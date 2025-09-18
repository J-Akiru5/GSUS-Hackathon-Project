// src/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { getUserByEmail, createUser, getUserById, updateUser, getUserByAuthUid } from '../services/firestoreService';

/**
 * useAuth hook
 * - Syncs Firebase Auth user (if any) with Firestore 'users' collection and localStorage
 * - Provides login({ email, password, role }) demo-friendly method and logout()
 * - Provides updateProfile to update Firestore user doc and local state
 */
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Restore from localStorage quickly for UX
    useEffect(() => {
        try {
            const ls = localStorage.getItem('gsus-user');
            if (ls) setUser(JSON.parse(ls));
        } catch (e) {
            console.warn('Failed to parse gsus-user from localStorage', e);
        }
    }, []);

    // Listen to Firebase Auth state and reconcile with Firestore user doc
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (!fbUser) {
                // not signed in with Firebase — keep local demo user if present
                return;
            }
            try {
                // Prefer matching by authUid if possible
                let profile = await getUserByAuthUid(fbUser.uid);
                if (!profile && fbUser.email) {
                    profile = await getUserByEmail(fbUser.email);
                }
                if (profile) {
                    // ensure profile stores authUid for future matches
                    if (!profile.authUid || profile.authUid !== fbUser.uid) {
                        try { await updateUser(profile.id, { authUid: fbUser.uid }); } catch (e) { /* ignore */ }
                        profile.authUid = fbUser.uid;
                    }
                    setUser(profile);
                    localStorage.setItem('gsus-user', JSON.stringify(profile));
                } else {
                    // create a minimal user doc for this auth user and store authUid
                    const id = await createUser({ email: fbUser.email || '', fullName: fbUser.displayName || '', role: 'personnel', authUid: fbUser.uid });
                    const newProfile = await getUserById(id);
                    setUser(newProfile);
                    localStorage.setItem('gsus-user', JSON.stringify(newProfile));
                }
            } catch (err) {
                console.error('useAuth onAuthStateChanged error:', err);
            }
            });
        return () => unsub();
    }, []);

    // Demo login: accept object {email, password, role}
    const login = useCallback(async (creds = {}) => {
        // If caller passes just a string role, keep backward compatibility
        if (typeof creds === 'string') creds = { role: creds };

        const { email = '', password = '', role = 'personnel', name } = creds;

        // If email is provided, try to find Firestore user — otherwise create a demo local user
        if (email) {
            try {
                let profile = await getUserByEmail(email);
                if (!profile) {
                    const id = await createUser({ email, fullName: name || email.split('@')[0], role });
                    profile = await getUserById(id);
                }
                setUser(profile);
                localStorage.setItem('gsus-user', JSON.stringify(profile));

                // Optionally sign in anonymously to obtain an auth UID for mapping.
                // This is gated by VITE_ALLOW_ANON_SIGNIN to avoid accidental anonymous
                // sign-ins in production. Set VITE_ALLOW_ANON_SIGNIN=true for local/dev only.
                if (auth && import.meta.env.VITE_ALLOW_ANON_SIGNIN === 'true') {
                    try { await signInAnonymously(auth); } catch (e) { /* ignore if not permitted */ }
                }

                // navigate based on role
                if (profile.role === 'gso_head' || role === 'gso_head') navigate('/dashboard');
                else navigate('/my-tasks');
                return profile;
            } catch (err) {
                console.error('login failed (email path):', err);
                throw err;
            }
        }

        // Fallback demo login using role only
        const demoProfile = {
            id: `demo-${role}`,
            email: `${role}@demo.local`,
            fullName: role === 'gso_head' ? 'GSO Head' : 'Personnel',
            role,
        };
        setUser(demoProfile);
        localStorage.setItem('gsus-user', JSON.stringify(demoProfile));
        if (role === 'gso_head') navigate('/dashboard'); else navigate('/my-tasks');
        return demoProfile;
    }, [navigate]);

    const logout = useCallback(async () => {
        try {
            // Sign out of Firebase if possible
            if (auth) {
                try { await signOut(auth); } catch (e) { /* ignore */ }
            }
        } finally {
            localStorage.removeItem('gsus-user');
            setUser(null);
            navigate('/');
        }
    }, [navigate]);

    const updateProfile = useCallback(async (patch = {}) => {
        try {
            if (!user) throw new Error('no user to update');
            // If user has an id stored in Firestore, update there
            if (user.id && !String(user.id).startsWith('demo-')) {
                await updateUser(user.id, patch);
                const updated = { ...user, ...patch };
                setUser(updated);
                localStorage.setItem('gsus-user', JSON.stringify(updated));
                return updated;
            }
            // For demo users, just update local state
            const updated = { ...user, ...patch };
            setUser(updated);
            localStorage.setItem('gsus-user', JSON.stringify(updated));
            return updated;
        } catch (err) {
            console.error('updateProfile failed:', err);
            throw err;
        }
    }, [user]);

    return { user, login, logout, updateProfile };
};