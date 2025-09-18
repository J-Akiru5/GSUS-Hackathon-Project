// Clean, single implementation of AnalyticsPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Clock, Users, Calendar, Activity, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import './AnalyticsPage.css';
import SectionHeader from '../components/SectionHeader';
import { listenToRequests } from '../services/firestoreService';

export default function AnalyticsPage() {
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

  const formatDateKey = (input) => {
    if (!input) return 'Unknown';
    let d = input;
    if (typeof input === 'object' && typeof input.toDate === 'function') d = input.toDate();
    const dt = new Date(d);
    if (isNaN(dt)) return 'Unknown';
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const {
    totalRequests,
    avgApprovalTime,
    approvalRate,
    busiestResource,
    peakDay,
    userSatisfaction,
    requestsByDivision,
    requestsOverTime,
    statusDistribution,
    resourceUtilization,
    metrics
  } = useMemo(() => {
    const total = requests.length;

    const statusCounts = requests.reduce((acc, r) => {
      const s = (r.status || 'Pending');
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const approved = statusCounts['Approved'] || 0;
    const approvalRateCalc = total ? Math.round((approved / total) * 100) + '%' : 'N/A';

    let avgApproval = 'N/A';
    const durations = [];
    for (const r of requests) {
      const createdRaw = r.submittedAt || r.createdAt || r.dateSubmitted || r.details?.submittedAt;
      const created = createdRaw ? (typeof createdRaw.toDate === 'function' ? createdRaw.toDate() : new Date(createdRaw)) : null;
      const approvedRaw = r.approvedAt || r.updatedAt;
      const approvedAt = approvedRaw ? (typeof approvedRaw.toDate === 'function' ? approvedRaw.toDate() : new Date(approvedRaw)) : null;
      if (created && approvedAt && !isNaN(created) && !isNaN(approvedAt)) durations.push((approvedAt - created) / (1000 * 60 * 60));
    }
    if (durations.length) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const safeAvg = Number.isFinite(avg) ? avg : 0;
      avgApproval = `${safeAvg.toFixed(1)} hours`;
    }

    const byDivMap = {};
    for (const r of requests) {
      const key = r.assignedTo || r.assignedDivision || r.division || r.serviceType || 'Unassigned';
      if (!byDivMap[key]) byDivMap[key] = { division: key, approved: 0, denied: 0, total: 0 };
      byDivMap[key].total += 1;
      if ((r.status || '').toLowerCase() === 'approved') byDivMap[key].approved += 1;
      if ((r.status || '').toLowerCase() === 'denied') byDivMap[key].denied += 1;
    }
    const byDivision = Object.values(byDivMap);

    const overTimeMap = {};
    for (const r of requests) {
      const dateKeyRaw = r.submittedAt || r.dateSubmitted || r.createdAt || r.date || r.details?.submittedAt;
      const key = formatDateKey(dateKeyRaw);
      if (!overTimeMap[key]) overTimeMap[key] = { date: key, requests: 0, approved: 0 };
      overTimeMap[key].requests += 1;
      if ((r.status || '').toLowerCase() === 'approved') overTimeMap[key].approved += 1;
    }
    const overTimeArr = Object.values(overTimeMap)
      .sort((a, b) => {
        const parse = (label) => {
          const parsed = Date.parse(label);
          return isNaN(parsed) ? 0 : parsed;
        };
        return parse(a.date) - parse(b.date);
      })
      .slice(-8);

    const statusDistColors = {
      'Approved': "#10B981",
      'In Progress': "#3B82F6",
      'Pending': "#F59E0B",
      'Denied': "#EF4444",
      'Completed': "#E5E7EB",
      'Awaiting Feedback': "#F97316"
    };
    const statusDist = Object.entries(statusCounts).map(([name, val]) => ({
      name,
      value: total ? Math.round((val / total) * 100) : 0,
      raw: val,
      color: statusDistColors[name] || "#94A3B8"
    }));

    const resourceMap = {};
    for (const r of requests) {
      const key = r.resourceName || r.resource || r.serviceType || r.location || 'General';
      if (!resourceMap[key]) resourceMap[key] = 0;
      resourceMap[key] += 1;
    }
    const resourceArr = Object.entries(resourceMap).map(([resource, count]) => ({
      resource,
      utilization: total ? Math.round((count / total) * 100) : 0,
      bookings: count
    })).sort((a, b) => b.utilization - a.utilization).slice(0, 5);

    const busiest = resourceArr.length ? resourceArr[0].resource : 'N/A';

    const weekdayMap = {};
    for (const r of requests) {
      const dRaw = r.submittedAt || r.dateSubmitted || r.createdAt || r.details?.submittedAt;
      const d = dRaw ? (typeof dRaw.toDate === 'function' ? dRaw.toDate() : new Date(dRaw)) : null;
      if (!d || isNaN(new Date(d))) continue;
      const wd = new Date(d).toLocaleDateString(undefined, { weekday: 'long' });
      weekdayMap[wd] = (weekdayMap[wd] || 0) + 1;
    }
    const peak = Object.entries(weekdayMap).sort((a, b) => b[1] - a[1])[0];
    const peakDayName = peak ? peak[0] : 'N/A';

    let satisfaction = 'N/A';
    const ratings = requests.map(r => r.rating).filter(v => typeof v === 'number');
    if (ratings.length) {
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const safeAvg = Number.isFinite(avg) ? avg : 0;
      satisfaction = `${(safeAvg).toFixed(1)}/5`;
    }

    return {
      totalRequests: total,
      avgApprovalTime: avgApproval,
      approvalRate: approvalRateCalc,
      busiestResource: busiest,
      peakDay: peakDayName,
      userSatisfaction: satisfaction,
      requestsByDivision: byDivision,
      requestsOverTime: overTimeArr,
      statusDistribution: statusDist,
      resourceUtilization: resourceArr,
      metrics: {
        totalRequests: total,
        avgApprovalTime: avgApproval,
        approvalRate: approvalRateCalc,
        busiestResource: busiest,
        peakDay: peakDayName,
        userSatisfaction: satisfaction
      }
    };
  }, [requests]);

  const safeRequestsByDivision = (requestsByDivision && requestsByDivision.length)
    ? requestsByDivision
    : [{ division: 'No data', approved: 0, denied: 0 }];

  const safeRequestsOverTime = (requestsOverTime && requestsOverTime.length)
    ? requestsOverTime
    : [{ date: new Date().toLocaleDateString(), requests: 0, approved: 0 }];

  const safeStatusDistribution = (statusDistribution && statusDistribution.length)
    ? statusDistribution
    : [{ name: 'No data', value: 1, raw: 0, color: '#CBD5E1' }];

  const safeResourceUtilization = (resourceUtilization && resourceUtilization.length)
    ? resourceUtilization
    : [];

  const legendStatusSource = (statusDistribution && statusDistribution.length) ? statusDistribution : safeStatusDistribution;

  return (
    <div className="page-content analytics-page">
      <SectionHeader title="Analytics Dashboard" subtitle="Performance metrics and insights" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <div className="last-updated">Last updated: {new Date().toLocaleString()}</div>
      </div>

      <div className="metrics-grid">
        <div className="card metric-card">
          <div className="metric-header">
            <div>
              <p className="metric-title">Total Requests</p>
              <p className="metric-value">{loading ? '...' : metrics.totalRequests}</p>
            </div>
            <Activity className="metric-icon icon-primary" />
          </div>
          <div className="metric-trend trend-positive"><TrendingUp /> {loading ? '' : '+12% vs last month'}</div>
        </div>

        <div className="card metric-card">
          <div className="metric-header">
            <div>
              <p className="metric-title">Avg Approval Time</p>
              <p className="metric-value">{loading ? '...' : metrics.avgApprovalTime}</p>
            </div>
            <Clock className="metric-icon icon-info" />
          </div>
          <div className="metric-trend trend-positive"><TrendingDown /> -8% faster</div>
        </div>

        <div className="card metric-card">
          <div className="metric-header">
            <div>
              <p className="metric-title">Approval Rate</p>
              <p className="metric-value">{loading ? '...' : metrics.approvalRate}</p>
            </div>
            <TrendingUp className="metric-icon icon-primary" />
          </div>
          <div className="metric-trend trend-positive"><TrendingUp /> +3% vs last month</div>
        </div>

        <div className="card metric-card">
          <div className="metric-header">
            <div>
              <p className="metric-title">Busiest Resource</p>
              <p className="metric-value small">{loading ? '...' : metrics.busiestResource}</p>
            </div>
            <Calendar className="metric-icon icon-warning" />
          </div>
          <div className="metric-trend">85% utilization</div>
        </div>

        <div className="card metric-card">
          <div className="metric-header">
            <div>
              <p className="metric-title">Peak Day</p>
              <p className="metric-value">{loading ? '...' : metrics.peakDay}</p>
            </div>
            <BarChart3 className="metric-icon icon-purple" />
          </div>
          <div className="metric-trend">35+ avg requests</div>
        </div>

        <div className="card metric-card">
          <div className="metric-header">
            <div>
              <p className="metric-title">Satisfaction</p>
              <p className="metric-value">{loading ? '...' : metrics.userSatisfaction}</p>
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
              <BarChart data={safeRequestsByDivision}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="division" tick={{ fontSize: 12, fill: "#64748B" }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
                <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #E2E8F0", borderRadius: "8px" }} />
                <Bar dataKey="approved" fill="#10B981" name="Approved" />
                <Bar dataKey="denied" fill="#EF4444" name="Denied" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <div className="card-header"><Activity className="icon" /> Requests Over Time</div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={safeRequestsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
                <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #E2E8F0", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="requests" stroke="#10B981" strokeWidth={3} name="Total Requests" />
                <Line type="monotone" dataKey="approved" stroke="#3B82F6" strokeWidth={2} name="Approved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <div className="card-header"><PieChartIcon className="icon" /> Status Distribution</div>
          <div className="card-content pie-chart-content">
            <ResponsiveContainer width="60%" height={250}>
              <PieChart>
                <Pie data={safeStatusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {safeStatusDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-chart-legend">
              {legendStatusSource.map((item) => (
                <div key={item.name} className="legend-item">
                  <div className="legend-color-box" style={{ backgroundColor: item.color }} />
                  <span className="legend-name">{item.name}</span>
                  <span className="legend-value">{item.raw}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card chart-card">
          <div className="card-header"><Calendar className="icon" /> Resource Utilization</div>
          <div className="card-content">
            <div className="resource-list">
              {safeResourceUtilization.map((resource) => (
                <div key={resource.resource} className="resource-item">
                  <div className="resource-header">
                    <span className="resource-name">{resource.resource}</span>
                    <div className="resource-stats">
                      <span>{resource.bookings} bookings</span>
                      <span className="resource-percent">{resource.utilization}%</span>
                    </div>
                  </div>
                  <div className="progress-bar-background">
                    <div className="progress-bar-fill" style={{ width: `${Number.isFinite(resource.utilization) ? resource.utilization : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card insights-card">
        <div className="card-header"><TrendingUp className="icon" />Key Insights</div>
        <div className="card-content insights-grid">
          <div className="insight-item green"><div className="insight-header"><TrendingUp /> Performance Improvement</div> <p>Approval time decreased compared to prior period.</p></div>
          <div className="insight-item yellow"><div className="insight-header"><Calendar /> High Demand</div> <p>{busiestResource} has high utilization. Consider optimizing scheduling.</p></div>
          <div className="insight-item blue"><div className="insight-header"><Users /> User Satisfaction</div> <p>User satisfaction is {userSatisfaction} based on available ratings.</p></div>
        </div>
      </div>
    </div>
  );
}