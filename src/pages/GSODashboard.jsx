// src/pages/GSODashboard.jsx

import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertTriangle, FileText, ThumbsUp, ThumbsDown, Eye, Calendar } from "lucide-react";

// Utility to render one of the imported icons by key.
// Usage: renderIcon('clock', { size: 20, className: 'my-icon' })
// Note: removed unused renderIcon helper to satisfy lint rules
import GlobalModal from '../components/GlobalModal';
import './Dashboard.css'; // <-- Use our existing CSS file
import SectionHeader from '../components/SectionHeader';
import { listenToPendingRequests, updateRequestStatus, listenToBookings, listenToUsers } from '../services/firestoreService'; // add service imports
import { useNavigate } from 'react-router-dom';

// Reusable Priority Badge Component
const PriorityBadge = ({ priority }) => {
    const priorityClass = `priority-badge priority-${priority.toLowerCase()}`;
    return <span className={priorityClass}>{priority}</span>;
};

const StatCard = ({ title, value, icon, onClick }) => (
  <div className={`card stat-card clickable ${onClick ? 'clickable-card' : ''}`} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
    <div className="stat-icon">{icon}</div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
    </div>
  </div>
);

export default function GSODashboard() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  // --- NEW: bookings state for mini-calendar ---
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState(null);

  // --- users map to enrich requests with requester details ---
  const [usersById, setUsersById] = useState({});
  const [usersByEmail, setUsersByEmail] = useState({});
  // loadingUsers is intentionally unused here (kept for future enhancements)
  /* eslint-disable-next-line no-unused-vars */
  const [loadingUsers, setLoadingUsers] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToPendingRequests((data, err) => {
      if (err) {
        setError(err);
        setLoading(false);
        return;
      }
      setPendingRequests(data || []);
      setLoading(false);
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // subscribe to bookings for the mini calendar
  useEffect(() => {
    setLoadingBookings(true);
    const unsub = listenToBookings((data, err) => {
      if (err) {
        setBookingsError(err);
        setLoadingBookings(false);
        return;
      }
      // normalize bookings: ensure date strings for display
      const normalized = (data || []).map(b => {
        const rawDate = b.startDate || b.date || b.createdAt || b.time || b.submittedAt || null;
        const dateObj = rawDate && typeof rawDate.toDate === 'function' ? rawDate.toDate() : (rawDate ? new Date(rawDate) : null);
        const dateLabel = dateObj ? dateObj.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (b.date || 'TBD');
        return {
          id: b.id,
          title: b.title || b.summary || b.resourceName || b.purpose || 'Booking',
          dateLabel,
          dateObj,
          location: b.location || b.resourceLocation || '',
          type: b.type || b.category || ''
        };
      })
        // sort ascending by dateObj (nulls last)
        .sort((a, b) => {
          if (!a.dateObj && !b.dateObj) return 0;
          if (!a.dateObj) return 1;
          if (!b.dateObj) return -1;
          return a.dateObj - b.dateObj;
        });
      setBookings(normalized);
      setLoadingBookings(false);
    });
    return () => { if (unsub) unsub(); };
  }, []);

  // subscribe to users collection once and build lookups
  useEffect(() => {
    setLoadingUsers(true);
    const unsub = listenToUsers((data, err) => {
      if (err) {
        // don't block requests if users failed to load
        console.error('Failed to load users', err);
        setUsersById({});
        setUsersByEmail({});
        setLoadingUsers(false);
        return;
      }
      const byId = {};
      const byEmail = {};
      (data || []).forEach(u => {
        if (!u) return;
        if (u.id) byId[u.id] = u;
        const email = (u.email || u.emailAddress || '').toLowerCase();
        if (email) byEmail[email] = u;
      });
      setUsersById(byId);
      setUsersByEmail(byEmail);
      setLoadingUsers(false);
    });
    return () => { if (unsub) unsub(); };
  }, []);

  // helper to safely format dates from various possible fields
  const safeFormatDate = (d) => {
    if (!d) return '—';
    try {
      if (d instanceof Date) return d.toLocaleString();
      if (d && typeof d.toDate === 'function') return d.toDate().toLocaleString();
      return new Date(d).toLocaleString();
    } catch (e) {
      console.error('safeFormatDate error', e);
      return '—';
    }
  };

  // helper to resolve requester info for a request object
  const getRequesterInfo = (req) => {
    if (!req) return { name: 'Unknown', email: '', department: '' };
    // try common id/email fields
    const candidateIds = [req.requesterId, req.userId, req.userUid, req.uid, req.createdBy, req.requesterUID];
    for (const id of candidateIds) {
      if (id && usersById[id]) {
        const u = usersById[id];
        return {
          name: u.fullName || u.displayName || u.fullname || u.name || u.email || 'Unknown',
          email: u.email || '',
          department: u.department || u.office || u.unit || (u.role && u.role.toLowerCase().includes('gov') ? u.role : '') || '',
          contactNumber: u.contactNumber || u.phone || ''
        };
      }
    }
    // try email
    const candidateEmails = [req.requesterEmail, req.userEmail, req.email, req.contactEmail, req.requester_email];
    for (const em of candidateEmails) {
      if (!em) continue;
      const lower = ('' + em).toLowerCase();
      if (usersByEmail[lower]) {
        const u = usersByEmail[lower];
        return {
          name: u.fullName || u.displayName || u.fullname || u.name || u.email || 'Unknown',
          email: u.email || '',
          department: u.department || u.office || u.unit || (u.role && u.role.toLowerCase().includes('gov') ? u.role : '') || '',
          contactNumber: u.contactNumber || u.phone || ''
        };
      }
    }

    // fallback: use any requester fields directly on request
    const fallbackName = req.requesterName || req.requester || req.requestedBy || req.requestor || req.fullName || '';
    return {
      name: fallbackName || (req.email || req.userEmail ? (req.fullName || req.email || req.userEmail) : 'Unknown'),
      email: req.email || req.userEmail || '',
      department: req.department || req.office || '',
      contactNumber: req.contactNumber || ''
    };
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await updateRequestStatus(id, newStatus);
    } catch (err) {
      console.error('Failed to update status', err);
      setError(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="page-content gso-dashboard">
      {/* Use the shared SectionHeader so the title and subtitle are portalled into the banner when present */}
      <SectionHeader title="GSO Dashboard" subtitle="Manage service requests and resources" />
      <div className="stats-grid">
        <StatCard title="Pending Requests" value={loading ? '...' : pendingRequests.length} icon="🕒" onClick={() => navigate('/requests')} />
        <StatCard title="Completed This Month" value="45" icon="✅" onClick={() => navigate('/analytics')} />
        <StatCard title="In Progress" value="8" icon="⚠️" onClick={() => navigate('/requests')} />
        <StatCard title="Avg Response Time" value="2.3 hours" icon="📄" onClick={() => navigate('/analytics')} />
      </div>
      <div className="dashboard-main-grid">
        <div className="card action-required-panel">
          <h3>Action Required</h3>
          <div className="card-content">

          {loading && <p style={{ color: 'var(--color-text-light)' }}>Loading pending requests...</p>}
          {error && <p style={{ color: 'var(--color-danger)' }}>Error loading requests.</p>}

          {!loading && !error && pendingRequests.length === 0 && (
            <p style={{ color: 'var(--color-text-light)' }}>No pending requests.</p>
          )}

          {!loading && !error && pendingRequests.map(req => {
            const requester = getRequesterInfo(req);
            const dateLabel = safeFormatDate(req.requestedDate || req.createdAt || req.submittedAt || req.created);
            void dateLabel; // currently not shown in list but kept for future UI
            return (
              <div key={req.id} className="request-item clickable" onClick={() => navigate('/requests')}>
                <div>
                  <h4>{req.title || req.serviceType || 'Request'}</h4>
                  <p>
                    <strong style={{ marginRight: 8 }}>{requester.name}</strong>
                    {requester.department ? <span style={{ color: 'var(--color-text-muted)' }}>• {requester.department}</span> : null}
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: 12, fontSize: 12 }}>{req.id}</span>
                  </p>
                </div>

                {/* move actions to footer so they align at the bottom of the card */}
                <div className="request-item-footer">
                  <div className={`priority-label priority-${(req.priority || 'medium').toLowerCase()}`}>{req.priority || 'Medium'}</div>
                  <div className="request-item-buttons">
                    <button
                      className="btn btn-primary"
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(req.id, 'Approved'); }}
                      disabled={updatingId === req.id}
                    >
                      {updatingId === req.id ? 'Updating…' : 'Approve'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(req.id, 'Denied'); }}
                      disabled={updatingId === req.id}
                    >
                      {updatingId === req.id ? 'Updating…' : 'Deny'}
                    </button>
                    <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); setModalContent({ ...req, __requester: requester }); setModalOpen(true); }}>Details</button>
                  </div>
                </div>
              </div>
            );
          })}

          </div>
        </div>

        <div className="card calendar-panel">
          <h3>Calendar</h3>
          <div className="card-content">

          {loadingBookings && <p style={{ textAlign: 'center', color: 'var(--color-text-light)', marginTop: '1rem' }}>Loading calendar...</p>}
          {bookingsError && <p style={{ textAlign: 'center', color: 'var(--color-danger)', marginTop: '1rem' }}>Failed to load calendar.</p>}

          {!loadingBookings && bookings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              {bookings.slice(0, 6).map(b => (
                <div key={b.id} className="calendar-row clickable" onClick={() => navigate('/calendar')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{b.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-light)' }}>{b.location || 'No location'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--color-text-light)' }}>
                    <div>{b.dateLabel}</div>
                    <div style={{ marginTop: 4 }}>{b.type}</div>
                  </div>
                </div>
              ))}
              {bookings.length > 6 && <div style={{ textAlign: 'center', color: 'var(--color-text-light' }}>{bookings.length - 6} more events</div>}
            </div>
          )}

          {!loadingBookings && bookings.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-text-light)', marginTop: '2rem' }}>No upcoming bookings.</p>}

          </div>
        </div>
      </div>

      {/* Audit trail moved to Analytics page per request */}

      <GlobalModal open={modalOpen} title={modalContent ? (modalContent.title || 'Audit Trail') : 'Details'} onClose={() => setModalOpen(false)}>
        {modalContent ? (
          <div>
            <p><strong>ID:</strong> {modalContent.id}</p>
            <p><strong>Title:</strong> {modalContent.title}</p>
            <p><strong>Type:</strong> {modalContent.type || modalContent.serviceType}</p>
            <p><strong>Priority:</strong> {modalContent.priority}</p>
            {/* requester info (enriched) */}
            {modalContent.__requester ? (
              <div style={{ marginTop: 8 }}>
                <p><strong>Requester:</strong> {modalContent.__requester.name} {modalContent.__requester.email ? <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>• {modalContent.__requester.email}</span> : null}</p>
                {modalContent.__requester.department ? <p><strong>Department:</strong> {modalContent.__requester.department}</p> : null}
                {modalContent.__requester.contactNumber ? <p><strong>Contact:</strong> {modalContent.__requester.contactNumber}</p> : null}
              </div>
            ) : null}
            <p><strong>Submitted:</strong> {safeFormatDate(modalContent.createdAt || modalContent.createdAt || modalContent.submittedAt || modalContent.created)}</p>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{modalContent.description || modalContent.notes || 'No additional details.'}</pre>
          </div>
        ) : null}
      </GlobalModal>

    </div>
  );
}