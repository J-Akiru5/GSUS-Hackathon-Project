import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/GSUS_logo.svg';
const LoginPage = () => {
    const navigate = useNavigate();
    const handleLogin = (e) => {
        e.preventDefault();
        // This is a FAKE login for the demo. It just navigates.
        navigate('/dashboard');
    };

    return (
      <div style={{width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <img src={logo} alt="GSUS Logo" style={{width: '96px', height: '96px', marginBottom: '1rem'}} />
          <form onSubmit={handleLogin} style={{padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-md)', width: '400px'}}>
            <h2 style={{textAlign: 'center', color: 'var(--color-primary)'}}>GSUS Admin Portal</h2>
            <div style={{marginTop: '1.5rem'}}>
              <label>Email</label>
              <input type="email" defaultValue="gso.head@iloilo.gov.ph" style={{width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)'}} />
            </div>
            <div style={{marginTop: '1rem'}}>
              <label>Password</label>
              <input type="password" defaultValue="password" style={{width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)'}} />
            </div>
            <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1.5rem'}}>Sign In</button>
          </form>
        </div>
      </div>
    );
};

export default LoginPage;