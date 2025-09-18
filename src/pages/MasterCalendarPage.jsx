// src/pages/MasterCalendarPage.jsx

import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Building, Car, MapPin, Clock, User } from "lucide-react";
import './MasterCalendarPage.css'; // <-- IMPORT OUR NEW CSS FILE

// Mock Data (keep this as it is)
const calendarEvents = [
    { id: "evt-001", title: "Board Room - Executive Meeting", type: "Venue", date: "2025-09-18", startTime: "14:00", endTime: "16:00", requester: "Maria Santos", location: "Board Room, 5th Floor", description: "Monthly executive team meeting", status: "Confirmed" },
    { id: "evt-002", title: "Vehicle Unit 001 - Field Inspection", type: "Vehicle", date: "2025-09-18", startTime: "09:00", endTime: "17:00", requester: "John Doe", description: "Site inspection at remote location", status: "Confirmed" },
    { id: "evt-003", title: "Conference Room A - Training Session", type: "Venue", date: "2025-09-19", startTime: "10:00", endTime: "12:00", requester: "Sarah Wilson", location: "Conference Room A, 3rd Floor", description: "Employee training on new procedures", status: "Confirmed" },
    { id: "evt-004", title: "Vehicle Unit 002 - Emergency Response", type: "Vehicle", date: "2025-09-19", startTime: "13:00", endTime: "15:00", requester: "Emily Davis", description: "Emergency site visit", status: "Confirmed" }
];

export default function MasterCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);

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
        <div className="page-content calendar-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Master Calendar</h1>
                    <p className="page-subtitle">View and manage resource bookings</p>
                </div>
            </div>

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
    );
}