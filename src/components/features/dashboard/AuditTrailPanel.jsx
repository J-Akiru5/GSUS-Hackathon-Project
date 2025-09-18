import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, PlusCircle, XCircle, Info } from 'lucide-react';
import { listenToRequests } from '../../../services/firestoreService';
import { toDate } from '../../../utils/dateHelpers';

const getActionIcon = (action) => {
    switch (action) {
        case 'Approved':
            return <div className="audit-icon icon-success"><CheckCircle2 size={16} /></div>;
        case 'Submitted':
            return <div className="audit-icon icon-info"><PlusCircle size={16} /></div>;
        case 'Denied':
            return <div className="audit-icon icon-danger"><XCircle size={16} /></div>;
        default:
            return <div className="audit-icon icon-default"><Info size={16} /></div>;
    }
};

const timeAgo = (date) => {
    if (!date) return '';
    const d = toDate(date) || (date instanceof Date ? date : new Date(date));
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const AuditTrailPanel = () => {
    const [items, setItems] = useState([]);
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
            // Build recent activity entries from requests (latest status/updates)
            const sorted = (data || [])
                .map(r => ({
                    id: r.id,
                    actor: r.approvedBy || r.modifiedBy || r.requesterName || r.requester || 'System',
                    action: r.status || 'Updated',
                    target: r.id,
                    timestamp: toDate(r.updatedAt || r.submittedAt || r.dateSubmitted || r.details?.submittedAt) || new Date()
                }))
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 8);
            setItems(sorted);
            setLoading(false);
        });
        return () => { if (unsubscribe) unsubscribe(); };
    }, []);

    return (
        <div className="card audit-trail-panel">
            <div className="card-header">
                <Activity className="icon" />
                <h3>Recent Activity</h3>
            </div>
            <div className="card-content">
                {loading && <p style={{ color: 'var(--color-text-light)' }}>Loading activity...</p>}
                {error && <p style={{ color: 'var(--color-danger)' }}>Error loading activity</p>}
                <ul className="audit-list">
                    {items.map(item => (
                        <li key={item.id} className="audit-item">
                            {getActionIcon(item.action)}
                            <div className="audit-text">
                                <p>
                                    <strong>{item.actor}</strong> {String(item.action).toLowerCase()} request <strong>{item.target}</strong>.
                                </p>
                                <span className="audit-timestamp">{timeAgo(new Date(item.timestamp))}</span>
                            </div>
                        </li>
                    ))}
                    {!loading && items.length === 0 && <p style={{ color: 'var(--color-text-light)' }}>No recent activity.</p>}
                </ul>
            </div>
        </div>
    );
};

export default AuditTrailPanel;