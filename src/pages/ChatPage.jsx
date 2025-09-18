import React, { useEffect, useState, useRef } from 'react';
import { listenToConversation, sendMessage, getUserById, listenToUsers, markConversationRead } from '../services/firestoreService';
import { auth } from '../../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import './ChatPage.css';
import { User, Send } from 'lucide-react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [gsoHead, setGsoHead] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const unsubRef = useRef(null);
  const { user: localUser } = useAuth();

  // find GSO_Head on mount
  useEffect(() => {
    const usersUnsub = listenToUsers((users) => {
      const gso = users.find(u => (u.role || '').toLowerCase() === 'gso_head');
      if (gso) {
        setGsoHead(gso);
        // set up conversation listener
        const current = auth?.currentUser || (localUser ? { uid: localUser.id || localUser.userId } : null);
        if (current) {
          if (unsubRef.current) unsubRef.current();
          unsubRef.current = listenToConversation(current.uid, gso.id, (msgs) => {
            setMessages(msgs);
            setLoading(false);
            // mark read for messages received by current user
            markConversationRead(current.uid, gso.id).catch(() => {});
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

  return (
    <div className="page-content chat-page">
      <div className="chat-card">
        <div className="chat-header">
          <div className="chat-title">Chat with GSO Head</div>
          <div className="chat-subtitle">{gsoHead?.displayName || gsoHead?.fullName || 'GSO Head'}</div>
        </div>

        <div className="chat-body" ref={scrollRef}>
          {loading && <div className="chat-loading">Loading chat...</div>}
          {!loading && messages.length === 0 && <div className="chat-empty">No messages yet.</div>}

          {messages.map(m => (
            <div key={m.id} className={`bubble ${m.senderId === currentUser?.uid ? 'sent' : 'received'}`}>
              <div className="bubble-text">{m.text}</div>
              <div className="bubble-meta">{m.senderName || (m.senderId === currentUser?.uid ? 'You' : 'GSO Head')} · {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ''}</div>
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
  );
}
