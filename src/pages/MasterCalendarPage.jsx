// src/pages/MasterCalendarPage.jsx

import React, { useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Building, Car, MapPin, Clock, User } from "lucide-react";
import './MasterCalendarPage.css'; // <-- IMPORT OUR NEW CSS FILE
import { listenToBookings } from '../services/firestoreService';
import { toDate } from '../utils/dateHelpers';
import GlobalModal from '../components/GlobalModal';
import BookingForm from '../components/BookingForm';
import SectionHeader from '../components/SectionHeader';

export default function MasterCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [unscheduledEvents, setUnscheduledEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = listenToBookings((data, err) => {
            if (err) {
                setError(err);
                setLoading(false);
                return;
            }
            // Normalize bookings -> calendar event shape used by this page
            const normalized = (data || []).map(b => {
                // try multiple fields for a start date
                const rawStart = b.startDate || b.date || b.createdAt || b.startTime || null;
                const start = toDate(rawStart);
                const end = toDate(b.endDate || b.endTime || null);
                const dateStr = start ? start.toISOString().split('T')[0] : (b.date || (b.createdAt ? (toDate(b.createdAt) ? toDate(b.createdAt).toISOString().split('T')[0] : '') : ''));
                return {
                    id: b.id,
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

            // split into scheduled and unscheduled (no date)
            const scheduled = normalized.filter(e => e.date);
            const unscheduled = normalized.filter(e => !e.date);
            setCalendarEvents(scheduled);
            // store unscheduled so we can render them below the calendar
            setUnscheduledEvents(unscheduled);
            setLoading(false);
        });
        return () => { if (unsubscribe) unsubscribe(); };
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
        return calendarEvents.filter(event => event.date === dateStr);
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

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = getDaysInMonth(currentDate);

    return (
        <>
            <div className="page-content calendar-page">
                <SectionHeader title="Master Calendar" subtitle="View and manage resource bookings" />

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
                            <button className="btn btn-primary" onClick={() => { setEditingEvent(null); setFormOpen(true); }}>New Booking</button>
                        </div>
                    </div>

                    {unscheduledEvents && unscheduledEvents.length > 0 && (
                        <div className="card unscheduled-card">
                            <SectionHeader title="Unscheduled / unknown date" subtitle={`${unscheduledEvents.length} item(s)`} />
                            <div className="unscheduled-list">
                                {unscheduledEvents.map(ev => {
                                    const { className, Icon } = getTypeProps(ev.type);
                                    return (
                                        <div key={ev.id} className={`unscheduled-item ${className}`} onClick={() => setSelectedEvent(ev)}>
                                            <Icon size={14} />
                                            <div className="unscheduled-content">
                                                <div className="unscheduled-title">{ev.title}</div>
                                                <div className="unscheduled-meta">{ev.requester} · {ev.location || 'No location'}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

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
                                            <div className="events-container">
                                                {events.map((event) => {
                                                    const { className, Icon } = getTypeProps(event.type);
                                                    return (
                                                        <div key={event.id} className={`event-item ${className}`} onClick={() => setSelectedEvent(event)}>
                                                            <Icon size={14} />
                                                            <span>{event.title}</span>
                                                        </div>
                                                    );
                                                })}
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
                                    <div className="detail-item full-width"><User size={16} /><span>{selectedEvent.requester}</span></div>
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