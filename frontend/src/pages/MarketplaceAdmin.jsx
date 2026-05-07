import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { Badge, Card, CardHead, Btn, Modal, ModalActions, Input, Select, InfoBox, EmptyState, DotMenu } from '../components/UI';
import { useToast } from '../components/Toast';

// ── Stable input ──────────────────────────────────────────────────────────
function AdminInput({ label, value, onChange, placeholder, type = 'text' }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{ width:'100%', padding:'10px 13px', border:`1.5px solid ${f?'#8B5CF6':'#E2E8F0'}`, borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', color:'#0F172A', boxShadow:f?'0 0 0 3px rgba(139,92,246,.1)':'none', transition:'all 150ms' }}/>
    </div>
  );
}

const STATUS_CFG = {
  new:              { bg:'#EFF6FF',  text:'#1D4ED8',  label:'New' },
  payment_pending:  { bg:'#FEF9C3',  text:'#854D0E',  label:'Payment pending' },
  payment_received: { bg:'#D1FAE5',  text:'#065F46',  label:'Payment received' },
  onboarded:        { bg:'#D1FAE5',  text:'#065F46',  label:'Onboarded ✓' },
  rejected:         { bg:'#FEE2E2',  text:'#991B1B',  label:'Rejected' },
};

function EnqBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.new;
  return <span style={{ display:'inline-flex', padding:'3px 9px', borderRadius:999, fontSize:11, fontWeight:600, background:c.bg, color:c.text }}>{c.label}</span>;
}

