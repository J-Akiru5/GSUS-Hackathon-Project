import React, { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  initial?: Partial<any>;
  onClose: () => void;
  onSave: (payload: { name: string; description?: string }) => Promise<void> | void;
  saving?: boolean;
};

export default function DivisionFormModal({ open, initial = {}, onClose, onSave, saving = false }: Props) {
  const [name, setName] = useState(initial.name || '');
  const [description, setDescription] = useState(initial.description || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initial.name || '');
    setDescription(initial.description || '');
    setError(null);
  }, [initial, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      await onSave({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Save failed');
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
