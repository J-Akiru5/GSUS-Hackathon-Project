// scripts/admin/migrate-auth-users.js
// Use: node migrate-auth-users.js /path/to/serviceAccountKey.json

const admin = require('firebase-admin');
const path = require('path');

async function main() {
  const svc = process.argv[2];
  if (!svc) {
    console.error('Usage: node migrate-auth-users.js /path/to/serviceAccountKey.json');
    process.exit(1);
  }
  admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(svc))) });
  const auth = admin.auth();
  const db = admin.firestore();

  console.log('Starting migration: scanning Auth users and creating/updating Firestore users...');
  let nextPageToken = undefined;
  do {
    const list = await auth.listUsers(1000, nextPageToken);
    for (const u of list.users) {
      const uid = u.uid;
      const email = u.email || null;
      const displayName = u.displayName || '';
      const usersRef = db.collection('users');
      let foundDoc = null;
      const byAuth = await usersRef.where('authUid', '==', uid).limit(1).get();
      if (!byAuth.empty) {
        foundDoc = byAuth.docs[0];
      } else if (email) {
        const byEmail = await usersRef.where('email', '==', email).limit(1).get();
        if (!byEmail.empty) foundDoc = byEmail.docs[0];
      }

      if (foundDoc) {
        const data = foundDoc.data();
        if (!data.authUid || data.authUid !== uid) {
          console.log(`Updating user doc ${foundDoc.id} with authUid=${uid}`);
          await foundDoc.ref.set({ authUid: uid, email: email || data.email || '', fullName: data.fullName || displayName || '', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        }
      } else {
        const payload = {
          authUid: uid,
          email: email || '',
          fullName: displayName || (email ? email.split('@')[0] : 'Unknown'),
          role: 'personnel',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        console.log(`Creating user doc for auth uid ${uid} email=${email}`);
        await usersRef.add(payload);
      }
    }
    nextPageToken = list.pageToken;
  } while (nextPageToken);

  console.log('Migration complete.');
  process.exit(0);
}

main().catch(err => { console.error('Migration failed:', err); process.exit(2); });
