import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../App';
import { api, API_BASE_URL } from '../api';
import {
  Badge, Avatar, Chip, Card, CardHead, NavItem,
  Modal, ModalActions, Btn, InfoBox, EmptyState,
  ProgressBar, daysUntil, ProfileBadge, fmt,
} from '../components/UI';
import { useToast } from '../components/Toast';
import ProfilePage from './ProfilePage';
import NotificationsPanel from './NotificationsPanel';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useT } from '../i18n';

// ── PayInput — OUTSIDE component to prevent remount on keystroke ─────────────
function PayInput({ label, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 13px', fontSize: 13,
          outline: 'none', fontFamily: 'inherit', borderRadius: 10,
          background: '#fff', color: '#0F172A',
          border: `1.5px solid ${focused ? '#3B82F6' : '#E2E8F0'}`,
          boxShadow: focused ? '0 0 0 3px rgba(59,130,246,.1)' : 'none',
          transition: 'border-color 150ms, box-shadow 150ms',
        }}
      />
    </div>
  );
}

// ── PayModal — OUTSIDE component to prevent remount on keystroke ─────────────
function PayModal({ tenant, f, onClose, onSuccess, onCashRequested }) {
  const [payMethod, setPayMethod] = useState('upi');
  const [upiId,     setUpiId]     = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [ifsc,      setIfsc]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [err,       setErr]       = useState('');

  const submit = async () => {
    setErr('');
    setLoading(true);
    try {
      const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

      if (payMethod === 'cash') {
        // Cash goes for landlord approval first
        await api(`/api/tenants/${tenant.id}/cash-request`, {
          method: 'POST',
          body: JSON.stringify({ amount: tenant.rent, month }),
        });
        onCashRequested?.();
      } else {
        // UPI / NEFT — mark paid directly
        await api(`/api/tenants/${tenant.id}/payment`, {
          method: 'PUT',
          body: JSON.stringify({ status:'paid', amount:tenant.rent, month, method:payMethod.toUpperCase() }),
        });
        onSuccess(payMethod);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Pay rent — ${tenant.property_name}`} onClose={onClose}>
      {/* Amount summary */}
      <div style={{
        background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12,
        padding: '16px 18px', marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontWeight: 600 }}>
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{tenant.property_name}</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#059669' }}>{f(tenant.rent)}</div>
      </div>

      {/* Method tabs */}
      <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 10 }}>
        Payment method
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
        {[['upi', 'UPI / GPay'], ['neft', 'NEFT / IMPS'], ['cash', 'Cash']].map(([m, l]) => (
          <button key={m} onClick={() => setPayMethod(m)}
            style={{
              padding: '11px 8px', borderRadius: 10, cursor: 'pointer',
              border: `2px solid ${payMethod === m ? '#3B82F6' : '#E2E8F0'}`,
              background: payMethod === m ? '#EFF6FF' : '#fff',
              color: payMethod === m ? '#1D4ED8' : '#374151',
              fontSize: 13, fontWeight: payMethod === m ? 700 : 500,
              fontFamily: 'inherit', transition: 'all 150ms',
            }}>
            {l}
          </button>
        ))}
      </div>

      {/* UPI */}
      {payMethod === 'upi' && (
        <PayInput
          label="UPI ID or phone number"
          value={upiId}
          onChange={e => setUpiId(e.target.value)}
          placeholder="phone@upi or 9876543210@paytm"
        />
      )}

      {/* NEFT */}
      {payMethod === 'neft' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <PayInput
            label="Account number"
            value={accNumber}
            onChange={e => setAccNumber(e.target.value)}
            placeholder="Account number"
          />
          <PayInput
            label="IFSC code"
            value={ifsc}
            onChange={e => setIfsc(e.target.value)}
            placeholder="SBIN0001234"
          />
        </div>
      )}

      {/* Cash */}
      {payMethod === 'cash' && (
        <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'11px 14px', fontSize:13, color:'#92400E', marginBottom:14 }}>
          <strong>Cash payment flow:</strong> Submitting this will send a confirmation request to your landlord. Once your landlord confirms receipt, your payment status will be updated. Your landlord can also add a remark.
        </div>
      )}

      {/* Error */}
      {err && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#B91C1C', marginBottom:14 }}>
          {err}
        </div>
      )}

      <ModalActions>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="success" onClick={submit} loading={loading}>
          {payMethod === 'cash' ? 'Send for confirmation →' : 'Confirm payment →'}
        </Btn>
      </ModalActions>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function TenantDashboard() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const t = useT();

  const [page,        setPage]       = useState('home');
  const [tenant,      setTenant]     = useState(null);
  const [payments,    setPayments]   = useState([]);
  const [payModal,    setPayModal]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]  = useState(false);
  const [notifCount,  setNotifCount] = useState(0);
  const notifRef = useRef(null);

  const currency = tenant?.landlord_currency || 'INR';
  const f = amt => fmt(amt, currency);

  const load = useCallback(async () => {
    try {
      const [ts, ps] = await Promise.all([api('/api/tenants'), api('/api/payments')]);
      setTenant(ts[0] || null);
      setPayments(ps);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Notification count — load on mount and poll every 30s
  useEffect(() => {
    const fetchCount = () => {
      api('/api/notifications/unread-count')
        .then(res => setNotifCount(res.count))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!tenant) return (
    <div style={{ minHeight: '100vh', background: '#080D1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 28, height: 28 }}/>
      <span style={{ fontSize: 14, color: 'rgba(255,255,255,.35)' }}>Loading your portal…</span>
    </div>
  );

  const d = tenant.lease_end ? daysUntil(tenant.lease_end) : null;
  const navItems = [['home', `🏠 ${t('myHome')}`], ['payments', `💳 ${t('payments')}`], ['contract', `📋 ${t('contracts')}`]];
  const titles   = { home: t('myHome'), payments: t('payments'), contract: t('contracts') };

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <div className="sidebar-scroll" style={{
      width: 230, flexShrink: 0, background: '#0A0F1E',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 20,
      borderRight: '1px solid rgba(255,255,255,.06)',
    }}>
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#10B981,#059669)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, boxShadow: '0 4px 12px rgba(16,185,129,.4)' }}>RP</div>
          <div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>RentPro</div>
            <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 11 }}>Tenant portal</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '10px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.2)', padding: '10px 18px 4px', letterSpacing: .8, textTransform: 'uppercase' }}>Navigation</div>
        {navItems.map(([p, l]) => (
          <NavItem key={p} label={l} active={page === p} onClick={() => setPage(p)} accent='#34D399' activeBg='rgba(16,185,129,.15)'/>
        ))}
      </nav>
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 3 }}>Property</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', fontWeight: 600 }} className="truncate">{tenant.property_name || '—'}</div>
        <div style={{ marginTop: 5 }}><Chip id={tenant.id}/></div>
      </div>
    </div>
  );

  // ── Home page ──────────────────────────────────────────────────────────────
  const renderHome = () => (
    <div className="stagger">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>Hello, {tenant.name?.split(' ')[0]}! 👋</h2>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Tenant ID: <Chip id={tenant.id}/></p>
      </div>

      {tenant.pay_status === 'overdue' && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(239,68,68,.1)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#B91C1C', marginBottom: 3 }}>⚠️ Payment overdue</div>
            <div style={{ fontSize: 13, color: '#DC2626' }}>{f(tenant.rent)} is due. Please pay to avoid penalties.</div>
          </div>
          <Btn style={{ background: '#B91C1C', color: '#fff', border: 'none', flexShrink: 0 }} onClick={() => setPayModal(true)}>
            Pay now
          </Btn>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {[
          ['🏠 Your property',  tenant.property_name || '—', null, null],
          ['💰 Monthly rent',   f(tenant.rent), 'Due 1st of month', null],
          ['📅 This month',     tenant.pay_status === 'paid' ? 'Paid ✓' : 'Overdue', null, tenant.pay_status === 'paid' ? '#059669' : '#B91C1C'],
          ['⏳ Lease ends in',  d !== null ? `${d} days` : '—', tenant.lease_end ? new Date(tenant.lease_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null, d !== null && d <= 60 ? '#D97706' : null],
        ].map(([l, v, s, c]) => (
          <Card key={l} style={{ padding: '16px 18px', marginBottom: 0 }}>
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginBottom: 6 }}>{l}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: c || '#0F172A', lineHeight: 1.2 }}>{v}</div>
            {s && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{s}</div>}
          </Card>
        ))}
      </div>

      {tenant.landlord_name && (
        <Card>
          <CardHead title="Your landlord"/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={tenant.landlord_name} size={44}/>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{tenant.landlord_name}</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>{tenant.landlord_email}</div>
              {tenant.landlord_phone && <div style={{ fontSize: 13, color: '#64748B' }}>{tenant.landlord_phone}</div>}
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // ── Payments page ──────────────────────────────────────────────────────────
  const renderPayments = () => (
    <div className="stagger">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        <Card style={{ padding: '16px 18px', marginBottom: 0 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 5 }}>Monthly rent</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{f(tenant.rent)}</div>
        </Card>
        <Card style={{ padding: '16px 18px', marginBottom: 0 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 5 }}>This month</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: tenant.pay_status === 'paid' ? '#059669' : '#B91C1C' }}>
            {tenant.pay_status === 'paid' ? 'Paid' : 'Overdue'}
          </div>
        </Card>
        <Card style={{ padding: '16px 18px', marginBottom: 0 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 5 }}>Total payments</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{payments.length}</div>
        </Card>
      </div>

      <Card>
        <CardHead
          title="Pay this month"
          action={
            <Btn
              variant={tenant.pay_status === 'paid' ? 'secondary' : 'success'}
              size="sm"
              onClick={() => setPayModal(true)}
            >
              {tenant.pay_status === 'paid' ? 'Pay again' : 'Pay now →'}
            </Btn>
          }
        />

        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{tenant.property_name}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge status={tenant.pay_status}/>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{f(tenant.rent)}</span>
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 12 }}>Payment history</div>
        {payments.length === 0 ? (
          <EmptyState icon="💳" title="No payment records yet"/>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Month', 'Amount', 'Method', 'Date', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: .5, textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ padding: '11px 12px', borderBottom: '1px solid #F8FAFC', fontSize: 13 }}>{p.month}</td>
                  <td style={{ padding: '11px 12px', borderBottom: '1px solid #F8FAFC', fontWeight: 600, fontSize: 13 }}>{f(p.amount)}</td>
                  <td style={{ padding: '11px 12px', borderBottom: '1px solid #F8FAFC', fontSize: 12, color: '#64748B' }}>{p.method}</td>
                  <td style={{ padding: '11px 12px', borderBottom: '1px solid #F8FAFC', fontSize: 12, color: '#64748B' }}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{ padding: '11px 12px', borderBottom: '1px solid #F8FAFC' }}><Badge status={p.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );

  // ── Contract page ──────────────────────────────────────────────────────────
  const renderContract = () => {
    const pct = tenant.lease_start && tenant.lease_end
      ? Math.min(100, Math.round(((new Date() - new Date(tenant.lease_start)) / (new Date(tenant.lease_end) - new Date(tenant.lease_start))) * 100))
      : 0;
    return (
      <div className="stagger">
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>My Lease Agreement</h3>
            <Badge status="active"/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            {[
              ['Tenant ID',      <Chip id={tenant.id}/>],
              ['Monthly rent',   <span style={{ fontWeight: 700 }}>{f(tenant.rent)}</span>],
              ['Lease start',    tenant.lease_start ? new Date(tenant.lease_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
              ['Lease end',      tenant.lease_end   ? new Date(tenant.lease_end).toLocaleDateString('en-IN',   { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
              ['Days remaining', d !== null ? <span style={{ fontWeight: 700, color: d <= 60 ? '#D97706' : '#059669' }}>{d} days</span> : '—'],
              ['Property',       tenant.property_name || '—'],
            ].map(([l, v]) => (
              <div key={l} style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>

          {tenant.lease_start && tenant.lease_end && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                <span>Lease progress</span>
                <span style={{ fontWeight: 600 }}>{pct}%</span>
              </div>
              <ProgressBar pct={pct} color={d && d <= 30 ? '#EF4444' : d && d <= 60 ? '#F59E0B' : '#3B82F6'} height={8}/>
            </>
          )}

          {d !== null && d <= 60 && d > 0 && (
            <InfoBox type="warning" style={{ marginTop: 16, marginBottom: 0 }}>
              Your lease expires in <strong>{d} days</strong>. Contact your landlord to discuss renewal.
            </InfoBox>
          )}
          {d !== null && d <= 0 && (
            <InfoBox type="error" style={{ marginTop: 16, marginBottom: 0 }}>
              Your lease has expired. Please contact your landlord immediately.
            </InfoBox>
          )}
        </Card>

        <Card>
          <CardHead title="Contract Document"/>
          {tenant.contract_doc ? (
            <div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '24px', textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Lease Agreement</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 18 }}>Uploaded by your landlord</div>
                <Btn onClick={() => window.open(`${API_BASE_URL}${tenant.contract_doc}`, '_blank')} icon="↗">
                  View document in new tab
                </Btn>
              </div>
              <InfoBox type="info">This document is view-only. Downloading is not permitted.</InfoBox>
            </div>
          ) : (
            <EmptyState icon="📄" title="No contract uploaded yet" desc="Your landlord will upload it shortly."/>
          )}
        </Card>
      </div>
    );
  };

  // ── Profile page ───────────────────────────────────────────────────────────
  if (profileOpen) return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9' }}>
      <div style={{ background: '#0A0F1E', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => setProfileOpen(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'rgba(255,255,255,.5)', padding: '4px 8px', borderRadius: 8 }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.5)'}>
          ←
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>My Profile</h1>
      </div>
      <div style={{ padding: '32px 28px', maxWidth: 640, margin: '0 auto' }}>
        <ProfilePage profile={tenant} role="tenant" onClose={() => setProfileOpen(false)} onUpdated={load}/>
      </div>
    </div>
  );

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F1F5F9' }}>
      <Sidebar/>
      <div style={{ marginLeft: 230, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14, position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>{titles[page]}</h1>
          </div>
          <LanguageSwitcher variant="light"/>
          <div ref={notifRef} style={{ position: 'relative' }}>
            <ProfileBadge
              name={tenant.name}
              email={tenant.email}
              role="tenant"
              notifCount={notifCount}
              onNotif={() => setNotifOpen(o => !o)}
              onProfile={() => setProfileOpen(true)}
              onLogout={logout}
            />
            {notifOpen && (
              <NotificationsPanel
                role="tenant"
                onClose={() => setNotifOpen(false)}
                onCountChange={setNotifCount}
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }} className="page-enter">
          {page === 'home'     && renderHome()}
          {page === 'payments' && renderPayments()}
          {page === 'contract' && renderContract()}
        </div>
      </div>

      {/* Pay modal — rendered outside, stable component */}
      {payModal && (
        <PayModal
          tenant={tenant}
          f={f}
          onClose={() => setPayModal(false)}
          onSuccess={(method) => {
            setPayModal(false);
            toast(`Payment of ${f(tenant.rent)} confirmed via ${method.toUpperCase()}!`, 'success');
            load();
          }}
          onCashRequested={() => {
            setPayModal(false);
            toast('Cash payment request sent to your landlord for confirmation!', 'info');
            load();
          }}
        />
      )}
    </div>
  );
}
