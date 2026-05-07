import React, { useState, useRef, useEffect } from 'react';
import { useT } from '../i18n';

// ── Currency ───────────────────────────────────────────────────
export const CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
};
export const fmt = (amount, currency = 'INR') => {
  const sym = CURRENCIES[currency]?.symbol || '₹';
  return `${sym}${Number(amount || 0).toLocaleString()}`;
};

// ── Status badge ───────────────────────────────────────────────
const BADGE = {
  active:    { bg:'#D1FAE5', text:'#065F46' },
  paid:      { bg:'#D1FAE5', text:'#065F46' },
  occupied:  { bg:'#DBEAFE', text:'#1E40AF' },
  vacant:    { bg:'#F1F5F9', text:'#475569' },
  suspended: { bg:'#FEE2E2', text:'#991B1B' },
  overdue:   { bg:'#FEE2E2', text:'#991B1B' },
  'due-soon':{ bg:'#FEF3C7', text:'#92400E' },
  pending:   { bg:'#FEF3C7', text:'#92400E' },
  accepted:  { bg:'#D1FAE5', text:'#065F46' },
  rejected:  { bg:'#FEE2E2', text:'#991B1B' },
  pro:       { bg:'#EDE9FE', text:'#5B21B6' },
  Pro:       { bg:'#EDE9FE', text:'#5B21B6' },
  basic:     { bg:'#F1F5F9', text:'#475569' },
  Basic:     { bg:'#F1F5F9', text:'#475569' },
};
export function Badge({ status, label }) {
  const c = BADGE[status] || { bg:'#F1F5F9', text:'#475569' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 9px',
                   borderRadius:999, fontSize:11, fontWeight:600,
                   background:c.bg, color:c.text, letterSpacing:.2 }}>
      {label || (status ? status.charAt(0).toUpperCase()+status.slice(1) : '—')}
    </span>
  );
}

// ── Avatar ─────────────────────────────────────────────────────
export function Avatar({ name, size = 32 }) {
  const initials = (name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const palette = ['#3B82F6','#10B981','#8B5CF6','#F59E0B','#EF4444','#0891B2','#EC4899'];
  const color = palette[(name||'').charCodeAt(0) % palette.length];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:color,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', fontWeight:700, fontSize:Math.max(10,size*.36),
                  flexShrink:0, letterSpacing:.3 }}>
      {initials}
    </div>
  );
}

// ── Chip (monospace ID) ─────────────────────────────────────────
export function Chip({ id }) {
  return (
    <span style={{ fontFamily:'ui-monospace,monospace', fontSize:11,
                   background:'#F1F5F9', color:'#334155', padding:'3px 8px',
                   borderRadius:6, border:'1px solid #E2E8F0', letterSpacing:.3 }}>
      {id}
    </span>
  );
}

// ── Card ───────────────────────────────────────────────────────
export function Card({ children, style={} }) {
  return (
    <div className="page-enter-fast" style={{ background:'#fff', border:'1px solid #E2E8F0',
                   borderRadius:14, padding:'20px 22px', marginBottom:16,
                   boxShadow:'0 1px 4px rgba(0,0,0,.05)', ...style }}>
      {children}
    </div>
  );
}

export function CardHead({ title, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
      <h3 style={{ fontSize:15, fontWeight:700, color:'#0F172A' }}>{title}</h3>
      {action}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, danger }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:14,
                  padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <span style={{ fontSize:12, color:'#64748B', fontWeight:500 }}>{label}</span>
        {icon && <span style={{ fontSize:18 }}>{icon}</span>}
      </div>
      <div style={{ fontSize:26, fontWeight:800, color: danger ? '#B91C1C' : '#0F172A', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color: danger ? '#EF4444' : '#94A3B8', marginTop:6 }}>{sub}</div>}
    </div>
  );
}

