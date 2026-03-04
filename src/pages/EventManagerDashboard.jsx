import React from 'react';
import EventList from './manager/EventList';

/**
 * Wrapper for backward compatibility
 * Replaces the old monolithic dashboard with the new modular EventList
 */
const EventManagerDashboard = () => {
    return <EventList />;
};

export default EventManagerDashboard;
