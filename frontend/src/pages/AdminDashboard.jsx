import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { api, apiUpload } from '../api';
import {
  Badge, Avatar, Chip, Card, CardHead, StatCard, NavItem, DotMenu,
  Modal, ModalActions, Input, Select, Btn, TH, TD,
  daysUntil, InfoBox, EmptyState, fmt,
} from '../components/UI';
import { useToast } from '../components/Toast';
import MarketplaceAdmin from './MarketplaceAdmin';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useT } from '../i18n';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const toast = useToast();
  const t = useT();

  const [page,       setPage]       = useState('overview');
  const [stats,      setStats]      = useState({});
  const [landlords,  setLandlords]  = useState([]);
  const [tenants,    setTenants]    = useState([]);
  const [properties, setProperties] = useState([]);
  const [subs,       setSubs]       = useState([]);
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState({});
  const [msg,        setMsg]        = useState('');
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    try {
      const [st,ll,tn,pr,sb] = await Promise.all([api('/api/admin/stats'),api('/api/admin/landlords'),api('/api/tenants'),api('/api/properties'),api('/api/admin/subscriptions')]);
      setStats(st); setLandlords(ll); setTenants(tn); setProperties(pr); setSubs(sb);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setMsg(''); };
  const closeModal = () => { setModal(null); setForm({}); setMsg(''); };
  const Err = () => msg ? <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#B91C1C', marginBottom:14 }}>{msg}</div> : null;

  const editLL   = async () => { setSaving(true); try { await api(`/api/admin/landlords/${modal.data.id}`,{method:'PUT',body:JSON.stringify({name:form.name,email:form.email,phone:form.phone,city:form.city,plan:form.plan,status:form.status,planExpiry:form.planExpiry})}); toast('Landlord updated.','success'); closeModal(); load(); } catch(e){setMsg(e.message);} finally{setSaving(false);} };
  const addLL    = async () => { if(!form.name||!form.email){setMsg('Name and email required');return;} setSaving(true); try { await api('/api/auth/register',{method:'POST',body:JSON.stringify({name:form.name,email:form.email,password:'TempPass@123',phone:form.phone,city:form.city,plan:form.plan||'basic'})}); toast('Landlord created.','success'); closeModal(); load(); } catch(e){setMsg(e.message);} finally{setSaving(false);} };
  const toggleLL = async (id,status) => { try { await api(`/api/admin/landlords/${id}/status`,{method:'PUT',body:JSON.stringify({status:status==='active'?'suspended':'active'})}); toast(`Landlord ${status==='active'?'suspended':'activated'}.`,'info'); load(); } catch(e){toast(e.message,'error');} };
  const extendSub = async () => { setSaving(true); try { await api(`/api/admin/landlords/${modal.data.id}/extend`,{method:'PUT',body:JSON.stringify({months:form.months||3,exactDate:form.exactDate||null})}); toast('Subscription extended.','success'); closeModal(); load(); } catch(e){setMsg(e.message);} finally{setSaving(false);} };
  const editTenant = async () => { setSaving(true); try { await api(`/api/tenants/${modal.data.id}`,{method:'PUT',body:JSON.stringify({name:form.name,email:form.email,phone:form.phone,rent:form.rent,leaseStart:form.leaseStart,leaseEnd:form.leaseEnd,payStatus:form.payStatus,landlordId:form.landlordId})}); toast('Tenant updated.','success'); closeModal(); load(); } catch(e){setMsg(e.message);} finally{setSaving(false);} };
  const editContract = async () => { setSaving(true); try { await api(`/api/tenants/${modal.data.id}/contract`,{method:'PUT',body:JSON.stringify({leaseStart:form.leaseStart,leaseEnd:form.leaseEnd,rent:form.rent})}); toast('Contract updated.','success'); closeModal(); load(); } catch(e){setMsg(e.message);} finally{setSaving(false);} };
  const markPay = async (id,status) => { try { const t=tenants.find(x=>x.id===id); await api(`/api/tenants/${id}/payment`,{method:'PUT',body:JSON.stringify({status,amount:t?.rent,month:new Date().toLocaleString('default',{month:'long',year:'numeric'}),method:'admin'})}); toast(`Marked as ${status}.`,'success'); load(); } catch(e){toast(e.message,'error');} };
  const uploadContract = async (e,id) => { const file=e.target.files?.[0]; if(!file) return; const fd=new FormData(); fd.append('contract',file); try { await apiUpload(`/api/tenants/${id}/upload-contract`,fd); toast('Contract uploaded.','success'); closeModal(); load(); } catch(e){setMsg(e.message);} };
  const editProp = async () => { setSaving(true); try { await api(`/api/properties/${modal.data.id}`,{method:'PUT',body:JSON.stringify({name:form.name,city:form.city,rent:form.rent,address:form.address,status:form.status})}); toast('Property updated.','success'); closeModal(); load(); } catch(e){setMsg(e.message);} finally{setSaving(false);} };
  const addTenant = async () => { if(!form.name||!form.email){setMsg('Name and email required');return;} setSaving(true); try { await api('/api/tenants',{method:'POST',body:JSON.stringify({name:form.name,email:form.email,phone:form.phone,landlordId:form.landlordId,rent:form.rent,leaseEnd:form.leaseEnd})}); toast('Tenant ID created.','success'); closeModal(); load(); } catch(e){setMsg(e.message);} finally{setSaving(false);} };

  const tDotItems = t => [
    {label:'Edit tenant',        icon:'✎', fn:()=>{setForm({name:t.name,email:t.email,phone:t.phone,rent:t.rent,leaseStart:t.lease_start?.split('T')[0],leaseEnd:t.lease_end?.split('T')[0],payStatus:t.pay_status,landlordId:t.landlord_id});setModal({type:'editTenant',data:t});}},
    {label:'Edit contract',      icon:'📋',fn:()=>{setForm({leaseStart:t.lease_start?.split('T')[0],leaseEnd:t.lease_end?.split('T')[0],rent:t.rent});setModal({type:'editContract',data:t});}},
    {label:'Upload contract doc',icon:'📎',fn:()=>setModal({type:'uploadContract',data:t})},
    '---',
    {label:'Mark paid',   icon:'✓',fn:()=>markPay(t.id,'paid')},
    {label:'Mark overdue',icon:'⚠',fn:()=>markPay(t.id,'overdue')},
  ];

  const navItems=[['overview',`📊 ${t('dashboard')}`],['landlords',`🏠 ${t('landlord')}`],['tenants',`👥 ${t('tenants')}`],['properties',`🏢 ${t('properties')}`],['subscriptions',`💳 ${t('payments')}`],['marketplace',`🏪 ${t('myListings')}`],['activity',`📋 Activity`]];
  const titles={overview:t('dashboard'),landlords:t('landlord'),tenants:t('tenants'),properties:t('properties'),subscriptions:t('payments'),marketplace:t('myListings'),activity:'Activity Log'};

  const Sidebar=()=>(
    <div className="sidebar-scroll" style={{width:230,flexShrink:0,background:'#0A0F1E',display:'flex',flexDirection:'column',position:'fixed',top:0,bottom:0,left:0,zIndex:20,borderRight:'1px solid rgba(255,255,255,.06)'}}>
      <div style={{padding:'20px 18px 16px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,background:'linear-gradient(135deg,#8B5CF6,#6D28D9)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:14,boxShadow:'0 4px 12px rgba(139,92,246,.4)'}}>RP</div>
          <div><div style={{color:'#fff',fontSize:14,fontWeight:700}}>RentPro</div><div style={{color:'rgba(255,255,255,.35)',fontSize:11}}>Admin portal</div></div>
        </div>
      </div>
      <nav style={{flex:1,padding:'10px 0'}}>
        <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.2)',padding:'10px 18px 4px',letterSpacing:.8,textTransform:'uppercase'}}>Navigation</div>
        {navItems.map(([p,l])=><NavItem key={p} label={l} active={page===p} onClick={()=>setPage(p)} accent='#A78BFA' activeBg='rgba(139,92,246,.15)'/>)}
      </nav>
      <div style={{padding:'12px 18px',borderTop:'1px solid rgba(255,255,255,.06)'}}>
        <div style={{fontSize:11,color:'rgba(255,255,255,.35)'}}>Platform Admin</div>
        <div style={{fontSize:12,color:'rgba(255,255,255,.55)',fontWeight:600,marginTop:2}}>admin@rentpro.in</div>
        <button onClick={logout} style={{marginTop:10,width:'100%',padding:'7px',borderRadius:8,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.5)',fontSize:12,cursor:'pointer',fontFamily:'inherit',textAlign:'left',transition:'all 130ms'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.1)';e.currentTarget.style.color='rgba(255,255,255,.8)';}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.06)';e.currentTarget.style.color='rgba(255,255,255,.5)';}}>← Sign out</button>
      </div>
    </div>
  );

  const renderOverview=()=>(
    <div className="stagger">
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
        <StatCard label="Landlords"     value={stats.landlords||0}   icon="🏠" sub={`${stats.landlords||0} active`}/>
        <StatCard label="Tenants"       value={stats.tenants||0}     icon="👥" sub={`${stats.overdue||0} overdue`}/>
        <StatCard label="Properties"    value={stats.properties||0}  icon="🏢"/>
        <StatCard label="Expiring subs" value={stats.expiringSubs||0}icon="⚠️" danger sub="within 7 days"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:16}}>
        <Card>
          <CardHead title="Landlords" action={<Btn variant="ghost" size="sm" onClick={()=>setPage('landlords')}>Manage →</Btn>}/>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['ID','Landlord','City','Plan','Status','Actions'].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
            <tbody>{landlords.slice(0,5).map(l=>(
              <tr key={l.id}>
                <TD><Chip id={l.id}/></TD>
                <TD><div style={{display:'flex',alignItems:'center',gap:9}}><Avatar name={l.name} size={28}/><span style={{fontWeight:600}}>{l.name}</span></div></TD>
                <TD style={{color:'#64748B'}}>{l.city}</TD>
                <TD><Badge status={l.plan}/></TD>
                <TD><Badge status={l.status}/></TD>
                <TD><DotMenu items={[
                  {label:'Edit',icon:'✎',fn:()=>{setForm({name:l.name,email:l.email,phone:l.phone,city:l.city,plan:l.plan,status:l.status,planExpiry:l.plan_expiry?.split('T')[0]});setModal({type:'editLL',data:l});}},
                  {label:l.status==='active'?'Suspend':'Activate',fn:()=>toggleLL(l.id,l.status),danger:l.status==='active'},
                ]}/></TD>
              </tr>
            ))}</tbody>
          </table>
        </Card>
        <Card>
          <CardHead title="Recent activity"/>
          {[{t:'2m ago',m:'New landlord registered',c:'landlord'},{t:'1h ago',m:'Tenant TN-2025-003 overdue',c:'alert'},{t:'3h ago',m:'LL003 suspended by admin',c:'system'},{t:'Yesterday',m:'New tenant TN-2025-004',c:'tenant'}].map((a,i)=>(
            <div key={i} style={{display:'flex',gap:10,padding:'9px 0',borderBottom:'1px solid #F8FAFC'}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:a.c==='alert'?'#EF4444':a.c==='landlord'?'#3B82F6':a.c==='tenant'?'#10B981':'#94A3B8',flexShrink:0,marginTop:4}}/>
              <div><div style={{fontSize:13}}>{a.m}</div><div style={{fontSize:11,color:'#94A3B8',marginTop:2}}>{a.t}</div></div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );

  const renderLandlords=()=>(
    <Card>
      <CardHead title={`All Landlords (${landlords.length})`} action={<Btn style={{background:'#8B5CF6',color:'#fff',border:'none'}} size="sm" onClick={()=>{setForm({});setModal({type:'addLL'});}}>+ Add Landlord</Btn>}/>
      {landlords.length===0?<EmptyState icon="🏠" title="No landlords yet"/>:(
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>{['ID','Landlord','City','Plan','Expiry','Props','Status','Actions'].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
          <tbody>{landlords.map(l=>{const d=l.plan_expiry?daysUntil(l.plan_expiry):null;return(
            <tr key={l.id}>
              <TD><Chip id={l.id}/></TD>
              <TD><div style={{display:'flex',alignItems:'center',gap:9}}><Avatar name={l.name} size={28}/><div><div style={{fontWeight:600}}>{l.name}</div><div style={{fontSize:11,color:'#94A3B8'}}>{l.email}</div></div></div></TD>
              <TD style={{color:'#64748B'}}>{l.city}</TD>
              <TD><Badge status={l.plan}/></TD>
              <TD style={{fontSize:12,color:d!==null&&d<=7?'#B91C1C':d!==null&&d<=30?'#D97706':'#64748B'}}>{l.plan_expiry?new Date(l.plan_expiry).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—'}{d!==null&&<div style={{fontSize:11}}>{d>0?`${d} days`:'Expired'}</div>}</TD>
              <TD>{l.prop_count||0}</TD>
              <TD><Badge status={l.status}/></TD>
              <TD><DotMenu items={[
                {label:'Edit landlord',icon:'✎',fn:()=>{setForm({name:l.name,email:l.email,phone:l.phone,city:l.city,plan:l.plan,status:l.status,planExpiry:l.plan_expiry?.split('T')[0]});setModal({type:'editLL',data:l});}},
                {label:'Extend subscription',icon:'🗓',fn:()=>{setForm({months:3});setModal({type:'extendSub',data:l});}},
                '---',
                {label:l.status==='active'?'Suspend':'Activate',icon:l.status==='active'?'⊘':'✓',fn:()=>toggleLL(l.id,l.status),danger:l.status==='active'},
              ]}/></TD>
            </tr>
          )})}</tbody>
        </table>
      )}
    </Card>
  );

  const renderTenants=()=>(
    <Card>
      <CardHead title={`All Tenants (${tenants.length})`} action={<Btn style={{background:'#8B5CF6',color:'#fff',border:'none'}} size="sm" onClick={()=>{setForm({});setModal({type:'addTenant'});}}>+ Create Tenant ID</Btn>}/>
      {tenants.length===0?<EmptyState icon="👥" title="No tenants yet"/>:(
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>{['Tenant ID','Name','Landlord','Property','Rent','Payment','Lease end','Actions'].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
          <tbody>{tenants.map(t=>{const ll=landlords.find(l=>l.id===t.landlord_id);return(
            <tr key={t.id}>
              <TD><Chip id={t.id}/></TD>
              <TD><div style={{display:'flex',alignItems:'center',gap:9}}><Avatar name={t.name} size={28}/><span style={{fontWeight:600}}>{t.name}</span></div></TD>
              <TD style={{color:'#64748B',fontSize:12}}>{ll?.name||t.landlord_id}</TD>
              <TD style={{color:'#64748B',fontSize:12}}>{t.property_name||'—'}</TD>
              <TD style={{fontWeight:600}}>{fmt(t.rent)}</TD>
              <TD><Badge status={t.pay_status}/></TD>
              <TD style={{color:'#64748B',fontSize:12}}>{t.lease_end?new Date(t.lease_end).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—'}</TD>
              <TD><DotMenu items={tDotItems(t)}/></TD>
            </tr>
          )})}</tbody>
        </table>
      )}
    </Card>
  );

  const renderProperties=()=>(
    <Card>
      <CardHead title={`All Properties (${properties.length})`}/>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead><tr>{['ID','Property','Landlord','Rent','Tenant','Status','Actions'].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
        <tbody>{properties.map(p=>{const ll=landlords.find(l=>l.id===p.landlord_id),t=tenants.find(t=>t.property_id===p.id);return(
          <tr key={p.id}>
            <TD><Chip id={p.id}/></TD>
            <TD style={{fontWeight:600}}>{p.name}</TD>
            <TD style={{color:'#64748B',fontSize:12}}>{ll?.name||'—'}</TD>
            <TD style={{fontWeight:600}}>{fmt(p.rent)}</TD>
            <TD style={{color:'#64748B',fontSize:12}}>{t?.name||'Vacant'}</TD>
            <TD><Badge status={p.status}/></TD>
            <TD><DotMenu items={[{label:'Edit property',icon:'✎',fn:()=>{setForm({name:p.name,city:p.city,rent:p.rent,address:p.address,status:p.status});setModal({type:'editProp',data:p});}}]}/></TD>
          </tr>
        )})}</tbody>
      </table>
    </Card>
  );

  const renderSubscriptions=()=>(
    <div className="stagger">
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
        <StatCard label="Active subs"      value={subs.filter(l=>l.status==='active').length}/>
        <StatCard label="Expiring ≤7 days" value={subs.filter(l=>daysUntil(l.plan_expiry||'')<=7&&daysUntil(l.plan_expiry||'')>0).length} danger/>
        <StatCard label="Expired"          value={subs.filter(l=>daysUntil(l.plan_expiry||'')<=0).length} danger/>
        <StatCard label="Monthly revenue"  value={`₹${subs.filter(l=>l.status==='active').reduce((a,l)=>a+(l.plan==='pro'?2499:999),0).toLocaleString()}`}/>
      </div>
      <Card>
        <CardHead title="Subscription tracker"/>
        {subs.map(l=>{const d=l.plan_expiry?daysUntil(l.plan_expiry):null;const st=d===null?'Unknown':d<=0?'Expired':d<=7?'Critical':d<=30?'Expiring soon':'Active';const stBg=d===null?'#F1F5F9':d<=0?'#FEE2E2':d<=7?'#FEE2E2':d<=30?'#FEF3C7':'#D1FAE5';const stColor=d===null?'#64748B':d<=0?'#991B1B':d<=7?'#991B1B':d<=30?'#92400E':'#065F46';return(
          <div key={l.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 0',borderBottom:'1px solid #F1F5F9'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}><Avatar name={l.name} size={36}/><div><div style={{fontWeight:600,fontSize:14}}>{l.name}</div><div style={{fontSize:12,color:'#64748B'}}>{l.email}</div><Badge status={l.plan}/></div></div>
            <div style={{textAlign:'center'}}><div style={{fontSize:11,color:'#94A3B8'}}>Expiry</div><div style={{fontWeight:600,fontSize:13}}>{l.plan_expiry?new Date(l.plan_expiry).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—'}</div><div style={{fontSize:11,color:d!==null&&d<=30?'#B91C1C':'#94A3B8'}}>{d!==null?d>0?`${d} days`:'Expired':'—'}</div></div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
              <span style={{display:'inline-flex',padding:'3px 9px',borderRadius:999,fontSize:11,fontWeight:600,background:stBg,color:stColor}}>{st}</span>
              <div style={{display:'flex',gap:8}}>
                <Btn variant="secondary" size="sm" onClick={()=>{setForm({months:3});setModal({type:'extendSub',data:l});}}>Extend</Btn>
                <Btn variant="secondary" size="sm" onClick={()=>{setForm({name:l.name,email:l.email,phone:l.phone,city:l.city,plan:l.plan,status:l.status,planExpiry:l.plan_expiry?.split('T')[0]});setModal({type:'editLL',data:l});}}>Edit</Btn>
              </div>
            </div>
          </div>
        );})}
      </Card>
    </div>
  );

  const renderActivity=()=>(
    <Card>
      <CardHead title="Activity Log"/>
      {[{t:'2m ago',m:'New landlord: Deepa Joshi (Chennai)',c:'landlord'},{t:'1h ago',m:'Tenant TN-2025-003 payment overdue',c:'alert'},{t:'3h ago',m:'Landlord LL003 suspended',c:'system'},{t:'Yesterday',m:'Tenant ID issued: TN-2025-004',c:'tenant'},{t:'2 days ago',m:'Contract uploaded for TN-2025-001',c:'system'},{t:'3 days ago',m:'Subscription extended for LL002',c:'system'}].map((a,i)=>(
      <div key={i} style={{display:'flex',gap:12,padding:'11px 0',borderBottom:'1px solid #F8FAFC'}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:a.c==='alert'?'#EF4444':a.c==='landlord'?'#3B82F6':a.c==='tenant'?'#10B981':'#94A3B8',flexShrink:0,marginTop:4}}/>
        <div><div style={{fontSize:13}}>{a.m}</div><div style={{fontSize:11,color:'#94A3B8',marginTop:2}}>{a.t}</div></div>
      </div>
    ))}
    </Card>
  );

  const pageMap={overview:renderOverview,landlords:renderLandlords,tenants:renderTenants,properties:renderProperties,subscriptions:renderSubscriptions,marketplace:()=><MarketplaceAdmin/>,activity:renderActivity};

  // ── Modals ─────────────────────────────────────────────────
  const renderModal=()=>{
    if(!modal) return null;
    const purpleBtn = <Btn style={{background:'#8B5CF6',color:'#fff',border:'none'}} onClick={modal.type==='editLL'?editLL:modal.type==='addLL'?addLL:modal.type==='extendSub'?extendSub:modal.type==='editTenant'?editTenant:modal.type==='editContract'?editContract:modal.type==='editProp'?editProp:addTenant} loading={saving}>{modal.type==='addLL'?'Create landlord':modal.type==='extendSub'?'Extend subscription':modal.type==='addTenant'?'Create Tenant ID':'Save changes'}</Btn>;

    if(modal.type==='editLL'||modal.type==='addLL') return(
      <Modal title={modal.type==='editLL'?`Edit landlord — ${modal.data?.id}`:'Add new landlord'} onClose={closeModal}>
        <Err/><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Input label="Full name *" value={form.name||''} onChange={e=>set('name',e.target.value)}/><Input label="Email *" type="email" value={form.email||''} onChange={e=>set('email',e.target.value)}/><Input label="Phone" value={form.phone||''} onChange={e=>set('phone',e.target.value)}/><Input label="City" value={form.city||''} onChange={e=>set('city',e.target.value)}/></div>
        <Select label="Plan" value={form.plan||'basic'} onChange={e=>set('plan',e.target.value)}><option value="basic">Basic (₹999/mo)</option><option value="pro">Pro (₹2,499/mo)</option></Select>
        {modal.type==='editLL'&&<><Select label="Status" value={form.status||'active'} onChange={e=>set('status',e.target.value)}><option value="active">Active</option><option value="suspended">Suspended</option></Select><Input label="Plan expiry" type="date" value={form.planExpiry||''} onChange={e=>set('planExpiry',e.target.value)}/></>}
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Cancel</Btn>{purpleBtn}</ModalActions>
      </Modal>
    );
    if(modal.type==='extendSub') return(
      <Modal title={`Extend — ${modal.data.name}`} onClose={closeModal}>
        <div style={{background:'#F8FAFC',borderRadius:12,padding:'14px 16px',marginBottom:16,display:'flex',justifyContent:'space-between'}}><div><div style={{fontSize:11,color:'#94A3B8'}}>Expiry</div><div style={{fontWeight:600}}>{modal.data.plan_expiry?new Date(modal.data.plan_expiry).toLocaleDateString('en-IN'):'—'}</div></div><div><div style={{fontSize:11,color:'#94A3B8'}}>Days left</div><div style={{fontWeight:600,color:daysUntil(modal.data.plan_expiry||'')<=7?'#B91C1C':'#0F172A'}}>{modal.data.plan_expiry?daysUntil(modal.data.plan_expiry):'—'}</div></div><div><div style={{fontSize:11,color:'#94A3B8'}}>Plan</div><Badge status={modal.data.plan}/></div></div>
        <Err/><Select label="Extend by" value={form.months||3} onChange={e=>set('months',parseInt(e.target.value))}><option value={1}>1 month</option><option value={3}>3 months</option><option value={6}>6 months</option><option value={12}>12 months</option></Select>
        <Input label="Or set exact new expiry" type="date" value={form.exactDate||''} onChange={e=>set('exactDate',e.target.value)}/>
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Cancel</Btn>{purpleBtn}</ModalActions>
      </Modal>
    );
    if(modal.type==='editTenant') return(
      <Modal title={`Edit tenant — ${modal.data.id}`} onClose={closeModal} width={520}>
        <Err/><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Input label="Full name" value={form.name||''} onChange={e=>set('name',e.target.value)}/><Input label="Email" type="email" value={form.email||''} onChange={e=>set('email',e.target.value)}/><Input label="Phone" value={form.phone||''} onChange={e=>set('phone',e.target.value)}/><Input label="Monthly rent" type="number" value={form.rent||''} onChange={e=>set('rent',e.target.value)}/><Input label="Lease start" type="date" value={form.leaseStart||''} onChange={e=>set('leaseStart',e.target.value)}/><Input label="Lease end" type="date" value={form.leaseEnd||''} onChange={e=>set('leaseEnd',e.target.value)}/></div>
        <Select label="Payment status" value={form.payStatus||'paid'} onChange={e=>set('payStatus',e.target.value)}><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="due-soon">Due soon</option></Select>
        <Select label="Assigned landlord" value={form.landlordId||''} onChange={e=>set('landlordId',e.target.value)}>{landlords.map(l=><option key={l.id} value={l.id}>{l.name} ({l.id})</option>)}</Select>
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Cancel</Btn>{purpleBtn}</ModalActions>
      </Modal>
    );
    if(modal.type==='editContract') return(
      <Modal title={`Contract — ${modal.data.name}`} onClose={closeModal}>
        <Err/><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Input label="Lease start" type="date" value={form.leaseStart||''} onChange={e=>set('leaseStart',e.target.value)}/><Input label="Lease end" type="date" value={form.leaseEnd||''} onChange={e=>set('leaseEnd',e.target.value)}/></div>
        <Input label="Monthly rent (₹)" type="number" value={form.rent||''} onChange={e=>set('rent',e.target.value)}/>
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Cancel</Btn>{purpleBtn}</ModalActions>
      </Modal>
    );
    if(modal.type==='uploadContract') return(
      <Modal title={`Upload contract — ${modal.data.name}`} onClose={closeModal}>
        <InfoBox type="info">Tenant can <strong>view</strong> but not download.</InfoBox><Err/>
        <label style={{display:'block',border:'2px dashed #CBD5E1',borderRadius:12,padding:'28px 20px',textAlign:'center',cursor:'pointer',background:'#F8FAFC',transition:'border-color 150ms'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#8B5CF6'} onMouseLeave={e=>e.currentTarget.style.borderColor='#CBD5E1'}>
          <div style={{fontSize:28,marginBottom:10}}>📎</div><div style={{fontSize:13,fontWeight:600,color:'#374151',marginBottom:4}}>Upload contract</div><div style={{fontSize:12,color:'#94A3B8'}}>PDF, JPG, PNG — max 10MB</div>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={e=>uploadContract(e,modal.data.id)}/>
        </label>
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Close</Btn></ModalActions>
      </Modal>
    );
    if(modal.type==='editProp') return(
      <Modal title={`Edit property — ${modal.data.id}`} onClose={closeModal}>
        <Err/><Input label="Property name" value={form.name||''} onChange={e=>set('name',e.target.value)}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Input label="City" value={form.city||''} onChange={e=>set('city',e.target.value)}/><Input label="Rent (₹)" type="number" value={form.rent||''} onChange={e=>set('rent',e.target.value)}/></div>
        <Input label="Address" value={form.address||''} onChange={e=>set('address',e.target.value)}/>
        <Select label="Status" value={form.status||'vacant'} onChange={e=>set('status',e.target.value)}><option value="vacant">Vacant</option><option value="occupied">Occupied</option></Select>
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Cancel</Btn>{purpleBtn}</ModalActions>
      </Modal>
    );
    if(modal.type==='addTenant') return(
      <Modal title="Create Tenant ID (Admin)" onClose={closeModal}>
        <InfoBox type="info">Temp password = Tenant ID. Tenant must change on first login.</InfoBox><Err/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Input label="Full name *" value={form.name||''} onChange={e=>set('name',e.target.value)}/><Input label="Email *" type="email" value={form.email||''} onChange={e=>set('email',e.target.value)}/><Input label="Phone" value={form.phone||''} onChange={e=>set('phone',e.target.value)}/><Select label="Assign landlord" value={form.landlordId||''} onChange={e=>set('landlordId',e.target.value)}><option value="">— Select —</option>{landlords.filter(l=>l.status==='active').map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</Select><Input label="Monthly rent (₹)" type="number" value={form.rent||''} onChange={e=>set('rent',e.target.value)}/><Input label="Lease end" type="date" value={form.leaseEnd||''} onChange={e=>set('leaseEnd',e.target.value)}/></div>
        <ModalActions><Btn variant="secondary" onClick={closeModal}>Cancel</Btn>{purpleBtn}</ModalActions>
      </Modal>
    );
    return null;
  };

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#F1F5F9'}}>
      <Sidebar/>
      <div style={{marginLeft:230,flex:1,display:'flex',flexDirection:'column'}}>
        <div style={{height:56,background:'#fff',borderBottom:'1px solid #E2E8F0',display:'flex',alignItems:'center',padding:'0 24px',gap:14,position:'sticky',top:0,zIndex:10,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
          <div style={{flex:1}}><h1 style={{fontSize:17,fontWeight:700,color:'#0F172A'}}>{titles[page]}</h1></div>
          {page==='landlords'&&<Btn style={{background:'#8B5CF6',color:'#fff',border:'none'}} size="sm" onClick={()=>{setForm({});setModal({type:'addLL'});}}>+ Add Landlord</Btn>}
          {page==='tenants'&&<Btn style={{background:'#8B5CF6',color:'#fff',border:'none'}} size="sm" onClick={()=>{setForm({});setModal({type:'addTenant'});}}>+ Create Tenant ID</Btn>}
          <LanguageSwitcher variant="light"/>
        </div>
        <div style={{padding:24}} className="page-enter">{pageMap[page]?.()}</div>
      </div>
      {renderModal()}
    </div>
  );
}
