// src/hooks/useAuth.js

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Check localStorage for a logged-in user when the app first loads
        const loggedInUser = localStorage.getItem('gsus-user');
        console.log('Logged in user from localStorage:', loggedInUser);
        if (loggedInUser) {
            setUser(JSON.parse(loggedInUser));
        }
    }, []);

    // This is the function that actually performs the login and navigation
    const login = (role) => {
        const userData = {
            name: role === 'gso_head' ? 'GSO Head' : 'Personnel',
            role: role,
        };
        // 1. Save the user's role to the browser's memory
        localStorage.setItem('gsus-user', JSON.stringify(userData));
        setUser(userData);

        // 2. Navigate to the correct dashboard based on the role
        if (role === 'gso_head') {
            navigate('/dashboard');
        } else {
            navigate('/my-tasks');
        }
    };

    const logout = () => {
        localStorage.removeItem('gsus-user');
        setUser(null);
        navigate('/');
    };

    return { user, login, logout };
};