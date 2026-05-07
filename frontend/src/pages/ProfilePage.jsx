import React, { useState } from 'react';
import { api } from '../api';
import { Input, Select, Btn, Card, InfoBox, PasswordStrength, Avatar } from '../components/UI';
import { useToast } from '../components/Toast';
import { CURRENCIES } from '../components/UI';
import { LANGUAGES, useLang, useT } from '../i18n';

// ── ErrBox — MUST be outside ProfilePage to prevent remount on every keystroke ──
function ErrBox({ error }) {
  if (!error) return null;
  return (
    <div style={{
      background: '#FEF2F2', border: '1px solid #FECACA',
      borderRadius: 10, padding: '10px 14px',
      fontSize: 13, color: '#B91C1C', marginBottom: 14,
    }}>
      {error}
    </div>
  );
}

export default function ProfilePage({ profile, role, onClose, onUpdated }) {
  const toast = useToast();
  const { lang, setLang } = useLang();
  const t = useT();

  const [editing, setEditing] = useState(false);
  const [pwdMode, setPwdMode] = useState(false);
  const [form,    setForm]    = useState({});
  const [pwdForm, setPwdForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set    = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };
  const setPwd = (k, v) => { setPwdForm(f => ({ ...f, [k]: v })); setError(''); };

  const startEdit = () => {
    setForm({
      name:     profile.name,
      phone:    profile.phone,
      city:     profile.city,
      email:    profile.email,
      currency: profile.currency || 'INR',
    });
    setEditing(true);
  };

  const saveProfile = async () => {
    if (role === 'tenant') {
      const fields = [];
      if (form.name  !== profile.name)  fields.push({ field: 'name',  newValue: form.name });
      if (form.phone !== profile.phone) fields.push({ field: 'phone', newValue: form.phone });
      if (!fields.length) { setEditing(false); return; }
      setLoading(true);
      try {
        await api(`/api/tenants/${profile.id}/change-request`, {
          method: 'POST',
          body: JSON.stringify({ fields }),
        });
        toast('Update request sent to your landlord.', 'info');
        setEditing(false);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    } else {
      setLoading(true);
      try {
        await api('/api/landlords/me', {
          method: 'PUT',
          body: JSON.stringify({
            name:     form.name,
            phone:    form.phone,
            city:     form.city,
            currency: form.currency,
          }),
        });
        toast('Profile updated.', 'success');
        setEditing(false);
        onUpdated?.();
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    }
  };

  const changePwd = async () => {
    if (!pwdForm.current) { setError('Current password is required'); return; }
    if (!pwdForm.newPwd || pwdForm.newPwd.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (pwdForm.newPwd !== pwdForm.confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: pwdForm.current, newPassword: pwdForm.newPwd }),
      });
      toast('Password changed successfully.', 'success');
      setPwdMode(false);
      setPwdForm({});
      setError('');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const roleColors = { landlord: '#3B82F6', tenant: '#10B981', admin: '#8B5CF6' };
  const roleColor  = roleColors[role] || '#475569';

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>

      {/* ── Header ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, padding: '0 0 24px', borderBottom: '1px solid #E2E8F0' }}>
        <Avatar name={profile.name} size={60}/>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{profile.name}</h2>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>{profile.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: `${roleColor}15`, color: roleColor,
              padding: '3px 10px', borderRadius: 999,
              fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
              border: `1px solid ${roleColor}25`,
            }}>{role}</span>
            {profile.id && (
              <span style={{ fontFamily: 'monospace', background: '#F1F5F9', padding: '3px 8px', borderRadius: 6, fontSize: 11, color: '#475569', border: '1px solid #E2E8F0' }}>
                {profile.id}
              </span>
            )}
          </div>
        </div>
        {!editing && !pwdMode && (
          <Btn variant="secondary" onClick={startEdit} icon="✎">Edit profile</Btn>
        )}
      </div>

      <ErrBox error={error}/>

      {/* ── View mode ─────────────────────────────────────── */}
      {!editing && !pwdMode && (
        <>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>
              Profile details
            </div>
            {[
              ['Full name',  profile.name],
              ['Email',      profile.email],
              ['Phone',      profile.phone  || 'Not set'],
              ['City',       profile.city   || 'Not set'],
              ...(role === 'landlord' ? [
                ['Plan',     profile.plan   || 'basic'],
                ['Currency', CURRENCIES[profile.currency || 'INR']?.name || 'INR'],
              ] : []),
              ['Language', LANGUAGES.find(l => l.code === lang)?.native + ' ' + LANGUAGES.find(l => l.code === lang)?.flag || 'English'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
                <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </Card>

          {/* Language selector card */}
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>
              🌐 Display Language
            </div>
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              style={{
                width: '100%', padding: '10px 13px', fontSize: 13,
                border: '1.5px solid #E2E8F0', borderRadius: 10,
                background: '#fff', color: '#0F172A',
                fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
              }}
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.native} — {l.name}
                </option>
              ))}
            </select>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>
              This changes the display language across the entire app. Your preference is saved automatically.
            </div>
          </Card>

          <Btn variant="secondary" onClick={() => { setPwdMode(true); setError(''); }} style={{ width: '100%', justifyContent: 'center' }} icon="🔒">
            Change password
          </Btn>
        </>
      )}

      {/* ── Edit mode ─────────────────────────────────────── */}
      {editing && (
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 18 }}>Edit profile</h3>
          <Input
            label="Full name"
            value={form.name || ''}
            onChange={e => set('name', e.target.value)}
          />
          {role === 'landlord' && (
            <>
              <Input
                label="Phone"
                value={form.phone || ''}
                onChange={e => set('phone', e.target.value)}
                placeholder="+91 9XXXXXXXXX"
              />
              <Input
                label="City"
                value={form.city || ''}
                onChange={e => set('city', e.target.value)}
              />
              <Select
                label="Currency"
                value={form.currency || 'INR'}
                onChange={e => set('currency', e.target.value)}
              >
                <option value="INR">₹ INR — Indian Rupee</option>
                <option value="USD">$ USD — US Dollar</option>
                <option value="EUR">€ EUR — Euro</option>
              </Select>
            </>
          )}
          {role === 'tenant' && (
            <>
              <Input
                label="Phone number"
                value={form.phone || ''}
                onChange={e => set('phone', e.target.value)}
                placeholder="+91 9XXXXXXXXX"
              />
              <InfoBox type="warning">
                Changes to your name or phone number require approval from your landlord. You will receive a notification once reviewed.
              </InfoBox>
            </>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => { setEditing(false); setError(''); }}>Cancel</Btn>
            <Btn onClick={saveProfile} loading={loading}>
              {role === 'tenant' ? 'Request update' : 'Save changes'}
            </Btn>
          </div>
        </Card>
      )}

      {/* ── Password change mode ───────────────────────────── */}
      {pwdMode && (
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 18 }}>Change password</h3>
          <Input
            label="Current password"
            type="password"
            value={pwdForm.current || ''}
            onChange={e => setPwd('current', e.target.value)}
            placeholder="Your current password"
          />
          <Input
            label="New password"
            type="password"
            value={pwdForm.newPwd || ''}
            onChange={e => setPwd('newPwd', e.target.value)}
            placeholder="Minimum 8 characters"
          />
          {pwdForm.newPwd && <PasswordStrength value={pwdForm.newPwd}/>}
          <Input
            label="Confirm new password"
            type="password"
            value={pwdForm.confirm || ''}
            onChange={e => setPwd('confirm', e.target.value)}
            placeholder="Repeat new password"
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => { setPwdMode(false); setError(''); setPwdForm({}); }}>Cancel</Btn>
            <Btn onClick={changePwd} loading={loading}>Update password</Btn>
          </div>
        </Card>
      )}

    </div>
  );
}
