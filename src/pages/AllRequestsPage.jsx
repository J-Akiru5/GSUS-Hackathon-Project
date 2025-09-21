// src/pages/AllRequestsPage.jsx

import React, { useEffect, useState } from "react";
import { Search, Filter, Eye, FileText } from "lucide-react";
import Carousel from 'react-bootstrap/Carousel';
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
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

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

    // group requests by status for prioritized display
    const groupedByStatus = filteredRequests.reduce((acc, r) => {
        const k = r.status || 'Unknown';
        if (!acc[k]) acc[k] = [];
        acc[k].push(r);
        return acc;
    }, {});

    // We'll use react-bootstrap's Carousel for improved accessibility and SSR friendliness
    const GroupCarousel = ({ children, groupKey }) => {
        // react-bootstrap Carousel expects direct child <Carousel.Item> nodes; we'll wrap each card
        return (
            <Carousel crossfade={true} interval={null} controls={true} indicators={false} variant="dark" className="mb-2">
                {React.Children.map(children, (child, idx) => (
                    <Carousel.Item key={`${groupKey}-${idx}`} className="carousel-slide">
                        <div style={{ display: 'flex', justifyContent: 'center' }}>{child}</div>
                    </Carousel.Item>
                ))}
            </Carousel>
        );
    };

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
                <div className="card-content filters-grid--inline">
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                        <div style={{ flex: 1 }} className="search-input-wrapper">
                            <Search className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                            />
                        </div>

                        <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)} className="filter-select" style={{ width: 220 }}>
                            <option value="all">All Divisions</option>
                            <option value="facilities">Facilities Team</option>
                            <option value="transportation">Transportation Team</option>
                            <option value="maintenance">Maintenance Team</option>
                            <option value="it">IT Support Team</option>
                    </select>

                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className={`btn ${viewMode === 'cards' ? 'btn-primary' : ''}`} onClick={() => setViewMode('cards')}>Card View</button>
                            <button className={`btn ${viewMode === 'table' ? 'btn-primary' : ''}`} onClick={() => setViewMode('table')}>Table View</button>
                        </div>
                    </div>

                    {/* status pills */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        {['all', 'Pending', 'In Progress', 'Completed', 'Approved', 'Denied', 'Awaiting Feedback'].map(s => (
                            <button key={s} className={`btn status-pill ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s === 'all' ? 'All' : s}</button>
                        ))}
                    </div>
            </div>
        </div>

        <div className="card requests-table-card">
            <div className="card-header">
                <FileText className="icon" />
                <h3>Requests Overview</h3>
            </div>
            <div className="card-content">
                    {viewMode === 'cards' ? (
                        <div className="requests-cards">
                            {/* render groups in order: Pending, In Progress, Approved, Completed, other */}
                            {['Pending', 'In Progress', 'Approved', 'Completed'].map(group => (
                                <div key={group} className="request-group">
                                    {groupedByStatus[group] && groupedByStatus[group].length > 0 && (
                                        <>
                                            <h4 className="group-title">{group} <span className="group-count">{groupedByStatus[group].length}</span></h4>
                                            <GroupCarousel groupKey={group}>
                                                {groupedByStatus[group].map(request => (
                                                    <div key={request.id} className="request-card">
                                                        <div className="card-main">
                                                            <div className="card-left">
                                                                <div className="card-id">{request.id}</div>
                                                                <div className="card-field"><span className="card-label">Requester</span><span className="card-value">{request.requesterName || request.requester || '—'}</span></div>
                                                                <div className="card-field"><span className="card-label">Type</span><span className="card-value">{request.serviceType || request.type || '—'}</span></div>
                                                                <div className="card-field"><span className="card-label">Assigned</span><span className="card-value">{request.assignedTo || 'Unassigned'}</span></div>
                                                            </div>
                                                            <div className="card-right">
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                                                    <div><StatusBadge status={request.status} /></div>
                                                                    <div><PriorityBadge priority={request.priority || 'Medium'} /></div>
                                                                    <div className="card-date">{formatDate(request.submittedAt || request.dateSubmitted || request.createdAt)}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="card-actions">
                                                            {request.status === 'Pending' && <button className="btn btn-primary" onClick={() => { setEditing(request); setFormOpen(true); }}>Start</button>}
                                                            {request.status === 'In Progress' && <button className="btn btn-primary" onClick={() => { setEditing(request); setFormOpen(true); }}>Continue</button>}
                                                            {request.status === 'Completed' && <button className="btn" onClick={() => {/* show details */ }}>Details</button>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </GroupCarousel>
                                        </>
                                    )}
                                </div>
                            ))}
                            {/* show any other statuses */}
                            {Object.keys(groupedByStatus).filter(k => !['Pending', 'In Progress', 'Approved', 'Completed'].includes(k)).map(k => (
                                <div key={k} className="request-group">
                                    <h4 className="group-title">{k} <span className="group-count">{groupedByStatus[k].length}</span></h4>
                                            <GroupCarousel groupKey={k}>
                                                {groupedByStatus[k].map(request => (
                                                    <div key={request.id} className="request-card">
                                                <div className="card-main">
                                                    <div className="card-left">
                                                        <div className="card-id">{request.id}</div>
                                                        <div className="card-requester">{request.requesterName || request.requester || '—'}</div>
                                                        <div className="card-type">{request.serviceType || request.type || '—'}</div>
                                                    </div>
                                                    <div className="card-right">
                                                        <StatusBadge status={request.status} />
                                                        <PriorityBadge priority={request.priority || 'Medium'} />
                                                        <div className="card-date">{formatDate(request.submittedAt || request.dateSubmitted || request.createdAt)}</div>
                                                    </div>
                                                </div>
                                                <div className="card-actions">
                                                    <button className="btn" onClick={() => { setEditing(request); setFormOpen(true); }}>Details</button>
                                                </div>
                                            </div>
                                        ))}
                                    </GroupCarousel>
                                </div>
                            ))}
                        </div>
                    ) : (
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
                    )}

                    {!loading && filteredRequests.length === 0 && (
                    <div className="empty-state">
                        <FileText size={48} />
                        <p>No requests found matching your criteria.</p>
                    </div>
                )}
                    {loading && <p style={{ color: 'var(--color-text-light)' }}>Loading requests...</p>}
                    {error && <p style={{ color: 'var(--color-danger)' }}>Error loading requests.</p>}

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
    </div>
    );
}