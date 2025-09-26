// src/pages/LoginPage.jsx (Themed Version)

import React, { createContext, useContext, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ThemeContext = createContext('light');

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <ThemeContext.Provider value="dark">
      <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AuthForm onLogin={login} />
      </div>
    </ThemeContext.Provider>
  );
}

function AuthForm({ onLogin }) {
  const [email, setEmail] = useState('gso.head@iloilo.gov.ph');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState('gso_head');
  const navigate = useNavigate();

  const handleRoleChange = async (newRole) => {
    setRole(newRole);
    // If user selects Personnel in the demo role dropdown, perform a quick demo login
    // and navigate to the Personnel Dashboard to support quick presentation access.
    if (newRole === 'personnel') {
      try {
        await onLogin({ role: 'personnel' });
      } catch (e) { void e; }
      navigate('/my-tasks');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // pass full credentials to useAuth.login
    onLogin({ email, password, role, name: role === 'gso_head' ? 'GSO Head' : 'Personnel' });
  };

  return (
    <Panel title="GSUS Portal Login">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: 360 }}>
        <label style={{ fontSize: 12, color: 'var(--color-text-light)' }}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--color-border)' }} />

        <label style={{ fontSize: 12, color: 'var(--color-text-light)' }}>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--color-border)' }} />

        <label style={{ fontSize: 12, color: 'var(--color-text-light)' }}>Role (demo)</label>
        <select value={role} onChange={(e) => handleRoleChange(e.target.value)} style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--color-border)' }}>
          <option value="gso_head">GSO Head</option>
          <option value="personnel">Personnel</option>
        </select>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <Button type="submit">Sign In</Button>
          <Button type="button" onClick={() => { setEmail('gso.head@iloilo.gov.ph'); setPassword('password'); setRole('gso_head'); }}>Fill Demo</Button>
          <Button type="button" onClick={async () => {
            // quick access: demo login as Personnel then navigate to the Personnel Dashboard
            try {
              await onLogin({ role: 'personnel' });
            } catch (e) { void e; }
            navigate('/my-tasks');
          }}>Personnel Dashboard</Button>
        </div>
      </form>
    </Panel>
  );
}

function Panel({ title, children }) {
  const theme = useContext(ThemeContext);
  const className = 'panel-' + theme;
  return (
    <section className={className} style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow-md)', width: 420 }}>
      <h2 style={{ color: 'var(--color-primary)', marginBottom: '0.75rem', textAlign: 'center' }}>{title}</h2>
      {children}
    </section>
  );
}

function Button({ children, type = 'button', onClick }) {
  const theme = useContext(ThemeContext);
  const base = { padding: '0.6rem 0.9rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer' };
  const themed = theme === 'dark'
    ? { background: 'var(--color-primary)', color: 'white', border: '1px solid transparent' }
    : { background: 'transparent', color: 'var(--color-text-default)', border: '1px solid var(--color-border)' };
  return (
    <button type={type} onClick={onClick} style={{ ...base, ...themed }}>
      {children}
    </button>
  );
}