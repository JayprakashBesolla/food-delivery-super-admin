'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  CreditCard,
  Landmark,
  Percent,
  Truck,
  Users,
  Tag,
  TrendingUp,
  Headphones,
  Bell,
  Settings,
  ShieldAlert,
  ClipboardCheck,
  ChevronRight,
  X,
  Flame,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'brand' | 'success' | 'warning' | 'danger' | 'info';
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navigationGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Restaurants', href: '/restaurants', icon: Store },
      { title: 'Live Orders', href: '/orders', icon: ShoppingBag },
      { title: 'Delivery Fleet', href: '/delivery', icon: Truck },
      { title: 'Customers', href: '/customers', icon: Users },
    ],
  },
  {
    label: 'Financials',
    items: [
      { title: 'Payments', href: '/payments', icon: CreditCard },
      { title: 'Settlements', href: '/settlements', icon: Landmark },
      { title: 'Commission', href: '/commission', icon: Percent },
      { title: 'Finance Analytics', href: '/finance', icon: TrendingUp },
    ],
  },
  {
    label: 'Marketing & Support',
    items: [
      { title: 'Coupons & Promos', href: '/coupons', icon: Tag },
      { title: 'Support Desk', href: '/support', icon: Headphones },
      { title: 'Notifications', href: '/notifications', icon: Bell },
    ],
  },
  {
    label: 'Governance',
    items: [
      { title: 'Work Queues', href: '/work-queues', icon: ClipboardCheck, badge: '4-Eyes', badgeVariant: 'brand' },
      { title: 'System Settings', href: '/settings', icon: Settings },
      { title: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            backgroundColor: 'rgba(11, 17, 32, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'block',
          }}
          className="mobile-backdrop"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        style={{
          width: 'var(--sidebar-width)',
          height: '100vh',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 50,
          transition: 'transform var(--transition-normal)',
        }}
        className={`sidebar-nav ${isOpen ? 'open' : ''}`}
      >
        {/* Brand Header */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px',
            borderBottom: '1px solid var(--border-sidebar)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ff5200 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(255, 82, 0, 0.3)',
                flexShrink: 0,
              }}
            >
              <Flame size={20} color="#ffffff" />
            </div>
            <div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  letterSpacing: '-0.3px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  lineHeight: 1.2,
                }}
              >
                FoodApp
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    backgroundColor: 'rgba(255, 82, 0, 0.15)',
                    color: 'var(--brand-primary)',
                    border: '1px solid rgba(255, 82, 0, 0.35)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                  }}
                >
                  Admin
                </span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--text-sidebar-muted)',
                  letterSpacing: '-0.1px',
                  marginTop: '1px',
                }}
              >
                Platform Operations
              </div>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            suppressHydrationWarning
            onClick={onClose}
            aria-label="Close sidebar"
            className="mobile-close-btn"
            style={{
              color: 'var(--text-sidebar)',
              padding: '6px',
              borderRadius: '6px',
              display: 'none',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Nav Groups */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 10px 20px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {navigationGroups.map((group) => (
            <div key={group.label}>
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-sidebar-muted)',
                  padding: '0 10px 6px 10px',
                }}
              >
                {group.label}
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#ffffff' : 'var(--text-sidebar)',
                        backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                        borderLeft: isActive ? '3px solid var(--brand-primary)' : '3px solid transparent',
                        transition: 'all var(--transition-fast)',
                        textDecoration: 'none',
                      }}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon
                          size={17}
                          className={isActive ? 'nav-icon-active' : 'nav-icon'}
                          style={{
                            color: isActive ? 'var(--brand-primary)' : 'var(--text-sidebar)',
                            transition: 'color var(--transition-fast)',
                          }}
                        />
                        <span>{item.title}</span>
                      </div>

                      {isActive && (
                        <ChevronRight size={13} style={{ color: 'var(--brand-primary)' }} />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Sidebar Footer: System Connection Badge */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--border-sidebar)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success)',
                  boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-sidebar-active)',
                }}
              >
                System Operational
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                color: 'var(--text-sidebar-muted)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '1px 5px',
                borderRadius: '4px',
              }}
            >
              Online
            </span>
          </div>
          <div
            style={{
              fontSize: '10.5px',
              color: 'var(--text-sidebar-muted)',
              lineHeight: 1.3,
            }}
          >
            FoodApp Multi-Sector Platform
          </div>
        </div>
      </aside>

      <style jsx global>{`
        @media (max-width: 1023px) {
          .sidebar-nav {
            transform: translateX(-100%);
          }
          .sidebar-nav.open {
            transform: translateX(0);
          }
          .mobile-close-btn {
            display: inline-flex !important;
          }
        }
        @media (min-width: 1024px) {
          .mobile-backdrop {
            display: none !important;
          }
          .mobile-close-btn {
            display: none !important;
          }
          .sidebar-nav {
            transform: translateX(0) !important;
          }
        }
        .nav-link:hover:not(.active) {
          background-color: var(--bg-sidebar-hover) !important;
          color: #ffffff !important;
        }
        .nav-link:hover:not(.active) .nav-icon {
          color: #ffffff !important;
        }
      `}</style>
    </>
  );
}
