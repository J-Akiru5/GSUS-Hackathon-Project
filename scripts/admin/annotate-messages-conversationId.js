// scripts/admin/annotate-messages-conversationId.js
// Usage: node annotate-messages-conversationId.js /path/to/serviceAccount.json
// This script scans the 'messages' collection and sets conversationId for docs missing it

const admin = require('firebase-admin');
const path = require('path');

async function main() {
  const svc = process.argv[2];
  if (!svc) {
    console.error('Usage: node annotate-messages-conversationId.js /path/to/serviceAccount.json');
    process.exit(1);
  }
  admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(svc))) });
  const db = admin.firestore();

  console.log('Scanning messages for missing conversationId...');
  const messagesRef = db.collection('messages');
  const snapshot = await messagesRef.get();
  let updated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.conversationId) { skipped++; continue; }
    const sender = data.senderId;
    const receiver = data.receiverId;
    if (!sender || !receiver) { skipped++; continue; }
    const convId = [sender, receiver].filter(Boolean).sort().join('_');
    await doc.ref.set({ conversationId: convId }, { merge: true });
    updated++;
    if (updated % 100 === 0) console.log(`Updated ${updated} messages...`);
  }

  console.log(`Done. Updated: ${updated}, Skipped: ${skipped}`);
  process.exit(0);
}

main().catch(err => { console.error('Failed:', err); process.exit(2); });
