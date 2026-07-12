import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NotificationPanel } from '../notifications/NotificationPanel';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        position: 'relative'
      }}>
        {/* Header */}
        <Header 
          toggleNotifications={() => setNotifOpen(!notifOpen)} 
          unreadCount={unreadCount} 
          setUnreadCount={setUnreadCount} 
        />

        {/* Page Content */}
        <main style={{
          flex: 1,
          padding: '40px 30px',
          overflowY: 'auto'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            animation: 'fadeIn 0.4s ease-out'
          }}>
            {children}
          </div>
        </main>
      </div>

      {/* Notifications Drawer */}
      <NotificationPanel 
        isOpen={notifOpen} 
        onClose={() => setNotifOpen(false)} 
        setUnreadCount={setUnreadCount} 
      />
    </div>
  );
};
