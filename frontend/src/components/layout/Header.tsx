import React, { useEffect } from 'react';
import { Bell, Trophy, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';


interface HeaderProps {
  toggleNotifications: () => void;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

export const Header: React.FC<HeaderProps> = ({ toggleNotifications, unreadCount, setUnreadCount }) => {
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);
      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };
    fetchUnreadCount();

    // Subscribe to new notifications in real-time
    const channel = supabase
      .channel('realtime:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        () => {
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, setUnreadCount]);

  return (
    <header style={{
      height: '70px',
      borderBottom: '1px solid var(--card-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px',
      position: 'sticky',
      top: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(12px)',
      zIndex: 99
    }}>
      {/* Search / Page Info placeholder */}
      <div>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>
          ESG Management Platform
        </h1>
      </div>

      {/* User Stats & Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* XP / Points badges */}
        {profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              padding: '6px 12px',
              borderRadius: '20px',
              color: '#fbbf24',
              fontSize: '0.85rem',
              fontWeight: 600
            }}>
              <Zap size={14} fill="#fbbf24" />
              <span>{profile.xp} XP</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              padding: '6px 12px',
              borderRadius: '20px',
              color: '#38bdf8',
              fontSize: '0.85rem',
              fontWeight: 600
            }}>
              <Trophy size={14} />
              <span>{profile.points} Points</span>
            </div>
          </div>
        )}

        {/* Notification Bell */}
        <button
          onClick={toggleNotifications}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: 'var(--text-secondary)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'var(--danger)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              minWidth: '16px',
              height: '16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #0f172a'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
