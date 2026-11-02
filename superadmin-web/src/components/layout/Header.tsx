'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  Shield,
  LogOut,
  ChevronDown,
  SlidersHorizontal,
  Server,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { getCurrentUser, clearAuthSession, AuthUser } from '@/lib/api';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const timer = setTimeout(() => {
        setCurrentUser(user);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    clearAuthSession();
    setCurrentUser(null);
    setProfileDropdownOpen(false);
    router.push('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'SA';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Left: Mobile Sidebar Trigger & Global Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, maxWidth: '480px' }}>
        <button
          suppressHydrationWarning
          onClick={onToggleSidebar}
          aria-label="Open navigation menu"
          className="lg-hidden-btn"
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-surface-muted)',
            border: '1px solid var(--border-light)',
          }}
        >
          <Menu size={18} />
        </button>

        {/* Global Search Input */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
          className="header-search-container"
        >
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '12px',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            suppressHydrationWarning
            type="text"
            placeholder="Search platform resources, orders, stores..."
            style={{
              width: '100%',
              height: '36px',
              padding: '0 64px 0 34px',
              fontSize: '12.5px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'all var(--transition-fast)',
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.borderColor = 'var(--brand-primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(255, 82, 0, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = 'var(--bg-surface-subtle)';
              e.target.style.borderColor = 'var(--border-light)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: '8px',
              fontSize: '10px',
              fontFamily: 'monospace',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-surface-muted)',
              border: '1px solid var(--border-light)',
              padding: '1px 5px',
              borderRadius: '4px',
              pointerEvents: 'none',
            }}
          >
            ⌘K
          </span>
        </div>
      </div>

      {/* Right Controls: Backend Indicator, Notification Bell, User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Live Backend Connection Indicator */}
        <div
          className="backend-indicator"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-full)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--success-text)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--success)',
            }}
          />
          <Shield size={12} />
          <span>System Operational</span>
        </div>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            suppressHydrationWarning
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Notifications"
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              backgroundColor: notificationsOpen ? 'var(--bg-surface-muted)' : 'transparent',
              border: '1px solid transparent',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-muted)';
            }}
            onMouseLeave={(e) => {
              if (!notificationsOpen) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Bell size={17} />
            <span
              style={{
                position: 'absolute',
                top: '7px',
                right: '7px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-primary)',
              }}
            />
          </button>

          {notificationsOpen && (
            <div
              style={{
                position: 'absolute',
                top: '44px',
                right: 0,
                width: '300px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-light)',
                padding: '14px',
                zIndex: 60,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  System Notifications
                </span>
                <Link
                  href="/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  style={{ fontSize: '11px', color: 'var(--brand-primary)', fontWeight: 600 }}
                >
                  View All
                </Link>
              </div>
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-light)',
                  fontSize: '11.5px',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Platform Synchronized</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10.5px', marginTop: '2px' }}>
                  Live operations telemetry active across all clusters.
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-light)' }} />

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            suppressHydrationWarning
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '3px 6px 3px 3px',
              borderRadius: 'var(--radius-lg)',
              transition: 'background-color var(--transition-fast)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-muted)')}
            onMouseLeave={(e) => {
              if (!profileDropdownOpen) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-sidebar)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '11.5px',
                border: '1px solid rgba(255, 82, 0, 0.4)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              {getInitials(currentUser?.name)}
            </div>

            {/* User Meta */}
            <div className="user-text-info" style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {currentUser?.name || 'Super Admin'}
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                }}
              >
                {currentUser?.role || 'SUPER_ADMIN'}
              </div>
            </div>

            <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '44px',
                right: 0,
                width: '230px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-light)',
                padding: '6px',
                zIndex: 60,
              }}
            >
              <div
                style={{
                  padding: '8px 10px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '4px',
                }}
              >
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentUser?.name || 'Platform Admin'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {currentUser?.email || 'admin@swiggy.com'}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <Badge variant="brand" size="sm">
                    {currentUser?.role || 'ROLE_SUPER_ADMIN'}
                  </Badge>
                </div>
              </div>

              <Link
                href="/settings"
                onClick={() => setProfileDropdownOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <SlidersHorizontal size={14} style={{ color: 'var(--text-muted)' }} />
                Platform Settings
              </Link>

              <Link
                href="/audit-logs"
                onClick={() => setProfileDropdownOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Shield size={14} style={{ color: 'var(--text-muted)' }} />
                Security & Audit Trail
              </Link>

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

              <button
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  color: 'var(--danger)',
                  fontWeight: 600,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1023px) {
          .lg-hidden-btn {
            display: inline-flex !important;
          }
          .backend-indicator {
            display: none !important;
          }
        }
        @media (min-width: 1024px) {
          .lg-hidden-btn {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .header-search-container {
            display: none !important;
          }
          .user-text-info {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
