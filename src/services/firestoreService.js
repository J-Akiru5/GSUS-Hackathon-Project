// src/services/firestoreService.js

import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, serverTimestamp, addDoc, setDoc, getDoc, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // adjust relative path if necessary

/**
 * Helper to map snapshot docs to plain objects
 * @param {QuerySnapshot} snap
 * @returns {Array<Object>}
 */
/**
 * Normalize document data coming from Firestore.
 * Convert Firestore Timestamps to JS Date objects for safer client usage.
 */
const normalizeDocData = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;
  const out = {};
  Object.entries(raw).forEach(([k, v]) => {
    if (v && typeof v.toDate === 'function') {
      // Firestore Timestamp -> JS Date
      try {
        out[k] = v.toDate();
        return;
      } catch (e) {
        out[k] = v;
        return;
      }
    }
    out[k] = v;
  });
  return out;
};

const mapSnapshot = (snap) => snap.docs.map(d => ({ id: d.id, ...normalizeDocData(d.data()) }));

// export normalization helper for unit tests and external usage
export { normalizeDocData };

/**
 * Real-time listener for the entire 'requests' collection.
 * @param {(data:Array<Object>, error:Error|null)=>void} callback
 * @returns {() => void} unsubscribe
 */
export function listenToRequests(callback) {
  try {
    // order by createdAt if available (new schema uses createdAt timestamps)
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => callback(mapSnapshot(snap), null),
      (error) => {
        console.error("listenToRequests error:", error);
        callback([], error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error("listenToRequests failed:", err);
    callback([], err);
    return () => {};
  }
}

/**
 * Real-time listener for requests where status === 'Pending'
 * @param {(data:Array<Object>, error:Error|null)=>void} callback
 * @returns {() => void} unsubscribe
 */
export function listenToPendingRequests(callback) {
  try {
    // To be resilient to varying casing in 'status' (pending vs Pending),
    // we listen to the whole collection and filter client-side.
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const all = mapSnapshot(snap);
        const pending = all.filter(r => ((r.status || '') + '').toLowerCase() === 'pending')
          .sort((a, b) => {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return bTime - aTime;
          });
        callback(pending, null);
      },
      (error) => {
        console.error("listenToPendingRequests error:", error);
        callback([], error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error("listenToPendingRequests failed:", err);
    callback([], err);
    return () => {};
  }
}

/**
 * Real-time listener for the 'users' collection.
 * @param {(data:Array<Object>, error:Error|null)=>void} callback
 * @returns {() => void} unsubscribe
 */
export function listenToUsers(callback) {
  try {
    const q = query(collection(db, "users"), orderBy("displayName", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => callback(mapSnapshot(snap), null),
      (error) => {
        console.error("listenToUsers error:", error);
        callback([], error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error("listenToUsers failed:", err);
    callback([], err);
    return () => {};
  }
}

/**
 * Real-time listener for the 'bookings' collection.
 * @param {(data:Array<Object>, error:Error|null)=>void} callback
 * @returns {() => void} unsubscribe
 */
export function listenToBookings(callback) {
  try {
    // order by createdAt if present; normalize timestamps for client
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => callback(mapSnapshot(snap), null),
      (error) => {
        console.error("listenToBookings error:", error);
        callback([], error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error("listenToBookings failed:", err);
    callback([], err);
    return () => {};
  }
}

// --- CRUD Helpers ---

/** Create a booking document in 'bookings' collection. Returns the new doc ref id. */
export async function createBooking(payload = {}) {
  try {
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...payload,
      createdAt: payload.createdAt && typeof payload.createdAt.toDate !== 'function' ? payload.createdAt : serverTimestamp(),
      updatedAt: payload.updatedAt && typeof payload.updatedAt.toDate !== 'function' ? payload.updatedAt : serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error('createBooking failed:', err);
    throw err;
  }
}

/** Update booking by id with partial payload */
export async function updateBooking(id, payload = {}) {
  try {
    const ref = doc(db, 'bookings', id);
    await updateDoc(ref, {
      ...payload,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error('updateBooking failed:', err);
    throw err;
  }
}

/** Delete booking by id */
export async function deleteBooking(id) {
  try {
    const ref = doc(db, 'bookings', id);
    await deleteDoc(ref);
  } catch (err) {
    console.error('deleteBooking failed:', err);
    throw err;
  }
}

/** Create a request document in 'requests' collection. Returns the new doc id. */
export async function createRequest(payload = {}) {
  try {
    const docRef = await addDoc(collection(db, 'requests'), {
      ...payload,
      createdAt: payload.createdAt && typeof payload.createdAt.toDate !== 'function' ? payload.createdAt : serverTimestamp(),
      updatedAt: payload.updatedAt && typeof payload.updatedAt.toDate !== 'function' ? payload.updatedAt : serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error('createRequest failed:', err);
    throw err;
  }
}

/** Generic update for requests */
export async function updateRequest(id, payload = {}) {
  try {
    const ref = doc(db, 'requests', id);
    await updateDoc(ref, {
      ...payload,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error('updateRequest failed:', err);
    throw err;
  }
}

/** Delete a request by id */
export async function deleteRequest(id) {
  try {
    const ref = doc(db, 'requests', id);
    await deleteDoc(ref);
  } catch (err) {
    console.error('deleteRequest failed:', err);
    throw err;
  }
}

/**
 * Update the status of a request document.
 * @param {string} requestId
 * @param {string} newStatus
 * @returns {Promise<void>}
 */
export async function updateRequestStatus(requestId, newStatus) {
  try {
    const ref = doc(db, "requests", requestId);
    await updateDoc(ref, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error("updateRequestStatus failed:", err);
    throw err;
  }
}

/**
 * Fetch a single user document by id.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getUserById(id) {
  try {
    if (!id) return null;
    const docRef = doc(db, 'users', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...normalizeDocData(snap.data()) };
  } catch (err) {
    console.error('getUserById failed:', err);
    throw err;
  }
}

/**
 * Fetch a user by email (performs a query).
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export async function getUserByEmail(email) {
  try {
    if (!email) return null;
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...normalizeDocData(d.data()) };
  } catch (err) {
    console.error('getUserByEmail failed:', err);
    throw err;
  }
}

/**
 * Listen to a conversation (all messages exchanged between two user ids)
 * Uses a broad query ordered by timestamp then filters client-side to avoid
 * Firestore composite filter restrictions. Returns unsubscribe.
 * @param {string} userA
 * @param {string} userB
 * @param {(data:Array<Object>, error:Error|null)=>void} callback
 */
export function listenToConversation(userA, userB, callback) {
  try {
    // prefer querying by conversationId for efficiency if messages are written with it
    const convId = [userA, userB].filter(Boolean).sort().join('_');
    let q;
    try {
      q = query(collection(db, 'messages'), where('conversationId', '==', convId), orderBy('timestamp', 'asc'));
    } catch (e) {
      // fallback to a broad query if conversationId field not indexed or absent
      q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    }
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const all = mapSnapshot(snap);
        const convo = all.filter(m => (
          (m.conversationId ? m.conversationId === convId : ((m.senderId === userA && m.receiverId === userB) || (m.senderId === userB && m.receiverId === userA)))
        ));
        // Ensure timestamps are Dates via normalizeDocData
        convo.sort((a, b) => {
          const at = a.timestamp instanceof Date ? a.timestamp.getTime() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
          const bt = b.timestamp instanceof Date ? b.timestamp.getTime() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
          return at - bt;
        });
        callback(convo, null);
      },
      (error) => {
        console.error('listenToConversation error:', error);
        callback([], error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('listenToConversation failed:', err);
    callback([], err);
    return () => { };
  }
}

/**
 * Send a message document to the 'messages' collection.
 * Payload should include senderId, receiverId, text, senderName, optional messageId
 */
export async function sendMessage(payload = {}) {
  try {
    const conversationId = [payload.senderId, payload.receiverId].filter(Boolean).sort().join('_');
    const docRef = await addDoc(collection(db, 'messages'), {
      senderId: payload.senderId,
      receiverId: payload.receiverId,
      conversationId,
      text: payload.text || '',
      timestamp: serverTimestamp(),
      senderName: payload.senderName || '',
      read: payload.read || false,
      messageId: payload.messageId || Date.now().toString(),
    });
    return docRef.id;
  } catch (err) {
    console.error('sendMessage failed:', err);
    throw err;
  }
}

/**
 * Mark unread messages from otherId to userId as read.
 */
export async function markConversationRead(userId, otherId) {
  try {
    if (!userId || !otherId) return;
    const q = query(collection(db, 'messages'), where('receiverId', '==', userId), where('senderId', '==', otherId), where('read', '==', false));
    const snap = await getDocs(q);
    const updates = [];
    snap.forEach(docSnap => {
      const ref = doc(db, 'messages', docSnap.id);
      updates.push(updateDoc(ref, { read: true, readAt: serverTimestamp() }));
    });
    await Promise.all(updates);
  } catch (err) {
    console.error('markConversationRead failed:', err);
    throw err;
  }
}