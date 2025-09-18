// src/pages/AllRequestsPage.jsx

import { useState } from "react";
import { Search, Filter, Eye, FileText } from "lucide-react";
import './AllRequestsPage.css'; // <-- IMPORT OUR NEW CSS FILE

// Mock data (keep this as it is)
const allRequests = [
    { id: "REQ-001", requesterName: "Maria Santos", serviceType: "Venue Booking", status: "Approved", dateSubmitted: "2024-09-17", priority: "High", assignedTo: "Facilities Team" },
    { id: "REQ-002", requesterName: "John Doe", serviceType: "Vehicle Request", status: "In Progress", dateSubmitted: "2024-09-17", priority: "Medium", assignedTo: "Transportation Team" },
    { id: "REQ-003", requesterName: "Lisa Chen", serviceType: "Equipment", status: "Pending", dateSubmitted: "2024-09-16", priority: "Low" },
    { id: "REQ-004", requesterName: "David Kim", serviceType: "Maintenance", status: "Completed", dateSubmitted: "2024-09-15", priority: "Medium", assignedTo: "Maintenance Team" },
    { id: "REQ-005", requesterName: "Sarah Wilson", serviceType: "IT Support", status: "Awaiting Feedback", dateSubmitted: "2024-09-14", priority: "High", assignedTo: "IT Support Team" },
    { id: "REQ-006", requesterName: "Robert Johnson", serviceType: "Venue Booking", status: "Denied", dateSubmitted: "2024-09-13", priority: "Low" },
    { id: "REQ-007", requesterName: "Emily Davis", serviceType: "Vehicle Request", status: "Approved", dateSubmitted: "2024-09-12", priority: "Urgent", assignedTo: "Transportation Team" },
    { id: "REQ-008", requesterName: "Michael Brown", serviceType: "Equipment", status: "In Progress", dateSubmitted: "2024-09-11", priority: "Medium", assignedTo: "IT Support Team" }
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


export default function AllRequestsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [divisionFilter, setDivisionFilter] = useState("all");

    const filteredRequests = allRequests.filter(request => {
        const matchesSearch = request.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              request.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || request.status === statusFilter;
        const matchesDivision = divisionFilter === "all" || 
                                (request.assignedTo && request.assignedTo.toLowerCase().includes(divisionFilter.toLowerCase()));
        return matchesSearch && matchesStatus && matchesDivision;
    });

    return (
    <div className="page-content all-requests-page">
        <div className="page-header">
            <div>
                <h1 className="page-title">All Requests</h1>
                <p className="page-subtitle">Manage and track all service requests</p>
            </div>
            <div className="request-count">
                {filteredRequests.length} of {allRequests.length} requests
            </div>
        </div>

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
                        className="search-input"
                    />
                </div>
                
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Denied">Denied</option>
                    <option value="Awaiting Feedback">Awaiting Feedback</option>
                </select>

                <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)} className="filter-select">
                    <option value="all">All Divisions</option>
                    <option value="facilities">Facilities Team</option>
                    <option value="transportation">Transportation Team</option>
                    <option value="maintenance">Maintenance Team</option>
                    <option value="it">IT Support Team</option>
                </select>
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
                                        <div className="cell-requester">{request.requesterName}</div>
                                        {request.assignedTo && <div className="cell-assigned-to">Assigned to: {request.assignedTo}</div>}
                                    </td>
                                    <td>{request.serviceType}</td>
                                    <td><StatusBadge status={request.status} /></td>
                                    <td><PriorityBadge priority={request.priority} /></td>
                                    <td className="cell-date">{new Date(request.dateSubmitted).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn btn-secondary">
                                            <Eye size={16} /> View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredRequests.length === 0 && (
                    <div className="empty-state">
                        <FileText size={48} />
                        <p>No requests found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
    );
}