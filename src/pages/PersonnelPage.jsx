// src/pages/PersonnelPage.jsx

import React, { useEffect, useState } from "react";
import { Users, Search, Filter, Plus, Edit, Mail, Phone, MapPin, Shield, UserCheck, UserX } from "lucide-react";
import './PersonnelPage.css'; // <-- IMPORT OUR NEW CSS FILE
import { listenToUsers } from '../services/firestoreService';
import SectionHeader from '../components/SectionHeader';

// Reusable Status Badge Component
const StatusBadge = ({ status }) => {
    const statusClass = `status-badge status-${String(status || '').toLowerCase().replace(' ', '-')}`;
    return <span className={statusClass}>{status}</span>;
};

export default function PersonnelPage() {
    const [personnelData, setPersonnelData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [divisionFilter, setDivisionFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = listenToUsers((data, err) => {
            if (err) {
                setError(err);
                setLoading(false);
                return;
            }
            // Normalize Firestore user doc shapes to the UI model expected by this page
            const normalized = (data || []).map(u => ({
                id: u.id,
                name: u.displayName || u.name || 'Unknown',
                email: u.email || u.mail || '',
                phone: u.phone || u.phoneNumber || '',
                role: u.role || u.position || 'Staff',
                assignedDivision: u.assignedDivision || u.division || u.department || 'Unassigned',
                status: u.status || 'Active',
                joinDate: u.joinDate || u.createdAt || u.joinedAt || null,
                location: u.location || ''
            }));
            setPersonnelData(normalized);
            setLoading(false);
        });
        return () => { if (unsubscribe) unsubscribe(); };
    }, []);

    const formatDate = (d) => {
        if (!d) return '—';
        if (typeof d === 'object' && typeof d.toDate === 'function') return new Date(d.toDate()).toLocaleDateString();
        try { return new Date(d).toLocaleDateString(); } catch { return '—'; }
    };

    const filteredPersonnel = personnelData.filter(person => {
        const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) || person.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || person.role === roleFilter;
        const matchesStatus = statusFilter === "all" || person.status === statusFilter;
        const matchesDivision = divisionFilter === "all" || person.assignedDivision.toLowerCase().includes(divisionFilter.toLowerCase());
        return matchesSearch && matchesRole && matchesStatus && matchesDivision;
    });

    const getInitials = (name) => (name || '').split(' ').map(n => n[0]).join('').toUpperCase();

    const getRoleIcon = (role) => {
        if (role === "GSO Head") return <Shield size={16} />;
        if (role === "Division Head") return <UserCheck size={16} />;
        return <Users size={16} />;
    };

    return (
        <div className="page-content personnel-page">
            <SectionHeader title="Personnel Management" subtitle="Manage GSO staff and division assignments" />
            {/* Add button removed — use the global header Add Personnel instead */}

            <div className="stats-grid">
                <div className="card stat-card"> <Users className="icon" /> <div><p className="value">{loading ? '...' : personnelData.filter(p => p.status === "Active").length}</p><p className="title">Active Personnel</p></div></div>
                <div className="card stat-card"> <Shield className="icon" /> <div><p className="value">{loading ? '...' : personnelData.filter(p => String(p.role).includes("Head")).length}</p><p className="title">Leadership</p></div></div>
                <div className="card stat-card"> <UserX className="icon" /> <div><p className="value">{loading ? '...' : personnelData.filter(p => p.status === "On Leave").length}</p><p className="title">On Leave</p></div></div>
                <div className="card stat-card"> <MapPin className="icon" /> <div><p className="value">{loading ? '...' : new Set(personnelData.map(p => p.assignedDivision)).size}</p><p className="title">Divisions</p></div></div>
            </div>

            <div className="card filters-card">
                <div className="card-header"><Filter className="icon" /><h3>Filters</h3></div>
                <div className="card-content filters-grid">
                    <div className="search-input-wrapper"><Search className="search-icon" /><input type="text" placeholder="Search personnel..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input"/></div>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="filter-select"><option value="all">All Roles</option><option value="GSO Head">GSO Head</option><option value="Division Head">Division Head</option><option value="Driver">Driver</option><option value="Technician">Technician</option></select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select"><option value="all">All Statuses</option><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="On Leave">On Leave</option></select>
                    <select value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)} className="filter-select"><option value="all">All Divisions</option><option value="transportation">Transportation</option><option value="facilities">Facilities</option><option value="maintenance">Maintenance</option></select>
                </div>
            </div>

            <div className="card table-card">
                 <div className="card-header"><Users className="icon" /><h3>Personnel Directory</h3></div>
                <div className="card-content">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr><th>Personnel</th><th>Contact</th><th>Role</th><th>Division</th><th>Status</th><th>Join Date</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {filteredPersonnel.map((person) => (
                                    <tr key={person.id}>
                                        <td>
                                            <div className="personnel-cell">
                                                <div className="avatar">{getInitials(person.name)}</div>
                                                <div>
                                                    <div className="person-name">{person.name}</div>
                                                    <div className="person-id">{person.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-cell"><Mail size={14} /> {person.email}</div>
                                            <div className="contact-cell"><Phone size={14} /> {person.phone}</div>
                                        </td>
                                        <td><div className="role-cell">{getRoleIcon(person.role)} {person.role}</div></td>
                                        <td>
                                            <div className="division-name">{person.assignedDivision}</div>
                                            <div className="location-cell"><MapPin size={14} /> {person.location}</div>
                                        </td>
                                        <td><StatusBadge status={person.status} /></td>
                                        <td className="date-cell">{formatDate(person.joinDate)}</td>
                                        <td><button className="btn btn-secondary"><Edit size={14} /> Edit</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     {filteredPersonnel.length === 0 && ( <div className="empty-state"><Users size={48} /><p>No personnel found.</p></div> )}
                </div>
            </div>
        </div>
    );
}