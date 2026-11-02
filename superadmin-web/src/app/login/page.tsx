'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Shield, ArrowRight, Lock, Mail, Eye, EyeOff, Server, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { loginSuperAdmin, API_BASE_URL } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await loginSuperAdmin({
        usernameOrEmailOrPhone: identifier.trim(),
        password,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to authenticate with backend server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0b1120',
        backgroundImage: `
          radial-gradient(circle at 15% 20%, rgba(255, 82, 0, 0.1) 0%, transparent 40%),
          radial-gradient(circle at 85% 80%, rgba(16, 185, 129, 0.06) 0%, transparent 40%)
        `,
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Main Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand & Security Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff5200 0%, #ea580c 100%)',
              boxShadow: '0 4px 16px rgba(255, 82, 0, 0.35)',
              marginBottom: '14px',
            }}
          >
            <Flame size={26} color="#ffffff" />
          </div>

          <h1
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.4px',
              margin: 0,
            }}
          >
            FoodApp Platform
          </h1>
          <p
            style={{
              fontSize: '12.5px',
              color: '#94a3b8',
              marginTop: '4px',
              letterSpacing: '-0.1px',
            }}
          >
            Super Administrator Control Center
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              backgroundColor: 'rgba(255, 82, 0, 0.1)',
              border: '1px solid rgba(255, 82, 0, 0.25)',
              borderRadius: '9999px',
              marginTop: '12px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--brand-primary)',
            }}
          >
            <Shield size={11} />
            <span>Enterprise Workspace</span>
          </div>
        </div>


        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '18px',
              fontSize: '12px',
              color: '#fca5a5',
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email / Username */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '6px',
              }}
            >
              Administrator Identifier (Email / Username)
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                }}
              />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter administrator username or email"
                required
                style={{
                  width: '100%',
                  height: '40px',
                  backgroundColor: '#0b1120',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0 12px 0 38px',
                  fontSize: '13px',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--brand-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                }}
              >
                Password
              </label>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>Encrypted</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%',
                  height: '40px',
                  backgroundColor: '#0b1120',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0 38px 0 38px',
                  fontSize: '13px',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--brand-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            rightIcon={<ArrowRight size={15} />}
            style={{ width: '100%', height: '42px', marginTop: '4px' }}
          >
            Authenticate & Access Dashboard
          </Button>
        </form>

        {/* Security Audit Footnote */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            textAlign: 'center',
            fontSize: '10.5px',
            color: '#64748b',
            lineHeight: 1.45,
          }}
        >
          Protected by Enterprise Multi-Factor &amp; Role-Based Access Control.
        </div>
      </div>
    </div>
  );
}
