import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDivisionById, updateDivision, deleteDivision } from '../services/firestoreService';
import './DivisionsPage.css';
import { Division } from './DivisionsPage';
import DivisionFormModal from '../components/DivisionFormModal';

export default function DivisionDetail(): React.ReactElement {
  const { id } = useParams();
  const navigate = useNavigate();
  const [division, setDivision] = useState<Division | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setError(new Error('Invalid division id'));
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const d = await getDivisionById(id);
        if (mounted) setDivision(d as Division | null);
      } catch (e) {
        setError(e as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleEdit = async () => {
    // open modal (handled below)
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!division || !division.id) return;
    if (!window.confirm('Delete this division?')) return;
    try {
      await deleteDivision(division.id);
      navigate('/divisions');
    } catch (e) {
      console.error('delete failed', e);
      alert('Failed to delete division');
    }
  };

  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const handleModalSave = async (payload: { name: string; description?: string }) => {
    if (!division || !division.id) return;
    setSaving(true);
    try {
      await updateDivision(division.id, payload);
      const updated = await getDivisionById(division.id);
      setDivision(updated as Division | null);
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="muted">Loading division…</div>;
  if (error) return <div className="error">Error: {String(error.message || error)}</div>;
  if (!division) return <div className="muted">Division not found</div>;

  return (
    <div className="division-detail page-content">
      <div className="card division-detail-card">
        <div className="division-detail-header">
          <div className="division-avatar large">{(division.name || '').split(' ').map(s => s[0]).slice(0,2).join('')}</div>
          <div className="division-detail-title">
            <h2 className="no-margin">{division.name}</h2>
            <div className="muted">ID: {division.id}</div>
          </div>
          <div className="division-detail-actions">
            <button className="btn" onClick={handleEdit}>Edit</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>

        <div className="division-detail-desc">
          <p>{division.description}</p>
        </div>

        <div className="division-stats division-detail-stats">
          <div className="stat"><div className="value">{division.stats?.personnel ?? '-'}</div><div className="label">Personnel</div></div>
          <div className="stat"><div className="value">{division.stats?.activeRequests ?? '-'}</div><div className="label">Active</div></div>
          <div className="stat"><div className="value">{division.stats?.completedThisMonth ?? '-'}</div><div className="label">Completed</div></div>
        </div>
      </div>
      <DivisionFormModal open={modalOpen} initial={division || undefined} onClose={() => setModalOpen(false)} onSave={handleModalSave} saving={saving} />
    </div>
  );
}
