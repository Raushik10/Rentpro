import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';

// ── Remark input — outside component ─────────────────────────
function RemarkInput({ value, onChange, placeholder }) {
  const [f, setF] = useState(false);
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={2}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{ width:'100%', padding:'8px 10px', border:`1px solid ${f?'#059669':'rgba(255,255,255,.15)'}`,
               borderRadius:8, fontSize:12, outline:'none', fontFamily:'inherit',
               background:'rgba(255,255,255,.06)', color:'#fff', resize:'none',
               transition:'border-color 150ms' }}/>
  );
}

export default function NotificationsPanel({ onClose, onCountChange, role }) {
  const [notifs,       setNotifs]       = useState([]);
  const [pending,      setPending]      = useState([]);
  const [cashRequests, setCashRequests] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [remarks,      setRemarks]      = useState({});
  const toast = useToast();
  const ref   = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  useEffect(() => {
    (async () => {
      try {
        const calls = [api('/api/notifications')];
        if (role === 'landlord') {
          calls.push(api('/api/tenants/change-requests/pending'));
          calls.push(api('/api/tenants/cash-requests/pending'));
        } else {
          calls.push(Promise.resolve([]));
          calls.push(Promise.resolve([]));
        }
        const [n, p, cr] = await Promise.all(calls);
        setNotifs(n); setPending(p||[]); setCashRequests(cr||[]);
        const total = n.filter(x=>!x.read).length + (p?.length||0) + (cr?.length||0);
        onCountChange?.(total);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [role]);

  const markRead = async id => {
    await api(`/api/notifications/${id}/read`,{method:'PUT'});
    setNotifs(n => n.map(x => x.id===id?{...x,read:true}:x));
    onCountChange?.(notifs.filter(x=>!x.read&&x.id!==id).length + pending.length + cashRequests.length);
  };

  const markAll = async () => {
    await api('/api/notifications/read-all/mark',{method:'PUT'});
    setNotifs(n => n.map(x=>({...x,read:true})));
    onCountChange?.(pending.length + cashRequests.length);
  };

  const resolveChange = async (reqId, action) => {
    try {
      await api(`/api/tenants/change-requests/${reqId}/resolve`,{method:'PUT',body:JSON.stringify({action})});
      setPending(p => p.filter(x=>x.id!==reqId));
      toast(action==='accept'?'Profile update approved.':'Request declined.', action==='accept'?'success':'info');
      onCountChange?.(notifs.filter(x=>!x.read).length + pending.filter(x=>x.id!==reqId).length + cashRequests.length);
    } catch(e) { toast(e.message,'error'); }
  };

  const resolveCash = async (reqId, action) => {
    try {
      await api(`/api/tenants/cash-requests/${reqId}/resolve`,{method:'PUT',body:JSON.stringify({action,remark:remarks[reqId]||''})});
      setCashRequests(c => c.filter(x=>x.id!==reqId));
      toast(action==='confirm'?'Cash payment confirmed.':'Cash payment rejected.', action==='confirm'?'success':'info');
      onCountChange?.(notifs.filter(x=>!x.read).length + pending.length + cashRequests.filter(x=>x.id!==reqId).length);
    } catch(e) { toast(e.message,'error'); }
  };

  const typeIcon = { tenant_created:'👤', change_request:'✏️', change_approved:'✅', change_rejected:'❌', cash_request:'💵', payment_confirmed:'✅', payment_rejected:'❌', system:'⚙️', onboarded:'🎉', tenant_onboarded:'🎉', new_enquiry:'📩' };

  const hasActions = pending.length > 0 || cashRequests.length > 0;

  return (
    <div ref={ref} style={{ position:'absolute', right:0, top:'calc(100% + 10px)', background:'#1E293B', border:'1px solid rgba(255,255,255,.1)', borderRadius:16, boxShadow:'0 20px 48px rgba(0,0,0,.5)', zIndex:400, width:380, maxHeight:540, overflow:'hidden', display:'flex', flexDirection:'column', animation:'dropIn 160ms cubic-bezier(.22,1,.36,1) both' }}>

      {/* Header */}
      <div style={{ padding:'14px 18px 12px', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Notifications</span>
        <button onClick={markAll} style={{ background:'none', border:'none', fontSize:12, color:'#60A5FA', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Mark all read</button>
      </div>

      <div style={{ overflowY:'auto', flex:1 }}>
        {loading && <div style={{ padding:'28px', textAlign:'center', color:'rgba(255,255,255,.3)', fontSize:13 }}>Loading…</div>}

        {/* ── Cash payment requests (landlord) ── */}
        {cashRequests.length > 0 && (
          <div>
            <div style={{ padding:'8px 18px 4px', fontSize:11, fontWeight:700, color:'#FCD34D', textTransform:'uppercase', letterSpacing:.5, background:'rgba(245,158,11,.06)' }}>💵 Cash payment confirmations</div>
            {cashRequests.map(cr => (
              <div key={cr.id} style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,.05)', background:'rgba(245,158,11,.05)' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:2 }}>{cr.tenant_name}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginBottom:2 }}>{cr.property_name}</div>
                <div style={{ fontSize:13, color:'#FCD34D', fontWeight:600, marginBottom:10 }}>
                  ₹{Number(cr.amount).toLocaleString()} — {cr.month}
                </div>
                <div style={{ marginBottom:8 }}>
                  <label style={{ fontSize:11, color:'rgba(255,255,255,.4)', display:'block', marginBottom:4 }}>Remark for tenant (optional)</label>
                  <RemarkInput value={remarks[cr.id]||''} onChange={e=>setRemarks(r=>({...r,[cr.id]:e.target.value}))} placeholder="e.g. Received, thank you!"/>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>resolveCash(cr.id,'confirm')} style={{ flex:1, padding:'8px', borderRadius:8, background:'#059669', color:'#fff', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit' }}>✓ Confirm payment</button>
                  <button onClick={()=>resolveCash(cr.id,'reject')}  style={{ flex:1, padding:'8px', borderRadius:8, background:'transparent', color:'#FCA5A5', border:'1px solid rgba(239,68,68,.3)', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit' }}>✕ Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Profile change requests (landlord) ── */}
        {pending.length > 0 && (
          <div>
            <div style={{ padding:'8px 18px 4px', fontSize:11, fontWeight:700, color:'rgba(245,158,11,.8)', textTransform:'uppercase', letterSpacing:.5, background:'rgba(245,158,11,.05)' }}>✏️ Profile update requests</div>
            {pending.map(req => (
              <div key={req.id} style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,.05)', background:'rgba(245,158,11,.04)' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:4 }}>{req.tenant_name}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.45)', marginBottom:10 }}>
                  <span style={{ fontWeight:500, textTransform:'capitalize' }}>{req.field_name}:</span>{' '}
                  <span style={{ textDecoration:'line-through', color:'rgba(255,255,255,.25)' }}>{req.old_value||'(empty)'}</span>
                  {' → '}
                  <span style={{ fontWeight:600, color:'#fff' }}>{req.new_value}</span>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>resolveChange(req.id,'accept')} style={{ flex:1, padding:'7px', borderRadius:8, background:'#059669', color:'#fff', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit' }}>✓ Accept</button>
                  <button onClick={()=>resolveChange(req.id,'reject')} style={{ flex:1, padding:'7px', borderRadius:8, background:'transparent', color:'#FCA5A5', border:'1px solid rgba(239,68,68,.3)', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit' }}>✕ Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Regular notifications ── */}
        {!loading && notifs.length===0 && !hasActions && (
          <div style={{ padding:'40px 20px', textAlign:'center', color:'rgba(255,255,255,.25)' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>🔔</div>
            <div style={{ fontSize:13 }}>No notifications yet</div>
          </div>
        )}

        {notifs.map(n => (
          <div key={n.id} onClick={()=>{ if(!n.read) markRead(n.id); }}
            style={{ padding:'13px 18px', borderBottom:'1px solid rgba(255,255,255,.04)', cursor:'pointer', background:n.read?'transparent':'rgba(59,130,246,.05)', transition:'background 120ms' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.04)'}
            onMouseLeave={e=>e.currentTarget.style.background=n.read?'transparent':'rgba(59,130,246,.05)'}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <span style={{ fontSize:16, marginTop:1 }}>{typeIcon[n.type]||'🔔'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:n.read?500:700, color:n.read?'rgba(255,255,255,.6)':'#fff', marginBottom:3 }}>{n.title}</div>
                {n.message && <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', lineHeight:1.5 }}>{n.message}</div>}
                <div style={{ fontSize:11, color:'rgba(255,255,255,.25)', marginTop:5 }}>
                  {new Date(n.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
              {!n.read && <span style={{ width:8, height:8, borderRadius:'50%', background:'#3B82F6', flexShrink:0, marginTop:4 }}/>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
