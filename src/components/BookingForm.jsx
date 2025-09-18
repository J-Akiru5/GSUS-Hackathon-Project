import React, { useState } from 'react';
import { createBooking, updateBooking } from '../services/firestoreService';

export default function BookingForm({ initialData = {}, onSaved = () => {}, onCancel = () => {} }) {
  const [title, setTitle] = useState(initialData.title || '');
  const [date, setDate] = useState(initialData.date || '');
  const [startTime, setStartTime] = useState(initialData.startTime || '');
  const [endTime, setEndTime] = useState(initialData.endTime || '');
  const [location, setLocation] = useState(initialData.location || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title,
      date,
      startTime,
      endTime,
      location,
      updatedAt: new Date()
    };

    try {
      if (initialData && initialData.id) {
        await updateBooking(initialData.id, payload);
        onSaved({ id: initialData.id, ...payload });
      } else {
        const id = await createBooking({ ...payload, createdAt: new Date() });
        onSaved({ id, ...payload });
      }
    } catch (err) {
      console.error('Booking save failed', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 320 }}>
      <label>
        Title
        <input value={title} onChange={e => setTitle(e.target.value)} required />
      </label>
      <label>
        Date
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
      </label>
      <label>
        Start Time
        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
      </label>
      <label>
        End Time
        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
      </label>
      <label>
        Location
        <input value={location} onChange={e => setLocation(e.target.value)} />
      </label>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (initialData && initialData.id ? 'Save' : 'Create')}</button>
      </div>
    </form>
  );
}
