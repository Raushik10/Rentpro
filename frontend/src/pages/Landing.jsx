import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Landing() {
  const nav = useNavigate();
  const t   = useT();
  const [hov,     setHov]     = useState(null);
  const [mouse,   setMouse]   = useState({ x:0, y:0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const h = e => setMouse({ x:e.clientX, y:e.clientY });
    window.addEventListener('mousemove', h, { passive: true });
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const cards = [
    {
      key:'landlord', label:t('landlord'), path:'/auth/landlord',
      color:'#3B82F6', glow:'rgba(59,130,246,.3)',
      hoverBg:'linear-gradient(135deg,rgba(59,130,246,.2),rgba(59,130,246,.08))',
      hoverBorder:'rgba(59,130,246,.55)', arrowColor:'#60A5FA', shadow:'rgba(59,130,246,.28)',
      iconBg:'rgba(59,130,246,.15)', iconBgH:'rgba(59,130,246,.28)', iconColor:'#60A5FA',
      desc:t('landlordDesc'),
      action:t('getStarted'),
      icon:(
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/>
        </svg>
      ),
    },
    {
      key:'tenant', label:t('tenant'), path:'/auth/tenant',
      color:'#10B981', glow:'rgba(16,185,129,.3)',
      hoverBg:'linear-gradient(135deg,rgba(16,185,129,.2),rgba(16,185,129,.08))',
      hoverBorder:'rgba(16,185,129,.55)', arrowColor:'#34D399', shadow:'rgba(16,185,129,.28)',
      iconBg:'rgba(16,185,129,.15)', iconBgH:'rgba(16,185,129,.28)', iconColor:'#34D399',
      desc:t('tenantDesc'),
      action:t('getStarted'),
      icon:(
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/>
        </svg>
      ),
    },
    {
      key:'marketplace', label:t('findProperty'), path:'/marketplace',
      color:'#F59E0B', glow:'rgba(245,158,11,.3)',
      hoverBg:'linear-gradient(135deg,rgba(245,158,11,.2),rgba(245,158,11,.08))',
      hoverBorder:'rgba(245,158,11,.55)', arrowColor:'#FCD34D', shadow:'rgba(245,158,11,.28)',
      iconBg:'rgba(245,158,11,.15)', iconBgH:'rgba(245,158,11,.28)', iconColor:'#FCD34D',
      desc:t('findPropertyDesc'),
      badge:t('new'),
      action:t('browseProperties'),
      icon:(
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#080D1A', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* Mouse-follow orb */}
      <div style={{ position:'fixed', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,.15) 0%,rgba(139,92,246,.06) 40%,transparent 70%)', left:mouse.x-300, top:mouse.y-300, pointerEvents:'none', transition:'left .9s ease, top .9s ease', zIndex:0 }}/>
      {/* Ambient orbs */}
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,.1) 0%,transparent 70%)', top:-120, right:-80, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,.08) 0%,transparent 70%)', bottom:-60, left:-80, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle,rgba(245,158,11,.06) 0%,transparent 70%)', bottom:140, right:100, pointerEvents:'none' }}/>
      {/* Grid */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)', backgroundSize:'52px 52px', zIndex:0 }}/>

      {/* Header */}
      <div style={{ position:'relative', zIndex:10, padding:'22px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.05)', opacity:mounted?1:0, transition:'opacity 400ms' }}>
        <div style={{ display:'flex', alignItems:'center', gap:11 }}>
          <div style={{ width:38, height:38, background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14, boxShadow:'0 4px 20px rgba(59,130,246,.4)' }}>RP</div>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:'#fff', letterSpacing:-.3 }}>{t('appName')}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{t('appTagline')}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Language switcher — dark variant for landing */}
          <LanguageSwitcher variant="dark"/>
          <button onClick={()=>nav('/auth/admin')}
            style={{ fontSize:12, color:'rgba(255,255,255,.4)', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, padding:'7px 16px', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, transition:'all 200ms' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,.09)'; e.currentTarget.style.color='rgba(255,255,255,.7)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.color='rgba(255,255,255,.4)'; }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2"/></svg>
            {t('adminPortal')}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, position:'relative', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 24px 64px' }}>

        {/* Hero text */}
        <div style={{ textAlign:'center', marginBottom:52, opacity:mounted?1:0, transform:mounted?'none':'translateY(18px)', transition:'opacity 500ms ease, transform 500ms ease' }}>
          <h1 style={{ fontSize:52, fontWeight:800, lineHeight:1.12, letterSpacing:-1.2, marginBottom:18, background:'linear-gradient(135deg,#fff 20%,rgba(255,255,255,.5) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            {t('welcomeTo')}
          </h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,.4)', maxWidth:480, margin:'0 auto', lineHeight:1.75 }}>
            {t('landingDesc')}
          </p>
        </div>

        {/* Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, width:'100%', maxWidth:820, marginBottom:48, opacity:mounted?1:0, transform:mounted?'none':'translateY(24px)', transition:'opacity 600ms ease 150ms, transform 600ms ease 150ms' }}>
          {cards.map(c => (
            <div key={c.key}
              onMouseEnter={()=>setHov(c.key)} onMouseLeave={()=>setHov(null)}
              onClick={()=>nav(c.path)}
              style={{ position:'relative', overflow:'hidden', background:hov===c.key?c.hoverBg:'rgba(255,255,255,.035)', border:`1px solid ${hov===c.key?c.hoverBorder:'rgba(255,255,255,.08)'}`, borderRadius:20, padding:'28px 24px', cursor:'pointer', textAlign:'center', transition:'all 220ms cubic-bezier(.22,1,.36,1)', transform:hov===c.key?'translateY(-6px) scale(1.015)':'none', boxShadow:hov===c.key?`0 24px 48px ${c.shadow}`:'0 4px 20px rgba(0,0,0,.35)' }}>
              {/* New badge */}
              {c.badge && (
                <div style={{ position:'absolute', top:14, right:14, background:'linear-gradient(135deg,#F59E0B,#D97706)', color:'#fff', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:999, letterSpacing:.5 }}>{c.badge}</div>
              )}
              {/* Corner glow */}
              <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:`radial-gradient(circle,${c.glow} 0%,transparent 70%)`, opacity:hov===c.key?1:0, transition:'opacity 220ms', pointerEvents:'none' }}/>
              {/* Icon */}
              <div style={{ width:54, height:54, margin:'0 auto 16px', background:hov===c.key?c.iconBgH:c.iconBg, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${c.color}33`, color:c.iconColor, transition:'all 220ms' }}>
                {c.icon}
              </div>
              <div style={{ fontSize:17, fontWeight:700, color:'#fff', marginBottom:9, letterSpacing:-.2 }}>{c.label}</div>
              <div style={{ fontSize:12.5, color:'rgba(255,255,255,.4)', lineHeight:1.65, marginBottom:20 }}>{c.desc}</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:c.arrowColor, opacity:hov===c.key?1:.4, transition:'all 220ms', transform:hov===c.key?'translateX(4px)':'none' }}>
                {c.action}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div style={{ display:'flex', alignItems:'center', gap:24, color:'rgba(255,255,255,.2)', fontSize:12, opacity:mounted?1:0, transition:'opacity 800ms ease 300ms' }}>
          {[
            ['🔒', t('bankSecurity')],
            ['📱', t('mobileFriendly')],
            ['⚡', t('realTimeUpdates')],
          ].map(([ic, label], i) => (
            <React.Fragment key={label}>
              {i > 0 && <span style={{ width:3, height:3, borderRadius:'50%', background:'rgba(255,255,255,.15)', display:'inline-block' }}/>}
              <span>{ic} {label}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
