import React from 'react';
import { Activity, CheckCircle2, PlusCircle, XCircle, Info } from 'lucide-react';

// Mock data for the audit trail
const auditTrailData = [
    { id: 1, actor: 'Maria Santos', action: 'Approved', target: 'REQ-005', timestamp: '5 minutes ago' },
    { id: 2, actor: 'John Doe', action: 'Submitted', target: 'REQ-006', timestamp: '25 minutes ago' },
    { id: 3, actor: 'System', action: 'Completed', target: 'REQ-004', timestamp: '1 hour ago' },
    { id: 4, actor: 'Maria Santos', action: 'Denied', target: 'REQ-002', timestamp: '2 hours ago' },
    { id: 5, actor: 'Sarah Wilson', action: 'Updated', target: 'Personnel Profile', timestamp: '3 hours ago' }
];

const AuditTrailPanel = () => {
    const getActionIcon = (action) => {
        // We will use CSS classes to style these now
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

    return (
        <div className="card audit-trail-panel">
            <div className="card-header">
                <Activity className="icon" />
                <h3>Recent Activity</h3>
            </div>
            <div className="card-content">
                <ul className="audit-list">
                    {auditTrailData.map(item => (
                        <li key={item.id} className="audit-item">
                            {getActionIcon(item.action)}
                            <div className="audit-text">
                                <p>
                                    <strong>{item.actor}</strong> {item.action.toLowerCase()} request <strong>{item.target}</strong>.
                                </p>
                                <span className="audit-timestamp">{item.timestamp}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AuditTrailPanel;