// src/pages/AllRequestsPage.jsx

import React, { useEffect, useState } from "react";
import { Search, Filter, Eye, FileText } from "lucide-react";
import './AllRequestsPage.css'; // <-- IMPORT OUR NEW CSS FILE
import { listenToRequests } from '../services/firestoreService';
import GlobalModal from '../components/GlobalModal';
import RequestForm from '../components/RequestForm';
import { formatDateShort } from '../utils/dateHelpers';
import SectionHeader from '../components/SectionHeader';

// Reusable Status Badge Component
const StatusBadge = ({ status }) => {
    const statusClass = `status-badge status-${String(status || '').toLowerCase().replace(' ', '-')}`;
    return <span className={statusClass}>{status}</span>;
};

// Reusable Priority Badge Component
const PriorityBadge = ({ priority }) => {
    const priorityClass = `priority-badge priority-${String(priority || '').toLowerCase()}`;
    return <span className={priorityClass}>{priority}</span>;
};

export default function AllRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [divisionFilter, setDivisionFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = listenToRequests((data, err) => {
            if (err) {
                setError(err);
                setLoading(false);
                return;
            }
            setRequests(data || []);
            setLoading(false);
        });
        return () => { if (unsubscribe) unsubscribe(); };
    }, []);

    const formatDate = (d) => formatDateShort(d);

    const filteredRequests = (requests || []).filter(request => {
        const q = searchTerm.toLowerCase();
        const matchesSearch = (request.requesterName || request.requester || '').toLowerCase().includes(q) ||
            (request.id || '').toLowerCase().includes(q) ||
            (request.serviceType || request.type || '').toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || request.status === statusFilter;
        const matchesDivision = divisionFilter === "all" || 
            ((request.assignedTo || '').toLowerCase().includes(divisionFilter.toLowerCase()));
        return matchesSearch && matchesStatus && matchesDivision;
    });

    return (
    <div className="page-content all-requests-page">
            <SectionHeader
                title="All Requests"
                subtitle="Manage and track all service requests"
                actions={(
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="request-count">{loading ? '...' : `${filteredRequests.length} of ${requests.length} requests`}</div>
                        <button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>New Request</button>
                    </div>
                )}
            />

        <div className="card filters-card">
            <div className="card-header">
                <Filter className="icon" />
                <h3>Filters</h3>
            </div>
            <div className="card-content filters-grid">
                <div className="search-input-wrapper">
                    <Search className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input control"
                    />
                </div>
                
                <div className="select-wrapper">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select control">
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Denied">Denied</option>
                    <option value="Awaiting Feedback">Awaiting Feedback</option>
                    </select>
                    <div className="select-chevron">▾</div>
                </div>

                <div className="select-wrapper">
                    <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)} className="filter-select control">
                    <option value="all">All Divisions</option>
                    <option value="facilities">Facilities Team</option>
                    <option value="transportation">Transportation Team</option>
                    <option value="maintenance">Maintenance Team</option>
                    <option value="it">IT Support Team</option>
                    </select>
                    <div className="select-chevron">▾</div>
                </div>
            </div>
        </div>

        <div className="card requests-table-card">
            <div className="card-header">
                <FileText className="icon" />
                <h3>Requests Overview</h3>
            </div>
            <div className="card-content">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Request ID</th>
                                <th>Requester</th>
                                <th>Service Type</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Date Submitted</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map((request) => (
                                <tr key={request.id}>
                                    <td className="cell-request-id">{request.id}</td>
                                    <td>
                                        <div className="cell-requester">{request.requesterName || request.requester || request.createdBy || request.userEmail || '—'}</div>
                                        {(request.assignedTo) && <div className="cell-assigned-to">Assigned to: {request.assignedTo}</div>}
                                    </td>
                                    <td>{request.serviceType || request.type || '—'}</td>
                                    <td><StatusBadge status={request.status} /></td>
                                    <td><PriorityBadge priority={request.priority || 'Medium'} /></td>
                                    <td className="cell-date">{formatDate(request.submittedAt || request.dateSubmitted || request.createdAt || request.details?.submittedAt || request.createdAt)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-secondary" onClick={() => { setEditing(request); setFormOpen(true); }}>
                                                <Eye size={16} /> Edit
                                            </button>
                                            <button className="btn" onClick={() => { /* could open details modal */ }}>
                                                <FileText size={16} /> Details
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                    {!loading && filteredRequests.length === 0 && (
                    <div className="empty-state">
                        <FileText size={48} />
                        <p>No requests found matching your criteria.</p>
                    </div>
                )}
                    {loading && <p style={{ color: 'var(--color-text-light)' }}>Loading requests...</p>}
                    {error && <p style={{ color: 'var(--color-danger)' }}>Error loading requests.</p>}
            </div>

                <GlobalModal open={formOpen} title={editing ? 'Edit Request' : 'New Request'} onClose={() => setFormOpen(false)}>
                    <RequestForm initialData={editing || {}} onSaved={(saved) => {
                        // update local state optimistically
                        if (editing && editing.id) {
                            setRequests(prev => prev.map(r => r.id === editing.id ? { ...r, ...saved } : r));
                        } else {
                            setRequests(prev => [{ id: saved.id, ...saved }, ...prev]);
                        }
                        setFormOpen(false);
                    }} onCancel={() => setFormOpen(false)} />
                </GlobalModal>
        </div>
    </div>
    );
}