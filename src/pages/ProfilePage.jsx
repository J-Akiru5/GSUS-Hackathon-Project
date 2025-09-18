import React, { useState, useEffect } from 'react';
import './PersonnelPage.css';
import { useAuth } from '../hooks/useAuth';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', office: '' });

  useEffect(() => {
    if (user) {
      setForm({ fullName: user.fullName || user.name || '', email: user.email || '', office: user.office || '' });
    }
  }, [user]);

  const handleChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const save = async () => {
    try {
      await updateProfile({ fullName: form.fullName, email: form.email, office: form.office });
      setEditing(false);
    } catch (err) {
      console.error('Failed to save profile', err);
      alert('Failed to save profile');
    }
  };

  return (
    <div className="page-content">
      <div className="card">
        <h2>Profile</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'flex-start' }}>
          <div style={{ width: 140 }}>
            <div style={{ width: 140, height: 140, borderRadius: 12, background: '#f3f4f6' }}></div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0 }}><strong>Name:</strong></p>
                {editing ? (
                  <input value={form.fullName} onChange={handleChange('fullName')} />
                ) : (
                  <p style={{ marginTop: 4 }}>{form.fullName}</p>
                )}
              </div>
              <div>
                <p style={{ margin: 0 }}><strong>Role:</strong></p>
                <p style={{ marginTop: 4 }}>{user ? user.role : '—'}</p>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <p style={{ margin: 0 }}><strong>Email:</strong></p>
              {editing ? (
                <input value={form.email} onChange={handleChange('email')} />
              ) : (
                <p style={{ marginTop: 4 }}>{form.email}</p>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <p style={{ margin: 0 }}><strong>Office:</strong></p>
              {editing ? (
                <input value={form.office} onChange={handleChange('office')} />
              ) : (
                <p style={{ marginTop: 4 }}>{form.office}</p>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              {editing ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={save}>Save</button>
                  <button onClick={() => setEditing(false)}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)}>Edit Profile</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
