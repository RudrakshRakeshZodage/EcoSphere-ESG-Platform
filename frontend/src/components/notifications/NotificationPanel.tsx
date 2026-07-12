import React, { useEffect, useState } from 'react';
import { X, Check, Bell } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import type { Notification } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, setUnreadCount }) => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data as Notification[]);
      
      const unread = data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);

      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      background: 'rgba(15, 23, 42, 0.95)',
      borderLeft: '1px solid var(--card-border)',
      backdropFilter: 'blur(20px)',
      boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={20} className="text-emerald-500" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Notifications</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={markAllAsRead}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary-color)',
              fontSize: '0.8rem',
              fontWeight: 500
            }}
          >
            Mark all read
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: 'var(--text-secondary)',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', color: 'var(--text-muted)', textAlign: 'center', gap: '10px' }}>
            <Bell size={32} />
            <p>You have no notifications yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: notif.is_read ? 'rgba(30, 41, 59, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid',
                  borderColor: notif.is_read ? 'transparent' : 'rgba(16, 185, 129, 0.2)',
                  position: 'relative',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {!notif.is_read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: 'none',
                      color: 'var(--primary-color)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Mark as read"
                  >
                    <Check size={12} />
                  </button>
                )}
                <h4 style={{
                  fontSize: '0.9rem',
                  fontWeight: notif.is_read ? 500 : 700,
                  color: '#fff',
                  paddingRight: '20px',
                  marginBottom: '4px'
                }}>
                  {notif.title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {notif.message}
                </p>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {new Date(notif.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
