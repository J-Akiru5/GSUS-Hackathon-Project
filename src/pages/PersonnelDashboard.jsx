// src/pages/PersonnelDashboard.jsx

import React from 'react';
import { Clock, CheckCircle, Play, MessageSquare, User, Calendar, MapPin } from 'lucide-react';
import './PersonnelDashboard.css'; // <-- IMPORT OUR NEW CSS FILE

// Mock Data
const MOCK_TASKS = [
    { id: 1, title: "Vehicle Inspection Service", type: "Transportation", status: "Assigned", assignedDate: "2024-09-17", requester: "John Doe", priority: "High", description: "Provide vehicle for field inspection at Site A", dueDate: "2024-09-20", location: "Field Site A" },
    { id: 2, title: "Printer Maintenance", type: "Maintenance", status: "In Progress", assignedDate: "2024-09-16", requester: "Maria Santos", priority: "Medium", description: "Fix printer connectivity issues in Office 2A", location: "Office 2A, 2nd Floor" },
    { id: 3, title: "Network Setup Completion", type: "Technical Support", status: "Awaiting Feedback", assignedDate: "2024-09-15", requester: "Lisa Chen", priority: "Medium", description: "Complete network configuration for new workstation", location: "IT Department" }
];

// Reusable Status Badge Component
const StatusBadge = ({ status }) => {
    const statusClass = `status-badge status-${status.toLowerCase().replace(' ', '-')}`;
    return <span className={statusClass}>{status}</span>;
};

// Reusable Priority Badge Component
const PriorityBadge = ({ priority }) => {
    const priorityClass = `priority-badge priority-${priority.toLowerCase()}`;
    return <span className={priorityClass}>{priority}</span>;
};


export default function PersonnelDashboard() {
    // For the sprint, we use static mock data
    const tasks = MOCK_TASKS;
    const stats = {
        assigned: tasks.filter(t => t.status === "Assigned").length,
        inProgress: tasks.filter(t => t.status === "In Progress").length,
        awaitingFeedback: tasks.filter(t => t.status === "Awaiting Feedback").length,
        completed: tasks.filter(t => t.status === "Completed").length,
    };

    return (
        <div className="page-content personnel-dashboard">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Tasks</h1>
                    <p className="page-subtitle">Manage your assigned service requests</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="card stat-card"><div className="stat-icon icon-yellow"><Clock /></div><div><p className="stat-value">{stats.assigned}</p><p className="stat-title">Assigned</p></div></div>
                <div className="card stat-card"><div className="stat-icon icon-blue"><Play /></div><div><p className="stat-value">{stats.inProgress}</p><p className="stat-title">In Progress</p></div></div>
                <div className="card stat-card"><div className="stat-icon icon-purple"><MessageSquare /></div><div><p className="stat-value">{stats.awaitingFeedback}</p><p className="stat-title">Awaiting Feedback</p></div></div>
                <div className="card stat-card"><div className="stat-icon icon-green"><CheckCircle /></div><div><p className="stat-value">{stats.completed}</p><p className="stat-title">Completed</p></div></div>
            </div>

            <div className="card tasks-card">
                <div className="card-header">
                    <h3>Assigned Tasks</h3>
                </div>
                <div className="card-content">
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
                                    <div className="task-detail"><Calendar size={14} /> Assigned: <strong>{task.assignedDate}</strong></div>
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