// scripts/admin/migrate-messages-to-chats.js
// Usage: node migrate-messages-to-chats.js /path/to/serviceAccount.json [--dry-run]
// You can alternatively set the GOOGLE_APPLICATION_CREDENTIALS env var instead of passing the path.
// This script moves documents from the root 'messages' collection into
// subcollections 'chats/{chatId}/messages' where chatId = sorted(senderId,receiverId).join('_')
// It will also create or update a 'chats/{chatId}' doc with participants and lastMessage

const admin = require('firebase-admin');
const path = require('path');

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  // find the first non-flag (not starting with '-') argument as the service account path
  const svcArg = argv.find(a => !a.startsWith('-'));
  // allow env var fallback
  const svcEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const svcPath = svcArg || svcEnv;
  if (!svcPath) {
    console.error('No service account provided. Please pass a path or set GOOGLE_APPLICATION_CREDENTIALS.');
    console.error('Usage: node migrate-messages-to-chats.js /path/to/serviceAccount.json [--dry-run]');
    process.exit(1);
  }

  try {
    admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(svcPath))) });
  } catch (err) {
    console.error('Failed to initialize Firebase Admin with service account:', svcPath, err.message || err);
    process.exit(2);
  }
  const db = admin.firestore();

  console.log('Scanning root messages to migrate into chats subcollections...');
  if (dryRun) console.log('Dry-run mode: no writes will be performed.');
  const messagesRef = db.collection('messages');
  const snapshot = await messagesRef.get();
  console.log(`Found ${snapshot.size} messages to examine`);

  let migrated = 0;
  let errors = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const sender = data.senderId;
    const receiver = data.receiverId;
    if (!sender || !receiver) {
      console.warn(`Skipping message ${doc.id} missing sender or receiver`);
      continue;
    }
    const chatId = [sender, receiver].filter(Boolean).sort().join('_');
    const chatRef = db.collection('chats').doc(chatId);
    const messagesSubRef = chatRef.collection('messages');

    // write message to subcollection
    try {
      // preserve original id by writing with same id under subcollection
      if (!dryRun) {
        await messagesSubRef.doc(doc.id).set({
          ...data,
          conversationId: chatId,
        }, { merge: true });

        // update chat doc with participants & lastMessage (use updatedAt to match DB)
        await chatRef.set({
          participants: [sender, receiver],
          lastMessage: data.text || '',
          updatedAt: data.timestamp || admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } else {
        console.log(`[dry-run] would migrate message ${doc.id} -> chats/${chatId}/messages`);
        console.log(`[dry-run] would update chats/${chatId} with lastMessage='${(data.text||'').slice(0,80)}'`);
      }

      migrated++;
    } catch (err) {
      console.error('Failed to migrate message', doc.id, err);
      errors++;
    }
  }

  console.log(`Migration finished. Migrated: ${migrated}, Errors: ${errors}`);
  process.exit(0);
}

main().catch(err => { console.error('Migration failed:', err); process.exit(2); });
