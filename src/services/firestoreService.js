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
      } catch (err) { void err; out[k] = v; return; }
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
    // prefer 'fullName' ordering since many documents use that field; fall back if it causes an error
    let q;
    try {
      q = query(collection(db, "users"), orderBy("fullName", "asc"));
    } catch (err) { void err; q = query(collection(db, "users")); }
    const unsubscribe = onSnapshot(
      q,
      (snap) => callback(mapSnapshot(snap), null),
      (error) => {
        console.error("listenToUsers error:", error);
        // fallback: try a plain onSnapshot without ordering
        try {
          const q2 = query(collection(db, 'users'));
          const unsub2 = onSnapshot(q2, (s2) => callback(mapSnapshot(s2), null), (err2) => { console.error('listenToUsers fallback error:', err2); callback([], err2); });
          return unsub2;
        } catch (err2) { void err2; callback([], error); }
      }
    );
    return unsubscribe;
  } catch (err) { console.error("listenToUsers failed:", err); callback([], err); return () => { }; }
}

/**
 * Real-time listener for the 'feedback' collection.
 * Exposes an array of feedback documents ordered by submittedAt descending.
 * @param {(data:Array<Object>, error:Error|null)=>void} callback
 * @returns {() => void} unsubscribe
 */
export function listenToFeedback(callback) {
  try {
    const q = query(collection(db, 'feedback'), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => callback(mapSnapshot(snap), null),
      (error) => {
        console.error('listenToFeedback error:', error);
        callback([], error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('listenToFeedback failed:', err);
    callback([], err);
    return () => { };
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

/**
 * Update the status of a booking document.
 * @param {string} bookingId - The ID of the booking to update
 * @param {string} newStatus - The new status to set
 * @returns {Promise<void>}
 */
export async function updateBookingStatus(bookingId, newStatus) {
  try {
    const ref = doc(db, 'bookings', bookingId);
    await updateDoc(ref, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error('updateBookingStatus failed:', err);
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
export async function updateRequestStatus(requestId, newStatus, assignedTo = null) {
  try {
    const ref = doc(db, "requests", requestId);
    await updateDoc(ref, {
      status: newStatus,
      updatedAt: serverTimestamp(),
      ...(assignedTo && { assignedTo }),
      ...(newStatus === 'In Progress' && { startedAt: serverTimestamp() }),
      ...(newStatus === 'Completed' && { completedAt: serverTimestamp() })
    });
  } catch (err) {
    console.error("updateRequestStatus failed:", err);
    throw err;
  }
}

/**
 * Real-time listener for requests assigned to specific personnel
 * @param {string} personnelId - The ID of the personnel to filter by
 * @param {(data:Array<Object>, error:Error|null)=>void} callback
 * @returns {() => void} unsubscribe
 */
export function listenToPersonnelTasks(personnelId, callback) {
  try {
    if (!personnelId) {
      callback([], new Error('Personnel ID required'));
      return () => { };
    }
    const q = query(
      collection(db, "requests"),
      where("assignedTo", "==", personnelId),
      orderBy("updatedAt", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => callback(mapSnapshot(snap), null),
      (error) => {
        console.error("listenToPersonnelTasks error:", error);
        callback([], error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error("listenToPersonnelTasks failed:", err);
    callback([], err);
    return () => { };
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
 * Fetch a user by their Firebase Auth UID (authUid) if stored in the document.
 * @param {string} authUid
 * @returns {Promise<Object|null>}
 */
export async function getUserByAuthUid(authUid) {
  try {
    if (!authUid) return null;
    const q = query(collection(db, 'users'), where('authUid', '==', authUid));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...normalizeDocData(d.data()) };
  } catch (err) {
    console.error('getUserByAuthUid failed:', err);
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
    } catch (err) { void err; q = query(collection(db, 'messages'), orderBy('timestamp', 'asc')); }
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

/**
 * Create or overwrite a user document in 'users' collection.
 * If an id is provided it will set that doc id; otherwise addDoc is used.
 * @param {Object} userData - { id?, email, fullName, role, office, ... }
 * @returns {Promise<string>} id of created/updated doc
 */
export async function createUser(userData = {}) {
  try {
    if (!userData) throw new Error('userData required');
    const payload = {
      email: userData.email || '',
      fullName: userData.fullName || userData.name || '',
      role: userData.role || 'personnel',
      office: userData.office || '',
      authUid: userData.authUid || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...userData
    };
    if (userData.id) {
      const ref = doc(db, 'users', userData.id);
      await setDoc(ref, payload, { merge: true });
      // maintain a mapping from auth UID -> userDocId for security rules
      if (userData.authUid) {
        try {
          await setDoc(doc(db, 'userMappings', String(userData.authUid)), { userDocId: userData.id }, { merge: true });
        } catch (e) {
          console.warn('Failed to write userMappings entry for', userData.authUid, e);
        }
      }
      return userData.id;
    }
    const docRef = await addDoc(collection(db, 'users'), payload);
    // write mapping from authUid -> new user doc id so server rules can map auth to user doc
    if (userData.authUid) {
      try {
        await setDoc(doc(db, 'userMappings', String(userData.authUid)), { userDocId: docRef.id }, { merge: true });
      } catch (e) {
        console.warn('Failed to write userMappings entry for', userData.authUid, e);
      }
    }
    return docRef.id;
  } catch (err) {
    console.error('createUser failed:', err);
    throw err;
  }
}

/**
 * Update an existing user document by id with partial payload.
 * @param {string} id
 * @param {Object} payload
 */
export async function updateUser(id, payload = {}) {
  try {
    if (!id) throw new Error('id required');
    const ref = doc(db, 'users', id);
    await updateDoc(ref, {
      ...payload,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error('updateUser failed:', err);
    throw err;
  }
}

// --- Chat helpers using chats/{chatId}/messages subcollection ---
/**
 * Deterministic chatId from two userDocIds
 */
export function makeChatId(userA, userB) {
  return [userA, userB].filter(Boolean).sort().join('_');
}

/**
 * Listen to a chat's messages under chats/{chatId}/messages ordered by timestamp
 * @returns {() => void} unsubscribe
 */
export function listenToChat(userA, userB, callback) {
  try {
    const chatId = makeChatId(userA, userB);
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => callback(mapSnapshot(snap), null), (err) => { console.error('listenToChat error', err); callback([], err); });
    return unsub;
  } catch (err) {
    console.error('listenToChat failed', err);
    callback([], err);
    return () => { };
  }
}

/**
 * Send a chat message into chats/{chatId}/messages and upsert the chat doc
 */
export async function sendChatMessage({ senderId, receiverId, text = '', senderName = '', messageId = null }) {
  try {
    const conversationId = makeChatId(senderId, receiverId);
    // upsert chat doc
    await setDoc(doc(db, 'chats', conversationId), {
      participants: [senderId, receiverId],
      lastMessage: text,
      updatedAt: serverTimestamp()
    }, { merge: true });

    const docRef = await addDoc(collection(db, 'chats', conversationId, 'messages'), {
      senderId,
      receiverId,
      conversationId,
      text,
      timestamp: serverTimestamp(),
      senderName,
      read: false,
      messageId: messageId || Date.now().toString(),
    });
    return docRef.id;
  } catch (err) {
    console.error('sendChatMessage failed:', err);
    throw err;
  }
}

/**
 * Mark unread messages in chats/{chatId}/messages as read where receiverId == userId and senderId == otherId
 */
export async function markChatRead(userId, otherId) {
  try {
    const chatId = makeChatId(userId, otherId);
    const q = query(collection(db, 'chats', chatId, 'messages'), where('receiverId', '==', userId), where('senderId', '==', otherId), where('read', '==', false));
    const snap = await getDocs(q);
    const updates = [];
    snap.forEach(docSnap => {
      const ref = doc(db, 'chats', chatId, 'messages', docSnap.id);
      updates.push(updateDoc(ref, { read: true, readAt: serverTimestamp() }));
    });
    await Promise.all(updates);
  } catch (err) {
    console.error('markChatRead failed:', err);
    throw err;
  }
}

/**
 * Real-time listener for the 'divisions' collection.
 * Expects documents with fields matching the Division shape used in the UI.
 * @param {(data:Array<Object>, error:Error|null)=>void} callback
 * @returns {() => void} unsubscribe
 */
export function listenToDivisions(callback) {
  try {
    const q = query(collection(db, 'divisions'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => callback(mapSnapshot(snap), null),
      (error) => {
        console.error('listenToDivisions error:', error);
        callback([], error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('listenToDivisions failed:', err);
    callback([], err);
    return () => { };
  }
}

/**
 * Fetch a single division document by id.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getDivisionById(id) {
  try {
    if (!id) return null;
    const ref = doc(db, 'divisions', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...normalizeDocData(snap.data()) };
  } catch (err) {
    console.error('getDivisionById failed:', err);
    throw err;
  }
}

/**
 * Create a division document. Returns the new doc id.
 * @param {Object} payload
 */
export async function createDivision(payload = {}) {
  try {
    const docRef = await addDoc(collection(db, 'divisions'), {
      ...payload,
      createdAt: payload.createdAt && typeof payload.createdAt.toDate !== 'function' ? payload.createdAt : serverTimestamp(),
      updatedAt: payload.updatedAt && typeof payload.updatedAt.toDate !== 'function' ? payload.updatedAt : serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error('createDivision failed:', err);
    throw err;
  }
}

/**
 * Update a division document by id with partial payload.
 * @param {string} id
 * @param {Object} payload
 */
export async function updateDivision(id, payload = {}) {
  try {
    if (!id) throw new Error('id required');
    const ref = doc(db, 'divisions', id);
    await updateDoc(ref, {
      ...payload,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error('updateDivision failed:', err);
    throw err;
  }
}

/**
 * Delete a division document by id.
 * @param {string} id
 */
export async function deleteDivision(id) {
  try {
    if (!id) throw new Error('id required');
    const ref = doc(db, 'divisions', id);
    await deleteDoc(ref);
  } catch (err) {
    console.error('deleteDivision failed:', err);
    throw err;
  }
}