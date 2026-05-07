import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../App';
import { api, apiUpload, API_BASE_URL } from '../api';
import {
  Badge, Avatar, Chip, Card, CardHead, StatCard, NavItem, DotMenu,
  Modal, ModalActions, Input, Select, Btn, TH, TD,
  daysUntil, ProgressBar, InfoBox, EmptyState, PropImageGallery,
  UploadZone, ProfileBadge, fmt, CURRENCIES,
} from '../components/UI';
import { useToast } from '../components/Toast';
import ProfilePage from './ProfilePage';
import NotificationsPanel from './NotificationsPanel';
import MyListings from './MyListings';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useT } from '../i18n';

export default function LandlordDashboard() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const [page,        setPage]        = useState('dashboard');
  const [properties,  setProperties]  = useState([]);
  const [tenants,     setTenants]     = useState([]);
  const [payments,    setPayments]    = useState([]);
  const [landlord,    setLandlord]    = useState(null);
  const [modal,       setModal]       = useState(null);
  const [form,        setForm]        = useState({});
  const [msg,         setMsg]         = useState('');
  const [saving,      setSaving]      = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifCount,  setNotifCount]  = useState(0);
  const notifRef = useRef(null);

  const currency = landlord?.currency || 'INR';
  const f = amt => fmt(amt, currency);
  const t = useT();

  const load = useCallback(async () => {
    try {
      const [p,t,py,me] = await Promise.all([api('/api/properties'),api('/api/tenants'),api('/api/payments'),api('/api/landlords/me')]);
      setProperties(p); setTenants(t); setPayments(py); setLandlord(me);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setMsg(''); };
  const closeModal = () => { setModal(null); setForm({}); setMsg(''); };

  // ── Actions ───────────────────────────────────────────────
  const addProp = async () => {
    if (!form.name||!form.rent){setMsg('Name and rent required');return;}
    setSaving(true);
    try {
      await api('/api/properties',{method:'POST',body:JSON.stringify({
        name:form.name,address:form.address,city:form.city,rent:form.rent,
        propertyType:form.propertyType,bhk:form.bhk,totalRooms:form.totalRooms,
        floorDetails:form.floorDetails,totalFloors:form.totalFloors,
        furnishing:form.furnishing,areaSqft:form.areaSqft,facing:form.facing,parking:form.parking
      })});
      toast('Property added.','success'); closeModal(); load();
    } catch(e){setMsg(e.message);}finally{setSaving(false);}
  };

  const editProp = async () => {
    setSaving(true);
    try {
      await api(`/api/properties/${modal.data.id}`,{method:'PUT',body:JSON.stringify({
        name:form.name,address:form.address,city:form.city,rent:form.rent,status:form.status,
        propertyType:form.propertyType,bhk:form.bhk,totalRooms:form.totalRooms,
        floorDetails:form.floorDetails,totalFloors:form.totalFloors,
        furnishing:form.furnishing,areaSqft:form.areaSqft,facing:form.facing,parking:form.parking
      })});
      toast('Property updated.','success'); closeModal(); load();
    } catch(e){setMsg(e.message);}finally{setSaving(false);}
  };

  const delProp = async id => {
    if(!window.confirm('Delete this property?')) return;
    try { await api(`/api/properties/${id}`,{method:'DELETE'}); toast('Deleted.','info'); load(); }
    catch(e){toast(e.message,'error');}
  };

  const uploadImages = async e => {
    const files = e.target.files; if(!files?.length) return;
    const fd = new FormData(); Array.from(files).forEach(f=>fd.append('images',f));
    try { await apiUpload(`/api/properties/${modal.data.id}/images`,fd); toast('Images uploaded.','success'); closeModal(); load(); }
    catch(e){setMsg(e.message);}
  };

  const delImage = async imgId => {
    if(!window.confirm('Remove image?')) return;
    try {
      await api(`/api/properties/${modal.data.id}/images/${imgId}`,{method:'DELETE'});
      toast('Image removed.','info'); load();
      const ps = await api('/api/properties');
      const p = ps.find(x=>x.id===modal.data.id);
      if(p) setModal(m=>({...m,data:p}));
    } catch(e){toast(e.message,'error');}
  };

  const issueTenant = async () => {
    if(!form.tname||!form.temail){setMsg('Name and email required');return;}
    setSaving(true);
    try {
      const res = await api('/api/tenants',{method:'POST',body:JSON.stringify({name:form.tname,email:form.temail,phone:form.tphone,propertyId:form.tprop,rent:form.trent,leaseStart:form.tstart,leaseEnd:form.tend})});
      setMsg(`✓ Tenant ID: ${res.tenantId}  ·  Temp password: ${res.tempPassword}`);
      setTimeout(()=>{closeModal();load();},4000);
    } catch(e){setMsg(e.message);}finally{setSaving(false);}
  };

  const editTenant = async () => {
    setSaving(true);
    try {
      await api(`/api/tenants/${modal.data.id}`,{method:'PUT',body:JSON.stringify({
        name:form.name,email:form.email,phone:form.phone,rent:form.rent,
        payStatus:form.payStatus,propertyId:form.propertyId
      })});
      toast('Tenant updated.','success'); closeModal(); load();
    } catch(e){setMsg(e.message);}finally{setSaving(false);}
  };

  const editContract = async () => {
    setSaving(true);
    try { await api(`/api/tenants/${modal.data.id}/contract`,{method:'PUT',body:JSON.stringify({leaseStart:form.leaseStart,leaseEnd:form.leaseEnd,rent:form.rent})}); toast('Contract updated.','success'); closeModal(); load(); }
    catch(e){setMsg(e.message);}finally{setSaving(false);}
  };

  const uploadContract = async e => {
    const file=e.target.files?.[0]; if(!file) return;
    const fd=new FormData(); fd.append('contract',file);
    try { await apiUpload(`/api/tenants/${modal.data.id}/upload-contract`,fd); toast('Contract uploaded.','success'); closeModal(); load(); }
    catch(e){setMsg(e.message);}
  };

  const delContract = async id => {
    if(!window.confirm('Remove contract document?')) return;
    try { await api(`/api/tenants/${id}/contract-doc`,{method:'DELETE'}); toast('Removed.','info'); load(); }
    catch(e){toast(e.message,'error');}
  };

  const markPay = async (id,status) => {
    try {
      const t=tenants.find(x=>x.id===id);
      await api(`/api/tenants/${id}/payment`,{method:'PUT',body:JSON.stringify({status,amount:t?.rent,month:new Date().toLocaleString('default',{month:'long',year:'numeric'}),method:'manual'})});
      toast(`Marked as ${status}.`,'success'); load();
    } catch(e){toast(e.message,'error');}
  };

  // ── Tenant dot menu ───────────────────────────────────────
  const tDotItems = t => [
    {label:'View details',       icon:'👁', fn:()=>setModal({type:'viewTenant',data:t})},
    {label:'Edit tenant',        icon:'✎', fn:()=>{setForm({name:t.name,email:t.email,phone:t.phone,rent:t.rent,payStatus:t.pay_status,propertyId:t.property_id||''});setModal({type:'editTenant',data:t});}},
    {label:'Edit contract',      icon:'📋',fn:()=>{setForm({leaseStart:t.lease_start?.split('T')[0],leaseEnd:t.lease_end?.split('T')[0],rent:t.rent});setModal({type:'editContract',data:t});}},
    {label:'Upload contract doc',icon:'📎',fn:()=>setModal({type:'uploadContract',data:t})},
    '---',
    {label:'Mark paid',   icon:'✓',fn:()=>markPay(t.id,'paid')},
    {label:'Mark overdue',icon:'⚠',fn:()=>markPay(t.id,'overdue')},
  ];

  // ── Sidebar ───────────────────────────────────────────────
  const navItems=[['dashboard',`🏠 ${t('dashboard')}`],['properties',`🏢 ${t('properties')}`],['tenants',`👥 ${t('tenants')}`],['payments',`💳 ${t('payments')}`],['contracts',`📋 ${t('contracts')}`],['listings',`🏪 ${t('myListings')}`]];
  const titles={dashboard:t('dashboard'),properties:t('properties'),tenants:t('tenants'),payments:t('payments'),contracts:t('contracts'),listings:t('myListings')};

  const Sidebar = ()=>(
    <div className="sidebar-scroll" style={{width:230,flexShrink:0,background:'#0A0F1E',display:'flex',flexDirection:'column',position:'fixed',top:0,bottom:0,left:0,zIndex:20,overflowY:'auto',borderRight:'1px solid rgba(255,255,255,.06)'}}>
      <div style={{padding:'20px 18px 16px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,background:'linear-gradient(135deg,#3B82F6,#8B5CF6)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:14,boxShadow:'0 4px 12px rgba(59,130,246,.4)'}}>RP</div>
          <div><div style={{color:'#fff',fontSize:14,fontWeight:700}}>RentPro</div><div style={{color:'rgba(255,255,255,.35)',fontSize:11}}>Landlord portal</div></div>
        </div>
      </div>
      <nav style={{flex:1,padding:'10px 0'}}>
        <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.2)',padding:'10px 18px 4px',letterSpacing:.8,textTransform:'uppercase'}}>Navigation</div>
        {navItems.map(([p,l])=><NavItem key={p} label={l} active={page===p} onClick={()=>setPage(p)} accent='#60A5FA' activeBg='rgba(59,130,246,.15)'/>)}
      </nav>
      {landlord&&(
        <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,.06)',background:'rgba(255,255,255,.02)'}}>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginBottom:3}}>Subscription</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,.6)',fontWeight:600,textTransform:'capitalize'}}>{landlord.plan} plan</div>
          {landlord.plan_expiry&&<div style={{fontSize:11,color:daysUntil(landlord.plan_expiry)<=7?'#FCA5A5':'rgba(255,255,255,.3)',marginTop:2}}>Expires {new Date(landlord.plan_expiry).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>}
        </div>
      )}
    </div>
  );

  // ── Pages ──────────────────────────────────────────────────
  const renderDashboard = ()=>(
    <div className="stagger">
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
        <StatCard label="Properties"      value={landlord?.total_properties||0}    icon="🏢" sub={`${landlord?.vacant_count||0} vacant`}/>
        <StatCard label="Active tenants"  value={landlord?.total_tenants||0}       icon="👥"/>
        <StatCard label="Monthly rent"    value={f(landlord?.monthly_rent_roll||0)} icon="💰"/>
        <StatCard label="Overdue"         value={landlord?.overdue_count||0}        icon="⚠️" danger sub="payments"/>
      </div>
      {landlord?.expiring_soon>0&&<InfoBox type="warning">⚠️ {landlord.expiring_soon} lease{landlord.expiring_soon>1?'s':''} expiring within 30 days. Review in <strong>Contracts</strong>.</InfoBox>}
      <Card>
        <CardHead title="Recent tenants" action={<Btn variant="ghost" size="sm" onClick={()=>setPage('tenants')}>View all →</Btn>}/>
        {tenants.length===0?<EmptyState icon="👥" title="No tenants yet" desc="Issue a Tenant ID to get started."/>:(
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Tenant ID','Name','Property','Rent','Status','Actions'].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
            <tbody>{tenants.slice(0,5).map(t=>(
              <tr key={t.id}>
                <TD><Chip id={t.id}/></TD>
                <TD><div style={{display:'flex',alignItems:'center',gap:9}}><Avatar name={t.name} size={28}/><span style={{fontWeight:600}}>{t.name}</span></div></TD>
                <TD style={{color:'#64748B'}}>{t.property_name||'—'}</TD>
                <TD style={{fontWeight:600}}>{f(t.rent)}</TD>
                <TD><Badge status={t.pay_status}/></TD>
                <TD><DotMenu items={tDotItems(t)}/></TD>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </div>
  );

  const renderProperties=()=>(
    <Card>
      <CardHead title={`My Properties (${properties.length})`} action={<Btn size="sm" onClick={()=>{setForm({});setModal({type:'addProp'});}}>+ Add Property</Btn>}/>
      {properties.length===0?<EmptyState icon="🏢" title="No properties yet"/>:(
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>{['ID','Property','Rent','Tenant','Photos','Status','Actions'].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
          <tbody>{properties.map(p=>(
            <tr key={p.id}>
              <TD><Chip id={p.id}/></TD>
              <TD><div style={{fontWeight:600}}>{p.name}</div><div style={{fontSize:11,color:'#94A3B8'}}>{p.city}</div></TD>
              <TD style={{fontWeight:600}}>{f(p.rent)}</TD>
              <TD>{p.tenant_id?<Chip id={p.tenant_id}/>:<span style={{color:'#94A3B8',fontSize:12}}>Vacant</span>}</TD>
              <TD>{p.images?.length>0?<Btn variant="secondary" size="sm" onClick={()=>setModal({type:'viewImages',data:p})}>🖼️ {p.images.length}</Btn>:<Btn variant="ghost" size="sm" onClick={()=>setModal({type:'uploadImages',data:p})}>+ Add</Btn>}</TD>
              <TD><Badge status={p.status}/></TD>
              <TD><DotMenu items={[
                {label:'Edit property',icon:'✎',fn:()=>{setForm({name:p.name,city:p.city,rent:p.rent,address:p.address,status:p.status,propertyType:p.property_type,bhk:p.bhk,totalRooms:p.total_rooms,floorDetails:p.floor_details,totalFloors:p.total_floors,furnishing:p.furnishing,areaSqft:p.area_sqft,facing:p.facing,parking:p.parking});setModal({type:'editProp',data:p});}},
                p.images?.length?{label:'Manage photos',icon:'🖼️',fn:()=>setModal({type:'viewImages',data:p})}:{label:'Add photos',icon:'📷',fn:()=>setModal({type:'uploadImages',data:p})},
                '---',
                {label:'Delete',icon:'🗑',fn:()=>delProp(p.id),danger:true},
              ]}/></TD>
            </tr>
          ))}</tbody>
        </table>
      )}
    </Card>
  );

  const renderTenants=()=>(
    <Card>
      <CardHead title={`My Tenants (${tenants.length})`} action={<Btn size="sm" onClick={()=>{setForm({});setModal({type:'issueTenant'});}}>+ Issue Tenant ID</Btn>}/>
      {tenants.length===0?<EmptyState icon="👥" title="No tenants yet"/>:(
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>{['Tenant ID','Name','Property','Rent','Lease end','Payment','Actions'].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
          <tbody>{tenants.map(t=>(
            <tr key={t.id}>
              <TD><Chip id={t.id}/></TD>
              <TD><div style={{display:'flex',alignItems:'center',gap:9}}><Avatar name={t.name} size={28}/><div><div style={{fontWeight:600}}>{t.name}</div><div style={{fontSize:11,color:'#94A3B8'}}>{t.email}</div></div></div></TD>
              <TD style={{color:'#64748B'}}>{t.property_name||'—'}</TD>
              <TD style={{fontWeight:600}}>{f(t.rent)}</TD>
              <TD style={{color:'#64748B',fontSize:12}}>{t.lease_end?new Date(t.lease_end).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—'}</TD>
              <TD><Badge status={t.pay_status}/></TD>
              <TD><DotMenu items={tDotItems(t)}/></TD>
            </tr>
          ))}</tbody>
        </table>
      )}
    </Card>
  );

  const renderPayments=()=>(
    <Card>
      <CardHead title="Payment Records"/>
      {payments.length===0?<EmptyState icon="💳" title="No payments yet"/>:(
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>{['Tenant','Property','Month','Amount','Method','Date','Status'].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
          <tbody>{payments.map(p=>(
            <tr key={p.id}>
              <TD style={{fontWeight:600}}>{p.tenant_name||'—'}</TD>
              <TD style={{color:'#64748B',fontSize:12}}>{p.property_name||'—'}</TD>
              <TD>{p.month}</TD>
              <TD style={{fontWeight:600}}>{f(p.amount)}</TD>
              <TD style={{color:'#64748B',fontSize:12}}>{p.method}</TD>
              <TD style={{color:'#64748B',fontSize:12}}>{p.paid_at?new Date(p.paid_at).toLocaleDateString('en-IN'):'—'}</TD>
              <TD><Badge status={p.status}/></TD>
            </tr>
          ))}</tbody>
        </table>
      )}
    </Card>
  );

  const renderContracts=()=>(
    <Card>
      <CardHead title="Contracts & Lease Tracking"/>
      {tenants.length===0?<EmptyState icon="📋" title="No contracts"/>:(
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>{['Tenant','Property','Period','Progress','Contract','Status','Actions'].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
          <tbody>{tenants.map(t=>{
            const d=t.lease_end?daysUntil(t.lease_end):null;
            const pct=t.lease_start&&t.lease_end?Math.min(100,Math.round(((new Date()-new Date(t.lease_start))/(new Date(t.lease_end)-new Date(t.lease_start)))*100)):0;
            const st=d===null?'vacant':d<0?'overdue':d<=30?'overdue':d<=60?'due-soon':'active';
            const stLbl=d===null?'No lease':d<0?'Expired':d<=30?'Expiring soon':d<=60?'Renewal needed':'Active';
            return(
              <tr key={t.id}>
                <TD style={{fontWeight:600}}>{t.name}</TD>
                <TD style={{color:'#64748B',fontSize:12}}>{t.property_name||'—'}</TD>
                <TD style={{fontSize:12}}>
                  {t.lease_start?new Date(t.lease_start).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):''} – {t.lease_end?new Date(t.lease_end).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'}):''}
                  {d!==null&&<div style={{fontSize:11,color:d<=60?'#D97706':'#94A3B8',marginTop:2}}>{d>0?`${d} days left`:'Expired'}</div>}
                </TD>
                <TD style={{width:90}}>{pct>0&&<ProgressBar pct={pct} color={d&&d<=30?'#EF4444':d&&d<=60?'#F59E0B':'#3B82F6'}/>}</TD>
                <TD>
                  {t.contract_doc
                    ? <div style={{display:'flex',gap:5}}>
                        <Btn variant="secondary" size="sm" onClick={()=>window.open(`${API_BASE_URL}${t.contract_doc}`,'_blank')}>View</Btn>
                        <Btn variant="ghost" size="sm" onClick={()=>setModal({type:'uploadContract',data:t})}>Replace</Btn>
                      </div>
                    : <Btn variant="ghost" size="sm" onClick={()=>setModal({type:'uploadContract',data:t})}>Upload</Btn>
                  }
                </TD>
                <TD><span style={{display:'inline-flex',padding:'3px 9px',borderRadius:999,fontSize:11,fontWeight:600,background:st==='active'?'#D1FAE5':st==='due-soon'?'#FEF3C7':'#FEE2E2',color:st==='active'?'#065F46':st==='due-soon'?'#92400E':'#991B1B'}}>{stLbl}</span></TD>
                <TD><DotMenu items={[
                  {label:'Edit contract',  icon:'📋',fn:()=>{setForm({leaseStart:t.lease_start?.split('T')[0],leaseEnd:t.lease_end?.split('T')[0],rent:t.rent});setModal({type:'editContract',data:t});}},
                  {label:'Upload doc',     icon:'📎',fn:()=>setModal({type:'uploadContract',data:t})},
                  t.contract_doc&&{label:'Remove doc',icon:'🗑',fn:()=>delContract(t.id),danger:true},
                ].filter(Boolean)}/></TD>
              </tr>
            );
          })}</tbody>
        </table>
      )}
    </Card>
  );

  const pageMap={dashboard:renderDashboard,properties:renderProperties,tenants:renderTenants,payments:renderPayments,contracts:renderContracts,listings:()=><MyListings currency={currency}/>};

  // ── Error msg ─────────────────────────────────────────────
  const Err=()=>msg?<div style={{background:msg.startsWith('✓')?'#F0FDF4':'#FEF2F2',border:`1px solid ${msg.startsWith('✓')?'#BBF7D0':'#FECACA'}`,borderRadius:10,padding:'10px 14px',fontSize:13,color:msg.startsWith('✓')?'#15803D':'#B91C1C',marginBottom:14}}>{msg}</div>:null;
  const vacantProps=properties.filter(p=>!p.tenant_id);

  // ── Modals ─────────────────────────────────────────────────
  const renderModal=()=>{
    if(!modal) return null;
    if(modal.type==='addProp') return(
      <Modal title="Add new property" onClose={closeModal} width={520}>
        <Err/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Input label="Property name *" value={form.name||''} onChange={e=>set('name',e.target.value)} placeholder="e.g. Hilltop Apartment"/>
          <Input label="City" value={form.city||''} onChange={e=>set('city',e.target.value)} placeholder="Bengaluru"/>
          <Input label={`Rent (${CURRENCIES[currency]?.symbol||'₹'}) *`} type="number" value={form.rent||''} onChange={e=>set('rent',e.target.value)} placeholder="25000"/>
          <Select label="Property type" value={form.propertyType||''} onChange={e=>set('propertyType',e.target.value)}>
            <option value="">— Select —</option>
            {['1BHK','2BHK','3BHK','4BHK','Studio','Duplex','Villa','Penthouse','PG Room'].map(t=><option key={t} value={t}>{t}</option>)}
          </Select>
          <Select label="BHK" value={form.bhk||''} onChange={e=>set('bhk',e.target.value)}>
            <option value="">— Select —</option>
            {['1 BHK','2 BHK','3 BHK','4 BHK','4+ BHK','Studio'].map(t=><option key={t} value={t}>{t}</option>)}
          </Select>
          <Input label="Total rooms" type="number" value={form.totalRooms||''} onChange={e=>set('totalRooms',e.target.value)} placeholder="3"/>
          <Input label="Floor details" value={form.floorDetails||''} onChange={e=>set('floorDetails',e.target.value)} placeholder="2nd floor, Building A"/>
          <Input label="Total floors in building" type="number" value={form.totalFloors||''} onChange={e=>set('totalFloors',e.target.value)} placeholder="6"/>
          <Select label="Furnishing" value={form.furnishing||''} onChange={e=>set('furnishing',e.target.value)}>
            <option value="">— Select —</option>
            {['Fully Furnished','Semi Furnished','Unfurnished'].map(t=><option key={t} value={t}>{t}</option>)}
          </Select>
          <Input label="Area (sq ft)" type="number" value={form.areaSqft||''} onChange={e=>set('areaSqft',e.target.value)} placeholder="850"/>
          <Select label="Facing" value={form.facing||''} onChange={e=>set('facing',e.target.value)}>
            <option value="">— Select —</option>
            {['North','South','East','West','North-East','North-West','South-East','South-West'].map(t=><option key={t} value={t}>{t}</option>)}
          </Select>
          <Select label="Parking" value={form.parking||''} onChange={e=>set('parking',e.target.value)}>
            <option value="">— Select —</option>
            {['Car Parking','Bike Parking','Both','None'].map(t=><option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <Input label="Full address" value={form.address||''} onChange={e=>set('address',e.target.value)} placeholder="Street, Area, City, Pincode"/>
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Cancel</Btn><Btn onClick={addProp} loading={saving}>Add property</Btn></ModalActions>
      </Modal>
    );
    if(modal.type==='editProp') return(
      <Modal title={`Edit property — ${modal.data.id}`} onClose={closeModal} width={520}>
        <Err/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Input label="Property name" value={form.name||''} onChange={e=>set('name',e.target.value)}/>
          <Input label="City" value={form.city||''} onChange={e=>set('city',e.target.value)}/>
          <Input label="Rent" type="number" value={form.rent||''} onChange={e=>set('rent',e.target.value)}/>
          <Select label="Property type" value={form.propertyType||''} onChange={e=>set('propertyType',e.target.value)}>
            <option value="">— Select —</option>
            {['1BHK','2BHK','3BHK','4BHK','Studio','Duplex','Villa','Penthouse','PG Room'].map(t=><option key={t} value={t}>{t}</option>)}
          </Select>
          <Select label="BHK" value={form.bhk||''} onChange={e=>set('bhk',e.target.value)}>
            <option value="">— Select —</option>
            {['1 BHK','2 BHK','3 BHK','4 BHK','4+ BHK','Studio'].map(t=><option key={t} value={t}>{t}</option>)}
          </Select>
          <Input label="Total rooms" type="number" value={form.totalRooms||''} onChange={e=>set('totalRooms',e.target.value)}/>
          <Input label="Floor details" value={form.floorDetails||''} onChange={e=>set('floorDetails',e.target.value)}/>
          <Input label="Total floors" type="number" value={form.totalFloors||''} onChange={e=>set('totalFloors',e.target.value)}/>
          <Select label="Furnishing" value={form.furnishing||''} onChange={e=>set('furnishing',e.target.value)}>
            <option value="">— Select —</option>
            {['Fully Furnished','Semi Furnished','Unfurnished'].map(t=><option key={t} value={t}>{t}</option>)}
          </Select>
          <Input label="Area (sq ft)" type="number" value={form.areaSqft||''} onChange={e=>set('areaSqft',e.target.value)}/>
          <Select label="Facing" value={form.facing||''} onChange={e=>set('facing',e.target.value)}>
            <option value="">— Select —</option>
            {['North','South','East','West','North-East','North-West','South-East','South-West'].map(t=><option key={t} value={t}>{t}</option>)}
          </Select>
          <Select label="Parking" value={form.parking||''} onChange={e=>set('parking',e.target.value)}>
            <option value="">— Select —</option>
            {['Car Parking','Bike Parking','Both','None'].map(t=><option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <Input label="Full address" value={form.address||''} onChange={e=>set('address',e.target.value)}/>
        <Select label="Status" value={form.status||'vacant'} onChange={e=>set('status',e.target.value)}>
          <option value="vacant">Vacant</option><option value="occupied">Occupied</option>
        </Select>
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Cancel</Btn><Btn onClick={editProp} loading={saving}>Save changes</Btn></ModalActions>
      </Modal>
    );
    if(modal.type==='viewImages') return(
      <Modal title={`Photos — ${modal.data.name}`} onClose={closeModal} width={540}>
        <PropImageGallery images={modal.data.images||[]} onDelete={delImage}/>
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Close</Btn><Btn onClick={()=>setModal({type:'uploadImages',data:modal.data})}>+ Add more</Btn></ModalActions>
      </Modal>
    );
    if(modal.type==='uploadImages') return(
      <Modal title={`Upload photos — ${modal.data.name}`} onClose={closeModal}>
        <Err/><InfoBox type="info">Upload up to 10 property photos. JPG, PNG or WEBP.</InfoBox>
        <UploadZone accept="image/*" multiple onChange={uploadImages} label="Click to upload photos" sublabel="JPG, PNG, WEBP — max 10MB"/>
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Cancel</Btn></ModalActions>
      </Modal>
    );
    if(modal.type==='viewTenant'){const t=modal.data;return(
      <Modal title={`Tenant — ${t.id}`} onClose={closeModal} width={520}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22,padding:'0 0 20px',borderBottom:'1px solid #F1F5F9'}}>
          <Avatar name={t.name} size={52}/><div><h3 style={{fontSize:17,fontWeight:700}}>{t.name}</h3><Chip id={t.id}/><span style={{marginLeft:8}}><Badge status={t.pay_status}/></span></div>
        </div>
        {[['Email',t.email],['Phone',t.phone||'—'],['Property',t.property_name||'—'],['Monthly rent',f(t.rent)],['Lease start',t.lease_start?new Date(t.lease_start).toLocaleDateString('en-IN'):'—'],['Lease end',t.lease_end?new Date(t.lease_end).toLocaleDateString('en-IN'):'—'],['Days remaining',t.lease_end?`${daysUntil(t.lease_end)} days`:'—'],['Contract',t.contract_doc?'Uploaded ✓':'Not uploaded']].map(([l,v])=>(
          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid #F8FAFC'}}>
            <span style={{fontSize:13,color:'#94A3B8',fontWeight:500}}>{l}</span>
            <span style={{fontSize:13,color:'#1E293B',fontWeight:500}}>{v}</span>
          </div>
        ))}
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Close</Btn><Btn onClick={()=>{setForm({name:t.name,email:t.email,phone:t.phone,rent:t.rent,payStatus:t.pay_status});setModal({type:'editTenant',data:t});}}>Edit tenant</Btn></ModalActions>
      </Modal>
    );}
    if(modal.type==='issueTenant') return(
      <Modal title="Issue Tenant ID" onClose={closeModal} width={520}>
        <InfoBox type="info">Temp password = Tenant ID. Tenant must change it on first login.</InfoBox><Err/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Input label="Full name *" value={form.tname||''} onChange={e=>set('tname',e.target.value)} placeholder="Tenant name"/>
          <Input label="Email *" type="email" value={form.temail||''} onChange={e=>set('temail',e.target.value)} placeholder="tenant@email.com"/>
          <Input label="Phone" value={form.tphone||''} onChange={e=>set('tphone',e.target.value)} placeholder="+91 9XXXXXXXXX"/>
          <Select label="Assign property (optional)" value={form.tprop||''} onChange={e=>set('tprop',e.target.value)}>
            <option value="">— Not assigned yet —</option>
            {vacantProps.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Input label={`Rent (${CURRENCIES[currency]?.symbol||'₹'})`} type="number" value={form.trent||''} onChange={e=>set('trent',e.target.value)} placeholder="20000"/>
          <div/>
          <Input label="Lease start date" type="date" value={form.tstart||''} onChange={e=>set('tstart',e.target.value)}/>
          <Input label="Lease end date" type="date" value={form.tend||''} onChange={e=>set('tend',e.target.value)}/>
        </div>
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Cancel</Btn><Btn onClick={issueTenant} loading={saving}>Issue Tenant ID</Btn></ModalActions>
      </Modal>
    );
    if(modal.type==='editTenant') return(
      <Modal title={`Edit tenant — ${modal.data.id}`} onClose={closeModal} width={520}><Err/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Input label="Full name" value={form.name||''} onChange={e=>set('name',e.target.value)}/>
          <Input label="Email" type="email" value={form.email||''} onChange={e=>set('email',e.target.value)}/>
          <Input label="Phone" value={form.phone||''} onChange={e=>set('phone',e.target.value)}/>
          <Input label="Monthly rent" type="number" value={form.rent||''} onChange={e=>set('rent',e.target.value)}/>
        </div>
        <Select label="Assign / change property" value={form.propertyId??''} onChange={e=>set('propertyId',e.target.value)}>
          <option value="">— No property assigned —</option>
          {properties.filter(p=>p.status==='vacant'||p.id===modal.data.property_id).map(p=>(
            <option key={p.id} value={p.id}>{p.name}{p.id===modal.data.property_id?' (current)':''}</option>
          ))}
        </Select>
        <Select label="Payment status" value={form.payStatus||'paid'} onChange={e=>set('payStatus',e.target.value)}>
          <option value="paid">Paid</option><option value="overdue">Overdue</option><option value="due-soon">Due soon</option>
        </Select>
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Cancel</Btn><Btn onClick={editTenant} loading={saving}>Save changes</Btn></ModalActions>
      </Modal>
    );
    if(modal.type==='editContract') return(
      <Modal title={`Contract — ${modal.data.name}`} onClose={closeModal}><Err/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Input label="Lease start" type="date" value={form.leaseStart||''} onChange={e=>set('leaseStart',e.target.value)}/><Input label="Lease end" type="date" value={form.leaseEnd||''} onChange={e=>set('leaseEnd',e.target.value)}/></div>
        <Input label={`Rent (${CURRENCIES[currency]?.symbol||'₹'})`} type="number" value={form.rent||''} onChange={e=>set('rent',e.target.value)}/>
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Cancel</Btn><Btn onClick={editContract} loading={saving}>Save contract</Btn></ModalActions>
      </Modal>
    );
    if(modal.type==='uploadContract') return(
      <Modal title={`Upload contract — ${modal.data.name}`} onClose={closeModal}>
        <InfoBox type="info">Tenant can <strong>view</strong> this document but <strong>cannot download</strong> it.</InfoBox><Err/>
        <UploadZone accept=".pdf,.jpg,.jpeg,.png" onChange={uploadContract} label="Upload contract document" sublabel="PDF, JPG, PNG — max 10MB"/>
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Close</Btn></ModalActions>
      </Modal>
    );
    return null;
  };

  // ── Profile page ──────────────────────────────────────────
  if(profileOpen) return(
    <div style={{minHeight:'100vh',background:'#F1F5F9'}}>
      <div style={{background:'#0A0F1E',borderBottom:'1px solid rgba(255,255,255,.06)',padding:'14px 28px',display:'flex',alignItems:'center',gap:14}}>
        <button onClick={()=>setProfileOpen(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'rgba(255,255,255,.5)',padding:'4px 8px',borderRadius:8,transition:'color 130ms'}} onMouseEnter={e=>e.currentTarget.style.color='#fff'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.5)'}>←</button>
        <h1 style={{fontSize:16,fontWeight:700,color:'#fff'}}>My Profile</h1>
      </div>
      <div style={{padding:'32px 28px',maxWidth:640,margin:'0 auto'}}><ProfilePage profile={landlord} role="landlord" onClose={()=>setProfileOpen(false)} onUpdated={load}/></div>
    </div>
  );

  // ── Main layout ───────────────────────────────────────────
  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#F1F5F9'}}>
      <Sidebar/>
      <div style={{marginLeft:230,flex:1,display:'flex',flexDirection:'column'}}>
        {/* Topbar */}
        <div style={{height:56,background:'#fff',borderBottom:'1px solid #E2E8F0',display:'flex',alignItems:'center',padding:'0 24px',gap:14,position:'sticky',top:0,zIndex:10,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
          <div style={{flex:1}}><h1 style={{fontSize:17,fontWeight:700,color:'#0F172A'}}>{titles[page]}</h1></div>
          {page==='properties'&&<Btn size="sm" onClick={()=>{setForm({});setModal({type:'addProp'});}}>+ Add Property</Btn>}
          {page==='tenants'&&<Btn size="sm" onClick={()=>{setForm({});setModal({type:'issueTenant'});}}>+ Issue Tenant ID</Btn>}
          <LanguageSwitcher variant="light"/>
          <div ref={notifRef} style={{position:'relative'}}>
            <ProfileBadge name={landlord?.name||user?.email} email={landlord?.email||user?.email} role="landlord" notifCount={notifCount} onNotif={()=>setNotifOpen(o=>!o)} onProfile={()=>setProfileOpen(true)} onLogout={logout}/>
            {notifOpen&&<NotificationsPanel role="landlord" onClose={()=>setNotifOpen(false)} onCountChange={setNotifCount}/>}
          </div>
        </div>
        <div style={{padding:24}} className="page-enter">
          {pageMap[page]?.()}
        </div>
      </div>
      {renderModal()}
    </div>
  );
}
