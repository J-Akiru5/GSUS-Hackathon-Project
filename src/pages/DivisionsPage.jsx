import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenToDivisions, createDivision, updateDivision, deleteDivision } from '../services/firestoreService';
import DivisionFormModal from '../components/DivisionFormModal';
import './DivisionsPage.css';

export default function DivisionsPage() {
	const navigate = useNavigate();
	const [divisions, setDivisions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [modalInitial, setModalInitial] = useState(undefined);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setLoading(true);
		const unsub = listenToDivisions((data, err) => {
			if (err) {
				setError(err);
				setDivisions([]);
				setLoading(false);
				return;
			}
			setDivisions(Array.isArray(data) ? data : []);
			setLoading(false);
		});
		return () => { if (unsub && typeof unsub === 'function') unsub(); };
	}, []);

	const handleCreate = () => {
		setModalInitial({});
		setModalOpen(true);
	};

	const handleEdit = (d) => {
		setModalInitial(d);
		setModalOpen(true);
	};

	const handleDelete = async (id) => {
		if (!id) return;
		if (!window.confirm('Delete this division? This action cannot be undone.')) return;
		try {
			await deleteDivision(id);
		} catch (e) {
			console.error('delete division failed', e);
			alert('Failed to delete division');
		}
	};

	const handleModalSave = async (payload) => {
		setSaving(true);
		try {
			if (modalInitial && modalInitial.id) {
				await updateDivision(modalInitial.id, payload);
			} else {
				const id = await createDivision({ ...payload, stats: {} });
				navigate(`/divisions/${id}`);
			}
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="divisions-page">
			<div className="section-header section-header--active divisions-header">
				<div className="divisions-header-left">
					<h2 className="divisions-title">Divisions</h2>
					<p className="muted">Manage GSO divisions and teams</p>
				</div>
				<div className="divisions-actions">
					<button className="btn btn-primary" onClick={handleCreate}>Add Division</button>
				</div>
			</div>

			<div className="divisions-content page-content">
				{loading && <div className="muted">Loading divisions…</div>}
				{error && <div className="error">Failed to load divisions: {String(error?.message || error)}</div>}

				<div className="divisions-grid">
					{divisions.map((d) => (
						<article key={d.id || d.name} className="division-card" onClick={() => navigate(`/divisions/${d.id}`)}>
							<header className="division-card-header">
								<div className="division-avatar">{(d.name || '').split(' ').map(s => s[0]).slice(0,2).join('')}</div>
								<div className="division-title">
									<h3>{d.name}</h3>
									<div className="division-sub">{d.id}</div>
								</div>
							</header>

							<div className="division-body">
								<p className="division-desc">{d.description}</p>

								<div className="division-stats">
									<div className="stat">
										<div className="value">{(d.stats && d.stats.personnel) ?? '-'}</div>
										<div className="label">Personnel</div>
									</div>
									<div className="stat">
										<div className="value">{(d.stats && d.stats.activeRequests) ?? '-'}</div>
										<div className="label">Active</div>
									</div>
									<div className="stat">
										<div className="value">{(d.stats && d.stats.completedThisMonth) ?? '-'}</div>
										<div className="label">Completed</div>
									</div>
									<div className="stat">
										<div className="value">{(d.stats && d.stats.avgResponseTime) ?? '-'}</div>
										<div className="label">Avg</div>
									</div>
								</div>

								<div className="division-actions">
									<button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); navigate(`/divisions/${d.id}`); }}>View</button>
									<button className="btn" onClick={(e) => { e.stopPropagation(); handleEdit(d); }}>Edit</button>
									<button className="btn btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}>Delete</button>
								</div>
							</div>
						</article>
					))}
				</div>
			</div>
			<DivisionFormModal open={modalOpen} initial={modalInitial} onClose={() => setModalOpen(false)} onSave={handleModalSave} saving={saving} />
		</div>
	);
}
