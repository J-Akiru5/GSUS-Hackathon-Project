import React, { useState } from 'react';
import { createRequest, updateRequest } from '../services/firestoreService';

export default function RequestForm({ initialData = {}, onSaved = () => {}, onCancel = () => {} }) {
  const [title, setTitle] = useState(initialData.title || '');
  const [serviceType, setServiceType] = useState(initialData.serviceType || initialData.type || '');
  const [priority, setPriority] = useState(initialData.priority || 'Medium');
  const [description, setDescription] = useState(initialData.description || initialData.notes || '');
  const [requesterEmail, setRequesterEmail] = useState(initialData.requesterEmail || initialData.email || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title,
      serviceType,
      type: serviceType,
      priority,
      description,
      notes: description,
      requesterEmail: requesterEmail || undefined,
      updatedAt: new Date()
    };

    try {
      if (initialData && initialData.id) {
        await updateRequest(initialData.id, payload);
        onSaved({ id: initialData.id, ...payload });
      } else {
        const id = await createRequest({ ...payload, createdAt: new Date() });
        onSaved({ id, ...payload });
      }
    } catch (err) {
      console.error('Request save failed', err);
      // swallow: UI can be extended to show error state
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 360 }}>
      <label>
        Title
        <input value={title} onChange={e => setTitle(e.target.value)} required />
      </label>
      <label>
        Service Type
        <input value={serviceType} onChange={e => setServiceType(e.target.value)} />
      </label>
      <label>
        Priority
        <select value={priority} onChange={e => setPriority(e.target.value)}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </label>
      <label>
        Requester Email
        <input value={requesterEmail} onChange={e => setRequesterEmail(e.target.value)} placeholder="user@example.gov" />
      </label>
      <label>
        Description
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} />
      </label>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (initialData && initialData.id ? 'Save' : 'Create')}</button>
      </div>
    </form>
  );
}
