import React, { useEffect, useState, useRef } from 'react';
import { listenToUsers, getUserByAuthUid, createUser, getUserById, listenToChat, sendChatMessage } from '../services/firestoreService';
import { auth } from '../../firebaseConfig';
import { signInAnonymously } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import './ChatPage.css';
import SectionHeader from '../components/SectionHeader';
import { User, Send } from 'lucide-react';
// firebase/firestore helpers are not needed in this component (chat uses service wrapper)

export default function ChatPage() {
  useEffect(() => {
    // keep banner visible on chat page
  }, []);
  const [messages, setMessages] = useState([]);
  // gsoHead tracked via users list when required
  const [_gsoHead, setGsoHead] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const unsubRef = useRef(null);
  const { user: localUser } = useAuth();
  const [authMappedUser, setAuthMappedUser] = useState(null);
  const [currentUserFsId, setCurrentUserFsId] = useState(null);

  // find GSO_Head on mount and populate users list
  useEffect(() => {
    const usersUnsub = listenToUsers((allUsers) => {
      setUsers(allUsers.filter(u => u && u.id));
      const gso = allUsers.find(u => (u.role || '').toLowerCase() === 'gso_head');
      setGsoHead(gso || null);
      setLoading(false);
    });

    return () => {
      if (usersUnsub) usersUnsub();
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  // Map Firebase auth user to Firestore user doc if present; create a minimal doc if missing
  useEffect(() => {
    let mounted = true;
    const fb = auth && auth.currentUser;
    if (!fb) return;
    (async () => {
      try {
        const mapped = await getUserByAuthUid(fb.uid);
        if (mapped) {
          if (!mounted) return;
          setAuthMappedUser(mapped);
          setCurrentUserFsId(mapped.id);
          return;
        }
        // not found: create a lightweight user doc so we have a Firestore id to use in chat
        const id = await createUser({ email: fb.email || '', fullName: fb.displayName || '', role: 'personnel', authUid: fb.uid });
        const newU = await getUserById(id);
        if (!mounted) return;
        setAuthMappedUser(newU);
        setCurrentUserFsId(newU.id);
      } catch (err) {
        console.error('Failed to map auth user to Firestore user doc', err);
      }
    })();
    return () => { mounted = false; };
  }, [auth?.currentUser]);

  // When activeUser changes or currentUserFsId becomes available, subscribe to chat subcollection
  useEffect(() => {
    // clear previous
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    setMessages([]);
    if (!activeUser || !currentUserFsId) return;

    unsubRef.current = listenToChat(currentUserFsId, activeUser.id, (msgs, err) => {
      if (err) { console.error('chat listener error', err); setLoading(false); return; }
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
    });

    return () => {
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = null;
    };
  }, [activeUser, currentUserFsId]);

  const handleSend = async () => {
    const senderId = currentUserFsId || (localUser && localUser.id) || (authMappedUser && authMappedUser.id) || (auth && auth.currentUser && auth.currentUser.uid) || null;
    const senderName = (localUser && (localUser.fullName || localUser.name)) || (authMappedUser && (authMappedUser.fullName || authMappedUser.name)) || (auth && auth.currentUser && auth.currentUser.displayName) || (localUser && localUser.email) || 'You';
    if (!senderId || !activeUser) return;
    const text = newMessage.trim();
    if (!text) return;

    // optimistic UI
    const tempId = `temp-${Date.now()}`;
    const tempMsg = { id: tempId, senderId, receiverId: activeUser.id, text, senderName, timestamp: new Date(), optimistic: true };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');

    try {
      await sendChatMessage({ senderId, receiverId: activeUser.id, text, senderName, messageId: Date.now().toString() });
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
    } catch (err) {
      console.error('send failed', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(text);
    }
  };

  const currentUser = { uid: currentUserFsId || (localUser ? (localUser.id || localUser.userId) : (auth?.currentUser?.uid)) };

  const [error, setError] = useState(null);

  const handleAnonSignIn = async () => {
    try {
      await signInAnonymously(auth);
      setError(null);
    } catch (err) {
      console.error('anon sign-in failed', err);
      setError('Anonymous sign-in failed: ' + err.message);
    }
  };

  return (
    <div className="page-content chat-page">
      <SectionHeader title="Chat" subtitle="Team messaging" />
      <div className="chat-wrapper">
        {!currentUser && (
          <div style={{ padding: 12 }}>
            <div style={{ marginBottom: 8 }}>Not signed into Firebase auth. For quick tests you may sign in anonymously:</div>
            <button className="btn btn-primary" onClick={handleAnonSignIn}>Sign in anonymously</button>
            {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
          </div>
        )}
        <aside className="chat-users">
          <div className="users-header">Users</div>
          <div className="users-list">
            {users.map(u => (
              <div key={u.id} className={`user-item ${activeUser && activeUser.id === u.id ? 'active' : ''}`} onClick={() => {
                // set the active user; the useEffect below will subscribe to chats/{chatId}/messages
                setActiveUser(u);
              }}>
                <div className="user-name">{u.displayName || u.fullName || u.name || u.email}</div>
                <div className="user-meta">{u.role || ''}</div>
              </div>
            ))}
          </div>
        </aside>

        <div className="chat-card">
          <div className="chat-header">
            <div className="chat-title">Chat with {activeUser ? (activeUser.displayName || activeUser.fullName || activeUser.name || 'User') : 'User'}</div>
            <div className="chat-subtitle">{activeUser?.email || activeUser?.displayName || ''}</div>
          </div>

          <div className="chat-body" ref={scrollRef}>
            {loading && <div className="chat-loading">Loading chat...</div>}
            {!loading && messages.length === 0 && <div className="chat-empty">No messages yet.</div>}

            {messages.map(m => (
              <div key={m.id} className={`bubble ${m.senderId === currentUser?.uid ? 'sent' : 'received'}`}>
                <div className="bubble-text">{m.text}</div>
                <div className="bubble-meta">{m.senderName || (m.senderId === currentUser?.uid ? 'You' : (activeUser?.displayName || 'User'))} · {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ''}</div>
              </div>
            ))}
          </div>

          <div className="chat-input">
            <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." />
            <button className={`send-btn ${!newMessage.trim() ? 'disabled' : ''}`} onClick={handleSend} disabled={!newMessage.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
