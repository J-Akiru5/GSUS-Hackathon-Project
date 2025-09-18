import React from 'react';
import './PersonnelPage.css';

export default function ProfilePage() {
  return (
    <div className="page-content">
      <div className="card">
        <h2>Profile</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'flex-start' }}>
          <div style={{ width: 140 }}>
            <div style={{ width: 140, height: 140, borderRadius: 12, background: '#f3f4f6' }}></div>
          </div>
          <div style={{ flex: 1 }}>
            <p><strong>Name:</strong> GSO Head</p>
            <p><strong>Role:</strong> Administrator</p>
            <p><strong>Email:</strong> gso@example.local</p>
            <p><strong>Office:</strong> General Services Office</p>
          </div>
        </div>
      </div>
    </div>
  );
}
