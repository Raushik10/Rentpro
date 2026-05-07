import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { LANGUAGES, useLang, useT } from '../i18n';

export default function LanguageSwitcher({ variant = 'dark' }) {
  const { lang, setLang } = useLang();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  // dark = landing page (dark bg), light = dashboard topbar (white bg)
  const isDark = variant === 'dark';

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 6, right: window.innerWidth - r.right });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const h = e => {
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const timer = setTimeout(() => document.addEventListener('click', h), 0);
    return () => { clearTimeout(timer); document.removeEventListener('click', h); };
  }, [open]);

  const pick = (code) => { setLang(code); setOpen(false); };

  const dropdown = open && ReactDOM.createPortal(
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute', top: pos.top, right: pos.right,
        zIndex: 999999,
        background: '#1a2535',
        border: '1px solid rgba(255,255,255,.15)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,.5)',
        width: 220, overflow: 'hidden',
      }}
    >
      <div style={{
        padding: '9px 14px 7px', fontSize: 10, fontWeight: 700,
        letterSpacing: .8, textTransform: 'uppercase',
        color: 'rgba(255,255,255,.35)',
        borderBottom: '1px solid rgba(255,255,255,.08)',
      }}>
        🌐 {t('language')}
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {LANGUAGES.map(l => {
          const active = l.code === lang;
          return (
            <button key={l.code} onClick={() => pick(l.code)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 14px',
                background: active ? 'rgba(59,130,246,.25)' : 'transparent',
                border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.08)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{l.flag}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#60A5FA' : 'rgba(255,255,255,.85)' }}>
                  {l.native}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{l.name}</div>
              </div>
              {active && (
                <svg style={{ marginLeft:'auto' }} width="13" height="13" viewBox="0 0 24 24"
                  fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        title={t('language')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: isDark ? '7px 12px' : '6px 10px',
          borderRadius: 10, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
          background: isDark ? 'rgba(255,255,255,.07)' : 'transparent',
          border: isDark ? '1px solid rgba(255,255,255,.15)' : '1.5px solid #E2E8F0',
          color: isDark ? 'rgba(255,255,255,.85)' : '#475569',
          outline: 'none', flexShrink: 0,
          transition: 'all 140ms',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.12)' : '#F8FAFC';
          if (!isDark) e.currentTarget.style.borderColor = '#CBD5E1';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.07)' : 'transparent';
          if (!isDark) e.currentTarget.style.borderColor = '#E2E8F0';
        }}
      >
        {/* Globe icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
        </svg>
        {/* On dark bg show flag + name, on light topbar show only flag to save space */}
        {isDark
          ? <span>{current.flag} {current.native}</span>
          : <span>{current.flag}</span>
        }
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{ opacity: .45, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {dropdown}
    </>
  );
}
