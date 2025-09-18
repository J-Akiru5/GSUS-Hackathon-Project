// src/pages/PersonnelPage.jsx

import React, { useState } from "react";
import { Users, Search, Filter, Plus, Edit, Mail, Phone, MapPin, Shield, UserCheck, UserX} from "lucide-react";
import './PersonnelPage.css'; // <-- IMPORT OUR NEW CSS FILE

// Mock Data
const personnelData = [
    { id: "PER-001", name: "Maria Santos", email: "maria.santos@gov.ph", phone: "+63 912 345 6789", role: "GSO Head", assignedDivision: "General Services Office", status: "Active", joinDate: "2020-03-15", location: "Main Building, 5th Floor" },
    { id: "PER-002", name: "John Doe", email: "john.doe@gov.ph", phone: "+63 923 456 7890", role: "Division Head", assignedDivision: "Transportation Division", status: "Active", joinDate: "2019-07-22", location: "Transport Hub" },
    { id: "PER-003", name: "Sarah Wilson", email: "sarah.wilson@gov.ph", phone: "+63 934 567 8901", role: "Division Head", assignedDivision: "Facilities Division", status: "Active", joinDate: "2021-01-10", location: "Main Building, 2nd Floor" },
    { id: "PER-004", name: "Robert Johnson", email: "robert.johnson@gov.ph", phone: "+63 945 678 9012", role: "Driver", assignedDivision: "Transportation Division", status: "Active", joinDate: "2022-05-18", location: "Transport Hub" },
    { id: "PER-005", name: "Emily Davis", email: "emily.davis@gov.ph", phone: "+63 956 789 0123", role: "Technician", assignedDivision: "Maintenance Division", status: "Inactive", joinDate: "2020-11-30", location: "Maintenance Workshop" }
];

// Reusable Status Badge Component
const StatusBadge = ({ status }) => {
    const statusClass = `status-badge status-${status.toLowerCase().replace(' ', '-')}`;
    return <span className={statusClass}>{status}</span>;
};

export default function PersonnelPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [divisionFilter, setDivisionFilter] = useState("all");

    const filteredPersonnel = personnelData.filter(person => {
        const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) || person.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || person.role === roleFilter;
        const matchesStatus = statusFilter === "all" || person.status === statusFilter;
        const matchesDivision = divisionFilter === "all" || person.assignedDivision.toLowerCase().includes(divisionFilter.toLowerCase());
        return matchesSearch && matchesRole && matchesStatus && matchesDivision;
    });

    const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

    const getRoleIcon = (role) => {
        if (role === "GSO Head") return <Shield size={16} />;
        if (role === "Division Head") return <UserCheck size={16} />;
        return <Users size={16} />;
    };

    return (
        <div className="page-content personnel-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Personnel Management</h1>
                    <p className="page-subtitle">Manage GSO staff and division assignments</p>
                </div>
                <button className="btn btn-primary"><Plus size={16} /> Add New Personnel</button>
            </div>

            <div className="stats-grid">
                <div className="card stat-card"> <Users className="icon" /> <div><p className="value">{personnelData.filter(p => p.status === "Active").length}</p><p className="title">Active Personnel</p></div></div>
                <div className="card stat-card"> <Shield className="icon" /> <div><p className="value">{personnelData.filter(p => p.role.includes("Head")).length}</p><p className="title">Leadership</p></div></div>
                <div className="card stat-card"> <UserX className="icon" /> <div><p className="value">{personnelData.filter(p => p.status === "On Leave").length}</p><p className="title">On Leave</p></div></div>
                <div className="card stat-card"> <MapPin className="icon" /> <div><p className="value">{new Set(personnelData.map(p => p.assignedDivision)).size}</p><p className="title">Divisions</p></div></div>
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
                                        <td className="date-cell">{new Date(person.joinDate).toLocaleDateString()}</td>
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