// ── Input ──────────────────────────────────────────────────────
export function Input({ label, error, style={}, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }}>{label}</label>}
      <input {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
        style={{ width:'100%', padding:'10px 13px',
                 border:`1.5px solid ${error?'#EF4444':focused?'#3B82F6':'#E2E8F0'}`,
                 borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit',
                 background:'#fff', color:'#0F172A',
                 transition:'border-color 150ms, box-shadow 150ms',
                 boxShadow: focused && !error ? '0 0 0 3px rgba(59,130,246,.1)' : 'none',
                 ...style }}/>
      {error && <p style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>{error}</p>}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────
export function Select({ label, children, style={}, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }}>{label}</label>}
      <select {...props} style={{ width:'100%', padding:'10px 13px',
                border:'1.5px solid #E2E8F0', borderRadius:10,
                fontSize:13, outline:'none', fontFamily:'inherit',
                background:'#fff', color:'#0F172A', cursor:'pointer', ...style }}>
        {children}
      </select>
    </div>
  );
}

// ── Button ─────────────────────────────────────────────────────
const BTN = {
  primary:   { bg:'#3B82F6', text:'#fff', hov:'#2563EB', border:'transparent', glow:'rgba(59,130,246,.25)' },
  success:   { bg:'#10B981', text:'#fff', hov:'#059669', border:'transparent', glow:'rgba(16,185,129,.25)' },
  danger:    { bg:'#EF4444', text:'#fff', hov:'#DC2626', border:'transparent', glow:'rgba(239,68,68,.25)' },
  secondary: { bg:'#fff',    text:'#374151', hov:'#F9FAFB', border:'#D1D5DB', glow:'' },
  ghost:     { bg:'transparent', text:'#475569', hov:'#F1F5F9', border:'transparent', glow:'' },
  purple:    { bg:'#8B5CF6', text:'#fff', hov:'#7C3AED', border:'transparent', glow:'rgba(139,92,246,.25)' },
  dark:      { bg:'#1E293B', text:'#fff', hov:'#0F172A', border:'transparent', glow:'' },
};
export function Btn({ children, variant='primary', size='md', loading, icon, style={}, ...props }) {
  const [hov, setHov] = useState(false);
  const v = BTN[variant] || BTN.primary;
  const pad = { sm:'7px 13px', md:'9px 17px', lg:'12px 24px' };
  const fs  = { sm:12, md:13, lg:14 };
  return (
    <button {...props} disabled={loading||props.disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display:'inline-flex', alignItems:'center', gap:7,
               padding:pad[size], borderRadius:10, fontSize:fs[size], fontWeight:600,
               cursor:(loading||props.disabled)?'not-allowed':'pointer',
               border:`1.5px solid ${v.border}`,
               background: hov ? v.hov : v.bg,
               color: v.text, fontFamily:'inherit',
               transition:'all 140ms ease',
               opacity:(loading||props.disabled)?.65:1,
               boxShadow: hov && v.glow ? `0 4px 16px ${v.glow}` : 'none',
               ...style }}>
      {loading ? <span className="spinner" style={{ width:13, height:13 }}/> : icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// ── Table helpers ──────────────────────────────────────────────
export const TH = ({ children, style={} }) => (
  <th style={{ textAlign:'left', padding:'10px 12px', fontSize:11, fontWeight:700,
               color:'#64748B', letterSpacing:.5, textTransform:'uppercase',
               borderBottom:'1px solid #F1F5F9', background:'#FAFAFA', ...style }}>
    {children}
  </th>
);
export const TD = ({ children, style={} }) => (
  <td style={{ padding:'11px 12px', borderBottom:'1px solid #F8FAFC',
               verticalAlign:'middle', fontSize:13, ...style }}>
    {children}
  </td>
);

// ── Three-dot menu ─────────────────────────────────────────────
export function DotMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  if (!items?.length) return null;
  return (
    <div ref={ref} style={{ position:'relative', display:'inline-block' }}>
      <button onClick={() => setOpen(o=>!o)}
        style={{ background:open?'#F1F5F9':'none', border:'none', cursor:'pointer',
                 padding:'5px 9px', borderRadius:8, color:'#94A3B8',
                 fontSize:18, lineHeight:1, transition:'all 130ms' }}
        onMouseEnter={e=>e.currentTarget.style.background='#F1F5F9'}
        onMouseLeave={e=>e.currentTarget.style.background=open?'#F1F5F9':'none'}>
        ···
      </button>
      {open && (
        <div className="dropdown-enter" style={{ position:'absolute', right:0, top:'calc(100% + 4px)',
             background:'#fff', border:'1px solid #E2E8F0', borderRadius:12,
             boxShadow:'0 12px 32px rgba(0,0,0,.12)', zIndex:200,
             minWidth:188, padding:'6px 0' }}>
          {items.map((item, i) =>
            item === '---'
              ? <div key={i} style={{ height:1, background:'#F1F5F9', margin:'4px 0' }}/>
              : <button key={i} onClick={()=>{ setOpen(false); item.fn?.(); }}
                  style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 14px',
                           fontSize:13, cursor:'pointer', border:'none', background:'none',
                           width:'100%', textAlign:'left', fontFamily:'inherit',
                           color:item.danger?'#B91C1C':'#1E293B', transition:'background 120ms' }}
                  onMouseEnter={e=>e.currentTarget.style.background=item.danger?'#FEF2F2':'#F8FAFC'}
                  onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  {item.icon && <span style={{ fontSize:14, width:18, textAlign:'center' }}>{item.icon}</span>}
                  {item.label}
                </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width=480 }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  return (
    <div className="modal-overlay" onClick={e=>{ if(e.target===e.currentTarget) onClose?.(); }}
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.5)',
               display:'flex', alignItems:'center', justifyContent:'center',
               zIndex:500, backdropFilter:'blur(4px)', padding:20 }}>
      <div className="modal-box" style={{ background:'#fff', borderRadius:18,
           padding:'28px', width, maxWidth:'96vw', maxHeight:'90vh', overflowY:'auto',
           boxShadow:'0 32px 64px rgba(0,0,0,.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <h2 style={{ fontSize:17, fontWeight:700, color:'#0F172A' }}>{title}</h2>
          <button onClick={onClose}
            style={{ background:'#F1F5F9', border:'none', cursor:'pointer',
                     width:30, height:30, borderRadius:8, display:'flex',
                     alignItems:'center', justifyContent:'center',
                     color:'#64748B', fontSize:16, transition:'background 130ms' }}
            onMouseEnter={e=>e.currentTarget.style.background='#E2E8F0'}
            onMouseLeave={e=>e.currentTarget.style.background='#F1F5F9'}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ModalActions({ children }) {
  return (
    <div style={{ display:'flex', gap:8, justifyContent:'flex-end',
                  marginTop:22, paddingTop:18, borderTop:'1px solid #F1F5F9' }}>
      {children}
    </div>
  );
}

// ── Sidebar nav item ───────────────────────────────────────────
export function NavItem({ label, active, onClick, accent='#3B82F6', activeBg='rgba(59,130,246,.12)' }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 16px',
               cursor:'pointer', fontSize:13, fontWeight:active?600:400,
               color: active ? '#fff' : hov ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.45)',
               background: active ? activeBg : hov ? 'rgba(255,255,255,.04)' : 'transparent',
               borderLeft:`3px solid ${active ? accent : 'transparent'}`,
               border:'none', width:'100%', textAlign:'left', fontFamily:'inherit',
               transition:'all 150ms', borderRadius:'0 8px 8px 0' }}>
      {label}
    </button>
  );
}

