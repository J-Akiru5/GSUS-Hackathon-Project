// src/pages/PersonnelDashboard.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { Clock, CheckCircle, Play, MessageSquare, User, Calendar, MapPin } from 'lucide-react';
import './PersonnelDashboard.css'; // <-- IMPORT OUR NEW CSS FILE
import { listenToRequests } from '../services/firestoreService';
import { formatDateShort, toDate } from '../utils/dateHelpers';
import { useAuth } from '../hooks/useAuth';
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

export default function PersonnelDashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    // Derive tasks assigned to current user (match by assignedTo or assignedTeam)
    const tasks = useMemo(() => {
        if (!requests) return [];
        const uname = user?.name?.toLowerCase() || '';
        const urole = user?.role?.toLowerCase() || '';
        return requests
            .filter(r => {
                const assigned = (r.assignedTo || r.assigned || r.assignedUser || '').toString().toLowerCase();
                // match by exact name, role, or team token
                return !!assigned && (assigned.includes(uname) || assigned.includes(urole) || assigned.includes('personnel'));
            })
            .map((r, idx) => ({
                id: r.id || idx,
                title: r.title || r.serviceType || r.summary || 'Task',
                type: r.type || r.category || r.serviceType || 'General',
                status: r.status || 'Assigned',
                assignedDate: r.submittedAt || r.dateSubmitted || r.createdAt || r.details?.submittedAt || null,
                requester: r.requesterName || r.requester || r.createdBy || r.userEmail || '—',
                priority: r.priority || 'Medium',
                description: r.description || r.notes || '',
                dueDate: r.dueDate || r.expectedCompletion || null,
                location: r.location || r.resourceLocation || ''
            }));
    }, [requests, user]);

    const stats = {
        assigned: tasks.filter(t => t.status === "Assigned").length,
        inProgress: tasks.filter(t => t.status === "In Progress").length,
        awaitingFeedback: tasks.filter(t => t.status === "Awaiting Feedback").length,
        completed: tasks.filter(t => t.status === "Completed").length,
    };

    return (
        <div className="page-content personnel-dashboard">
            <SectionHeader title="My Tasks" subtitle="Manage your assigned service requests" />

            <div className="stats-grid">
                <div className="card stat-card"><div className="stat-icon icon-yellow"><Clock /></div><div><p className="stat-value">{loading ? '...' : stats.assigned}</p><p className="stat-title">Assigned</p></div></div>
                <div className="card stat-card"><div className="stat-icon icon-blue"><Play /></div><div><p className="stat-value">{loading ? '...' : stats.inProgress}</p><p className="stat-title">In Progress</p></div></div>
                <div className="card stat-card"><div className="stat-icon icon-purple"><MessageSquare /></div><div><p className="stat-value">{loading ? '...' : stats.awaitingFeedback}</p><p className="stat-title">Awaiting Feedback</p></div></div>
                <div className="card stat-card"><div className="stat-icon icon-green"><CheckCircle /></div><div><p className="stat-value">{loading ? '...' : stats.completed}</p><p className="stat-title">Completed</p></div></div>
            </div>

            <div className="card tasks-card">
                <div className="card-header">
                    <h3>Assigned Tasks</h3>
                </div>
                <div className="card-content">
                    {loading && <p style={{ color: 'var(--color-text-light)' }}>Loading tasks...</p>}
                    {error && <p style={{ color: 'var(--color-danger)' }}>Error loading tasks.</p>}
                    {!loading && tasks.length === 0 && <p style={{ color: 'var(--color-text-light)' }}>No tasks assigned.</p>}
                    {tasks.map(task => (
                        <div key={task.id} className="task-item">
                            <div className="task-main">
                                <div className="task-header">
                                    <h4>{task.title}</h4>
                                    <StatusBadge status={task.status} />
                                </div>
                                <p className="task-description">{task.description}</p>
                                <div className="task-details-grid">
                                    <div className="task-detail"><User size={14} /> Requester: <strong>{task.requester}</strong></div>
                                    <div className="task-detail"><Calendar size={14} /> Assigned: <strong>{task.assignedDate ? formatDateShort(task.assignedDate) : '—'}</strong></div>
                                    {task.dueDate && <div className="task-detail"><Clock size={14} /> Due: <strong>{task.dueDate}</strong></div>}
                                    {task.location && <div className="task-detail"><MapPin size={14} /> Location: <strong>{task.location}</strong></div>}
                                </div>
                            </div>
                            <div className="task-meta">
                                <PriorityBadge priority={task.priority} />
                                <span className="task-type-badge">{task.type}</span>
                            </div>
                            <div className="task-actions">
                                {task.status === "Assigned" && <button className="btn btn-primary"><Play size={14} /> Start Task</button>}
                                {task.status === "In Progress" && <button className="btn btn-primary"><MessageSquare size={14} /> Request Feedback</button>}
                                <button className="btn btn-secondary"><CheckCircle size={14} /> Mark as Completed</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}