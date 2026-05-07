import React, { useState, useEffect, useCallback } from 'react';
import { api, apiUpload } from '../api';
import { Badge, Card, CardHead, Btn, Modal, ModalActions, Input, Select, InfoBox, EmptyState, PropImageGallery, UploadZone, fmt } from '../components/UI';
import { useToast } from '../components/Toast';

const PROPERTY_TYPES = ['1BHK','2BHK','3BHK','4BHK','Studio','Duplex','Villa','Penthouse','PG Room'];

// ── All form inputs OUTSIDE component ─────────────────────────────────────
function LInput({ label, value, onChange, placeholder, type='text', required }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }}>{label}{required&&<span style={{ color:'#EF4444' }}> *</span>}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{ width:'100%', padding:'10px 13px', border:`1.5px solid ${f?'#3B82F6':'#E2E8F0'}`, borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', color:'#0F172A', boxShadow:f?'0 0 0 3px rgba(59,130,246,.1)':'none', transition:'all 150ms' }}/>
    </div>
  );
}

function LTextarea({ label, value, onChange, placeholder, rows=3 }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }}>{label}</label>}
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{ width:'100%', padding:'10px 13px', border:`1.5px solid ${f?'#3B82F6':'#E2E8F0'}`, borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', color:'#0F172A', resize:'vertical', boxShadow:f?'0 0 0 3px rgba(59,130,246,.1)':'none', transition:'all 150ms' }}/>
    </div>
  );
}

function LSelect({ label, value, onChange, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }}>{label}</label>}
      <select value={value} onChange={onChange}
        style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', color:'#0F172A', cursor:'pointer' }}>
        {children}
      </select>
    </div>
  );
}

