// scripts/admin/link-user-auth.js
// Usage: node link-user-auth.js /path/to/serviceAccount.json <usersDocId> <authUid>

const admin = require('firebase-admin');
const path = require('path');

async function main() {
  const svcPath = process.argv[2];
  const docId = process.argv[3];
  const authUid = process.argv[4];

  if (!svcPath || !docId || !authUid) {
    console.error('Usage: node link-user-auth.js /path/to/serviceAccount.json usersDocId authUid');
    process.exit(1);
  }

  admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(svcPath))) });
  const db = admin.firestore();

  const ref = db.collection('users').doc(docId);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error('User doc not found:', docId);
    process.exit(2);
  }
  console.log('Found user doc:', docId, snap.data());

  await ref.set({ authUid }, { merge: true });
  console.log('Updated users/' + docId + ' with authUid=' + authUid);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(10); });