// ── Progress bar ───────────────────────────────────────────────
export function ProgressBar({ pct, color='#3B82F6', height=6 }) {
  return (
    <div style={{ background:'#F1F5F9', borderRadius:999, overflow:'hidden', height }}>
      <div style={{ width:`${Math.min(100,Math.max(0,pct))}%`, height:'100%',
                    background:color, borderRadius:999, transition:'width 600ms ease' }}/>
    </div>
  );
}

// ── Info box ───────────────────────────────────────────────────
export function InfoBox({ children, type='info' }) {
  const cfg = {
    info:    { bg:'#EFF6FF', border:'#BFDBFE', color:'#1D4ED8' },
    success: { bg:'#F0FDF4', border:'#BBF7D0', color:'#15803D' },
    warning: { bg:'#FFFBEB', border:'#FDE68A', color:'#92400E' },
    error:   { bg:'#FEF2F2', border:'#FECACA', color:'#B91C1C' },
  };
  const c = cfg[type] || cfg.info;
  return (
    <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:10,
                  padding:'11px 14px', fontSize:13, color:c.color, marginBottom:14 }}>
      {children}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────
export function EmptyState({ icon='📭', title, desc }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 20px', color:'#94A3B8' }}>
      <div style={{ fontSize:40, marginBottom:14 }}>{icon}</div>
      {title && <div style={{ fontSize:15, fontWeight:600, color:'#475569', marginBottom:6 }}>{title}</div>}
      {desc  && <div style={{ fontSize:13 }}>{desc}</div>}
    </div>
  );
}

