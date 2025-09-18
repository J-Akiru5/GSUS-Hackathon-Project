// src/pages/GSODashboard.jsx

import React from 'react';
import { Clock, CheckCircle, AlertTriangle, FileText, ThumbsUp, ThumbsDown, Eye, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import AuditTrailPanel from '../components/features/dashboard/AuditTrailPanel'; // <-- IMPORT THE PANEL
import './Dashboard.css'; // <-- Use our existing CSS file

// Mock Data
const PENDING_REQUESTS = [
    { id: "REQ-005", title: "Board Room Booking", type: "Venue Booking", status: "Pending", submittedBy: "Maria Santos", priority: "High" },
    { id: "REQ-006", title: "Vehicle Maintenance", type: "Maintenance", status: "Pending", submittedBy: "John Doe", priority: "Medium" },
    { id: "REQ-007", title: "New Equipment Request", type: "Procurement", status: "Pending", submittedBy: "Lisa Chen", priority: "Low" }
];

// Reusable Priority Badge Component
const PriorityBadge = ({ priority }) => {
    const priorityClass = `priority-badge priority-${priority.toLowerCase()}`;
    return <span className={priorityClass}>{priority}</span>;
};

export default function GSODashboard() {
    // For the sprint, we use static mock data
    const pendingRequests = PENDING_REQUESTS;
    const metrics = { pendingRequests: 3, completedThisMonth: 45, inProgress: 8, avgResponseTime: "2.3 hours" };

    return (
        <div className="page-content">
            <div className="header">
                <h1>GSO Dashboard</h1>
                <p>Manage service requests and resources</p>
            </div>

            <div className="stats-grid">
                <div className="card stat-card"><div className="stat-icon icon-yellow"><Clock /></div><div><p className="stat-value">{metrics.pendingRequests}</p><p className="stat-title">Pending Requests</p></div></div>
                <div className="card stat-card"><div className="stat-icon icon-green"><CheckCircle /></div><div><p className="stat-value">{metrics.completedThisMonth}</p><p className="stat-title">Completed This Month</p></div></div>
                <div className="card stat-card"><div className="stat-icon icon-blue"><AlertTriangle /></div><div><p className="stat-value">{metrics.inProgress}</p><p className="stat-title">In Progress</p></div></div>
                <div className="card stat-card"><div className="stat-icon icon-purple"><FileText /></div><div><p className="stat-value">{metrics.avgResponseTime}</p><p className="stat-title">Avg Response Time</p></div></div>
            </div>

            <div className="dashboard-main-grid">
                <div className="card action-required-panel">
                    <div className="card-header"><Clock className="icon" /><h3>Action Required</h3></div>
                    <div className="card-content">
                        {pendingRequests.map((request) => (
                            <div key={request.id} className="request-item">
                                <div className="request-info">
                                    <h4>{request.title}</h4>
                                    <p>by {request.submittedBy} • {request.type}</p>
                                </div>
                                <div className="request-actions">
                                    <PriorityBadge priority={request.priority} />
                                    <button className="btn btn-primary"><ThumbsUp size={14} /> Approve</button>
                                    <button className="btn btn-danger"><ThumbsDown size={14} /> Deny</button>
                                    <button className="btn btn-secondary"><Eye size={14} /> Details</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card calendar-panel">
                    <div className="card-header"><Calendar className="icon" /><h3>Calendar</h3></div>
                    <div className="card-content">
                         <p style={{textAlign: 'center', color: 'var(--color-text-light)'}}>Weekly calendar view...</p>
                    </div>
                </div>
            </div>

            {/* --- INTEGRATED AUDIT TRAIL PANEL --- */}
            <AuditTrailPanel />

        </div>
    );
}