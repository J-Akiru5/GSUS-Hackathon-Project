import React, { useEffect, useState } from 'react';
import './DivisionFormModal.css';

export default function DivisionFormModal({ open, initial, onClose, onSave, saving }) {
  const [form, setForm] = useState({ name: '', description: '', leadName: '', leadRole: '' });

  useEffect(() => {
    if (initial) setForm({
      name: initial.name || '',
      description: initial.description || '',
      leadName: initial.leadName || '',
      leadRole: initial.leadRole || ''
    });
    else setForm({ name: '', description: '', leadName: '', leadRole: '' });
  }, [initial, open]);

  if (!open) return null;

  const change = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (typeof onSave === 'function') await onSave({ name: form.name, description: form.description, leadName: form.leadName, leadRole: form.leadRole });
  };

  return (
    <div className="division-modal-backdrop" onMouseDown={onClose} role="dialog" aria-modal="true">
      <form className="division-modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}>
        <header className="division-modal-header">
          <h3>{initial && initial.id ? 'Edit Division' : 'New Division'}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="division-modal-body">
          <label className="field">
            <div className="label">Name</div>
            <input value={form.name} onChange={change('name')} required />
          </label>
          <label className="field">
            <div className="label">Description</div>
            <textarea value={form.description} onChange={change('description')} rows={3} />
          </label>
          <label className="field two-up">
            <div>
              <div className="label">Lead name</div>
              <input value={form.leadName} onChange={change('leadName')} />
            </div>
            <div>
              <div className="label">Lead role</div>
              <input value={form.leadRole} onChange={change('leadRole')} />
            </div>
          </label>
        </div>
        <footer className="division-modal-footer">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (initial && initial.id ? 'Save' : 'Create')}</button>
        </footer>
      </form>
    </div>
  );
}
