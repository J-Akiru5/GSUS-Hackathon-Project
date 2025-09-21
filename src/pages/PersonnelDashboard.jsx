// src/pages/PersonnelDashboard.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { Clock, CheckCircle, Play, MessageSquare, User, Calendar, MapPin } from 'lucide-react';
import './PersonnelDashboard.css';
import { listenToRequests, listenToBookings, updateRequestStatus, updateBookingStatus } from '../services/firestoreService';
import { formatDateShort } from '../utils/dateHelpers';
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
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingTaskId, setUpdatingTaskId] = useState(null);

    // Listen to both requests and bookings
    useEffect(() => {
        setLoading(true);

        // Subscribe to requests
        const unsubRequests = listenToRequests((data, error) => {
            if (error) {
                setError(error.message);
                return;
            }
            setRequests(data || []);
            setLoading(false);
        });

        // Subscribe to bookings
        const unsubBookings = listenToBookings((data, error) => {
            if (error) {
                setError(error.message);
                return;
            }
            setBookings(data || []);
            setLoading(false);
        });

        return () => {
            unsubRequests();
            unsubBookings();
        };
    }, []);

    // Filter tasks assigned to current personnel
    const tasks = useMemo(() => {
        if (!user) return [];

        const assignedRequests = requests.filter(r =>
            r.assignedTo === user.id ||
            r.assignedPersonnel === user.id ||
            (r.personnel && r.personnel.includes(user.id))
        ).map(r => ({
            ...r,
            type: 'request',
            title: r.serviceType || r.title || 'Service Request'
        }));

        const assignedBookings = bookings.filter(b =>
            b.assignedTo === user.id ||
            b.assignedPersonnel === user.id ||
            (b.personnel && b.personnel.includes(user.id))
        ).map(b => ({
            ...b,
            type: 'booking',
            title: b.serviceType || b.title || 'Booking Request'
        }));

        return [...assignedRequests, ...assignedBookings].sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB - dateA;
        });
    }, [requests, bookings, user]);

    const stats = {
        assigned: tasks.filter(t => t.status === "Assigned").length,
        inProgress: tasks.filter(t => t.status === "In Progress").length,
        awaitingFeedback: tasks.filter(t => t.status === "Awaiting Feedback").length,
        completed: tasks.filter(t => t.status === "Completed").length,
    };

    const handleStatusUpdate = async (task, newStatus) => {
        if (updatingTaskId) return; // Prevent multiple updates
        setUpdatingTaskId(task.id);
        try {
            if (task.type === 'request') {
                await updateRequestStatus(task.id, newStatus);
            } else {
                // For bookings, preserve all fields and just update status
                await updateBookingStatus(task.id, newStatus);
            }
        } catch (err) {
            setError('Failed to update status: ' + err.message);
        } finally {
            setUpdatingTaskId(null);
        }
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
                                {task.status === "Assigned" && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleStatusUpdate(task, "In Progress")}
                                        disabled={updatingTaskId === task.id}
                                    >
                                        <Play size={14} /> Start Task
                                    </button>
                                )}
                                {task.status === "In Progress" && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleStatusUpdate(task, "Awaiting Feedback")}
                                        disabled={updatingTaskId === task.id}
                                    >
                                        <MessageSquare size={14} /> Request Feedback
                                    </button>
                                )}
                                {task.status !== "Completed" && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleStatusUpdate(task, "Completed")}
                                        disabled={updatingTaskId === task.id}
                                    >
                                        <CheckCircle size={14} /> Mark as Completed
                                    </button>
                                )}
                                {updatingTaskId === task.id && <span className="status-updating">Updating...</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}