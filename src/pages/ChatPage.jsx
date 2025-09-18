import React, { useEffect, useState, useRef } from 'react';
import { listenToConversation, sendMessage, getUserById, listenToUsers, markConversationRead } from '../services/firestoreService';
import { auth } from '../../firebaseConfig';
import { signInAnonymously } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import './ChatPage.css';
import { User, Send } from 'lucide-react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [gsoHead, setGsoHead] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const unsubRef = useRef(null);
  const { user: localUser } = useAuth();

  // find GSO_Head on mount
  useEffect(() => {
    const usersUnsub = listenToUsers((allUsers) => {
      setUsers(allUsers.filter(u => u && u.id));
      const gso = allUsers.find(u => (u.role || '').toLowerCase() === 'gso_head');
      setGsoHead(gso || null);
      // choose activeUser: prefer previously active or gso
      const chosen = activeUser || gso || null;
      if (chosen) {
        setActiveUser(chosen);
  const current = auth?.currentUser || (localUser ? { uid: localUser.id || localUser.userId } : null);
        if (current) {
          if (unsubRef.current) unsubRef.current();
          unsubRef.current = listenToConversation(current.uid, chosen.id, (msgs, err) => {
            if (err) { console.error('listenToConversation error for chosen:', err); }
            setMessages(msgs);
            setLoading(false);
            // mark read for messages received by current user
            markConversationRead(current.uid, chosen.id).catch(() => {});
            // scroll to bottom
            setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
          });
        }
      } else {
        setLoading(false);
      }
    });

    return () => {
      if (usersUnsub) usersUnsub();
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  const handleSend = async () => {
    const user = auth?.currentUser || (localUser ? { uid: localUser.id || localUser.userId, displayName: localUser.name || localUser.displayName, email: localUser.email } : null);
    if (!user || !gsoHead) return;
    const text = newMessage.trim();
    if (!text) return;

    // optimistic UI: create a temporary message
    const tempId = `temp-${Date.now()}`;
    const tempMsg = { id: tempId, senderId: user.uid, receiverId: gsoHead.id, text, senderName: user.displayName || user.email || 'You', timestamp: new Date(), optimistic: true };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');

    try {
      await sendMessage({ senderId: user.uid, receiverId: gsoHead.id, text, senderName: user.displayName || user.email });
      // let the real listener replace temp message when Firestore emits
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
    } catch (err) {
      console.error('send failed', err);
      // remove temp and restore input
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(text);
    }
  };

  const currentUser = auth?.currentUser || (localUser ? { uid: localUser.id || localUser.userId } : null);

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
                setActiveUser(u);
                const current = auth?.currentUser || (localUser ? { uid: localUser.id || localUser.userId } : null);
                if (current) {
                  if (unsubRef.current) unsubRef.current();
                  unsubRef.current = listenToConversation(current.uid, u.id, (msgs) => {
                    setMessages(msgs);
                    setLoading(false);
                    markConversationRead(current.uid, u.id).catch(() => {});
                    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
                  });
                }
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