// ── Password strength ──────────────────────────────────────────
export function PasswordStrength({ value }) {
  let s = 0;
  if (value.length >= 8)          s++;
  if (/[A-Z]/.test(value))        s++;
  if (/[0-9]/.test(value))        s++;
  if (/[^A-Za-z0-9]/.test(value)) s++;
  const labels = ['','Weak','Fair','Good','Strong'];
  const colors = ['','#EF4444','#F59E0B','#3B82F6','#10B981'];
  return (
    <div style={{ marginTop:6, marginBottom:14 }}>
      <div style={{ display:'flex', gap:4, marginBottom:5 }}>
        {[1,2,3,4].map(i=>(
          <div key={i} style={{ flex:1, height:4, borderRadius:999,
                                background:i<=s?colors[s]:'#E2E8F0',
                                transition:'background 200ms' }}/>
        ))}
      </div>
      {value && <span style={{ fontSize:11, color:colors[s], fontWeight:600 }}>{labels[s]}</span>}
    </div>
  );
}

// ── Notification bell ──────────────────────────────────────────
export function NotifBell({ count, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ position:'relative', background: hov ? '#F1F5F9' : 'transparent',
               border:'1.5px solid #E2E8F0', cursor:'pointer',
               padding:'7px 8px', borderRadius:10, color:'#475569',
               transition:'all 140ms', display:'flex',
               alignItems:'center', justifyContent:'center' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
      {count > 0 && (
        <span className="notif-pulse" style={{ position:'absolute', top:-4, right:-4,
               minWidth:18, height:18, background:'#EF4444', borderRadius:'50%',
               fontSize:10, fontWeight:800, color:'#fff',
               display:'flex', alignItems:'center', justifyContent:'center',
               border:'2px solid #fff', padding:'0 3px' }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}

// ── Profile badge ──────────────────────────────────────────────
export function ProfileBadge({ name, email, role, onProfile, onLogout, notifCount=0, onNotif }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const roleColors = { landlord:'#3B82F6', tenant:'#10B981', admin:'#8B5CF6' };

  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <NotifBell count={notifCount} onClick={onNotif}/>
      <div ref={ref} style={{ position:'relative' }}>
        <button onClick={()=>setOpen(o=>!o)}
          style={{ display:'flex', alignItems:'center', gap:9, padding:'6px 12px 6px 6px',
                   borderRadius:12, background:open?'#F1F5F9':'#fff',
                   border:'1.5px solid #E2E8F0', cursor:'pointer', transition:'all 140ms' }}
          onMouseEnter={e=>{ e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.borderColor='#CBD5E1'; }}
          onMouseLeave={e=>{ e.currentTarget.style.background=open?'#F1F5F9':'#fff'; e.currentTarget.style.borderColor='#E2E8F0'; }}>
          <Avatar name={name} size={28}/>
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', lineHeight:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#0F172A', maxWidth:120 }} className="truncate">{name||'User'}</div>
            <div style={{ fontSize:11, color:'#94A3B8', marginTop:2, textTransform:'capitalize' }}>{role}</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {open && (
          <div className="dropdown-enter" style={{ position:'absolute', right:0, top:'calc(100% + 8px)',
               background:'#fff', border:'1px solid #E2E8F0', borderRadius:14,
               boxShadow:'0 12px 32px rgba(0,0,0,.12)', zIndex:300, minWidth:220, overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #F1F5F9', background:'#F8FAFC' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <Avatar name={name} size={36}/>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#0F172A' }}>{name}</div>
                  <div style={{ fontSize:12, color:'#64748B', marginTop:1 }}>{email}</div>
                </div>
              </div>
              <span style={{ display:'inline-block', background:`${roleColors[role]||'#475569'}15`,
                             color:roleColors[role]||'#475569', padding:'2px 9px', borderRadius:999,
                             fontSize:11, fontWeight:600, textTransform:'capitalize',
                             border:`1px solid ${roleColors[role]||'#475569'}25` }}>
                {role?.charAt(0).toUpperCase()+role?.slice(1)}
              </span>
            </div>
            <div style={{ padding:'6px 0' }}>
              <button onClick={()=>{ setOpen(false); onProfile?.(); }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
                         width:'100%', background:'none', border:'none', cursor:'pointer',
                         fontSize:13, color:'#1E293B', fontFamily:'inherit',
                         textAlign:'left', transition:'all 120ms' }}
                onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <span>👤</span> {t('viewProfile')}
              </button>
              <div style={{ height:1, background:'#F1F5F9', margin:'4px 0' }}/>
              <button onClick={()=>{ setOpen(false); onLogout?.(); }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
                         width:'100%', background:'none', border:'none', cursor:'pointer',
                         fontSize:13, color:'#B91C1C', fontFamily:'inherit',
                         textAlign:'left', transition:'all 120ms' }}
                onMouseEnter={e=>e.currentTarget.style.background='#FEF2F2'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <span>↩</span> {t('signOut')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Property image gallery ─────────────────────────────────────
export function PropImageGallery({ images=[], onDelete }) {
  const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  if (!images.length) return (
    <div style={{ background:'#F8FAFC', border:'2px dashed #E2E8F0', borderRadius:12,
                  padding:'28px', textAlign:'center', color:'#94A3B8' }}>
      <div style={{ fontSize:28, marginBottom:8 }}>🖼️</div>
      <div style={{ fontSize:13 }}>No images yet</div>
    </div>
  );
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10 }}>
      {images.map(img=>(
        <div key={img.id} style={{ position:'relative', borderRadius:10, overflow:'hidden',
                                   border:'1px solid #E2E8F0', aspectRatio:'4/3', background:'#F1F5F9' }}>
          <img src={`${API}${img.url}`} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          {onDelete && (
            <button onClick={()=>onDelete(img.id)}
              style={{ position:'absolute', top:5, right:5, width:22, height:22,
                       background:'rgba(0,0,0,.6)', border:'none', borderRadius:'50%',
                       color:'#fff', cursor:'pointer', fontSize:12,
                       display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Upload zone ────────────────────────────────────────────────
export function UploadZone({ accept, multiple, onChange, label, sublabel }) {
  const [hov, setHov] = useState(false);
  return (
    <label onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:'block', border:`2px dashed ${hov?'#3B82F6':'#CBD5E1'}`,
               borderRadius:12, padding:'28px 20px', textAlign:'center',
               cursor:'pointer', background:hov?'#EFF6FF':'#F8FAFC',
               transition:'all 150ms' }}>
      <div style={{ fontSize:28, marginBottom:10 }}>📎</div>
      <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:4 }}>{label||'Click to upload'}</div>
      <div style={{ fontSize:12, color:'#94A3B8' }}>{sublabel||'Max 10MB'}</div>
      <input type="file" accept={accept} multiple={multiple} style={{ display:'none' }} onChange={onChange}/>
    </label>
  );
}

// ── daysUntil ──────────────────────────────────────────────────
export function daysUntil(d) {
  return Math.round((new Date(d) - new Date()) / 86400000);
}
