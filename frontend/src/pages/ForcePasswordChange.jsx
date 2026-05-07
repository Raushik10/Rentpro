import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../api';
import { PasswordStrength } from '../components/UI';

// ── Inputs defined OUTSIDE to prevent remount on every keystroke ──────────────
function DarkInput({ label, value, onChange, placeholder, type = 'password', children }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 5 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 13px', fontSize: 13,
          outline: 'none', fontFamily: 'inherit', borderRadius: 10,
          background: 'rgba(255,255,255,.06)',
          border: `1.5px solid ${focused ? '#3B82F6' : 'rgba(255,255,255,.1)'}`,
          color: '#fff', caretColor: '#fff',
          boxShadow: focused ? '0 0 0 3px rgba(59,130,246,.15)' : 'none',
          transition: 'border-color 150ms, box-shadow 150ms',
        }}
      />
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ForcePasswordChange() {
  const { user, logout, refreshUser } = useAuth();
  const nav = useNavigate();

  const [newPwd,   setNewPwd]   = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  // Once done + user refreshed, navigate to the correct dashboard
  useEffect(() => {
    if (done && user && !user.must_change_pwd && !user.mustChangePwd) {
      nav(`/${user.role}`, { replace: true });
    }
  }, [done, user, nav]);

  const submit = async () => {
    setError('');
    if (!newPwd || newPwd.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPwd !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword: newPwd }),
      });
      setDone(true);
      await refreshUser(); // this updates user.must_change_pwd → false
      // navigation handled by the useEffect above once user state updates
    } catch (e) {
      setError(e.message);
      setDone(false);
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ───────────────────────────────────────────────────────
  if (done) return (
    <div style={{ minHeight: '100vh', background: '#080D1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ width: 64, height: 64, background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Password set!</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.4)' }}>Taking you to your dashboard…</p>
      </div>
    </div>
  );

  // ── Main form ────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#080D1A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: 'linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)',
      backgroundSize: '52px 52px',
    }}>
      <div className="page-enter" style={{
        background: '#111827', border: '1px solid rgba(255,255,255,.1)',
        borderRadius: 20, padding: '44px 40px', width: 440, maxWidth: '96vw',
        boxShadow: '0 32px 64px rgba(0,0,0,.5)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.25)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22 }}>
            🔐
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            Set your new password
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.6 }}>
            Your temporary password was your Tenant ID. Create a personal password only you know.
          </p>
        </div>

        {/* Info box */}
        <div style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#93C5FD', marginBottom: 20 }}>
          After setting your password you'll be taken directly to your dashboard.
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FCA5A5', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Inputs — using the stable component defined outside */}
        <DarkInput
          label="New password"
          value={newPwd}
          onChange={e => { setNewPwd(e.target.value); setError(''); }}
          placeholder="Minimum 8 characters"
        >
          {newPwd && <PasswordStrength value={newPwd}/>}
        </DarkInput>

        <DarkInput
          label="Confirm password"
          value={confirm}
          onChange={e => { setConfirm(e.target.value); setError(''); }}
          placeholder="Repeat new password"
        />

        {/* Submit */}
        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: '100%', padding: '13px', marginTop: 4, borderRadius: 12,
            fontSize: 14, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            border: '1.5px solid rgba(59,130,246,.4)',
            background: 'linear-gradient(135deg,#3B82F6,#2563EB)',
            color: '#fff', fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(59,130,246,.35)',
            opacity: loading ? .7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading
            ? <span className="spinner" style={{ width: 16, height: 16 }}/>
            : 'Set password & continue →'
          }
        </button>

        {/* Sign out */}
        <button
          onClick={logout}
          style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 16, background: 'none', border: 'none', fontSize: 12, color: 'rgba(255,255,255,.25)', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Sign out and come back later
        </button>
      </div>
    </div>
  );
}
