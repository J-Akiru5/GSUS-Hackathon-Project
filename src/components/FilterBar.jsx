import React from 'react';
import './FilterBar.css';

export default function FilterBar({ showBookings, showRequests, onToggleBookings, onToggleRequests, categories, onToggleCategory }) {
  return (
    <div className="filter-bar">
      <label><input type="checkbox" checked={showBookings} onChange={onToggleBookings} /> Bookings</label>
      <label><input type="checkbox" checked={showRequests} onChange={onToggleRequests} /> Requests</label>
      <div className="filter-cats">
        <button className={`legend-pill venue ${categories['Venue'] ? 'active' : 'inactive'}`} onClick={() => onToggleCategory('Venue')}>Venue</button>
        <button className={`legend-pill vehicle ${categories['Vehicle'] ? 'active' : 'inactive'}`} onClick={() => onToggleCategory('Vehicle')}>Vehicle</button>
        <button className={`legend-pill equipment ${categories['Equipment'] ? 'active' : 'inactive'}`} onClick={() => onToggleCategory('Equipment')}>Equipment</button>
      </div>
    </div>
  );
}
