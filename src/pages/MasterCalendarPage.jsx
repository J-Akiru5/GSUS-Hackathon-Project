// src/pages/MasterCalendarPage.jsx

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight, Building, Car, MapPin, Clock, User } from "lucide-react";
import './MasterCalendarPage.css'; // <-- IMPORT OUR NEW CSS FILE
import { listenToBookings, listenToRequests, getUserById, getUserByEmail, getUserByAuthUid } from '../services/firestoreService';
import { toDate } from '../utils/dateHelpers';
import GlobalModal from '../components/GlobalModal';
import BookingForm from '../components/BookingForm';
import SectionHeader from '../components/SectionHeader';
import FilterBar from '../components/FilterBar';
import Popover from '../components/Popover';

export default function MasterCalendarPage() {
    useEffect(() => {
        document.body.classList.add('hide-banner');
        return () => document.body.classList.remove('hide-banner');
    }, []);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [unscheduledEvents, setUnscheduledEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [filters, setFilters] = useState({ showBookings: true, showRequests: true, categories: { Venue: true, Vehicle: true, Equipment: true, Booking: true, Request: true } });
    const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'
    const [firstDayOfWeek, setFirstDayOfWeek] = useState(0); // 0=Sun..6=Sat
    const [timeFormat24, setTimeFormat24] = useState(false);
    const [workHours, setWorkHours] = useState({ start: 8, end: 18 });
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        // restore persisted settings
        try {
            const raw = localStorage.getItem('masterCalendar.settings');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.viewMode) setViewMode(parsed.viewMode);
                if (typeof parsed.firstDayOfWeek === 'number') setFirstDayOfWeek(parsed.firstDayOfWeek);
                if (typeof parsed.timeFormat24 === 'boolean') setTimeFormat24(parsed.timeFormat24);
                if (parsed.workHours) setWorkHours(parsed.workHours);
            }
        } catch (e) { /* ignore */ }

        setLoading(true);
        const unsubBookings = listenToBookings((data, err) => {
            if (err) {
                setError(err);
                setLoading(false);
                return;
            }
            // Normalize bookings -> calendar event shape used by this page
            const normalized = (data || []).map(b => {
                const rawStart = b.startDate || b.date || b.createdAt || b.startTime || null;
                const start = toDate(rawStart);
                const end = toDate(b.endDate || b.endTime || null);
                const dateStr = start ? start.toISOString().split('T')[0] : (b.date || (b.createdAt ? (toDate(b.createdAt) ? toDate(b.createdAt).toISOString().split('T')[0] : '') : ''));
                return {
                    id: `booking-${b.id}`,
                    source: 'booking',
                    origId: b.id,
                    title: b.title || b.summary || b.resourceName || (b.purpose ? `${b.purpose}` : 'Booking'),
                    type: b.type || b.category || (b.purpose ? 'Venue' : 'Booking'),
                    date: dateStr || '',
                    startTime: start ? start.toTimeString().slice(0, 5) : (b.time || b.startTime || ''),
                    endTime: end ? end.toTimeString().slice(0, 5) : (b.endTime || ''),
                    requester: b.requesterName || b.requester || b.userId || b.createdBy || b.userEmail || '—',
                    location: b.location || b.resourceLocation || '',
                    description: b.description || b.notes || '',
                    raw: b,
                    status: (b.status || 'confirmed').charAt(0).toUpperCase() + (b.status || 'confirmed').slice(1)
                };
            });
            // enrich requester display names asynchronously then merge with existing requests
            (async () => {
                const enriched = await Promise.all((normalized || []).map(async (ev) => {
                    const out = { ...ev };
                    const rawRequester = ev.requester || ev.raw?.userId || ev.raw?.createdBy || ev.raw?.requester || ev.raw?.requesterName || '';
                    try {
                        if (!rawRequester) {
                            out.requesterName = '—';
                            return out;
                        }
                        // if looks like an email
                        if (String(rawRequester).includes('@')) {
                            const u = await getUserByEmail(String(rawRequester));
                            out.requesterName = (u && (u.fullName || u.email)) || String(rawRequester);
                            return out;
                        }
                        // try doc id lookup
                        const byId = await getUserById(String(rawRequester));
                        if (byId) {
                            out.requesterName = byId.fullName || byId.email || String(rawRequester);
                            return out;
                        }
                        // try authUid lookup
                        const byAuth = await getUserByAuthUid(String(rawRequester));
                        if (byAuth) {
                            out.requesterName = byAuth.fullName || byAuth.email || String(rawRequester);
                            return out;
                        }
                        // fallback to raw value
                        out.requesterName = String(rawRequester);
                        return out;
                    } catch (e) {
                        out.requesterName = String(rawRequester);
                        return out;
                    }
                }));

                setCalendarEvents(prev => {
                    const requestsOnly = prev.filter(e => e.source === 'request');
                    const combined = [...enriched, ...requestsOnly];
                    // scheduled only
                    return combined.filter(e => !!e.date);
                });
                setUnscheduledEvents(prev => {
                    const requestsOnly = prev.filter(e => e.source === 'request');
                    return [...enriched.filter(e => !e.date), ...requestsOnly];
                });
                setLoading(false);
            })();
        });

        const unsubRequests = listenToRequests((data, err) => {
            if (err) {
                setError(err);
                setLoading(false);
                return;
            }
            // Normalize requests similarly
            const normalized = (data || []).map(r => {
                const rawStart = r.requestedDate || r.date || r.createdAt || r.startTime || null;
                const start = toDate(rawStart);
                const end = toDate(r.endDate || r.endTime || null);
                const dateStr = start ? start.toISOString().split('T')[0] : (r.date || (r.createdAt ? (toDate(r.createdAt) ? toDate(r.createdAt).toISOString().split('T')[0] : '') : ''));
                return {
                    id: `request-${r.id}`,
                    source: 'request',
                    origId: r.id,
                    title: r.title || r.summary || r.subject || 'Request',
                    type: 'Request',
                    date: dateStr || '',
                    startTime: start ? start.toTimeString().slice(0, 5) : (r.time || r.startTime || ''),
                    endTime: end ? end.toTimeString().slice(0, 5) : (r.endTime || ''),
                    requester: r.requesterName || r.requester || r.userId || r.createdBy || r.userEmail || '—',
                    location: r.location || r.resourceLocation || '',
                    description: r.description || r.notes || r.reason || '',
                    raw: r,
                    status: (r.status || 'pending').charAt(0).toUpperCase() + (r.status || 'pending').slice(1)
                };
            });
            // enrich requester display names asynchronously then merge with existing bookings
            (async () => {
                const enriched = await Promise.all((normalized || []).map(async (ev) => {
                    const out = { ...ev };
                    const rawRequester = ev.requester || ev.raw?.userId || ev.raw?.createdBy || ev.raw?.requester || ev.raw?.requesterName || '';
                    try {
                        if (!rawRequester) {
                            out.requesterName = '—';
                            return out;
                        }
                        if (String(rawRequester).includes('@')) {
                            const u = await getUserByEmail(String(rawRequester));
                            out.requesterName = (u && (u.fullName || u.email)) || String(rawRequester);
                            return out;
                        }
                        const byId = await getUserById(String(rawRequester));
                        if (byId) {
                            out.requesterName = byId.fullName || byId.email || String(rawRequester);
                            return out;
                        }
                        const byAuth = await getUserByAuthUid(String(rawRequester));
                        if (byAuth) {
                            out.requesterName = byAuth.fullName || byAuth.email || String(rawRequester);
                            return out;
                        }
                        out.requesterName = String(rawRequester);
                        return out;
                    } catch (e) {
                        out.requesterName = String(rawRequester);
                        return out;
                    }
                }));

                setCalendarEvents(prev => {
                    const bookingsOnly = prev.filter(e => e.source === 'booking');
                    const combined = [...bookingsOnly, ...enriched];
                    return combined.filter(e => !!e.date);
                });
                setUnscheduledEvents(prev => {
                    const bookingsOnly = prev.filter(e => e.source === 'booking');
                    return [...bookingsOnly, ...enriched.filter(e => !e.date)];
                });
                setLoading(false);
            })();
        });

        return () => { if (unsubBookings) unsubBookings(); if (unsubRequests) unsubRequests(); };
    }, []);

    // persist settings when changed
    useEffect(() => {
        const payload = { viewMode, firstDayOfWeek, timeFormat24, workHours };
        try { localStorage.setItem('masterCalendar.settings', JSON.stringify(payload)); } catch (e) { }
    }, [viewMode, firstDayOfWeek, timeFormat24, workHours]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) { days.push(null); }
        for (let day = 1; day <= daysInMonth; day++) { days.push(new Date(year, month, day)); }
        return days;
    };

    const getEventsForDate = (date) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return calendarEvents.filter(event => event.date === dateStr && (
            (event.source === 'booking' && filters.showBookings) || (event.source === 'request' && filters.showRequests)
        ) && (filters.categories[event.type] !== false));
    };

    const navigate = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (viewMode === 'month') {
                newDate.setMonth(direction === 'prev' ? prev.getMonth() - 1 : prev.getMonth() + 1);
            } else if (viewMode === 'week') {
                newDate.setDate(direction === 'prev' ? prev.getDate() - 7 : prev.getDate() + 7);
            } else {
                // day view
                newDate.setDate(direction === 'prev' ? prev.getDate() - 1 : prev.getDate() + 1);
            }
            return newDate;
        });
    };

    const getTypeProps = (type) => {
        switch (type) {
            case "Venue": return { className: "event-venue", Icon: Building };
            case "Vehicle": return { className: "event-vehicle", Icon: Car };
            case "Equipment": return { className: "event-equipment", Icon: MapPin };
            default: return { className: "event-default", Icon: Calendar };
        }
    };

    const toggleBookings = () => setFilters(f => ({ ...f, showBookings: !f.showBookings }));
    const toggleRequests = () => setFilters(f => ({ ...f, showRequests: !f.showRequests }));
    const toggleCategory = (cat) => setFilters(f => ({ ...f, categories: { ...f.categories, [cat]: !f.categories[cat] } }));

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = getDaysInMonth(currentDate);

    const getStartOfWeek = (date) => {
        const copy = new Date(date);
        const day = copy.getDay();
        const diff = (day - firstDayOfWeek + 7) % 7;
        copy.setDate(copy.getDate() - diff);
        copy.setHours(0, 0, 0, 0);
        return copy;
    };

    const getWeekDays = (date) => {
        const start = getStartOfWeek(date);
        const arr = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            arr.push(d);
        }
        return arr;
    };

    function MoreIndicator({ events }) {
        const [open, setOpen] = useState(false);
        const anchorRef = useRef(null);

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button ref={anchorRef} className="more-indicator" onClick={() => setOpen(v => !v)} aria-haspopup="dialog" aria-expanded={open} aria-controls="more-popover">+{events.length} more</button>
                <Popover
                    anchorRef={anchorRef}
                    open={open}
                    onClose={() => setOpen(false)}
                    ariaLabel={`More events (${events.length})`}
                >
                    <div id="more-popover" className="popover-list" role="list">
                        {events.map(ev => (
                            <button key={ev.id} className="popover-item" onClick={() => { setSelectedEvent(ev); setOpen(false); }}>{ev.title}</button>
                        ))}
                    </div>
                </Popover>
            </div>
        );
    }

    const formatHourLabel = (h) => {
        if (timeFormat24) return `${String(h).padStart(2, '0')}:00`;
        const am = h < 12; const hour = ((h + 11) % 12) + 1; return `${hour}:00 ${am ? 'AM' : 'PM'}`;
    };

    // helpers for event layout
    const hhmmToMinutes = (hhmm) => {
        if (!hhmm) return null;
        const parts = String(hhmm).split(':');
        if (parts.length < 2) return null;
        const hh = parseInt(parts[0], 10);
        const mm = parseInt(parts[1], 10);
        if (isNaN(hh) || isNaN(mm)) return null;
        return hh * 60 + mm;
    };

    // compute layout for events within a single day column
    // returns array of blocks with top(%), height(%), left(%), width(%) and event reference
    const computeDayEventLayout = (eventsForDay) => {
        // eventsForDay: [{ id, startTime, endTime, ... }]
        // convert to minutes and filter
        const evs = (eventsForDay || []).map(ev => {
            const startMin = hhmmToMinutes(ev.startTime) ?? null;
            const endMin = hhmmToMinutes(ev.endTime) ?? null;
            return { ev, startMin, endMin };
        }).filter(x => x.startMin !== null || x.endMin !== null);

        // assume a default 60-minute duration if no end provided
        evs.forEach(x => { if (x.startMin !== null && x.endMin === null) x.endMin = x.startMin + 60; });

        // sort by start
        evs.sort((a, b) => (a.startMin || 0) - (b.startMin || 0));

        // greedy grouping for overlaps: produce columns sets
        const columns = [];
        evs.forEach(item => {
            let placed = false;
            for (let c = 0; c < columns.length; c++) {
                const col = columns[c];
                // check if item overlaps with last in this column
                const last = col[col.length - 1];
                if (item.startMin >= last.endMin) {
                    col.push(item);
                    placed = true;
                    break;
                }
            }
            if (!placed) columns.push([item]);
        });

        // flatten with column index
        const result = [];
        const totalCols = columns.length || 1;
        columns.forEach((col, colIndex) => {
            col.forEach(item => {
                const topPct = ((item.startMin - (workHours.start * 60)) / ((workHours.end - workHours.start) * 60)) * 100;
                const heightPct = ((item.endMin - item.startMin) / ((workHours.end - workHours.start) * 60)) * 100;
                const leftPct = (colIndex / totalCols) * 100;
                const widthPct = (1 / totalCols) * 100;
                result.push({ event: item.ev, topPct, heightPct, leftPct, widthPct });
            });
        });
        return result;
    };

    const renderMonthView = () => (
        <div className="calendar-grid">
            {dayNames.map((day) => (<div key={day} className="day-header">{day}</div>))}
            {days.map((day, index) => {
                const events = getEventsForDate(day);
                const isToday = day && day.toDateString() === new Date().toDateString();
                return (
                    <div key={index} className={`day-cell ${!day ? "disabled" : ""} ${isToday ? "today" : ""}`}>
                        {day && (
                            <>
                                <div className="day-number">{day.getDate()}</div>
                                <div className="events-container" style={{ position: 'relative' }}>
                                    {events.slice(0, 3).map((event) => {
                                        const { className, Icon } = getTypeProps(event.type);
                                        return (
                                            <div key={event.id} className={`event-item ${className}`} onClick={() => setSelectedEvent(event)}>
                                                <Icon size={14} />
                                                <span title={event.title}>{event.title}</span>
                                            </div>
                                        );
                                    })}
                                    {events.length > 3 && (
                                        <MoreIndicator events={events.slice(3)} />
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderWeekView = () => {
        const weekDays = getWeekDays(currentDate);
        const hours = [];
        for (let h = workHours.start; h <= workHours.end; h++) hours.push(h);

        return (
            <div className="week-view">
                <div className="week-header">
                    <div className="time-column" />
                    {weekDays.map(d => (
                        <div key={d.toISOString()} className="week-day-header">{dayNames[d.getDay()]} {d.getDate()}</div>
                    ))}
                </div>
                <div className="week-body">
                    <div className="time-column">
                        {hours.map(h => <div key={h} className="time-slot-label">{formatHourLabel(h)}</div>)}
                    </div>
                    {weekDays.map(d => {
                        const eventsForDay = getEventsForDate(d);
                        const blocks = computeDayEventLayout(eventsForDay);
                        return (
                            <div key={d.toISOString()} className="week-column" style={{ position: 'relative' }}>
                                <div className="day-slots">
                                    {hours.map(h => (<div key={h} className="week-slot" />))}
                                </div>
                                {blocks.map(b => (
                                    <div
                                        key={b.event.id}
                                        className={`event-block ${getTypeProps(b.event.type).className}`}
                                        style={{ top: `${b.topPct}%`, height: `${b.heightPct}%`, left: `${b.leftPct}%`, width: `${b.widthPct}%`, position: 'absolute' }}
                                        onClick={() => setSelectedEvent(b.event)}
                                    >
                                        <div className="event-block-time">{b.event.startTime}{b.event.endTime ? ` - ${b.event.endTime}` : ''}</div>
                                        <div className="event-block-title">{b.event.title}</div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const day = currentDate;
        const hours = [];
        for (let h = workHours.start; h <= workHours.end; h++) hours.push(h);
        const eventsForDay = getEventsForDate(day);
        const blocks = computeDayEventLayout(eventsForDay);
        return (
            <div className="day-view">
                <div className="day-header-row">
                    <div className="day-title">{day.toDateString()}</div>
                </div>
                <div className="day-body">
                    <div className="time-column">
                        {hours.map(h => <div key={h} className="time-slot-label">{formatHourLabel(h)}</div>)}
                    </div>
                    <div className="day-column" style={{ position: 'relative' }}>
                        {hours.map(h => (<div key={h} className="day-slot" />))}
                        {blocks.map(b => (
                            <div
                                key={b.event.id}
                                className={`event-block ${getTypeProps(b.event.type).className}`}
                                style={{ top: `${b.topPct}%`, height: `${b.heightPct}%`, left: `${b.leftPct}%`, width: `${b.widthPct}%`, position: 'absolute' }}
                                onClick={() => setSelectedEvent(b.event)}
                            >
                                <div className="event-block-time">{b.event.startTime}{b.event.endTime ? ` - ${b.event.endTime}` : ''}</div>
                                <div className="event-block-title">{b.event.title}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="page-content calendar-page">
                {/* build filters for center area */}
                {(() => {
                    const centerFilters = (
                        <FilterBar
                            showBookings={filters.showBookings}
                            showRequests={filters.showRequests}
                            onToggleBookings={toggleBookings}
                            onToggleRequests={toggleRequests}
                            categories={filters.categories}
                            onToggleCategory={toggleCategory}
                        />
                    );

                    return (
                        <SectionHeader
                            title="Master Calendar"
                            subtitle="View and manage resource bookings"
                            center={centerFilters}
                            actions={(
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button className="btn btn-primary" onClick={() => { setEditingEvent(null); setFormOpen(true); }}>New Booking</button>
                                </div>
                            )}
                        />
                    );
                })()}

                <div className="card calendar-card full-viewport">
                    <div className="calendar-controls">
                        <div className="calendar-title">
                            <Calendar className="icon" />
                            {viewMode === 'month' ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` : viewMode === 'week' ? `Week of ${getStartOfWeek(currentDate).toDateString()}` : currentDate.toDateString()}
                        </div>

                        <div className="calendar-nav-buttons">
                            <button className="btn btn-secondary" onClick={() => navigate('prev')}><ChevronLeft size={16} /></button>
                            <button className="btn btn-secondary" onClick={() => {
                                if (viewMode === 'week') {
                                    setCurrentDate(getStartOfWeek(new Date()));
                                } else {
                                    setCurrentDate(new Date());
                                }
                            }}>Today</button>
                            <button className="btn btn-secondary" onClick={() => navigate('next')}><ChevronRight size={16} /></button>
                        </div>

                        <div className="view-mode-controls">
                            <button className={`btn ${viewMode === 'month' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('month')}>Month</button>
                            <button className={`btn ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('week')}>Week</button>
                            <button className={`btn ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('day')}>Day</button>
                            <button className="btn btn-ghost" onClick={() => setShowSettings(s => !s)}>Settings</button>
                        </div>
                    </div>

                    {/* Unscheduled items removed for focused calendar view */}

                    <div className="calendar-body">
                        {showSettings && (
                            <div className="calendar-settings">
                                <h4>Calendar Settings</h4>
                                <div className="settings-row">
                                    <label>First day of week</label>
                                    <select value={firstDayOfWeek} onChange={(e) => setFirstDayOfWeek(Number(e.target.value))}>
                                        <option value={0}>Sunday</option>
                                        <option value={1}>Monday</option>
                                    </select>
                                </div>
                                <div className="settings-row">
                                    <label>24-hour time</label>
                                    <input type="checkbox" checked={timeFormat24} onChange={(e) => setTimeFormat24(e.target.checked)} />
                                </div>
                                <div className="settings-row">
                                    <label>Work hours</label>
                                    <input type="number" min={0} max={23} value={workHours.start} onChange={(e) => setWorkHours(w => ({ ...w, start: Number(e.target.value) }))} />
                                    <input type="number" min={0} max={23} value={workHours.end} onChange={(e) => setWorkHours(w => ({ ...w, end: Number(e.target.value) }))} />
                                </div>
                            </div>
                        )}
                        {viewMode === 'month' && renderMonthView()}
                        {viewMode === 'week' && renderWeekView()}
                        {viewMode === 'day' && renderDayView()}
                    </div>
                </div>

                {selectedEvent && (
                    <div className="dialog-overlay" onClick={() => setSelectedEvent(null)}>
                        <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
                            <div className="dialog-header">
                                <h3>Event Details</h3>
                            </div>
                            <div className="dialog-body">
                                <h4>{selectedEvent.title}</h4>
                                <span className={`event-type-badge ${getTypeProps(selectedEvent.type).className}`}>{selectedEvent.type}</span>
                                <div className="details-grid">
                                    <div className="detail-item"><Calendar size={16} /><span>{selectedEvent.date}</span></div>
                                    <div className="detail-item"><Clock size={16} /><span>{selectedEvent.startTime} - {selectedEvent.endTime}</span></div>
                                    <div className="detail-item full-width"><User size={16} /><span>{selectedEvent.requesterName || selectedEvent.requester || '—'}</span></div>
                                    {selectedEvent.location && (
                                        <div className="detail-item full-width"><MapPin size={16} /><span>{selectedEvent.location}</span></div>
                                    )}
                                </div>
                                <p className="description">{selectedEvent.description}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <GlobalModal open={formOpen} title={editingEvent ? 'Edit Booking' : 'New Booking'} onClose={() => setFormOpen(false)}>
                <BookingForm initialData={editingEvent || {}} onSaved={(saved) => {
                    // update local events list to reflect new booking (simple optimistic update)
                    setCalendarEvents(prev => {
                        if (editingEvent && editingEvent.id) {
                            return prev.map(ev => ev.id === editingEvent.id ? { ...ev, ...saved } : ev);
                        }
                        return [{ id: saved.id, title: saved.title, date: saved.date, startTime: saved.startTime, endTime: saved.endTime, location: saved.location }, ...prev];
                    });
                    setFormOpen(false);
                }} onCancel={() => setFormOpen(false)} />
            </GlobalModal>
        </>
    );
}