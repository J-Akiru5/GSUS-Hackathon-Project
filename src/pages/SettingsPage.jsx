// src/pages/SettingsPage.jsx

import React, { useState } from "react";
import { User, Bell, Shield, Database, Save, Key, Mail, Phone } from "lucide-react";
import './SettingsPage.css'; // <-- IMPORT OUR NEW CSS FILE

export default function SettingsPage() {
    // For the sprint, we'll just log to the console to show it works
    const showToast = (message, type) => {
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message); // Simple alert for demo purposes
    };

    return (
        <div className="page-content settings-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage your account and system preferences</p>
                </div>
            </div>

            <div className="settings-grid">
                {/* Profile Settings */}
                <div className="card">
                    <div className="card-header"><User className="icon" /><h3>Profile Settings</h3></div>
                    <div className="card-content">
                        <div className="form-grid">
                            <div className="form-group"> <label htmlFor="name">Full Name</label> <input id="name" defaultValue="Maria Santos" /> </div>
                            <div className="form-group"> <label htmlFor="position">Position</label> <input id="position" defaultValue="GSO Head" /> </div>
                        </div>
                        <div className="form-group"> <label htmlFor="email">Email Address</label> <input id="email" type="email" defaultValue="maria.santos@gov.ph" /> </div>
                        <div className="form-group"> <label htmlFor="phone">Phone Number</label> <input id="phone" defaultValue="+63 912 345 6789" /> </div>
                        <div className="form-group"> <label htmlFor="department">Department</label> <input id="department" defaultValue="General Services Office" /> </div>
                        <hr className="separator" />
                        <div className="form-actions">
                            <button className="btn btn-secondary"><Key size={16} /> Change Password</button>
                            <button className="btn btn-primary" onClick={() => showToast('Profile settings saved!', 'success')}><Save size={16} /> Save Profile</button>
                        </div>
                    </div>
                </div>

                {/* Notification Preferences */}
                <div className="card">
                    <div className="card-header"><Bell className="icon" /><h3>Notification Preferences</h3></div>
                    <div className="card-content">
                        <div className="switch-group"><label>Email on New Request</label><div className="switch" /></div>
                        <div className="switch-group"><label>Email on Approval</label><div className="switch" /></div>
                        <div className="switch-group"><label>SMS for Urgent Requests</label><div className="switch" /></div>
                        <div className="switch-group"><label>Push Notifications</label><div className="switch active" /></div>
                        <hr className="separator" />
                        <div className="form-group">
                            <label htmlFor="digest">Email Digest Frequency</label>
                            <select id="digest" className="filter-select"><option>Daily</option><option>Weekly</option></select>
                        </div>
                        <button className="btn btn-primary full-width" onClick={() => showToast('Notification settings saved!', 'success')}><Save size={16}/> Save Notification Settings</button>
                    </div>
                </div>

                {/* System Settings */}
                <div className="card">
                    <div className="card-header"><Database className="icon" /><h3>System Settings</h3></div>
                    <div className="card-content">
                        <div className="form-grid">
                            <div className="form-group"><label>Theme</label><select className="filter-select"><option>Light</option><option>Dark</option></select></div>
                            <div className="form-group"><label>Language</label><select className="filter-select"><option>English</option><option>Filipino</option></select></div>
                            <div className="form-group"><label>Auto Logout (mins)</label><input type="number" defaultValue="30"/></div>
                            <div className="form-group"><label>Session Timeout (mins)</label><input type="number" defaultValue="60"/></div>
                        </div>
                        <button className="btn btn-primary full-width" onClick={() => showToast('System settings saved!', 'success')}><Save size={16}/> Save System Settings</button>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="card">
                    <div className="card-header"><Shield className="icon" /><h3>Security Settings</h3></div>
                    <div className="card-content">
                        <div className="switch-group"><label>Two-Factor Authentication</label><div className="switch" /></div>
                        <div className="switch-group"><label>Login Alerts</label><div className="switch active" /></div>
                        <div className="form-group">
                            <label htmlFor="expiry">Password Expiry (days)</label>
                            <input id="expiry" type="number" defaultValue="90"/>
                            <p className="input-hint">Set to 0 for passwords that never expire</p>
                        </div>
                        <button className="btn btn-primary full-width" onClick={() => showToast('Security settings saved!', 'success')}><Save size={16}/> Save Security Settings</button>
                    </div>
                </div>
            </div>
        </div>
    );
}