export default function MyListings({ currency = 'INR' }) {
  const toast = useToast();
  const [properties, setProperties] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [saving,     setSaving]     = useState(false);

  // Listing form — separate vars to prevent 1-letter bug
  const [fType,     setFType]     = useState('');
  const [fFloor,    setFFloor]    = useState('');
  const [fAmen,     setFAmen]     = useState('');
  const [fDate,     setFDate]     = useState('');
  const [fAdults,   setFAdults]   = useState('2');
  const [fDesc,     setFDesc]     = useState('');
  const [fRules,    setFRules]    = useState('');
  const [fDeposit,  setFDeposit]  = useState('');
  const [fErr,      setFErr]      = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api('/api/marketplace/landlord/my-listings');
      setProperties(data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = (p) => {
    setFType(p.property_type || '');
    setFFloor(p.floor_details || '');
    setFAmen(p.amenities || '');
    setFDate(p.available_from ? p.available_from.split('T')[0] : '');
    setFAdults(String(p.max_adults || 2));
    setFDesc(p.description || '');
    setFRules(p.house_rules || '');
    setFDeposit(p.security_deposit ? String(p.security_deposit) : '');
    setFErr('');
    setModal({ type:'list', data:p });
  };

  const submitList = async () => {
    if (!fType) { setFErr('Please select a property type'); return; }
    setSaving(true);
    try {
      const body = { propertyType:fType, floorDetails:fFloor, amenities:fAmen,
                     availableFrom:fDate||null, maxAdults:fAdults?parseInt(fAdults):2,
                     description:fDesc, houseRules:fRules,
                     securityDeposit:fDeposit?parseInt(fDeposit):null };
      if (modal.data.listed) {
        await api(`/api/marketplace/landlord/listing/${modal.data.id}`,{ method:'PUT', body:JSON.stringify(body) });
        toast('Listing updated.','success');
      } else {
        await api(`/api/marketplace/landlord/list/${modal.data.id}`,{ method:'POST', body:JSON.stringify(body) });
        toast('Property listed on marketplace!','success');
      }
      setModal(null); load();
    } catch(e) { setFErr(e.message); }
    finally { setSaving(false); }
  };

  const unlist = async (id) => {
    if (!window.confirm('Remove this property from the marketplace?')) return;
    try { await api(`/api/marketplace/landlord/unlist/${id}`,{ method:'POST' }); toast('Property removed from marketplace.','info'); load(); }
    catch(e) { toast(e.message,'error'); }
  };

  const f = amt => fmt(amt, currency);
  const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'#94A3B8' }}>Loading…</div>;

  const vacant   = properties.filter(p => p.status === 'vacant');
  const occupied = properties.filter(p => p.status === 'occupied');

  return (
    <>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
        {[
          ['Listed on marketplace', vacant.filter(p=>p.listed).length, '🏪', '#3B82F6'],
          ['Total views',           vacant.filter(p=>p.listed).reduce((a,p)=>a+parseInt(p.view_count||0),0), '👁', '#8B5CF6'],
          ['Total enquiries',       vacant.filter(p=>p.listed).reduce((a,p)=>a+parseInt(p.enquiry_count||0),0), '📩', '#F59E0B'],
        ].map(([l,v,ic,c])=>(
          <div key={l} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:8 }}>{ic} {l}</div>
            <div style={{ fontSize:26, fontWeight:800, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Vacant properties */}
      <Card>
        <CardHead title="Vacant properties — list on marketplace"/>
        {vacant.length === 0
          ? <EmptyState icon="🏠" title="No vacant properties" desc="Add a property and leave it vacant to list it here."/>
          : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
              {vacant.map(p => (
                <div key={p.id} style={{ border:'1px solid #E2E8F0', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ height:130, background:'#F1F5F9', position:'relative' }}>
                    {p.images?.[0]
                      ? <img src={`${API}${p.images[0]}`} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>🏠</div>
                    }
                    {p.listed && <div style={{ position:'absolute', top:8, right:8, background:'#10B981', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999 }}>LISTED</div>}
                  </div>
                  <div style={{ padding:'12px 14px' }}>
                    <div style={{ fontWeight:600, fontSize:14, marginBottom:1 }}>{p.name}</div>
                    {p.property_type && <div style={{ fontSize:11, color:'#3B82F6', fontWeight:600, marginBottom:2 }}>{p.property_type}{p.bhk?` · ${p.bhk}`:''}{p.total_rooms?` · ${p.total_rooms} rooms`:''}</div>}
                    <div style={{ fontSize:12, color:'#64748B', marginBottom:10 }}>{p.city} · {f(p.rent)}/mo</div>
                    {p.listed ? (
                      <div>
                        <div style={{ display:'flex', gap:10, fontSize:12, color:'#64748B', marginBottom:10 }}>
                          <span>👁 {p.view_count||0} views</span>
                          <span>·</span>
                          <span>📩 {p.enquiry_count||0} enquiries</span>
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                          <Btn variant="secondary" size="sm" onClick={()=>openModal(p)} style={{ flex:1, justifyContent:'center' }}>Edit listing</Btn>
                          <Btn variant="danger" size="sm" onClick={()=>unlist(p.id)}>Unlist</Btn>
                        </div>
                      </div>
                    ) : (
                      <Btn size="sm" onClick={()=>openModal(p)} style={{ width:'100%', justifyContent:'center' }}>+ List on marketplace</Btn>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </Card>

      {/* Occupied */}
      {occupied.length > 0 && (
        <Card>
          <CardHead title="Occupied properties"/>
          <div style={{ fontSize:13, color:'#64748B', marginBottom:12 }}>These properties already have tenants and cannot be listed.</div>
          {occupied.map(p=>(
            <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #F8FAFC' }}>
              <div>
                <div style={{ fontWeight:600 }}>{p.name}</div>
                <div style={{ fontSize:12, color:'#94A3B8' }}>{p.city} · {f(p.rent)}/mo</div>
              </div>
              <Badge status="occupied"/>
            </div>
          ))}
        </Card>
      )}

      {/* List / Edit modal */}
      {modal?.type === 'list' && (
        <Modal title={modal.data.listed ? `Edit listing — ${modal.data.name}` : `List on marketplace — ${modal.data.name}`} onClose={()=>setModal(null)} width={540}>
          <InfoBox type="info">Your name and contact details will <strong>not</strong> be shown — all enquiries go through admin.</InfoBox>
          {fErr && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'9px 12px', fontSize:13, color:'#B91C1C', marginBottom:14 }}>{fErr}</div>}

          {/* Property summary */}
          <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:10, padding:'10px 14px', marginBottom:16, display:'flex', justifyContent:'space-between' }}>
            <div><div style={{ fontWeight:600 }}>{modal.data.name}</div><div style={{ fontSize:12, color:'#64748B' }}>{modal.data.city}</div></div>
            <div style={{ fontWeight:700, color:'#0F172A' }}>{f(modal.data.rent)}/mo</div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <LSelect label="Property type *" value={fType} onChange={e=>setFType(e.target.value)}>
              <option value="">— Select —</option>
              {PROPERTY_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </LSelect>
            <LInput label="Floor / building details" value={fFloor} onChange={e=>setFFloor(e.target.value)} placeholder="e.g. 3rd floor, East wing"/>
            <LInput label="Max adults allowed" type="number" value={fAdults} onChange={e=>setFAdults(e.target.value)} placeholder="2"/>
            <LInput label="Security deposit (₹)" type="number" value={fDeposit} onChange={e=>setFDeposit(e.target.value)} placeholder="50000"/>
            <LInput label="Available from" type="date" value={fDate} onChange={e=>setFDate(e.target.value)}/>
          </div>
          <LInput label="Amenities (comma separated)" value={fAmen} onChange={e=>setFAmen(e.target.value)} placeholder="e.g. Parking, AC, Gym, 24h security, WiFi"/>
          <LTextarea label="Description" value={fDesc} onChange={e=>setFDesc(e.target.value)} placeholder="Describe your property — location highlights, nearby amenities, what makes it special…" rows={3}/>
          <LTextarea label="House rules" value={fRules} onChange={e=>setFRules(e.target.value)} placeholder="e.g. No smoking, No pets, Visitors allowed till 10pm…" rows={3}/>

          <ModalActions>
            <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
            <Btn onClick={submitList} loading={saving}>
              {modal.data.listed ? 'Update listing' : 'Publish on marketplace'}
            </Btn>
          </ModalActions>
        </Modal>
      )}
    </>
  );
}
