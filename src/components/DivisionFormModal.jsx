import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

export default function DivisionFormModal({ open, initial = {}, onClose, onSave, saving = false }) {
  const [name, setName] = useState(initial.name || '');
  const [description, setDescription] = useState(initial.description || '');
  const [error, setError] = useState(null);

  useEffect(() => {
    setName(initial.name || '');
    setDescription(initial.description || '');
    setError(null);
  }, [initial, open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name || !name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      await onSave({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (err) {
      setError((err && err.message) || 'Save failed');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <form onSubmit={handleSubmit}>
          <h3>{initial && initial.id ? 'Edit Division' : 'New Division'}</h3>
          <div className="form-row">
            <label htmlFor="division-name">Name</label>
            <input id="division-name" placeholder="e.g. Facilities Team" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-row">
            <label htmlFor="division-desc">Description</label>
            <textarea id="division-desc" placeholder="Short description" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

DivisionFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  initial: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
