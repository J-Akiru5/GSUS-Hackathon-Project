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

    useEffect(() => {
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

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(direction === "prev" ? prev.getMonth() - 1 : prev.getMonth() + 1);
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

                <div className="card calendar-card">
                    <div className="calendar-controls">
                        <div className="calendar-title">
                            <Calendar className="icon" />
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </div>

                        <div className="calendar-nav-buttons">
                            <button className="btn btn-secondary" onClick={() => navigateMonth("prev")}><ChevronLeft size={16} /></button>
                            <button className="btn btn-secondary" onClick={() => setCurrentDate(new Date())}>Today</button>
                            <button className="btn btn-secondary" onClick={() => navigateMonth("next")}><ChevronRight size={16} /></button>
                        </div>
                    </div>


                    {/* Unscheduled items removed for focused calendar view */}

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