export default function MarketplaceAdmin() {
  const toast = useToast();
  const [tab,       setTab]      = useState('enquiries');
  const [enquiries, setEnquiries]= useState([]);
  const [listings,  setListings] = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [modal,     setModal]    = useState(null);
  const [saving,    setSaving]   = useState(false);

  // Modal form state — separate vars
  const [fStatus,  setFStatus]  = useState('');
  const [fPayRef,  setFPayRef]  = useState('');
  const [fPayAmt,  setFPayAmt]  = useState('');
  const [fPayNote, setFPayNote] = useState('');
  const [fErr,     setFErr]     = useState('');

  // Edit listing form
  const [fRent,    setFRent]    = useState('');
  const [fType,    setFType]    = useState('');
  const [fListed,  setFListed]  = useState(true);

  const load = useCallback(async () => {
    try {
      const [enq, lst] = await Promise.all([
        api('/api/marketplace/admin/enquiries'),
        api('/api/marketplace/admin/listings'),
      ]);
      setEnquiries(enq); setListings(lst);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openStatusModal = (enq) => {
    setFStatus(enq.status);
    setFPayRef(enq.payment_ref || '');
    setFPayAmt(enq.payment_amount || '');
    setFPayNote(enq.payment_note || '');
    setFErr('');
    setModal({ type:'status', data:enq });
  };

  const openEditListing = (lst) => {
    setFRent(lst.rent || '');
    setFType(lst.property_type || '');
    setFListed(lst.listed !== false);
    setFErr('');
    setModal({ type:'editListing', data:lst });
  };

  const saveStatus = async () => {
    setSaving(true);
    try {
      await api(`/api/marketplace/admin/enquiries/${modal.data.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status:fStatus, paymentRef:fPayRef||null, paymentAmount:fPayAmt?parseInt(fPayAmt):null, paymentNote:fPayNote||null }),
      });
      toast('Status updated.', 'success');
      setModal(null); load();
    } catch (e) { setFErr(e.message); }
    finally { setSaving(false); }
  };

  const onboard = async (enq) => {
    if (!window.confirm(`Onboard ${enq.name}? This will create a tenant account and notify them.`)) return;
    setSaving(true);
    try {
      const res = await api(`/api/marketplace/admin/enquiries/${enq.id}/onboard`, { method:'POST' });
      toast(`✓ Tenant created! ID: ${res.tenantId}  Temp password: ${res.tempPassword}`, 'success');
      setModal(null); load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const saveListing = async () => {
    setSaving(true);
    try {
      await api(`/api/marketplace/admin/listings/${modal.data.id}`, {
        method: 'PUT',
        body: JSON.stringify({ rent:fRent?parseInt(fRent):null, propertyType:fType||null, listed:fListed }),
      });
      toast('Listing updated.', 'success');
      setModal(null); load();
    } catch (e) { setFErr(e.message); }
    finally { setSaving(false); }
  };

  const newEnq       = enquiries.filter(e => e.status === 'new').length;
  const pendingPay   = enquiries.filter(e => e.status === 'payment_pending').length;
  const payReceived  = enquiries.filter(e => e.status === 'payment_received').length;
  const onboarded    = enquiries.filter(e => e.status === 'onboarded').length;

  return (
    <>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        {[
          ['New enquiries',      newEnq,      '📩', '#3B82F6'],
          ['Payment pending',    pendingPay,  '⏳', '#F59E0B'],
          ['Ready to onboard',   payReceived, '✅', '#10B981'],
          ['Onboarded',          onboarded,   '🎉', '#8B5CF6'],
        ].map(([l,v,ic,c]) => (
          <div key={l} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:8 }}>{ic} {l}</div>
            <div style={{ fontSize:26, fontWeight:800, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display:'flex', background:'#F1F5F9', borderRadius:10, padding:4, marginBottom:20, maxWidth:360 }}>
        {[['enquiries','Enquiries'],['listings','Active Listings']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex:1, padding:'8px 12px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit', border:'none', transition:'all 150ms', background:tab===t?'#fff':'transparent', color:tab===t?'#0F172A':'#64748B', fontWeight:tab===t?600:400, boxShadow:tab===t?'0 1px 4px rgba(0,0,0,.1)':'none' }}>
            {l}{t==='enquiries'&&newEnq>0?` (${newEnq})`:''}{t==='listings'?` (${listings.filter(l=>l.listing_status==='active').length})`:''}
          </button>
        ))}
      </div>

      {/* Enquiries tab */}
      {tab === 'enquiries' && (
        <Card>
          <CardHead title="All enquiries"/>
          {enquiries.length === 0
            ? <EmptyState icon="📩" title="No enquiries yet" desc="Enquiries from prospective tenants will appear here."/>
            : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr>
                  {['Name','Property','City','Rent','Move-in','Status','Actions'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'10px 12px', fontSize:11, fontWeight:700, color:'#64748B', letterSpacing:.5, textTransform:'uppercase', borderBottom:'1px solid #F1F5F9', background:'#FAFAFA' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {enquiries.map(e => (
                    <tr key={e.id}>
                      <td style={{ padding:'12px 12px', borderBottom:'1px solid #F8FAFC' }}>
                        <div style={{ fontWeight:600 }}>{e.name}</div>
                        <div style={{ fontSize:11, color:'#94A3B8' }}>{e.email}</div>
                        <div style={{ fontSize:11, color:'#94A3B8' }}>{e.phone}</div>
                      </td>
                      <td style={{ padding:'12px 12px', borderBottom:'1px solid #F8FAFC', fontSize:13, fontWeight:500 }}>{e.property_name}</td>
                      <td style={{ padding:'12px 12px', borderBottom:'1px solid #F8FAFC', fontSize:12, color:'#64748B' }}>{e.city}</td>
                      <td style={{ padding:'12px 12px', borderBottom:'1px solid #F8FAFC', fontSize:13, fontWeight:600 }}>₹{Number(e.property_rent).toLocaleString()}</td>
                      <td style={{ padding:'12px 12px', borderBottom:'1px solid #F8FAFC', fontSize:12, color:'#64748B' }}>
                        {e.move_in_date ? new Date(e.move_in_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                      </td>
                      <td style={{ padding:'12px 12px', borderBottom:'1px solid #F8FAFC' }}><EnqBadge status={e.status}/></td>
                      <td style={{ padding:'12px 12px', borderBottom:'1px solid #F8FAFC' }}>
                        <DotMenu items={[
                          { label:'Manage enquiry', icon:'⚙️', fn:()=>openStatusModal(e) },
                          e.status==='payment_received' && { label:'Onboard as tenant', icon:'🎉', fn:()=>onboard(e) },
                        ].filter(Boolean)}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </Card>
      )}

      {/* Listings tab */}
      {tab === 'listings' && (
        <Card>
          <CardHead title="All marketplace listings"/>
          {listings.length === 0
            ? <EmptyState icon="🏪" title="No listings yet" desc="Landlords will list their properties here."/>
            : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr>
                  {['Property','Landlord','City','Rent','Type','Views','Enquiries','Status','Actions'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'10px 12px', fontSize:11, fontWeight:700, color:'#64748B', letterSpacing:.5, textTransform:'uppercase', borderBottom:'1px solid #F1F5F9', background:'#FAFAFA' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {listings.map(l => (
                    <tr key={l.id}>
                      <td style={{ padding:'11px 12px', borderBottom:'1px solid #F8FAFC', fontWeight:600, fontSize:13 }}>{l.name}</td>
                      <td style={{ padding:'11px 12px', borderBottom:'1px solid #F8FAFC', fontSize:12, color:'#64748B' }}>{l.landlord_name}</td>
                      <td style={{ padding:'11px 12px', borderBottom:'1px solid #F8FAFC', fontSize:12, color:'#64748B' }}>{l.city}</td>
                      <td style={{ padding:'11px 12px', borderBottom:'1px solid #F8FAFC', fontWeight:600, fontSize:13 }}>₹{Number(l.rent).toLocaleString()}</td>
                      <td style={{ padding:'11px 12px', borderBottom:'1px solid #F8FAFC', fontSize:12 }}>{l.property_type||'—'}</td>
                      <td style={{ padding:'11px 12px', borderBottom:'1px solid #F8FAFC', fontSize:13 }}>{l.view_count||0}</td>
                      <td style={{ padding:'11px 12px', borderBottom:'1px solid #F8FAFC', fontSize:13 }}>{l.enquiry_count||0}</td>
                      <td style={{ padding:'11px 12px', borderBottom:'1px solid #F8FAFC' }}>
                        <span style={{ display:'inline-flex', padding:'3px 9px', borderRadius:999, fontSize:11, fontWeight:600, background:l.listing_status==='active'?'#D1FAE5':l.listing_status==='rented'?'#DBEAFE':'#F1F5F9', color:l.listing_status==='active'?'#065F46':l.listing_status==='rented'?'#1E40AF':'#475569' }}>
                          {l.listing_status==='active'?'Active':l.listing_status==='rented'?'Rented':'Unlisted'}
                        </span>
                      </td>
                      <td style={{ padding:'11px 12px', borderBottom:'1px solid #F8FAFC' }}>
                        <DotMenu items={[{ label:'Edit listing', icon:'✎', fn:()=>openEditListing(l) }]}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </Card>
      )}

      {/* Status/payment modal */}
      {modal?.type === 'status' && (
        <Modal title={`Manage enquiry — ${modal.data.name}`} onClose={() => setModal(null)} width={520}>
          <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[['Name',modal.data.name],['Email',modal.data.email],['Phone',modal.data.phone],['Property',modal.data.property_name],['City',modal.data.city],['Rent',`₹${Number(modal.data.property_rent).toLocaleString()}`],['Move-in',modal.data.move_in_date?new Date(modal.data.move_in_date).toLocaleDateString('en-IN'):'Not specified'],['Enquiry date',new Date(modal.data.created_at).toLocaleDateString('en-IN')]].map(([l,v]) => (
                <div key={l}>
                  <div style={{ fontSize:10, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:.4 }}>{l}</div>
                  <div style={{ fontSize:13, fontWeight:500, color:'#0F172A' }}>{v}</div>
                </div>
              ))}
            </div>
            {modal.data.message && <div style={{ marginTop:10, fontSize:13, color:'#475569', background:'#fff', borderRadius:8, padding:'8px 10px', border:'1px solid #E2E8F0' }}><strong>Message:</strong> {modal.data.message}</div>}
          </div>
          {fErr && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'9px 12px', fontSize:13, color:'#B91C1C', marginBottom:14 }}>{fErr}</div>}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }}>Update status</label>
            <select value={fStatus} onChange={e=>setFStatus(e.target.value)}
              style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', color:'#0F172A', cursor:'pointer' }}>
              <option value="new">New</option>
              <option value="payment_pending">Payment pending</option>
              <option value="payment_received">Payment received ✓</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {(fStatus==='payment_pending'||fStatus==='payment_received') && (
            <>
              <AdminInput label="Payment reference / UTR" value={fPayRef} onChange={e=>setFPayRef(e.target.value)} placeholder="UTR number or reference"/>
              <AdminInput label="Payment amount (₹)" value={fPayAmt} onChange={e=>setFPayAmt(e.target.value)} type="number" placeholder={modal.data.property_rent}/>
              <AdminInput label="Payment note" value={fPayNote} onChange={e=>setFPayNote(e.target.value)} placeholder="e.g. First month + security deposit"/>
            </>
          )}
          {fStatus==='payment_received' && (
            <InfoBox type="success">
              Once saved, you can click <strong>Onboard as tenant</strong> to create their account and notify them.
            </InfoBox>
          )}
          <ModalActions>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            {modal.data.status==='payment_received' && (
              <Btn variant="success" onClick={() => onboard(modal.data)} loading={saving}>
                🎉 Onboard as tenant
              </Btn>
            )}
            <Btn style={{ background:'#8B5CF6', color:'#fff', border:'none' }} onClick={saveStatus} loading={saving}>
              Save status
            </Btn>
          </ModalActions>
        </Modal>
      )}

      {/* Edit listing modal */}
      {modal?.type === 'editListing' && (
        <Modal title={`Edit listing — ${modal.data.name}`} onClose={() => setModal(null)}>
          {fErr && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'9px 12px', fontSize:13, color:'#B91C1C', marginBottom:14 }}>{fErr}</div>}
          <AdminInput label="Override rent (₹/month)" value={fRent} onChange={e=>setFRent(e.target.value)} type="number" placeholder={modal.data.rent}/>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }}>Property type</label>
            <select value={fType} onChange={e=>setFType(e.target.value)}
              style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', cursor:'pointer' }}>
              <option value="">— No change —</option>
              {['1BHK','2BHK','3BHK','4BHK','Studio','Duplex','Villa','Penthouse'].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }}>Listing status</label>
            <select value={fListed?'active':'unlisted'} onChange={e=>setFListed(e.target.value==='active')}
              style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', cursor:'pointer' }}>
              <option value="active">Active — visible on marketplace</option>
              <option value="unlisted">Unlisted — hidden from marketplace</option>
            </select>
          </div>
          <ModalActions>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn style={{ background:'#8B5CF6', color:'#fff', border:'none' }} onClick={saveListing} loading={saving}>Save changes</Btn>
          </ModalActions>
        </Modal>
      )}
    </>
  );
}
