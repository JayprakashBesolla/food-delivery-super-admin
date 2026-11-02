'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-app)' }}>
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
        className="admin-main-wrapper"
      >
        {/* Top Header */}
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content Container */}
        <main
          style={{
            flex: 1,
            padding: '24px 28px 48px 28px',
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
          }}
          className="admin-main-content"
        >
          {children}
        </main>
      </div>

      <style jsx global>{`
        @media (min-width: 1024px) {
          .admin-main-wrapper {
            margin-left: var(--sidebar-width);
          }
        }
        @media (max-width: 1023px) {
          .admin-main-wrapper {
            margin-left: 0;
          }
          .admin-main-content {
            padding: 16px 16px 36px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
