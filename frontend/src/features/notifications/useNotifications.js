import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '../../api';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
const POLL_INTERVAL_MS = 4000;

// Builds notifications from domain APIs when the notifications endpoint
// returns nothing for a role.
async function getRoleNotificationFallback(user) {
  if (!user) return [];

  if (user.role === 'laboratory') {
    const samples = await api.lab.getPendingSamples();
    return (samples || []).map((sample) => ({
      id: `lab-sample-${sample.id}`,
      category: 'pending',
      title: 'Sample Awaiting Screening',
      desc: `Unit ${sample.id.slice(0, 8)} (${sample.blood_type}) received from collection station. Needs testing.`,
      time: 'Active',
      type: 'info',
      unread: true,
    }));
  }

  if (user.role === 'station') {
    const samples = await api.station.getSamples();
    return (samples || []).map((sample) => ({
      id: `station-sample-${sample.id}`,
      category: 'collections',
      title: sample.status === 'validated' ? 'Sample Validated by Lab' : `Sample Status: ${sample.status.toUpperCase()}`,
      desc: `Unit ${sample.id.slice(0, 8)} (${sample.blood_type}) status is currently "${sample.status}".`,
      time: 'Active',
      type: sample.status === 'validated' ? 'success' : sample.status === 'discarded' ? 'warning' : 'info',
      unread: true,
    }));
  }

  if (user.role === 'warehouse') {
    const [stock, requests] = await Promise.all([api.warehouse.getStock(), api.warehouse.getRequests()]);
    return [
      ...(stock || [])
        .filter((item) => item.quantity <= 10)
        .map((item) => ({
          id: `wh-stock-${item.id}`,
          category: 'inventory',
          title: 'Low Stock Warning',
          desc: `${item.blood_type} inventory at critical level: ${item.quantity} units remaining in storage.`,
          time: 'Active Alert',
          type: item.quantity <= 3 ? 'warning' : 'info',
          unread: true,
        })),
      ...(requests || [])
        .filter((request) => request.status === 'pending')
        .map((request) => ({
          id: `wh-req-${request.id}`,
          category: 'dispatch',
          title: 'Hospital Requisition Order',
          desc: `${request.hospital?.entity_name || 'Hospital'} requested ${request.units_needed} units of ${request.blood_type}.`,
          time: 'Active',
          type: 'warning',
          unread: true,
        })),
    ];
  }

  if (user.role === 'hospital') {
    const [requests, stock] = await Promise.all([api.hospital.getRequests(), api.hospital.getStock()]);
    return [
      ...(requests || []).map((request) => ({
        id: `hosp-req-${request.id}`,
        category: 'request',
        title: request.status === 'fulfilled' ? 'Requisition Dispatched' : `Requisition: ${request.status.toUpperCase()}`,
        desc: `Order for ${request.units_needed} units of ${request.blood_type} is "${request.status}".`,
        time: 'Active',
        type: request.status === 'fulfilled' ? 'success' : 'info',
        unread: true,
      })),
      ...(stock || [])
        .filter((item) => item.quantity <= 5)
        .map((item) => ({
          id: `hosp-stock-${item.id}`,
          category: 'stock',
          title: 'Local Reserve Critical',
          desc: `${item.blood_type} stock is low (${item.quantity} units). Requisition recommended.`,
          time: 'Active Alert',
          type: 'warning',
          unread: true,
        })),
    ];
  }

  return [];
}

// Live notifications pipeline: REST fetch + role fallbacks, short polling,
// window-focus refresh, and Socket.IO push events. Also surfaces transient
// toast alerts for incoming real-time messages.
export function useNotifications(user) {
  const [rawNotifications, setRawNotifications] = useState([]);
  const [readNotifIds, setReadNotifIds] = useState([]);
  const [incomingAlert, setIncomingAlert] = useState(null);
  const lastGoodNotifications = useRef([]);

  useEffect(() => {
    if (!user) {
      lastGoodNotifications.current = [];
      setReadNotifIds([]);
      setRawNotifications([]);
      return;
    }

    async function fetchNotifications() {
      try {
        let notifs = [];
        try {
          const res = await api.notifications.getNotifications();
          if (res && Array.isArray(res.notifications)) notifs = res.notifications;
        } catch (e) {
          console.warn('[Notifications API]', e);
        }

        if (notifs.length === 0 && user.role !== 'admin') {
          try {
            notifs = await getRoleNotificationFallback(user);
          } catch (fallbackError) {
            console.warn('[Notifications fallback]', fallbackError);
            notifs = lastGoodNotifications.current;
          }
        }

        // Admin safeguard: always surface pending workstation registrations.
        if (user.role === 'admin') {
          try {
            const usersData = await api.admin.getUsers();
            const pendingWorkstations = (usersData || []).filter(
              (u) => u.status === 'pending' && u.role !== 'donor',
            );
            pendingWorkstations.forEach((u) => {
              const notifId = `admin-pending-user-${u.id}`;
              if (!notifs.some((n) => n.id === notifId)) {
                notifs.unshift({
                  id: notifId,
                  category: 'approvals',
                  title: 'Workstation Registration Pending',
                  desc: `${u.entity_name || u.email} (${(u.role || '').toUpperCase()}) submitted registration for authorization.`,
                  time: 'Awaiting Action',
                  type: 'warning',
                  unread: true,
                });
              }
            });
          } catch (adminErr) {
            console.warn('[Admin pending users sync]', adminErr);
          }
        }

        lastGoodNotifications.current = notifs;
        setRawNotifications(notifs);
      } catch (err) {
        console.warn('[Notifications] Failed to fetch live notifications:', err);
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);

    let socket;
    try {
      socket = io(API_ORIGIN);
      socket.on('new_workstation_registered', (data) => {
        fetchNotifications();
        if (user.role === 'admin') {
          setIncomingAlert(`🔔 ${data.message || 'New workstation registration awaiting approval!'}`);
        }
      });
      socket.on('notification', (data) => {
        if (data?.recipientRole && data.recipientRole !== user.role) return;
        if (data?.recipientId && data.recipientId !== user.id) return;
        fetchNotifications();
        if (data?.message) setIncomingAlert(`🔔 ${data.message}`);
      });
    } catch (e) {
      console.warn('[WebSocket Error]:', e);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      if (socket) socket.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    setReadNotifIds([]);
  }, [user?.id]);

  const markAsRead = (id) => setReadNotifIds((prev) => [...new Set([...prev, id])]);
  const markAllRead = () =>
    setReadNotifIds((prev) => [...new Set([...prev, ...rawNotifications.map((n) => n.id)])]);
  const dismissAlert = () => setIncomingAlert(null);

  const notifications = rawNotifications.filter((n) => !readNotifIds.includes(n.id));
  const unreadCount = notifications.filter((n) => n.unread !== false).length;

  return { notifications, unreadCount, incomingAlert, dismissAlert, markAsRead, markAllRead };
}
