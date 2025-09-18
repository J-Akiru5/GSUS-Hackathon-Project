// src/pages/AnalyticsPage.jsx

import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Clock, Users, Calendar, Activity, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import './AnalyticsPage.css'; // <-- IMPORT OUR NEW CSS FILE

// Mock data (keep this as it is)
const requestsByDivision = [
    { division: "Facilities", approved: 38, denied: 7 }, { division: "Transportation", approved: 28, denied: 4 },
    { division: "Maintenance", approved: 22, denied: 6 }, { division: "IT Support", approved: 20, denied: 4 },
    { division: "Procurement", approved: 15, denied: 3 }
];
const requestsOverTime = [
    { date: "Sep 1", requests: 8, approved: 6 }, { date: "Sep 3", requests: 15, approved: 11 },
    { date: "Sep 5", requests: 18, approved: 14 }, { date: "Sep 7", requests: 16, approved: 13 },
    { date: "Sep 9", requests: 19, approved: 15 }, { date: "Sep 11", requests: 17, approved: 14 },
    { date: "Sep 13", requests: 23, approved: 19 }, { date: "Sep 15", requests: 21, approved: 17 }
];
const statusDistribution = [
    { name: "Approved", value: 68, color: "#10B981" }, { name: "In Progress", value: 18, color: "#3B82F6" },
    { name: "Pending", value: 10, color: "#F59E0B" }, { name: "Denied", value: 4, color: "#EF4444" }
];
const resourceUtilization = [
    { resource: "Conference Room A", utilization: 85, bookings: 24 }, { resource: "Vehicle Unit 001", utilization: 72, bookings: 18 },
    { resource: "Board Room", utilization: 68, bookings: 16 }, { resource: "Vehicle Unit 002", utilization: 58, bookings: 14 },
    { resource: "Equipment Room", utilization: 45, bookings: 12 }
];
const metrics = {
    totalRequests: 147, avgApprovalTime: "2.3 hours", approvalRate: "89%",
    busiestResource: "Conference Room A", peakDay: "Monday", userSatisfaction: "4.7/5"
};

export default function AnalyticsPage() {
    return (
        <div className="page-content analytics-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics Dashboard</h1>
                    <p className="page-subtitle">Performance metrics and insights</p>
                </div>
                <div className="last-updated">Last updated: {new Date().toLocaleDateString()}</div>
            </div>

            <div className="metrics-grid">
                <div className="card metric-card">
                    <div className="metric-header">
                        <div>
                            <p className="metric-title">Total Requests</p>
                            <p className="metric-value">{metrics.totalRequests}</p>
                        </div>
                        <Activity className="metric-icon icon-primary" />
                    </div>
                    <div className="metric-trend trend-positive"><TrendingUp /> +12% vs last month</div>
                </div>
                <div className="card metric-card">
                    <div className="metric-header">
                        <div>
                            <p className="metric-title">Avg Approval Time</p>
                            <p className="metric-value">{metrics.avgApprovalTime}</p>
                        </div>
                        <Clock className="metric-icon icon-info" />
                    </div>
                    <div className="metric-trend trend-positive"><TrendingDown /> -8% faster</div>
                </div>
                <div className="card metric-card">
                     <div className="metric-header">
                        <div>
                            <p className="metric-title">Approval Rate</p>
                            <p className="metric-value">{metrics.approvalRate}</p>
                        </div>
                        <TrendingUp className="metric-icon icon-primary" />
                    </div>
                    <div className="metric-trend trend-positive"><TrendingUp /> +3% vs last month</div>
                </div>
                 <div className="card metric-card">
                    <div className="metric-header">
                        <div>
                            <p className="metric-title">Busiest Resource</p>
                            <p className="metric-value small">{metrics.busiestResource}</p>
                        </div>
                        <Calendar className="metric-icon icon-warning" />
                    </div>
                    <div className="metric-trend">85% utilization</div>
                </div>
                <div className="card metric-card">
                    <div className="metric-header">
                        <div>
                            <p className="metric-title">Peak Day</p>
                            <p className="metric-value">{metrics.peakDay}</p>
                        </div>
                        <BarChart3 className="metric-icon icon-purple" />
                    </div>
                    <div className="metric-trend">35+ avg requests</div>
                </div>
                <div className="card metric-card">
                    <div className="metric-header">
                        <div>
                            <p className="metric-title">Satisfaction</p>
                            <p className="metric-value">{metrics.userSatisfaction}</p>
                        </div>
                        <Users className="metric-icon icon-primary" />
                    </div>
                    <div className="metric-trend trend-positive"><TrendingUp /> +0.2 vs last month</div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="card chart-card">
                    <div className="card-header"><BarChart3 className="icon" /> Requests per Division</div>
                    <div className="card-content">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={requestsByDivision}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis dataKey="division" tick={{ fontSize: 12, fill: "#64748B" }} angle={-45} textAnchor="end" height={60}/>
                                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
                                <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #E2E8F0", borderRadius: "8px" }} />
                                <Bar dataKey="approved" fill="#10B981" name="Approved" />
                                <Bar dataKey="denied" fill="#EF4444" name="Denied" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card chart-card">
                    <div className="card-header"><Activity className="icon" /> Requests Over Time (Last 15 Days)</div>
                    <div className="card-content">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={requestsOverTime}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748B" }}/>
                                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
                                <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #E2E8F0", borderRadius: "8px" }}/>
                                <Line type="monotone" dataKey="requests" stroke="#10B981" strokeWidth={3} name="Total Requests"/>
                                <Line type="monotone" dataKey="approved" stroke="#3B82F6" strokeWidth={2} name="Approved"/>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card chart-card">
                    <div className="card-header"><PieChartIcon className="icon" /> Request Status Distribution</div>
                    <div className="card-content pie-chart-content">
                        <div style={{ width: '60%', height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="pie-chart-legend">
                            {statusDistribution.map((item) => (
                                <div key={item.name} className="legend-item">
                                    <div className="legend-color-box" style={{ backgroundColor: item.color }} />
                                    <span className="legend-name">{item.name}</span>
                                    <span className="legend-value">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card chart-card">
                    <div className="card-header"><Calendar className="icon" /> Resource Utilization</div>
                    <div className="card-content">
                        <div className="resource-list">
                            {resourceUtilization.map((resource) => (
                                <div key={resource.resource} className="resource-item">
                                    <div className="resource-header">
                                        <span className="resource-name">{resource.resource}</span>
                                        <div className="resource-stats">
                                            <span>{resource.bookings} bookings</span>
                                            <span className="resource-percent">{resource.utilization}%</span>
                                        </div>
                                    </div>
                                    <div className="progress-bar-background">
                                        <div className="progress-bar-fill" style={{ width: `${resource.utilization}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}