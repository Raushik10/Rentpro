import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n';


const API = process.env.REACT_APP_API_URL ;
const publicFetch = async (path) => {
  const res  = await fetch(`${API}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed');
  return data;
};

function TypeBadge({ type }) {
  if (!type) return null;
  return <span style={{ display:'inline-flex', padding:'2px 9px', borderRadius:999, fontSize:11, fontWeight:600, background:'rgba(59,130,246,.12)', color:'#3B82F6', border:'1px solid rgba(59,130,246,.2)' }}>{type}</span>;
}

function AmenityChips({ amenities, max = 4 }) {
  if (!amenities) return null;
  const list = amenities.split(',').map(a => a.trim()).filter(Boolean).slice(0, max);
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:8 }}>
      {list.map(a => <span key={a} style={{ fontSize:11, background:'#F1F5F9', color:'#475569', padding:'2px 8px', borderRadius:6, border:'1px solid #E2E8F0' }}>{a}</span>)}
    </div>
  );
}

function PropCard({ p, onClick }) {
  const [hov, setHov] = useState(false);
  const t = useT();
  const img = p.images?.[0];
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'#fff', border:`1.5px solid ${hov?'#3B82F6':'#E2E8F0'}`, borderRadius:16,
               overflow:'hidden', cursor:'pointer', transition:'all 200ms ease',
               transform:hov?'translateY(-4px)':'none',
               boxShadow:hov?'0 12px 32px rgba(59,130,246,.15)':'0 2px 8px rgba(0,0,0,.06)' }}>
      <div style={{ height:190, background:'#F1F5F9', position:'relative', overflow:'hidden' }}>
        {img
          ? <img src={`${API}${img}`} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 300ms', transform:hov?'scale(1.04)':'scale(1)' }}/>
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
              <span style={{ fontSize:40 }}>🏠</span>
              <span style={{ fontSize:12, color:'#94A3B8' }}>No photos yet</span>
            </div>
        }
        <div style={{ position:'absolute', bottom:10, left:10, background:'rgba(15,23,42,.85)', backdropFilter:'blur(6px)', borderRadius:8, padding:'5px 11px', fontSize:14, fontWeight:700, color:'#fff' }}>
          ₹{Number(p.rent).toLocaleString()}<span style={{ fontSize:11, fontWeight:400 }}>/mo</span>
        </div>
        {p.images?.length > 1 && <div style={{ position:'absolute', bottom:10, right:10, background:'rgba(15,23,42,.65)', borderRadius:6, padding:'3px 8px', fontSize:11, color:'rgba(255,255,255,.8)' }}>📷 {p.images.length}</div>}
      </div>
      <div style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:4 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#0F172A', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
          <TypeBadge type={p.property_type}/>
        </div>
        {/* Key specs row — BHK, rooms, adults */}
        <div style={{ display:'flex', gap:8, marginBottom:6, flexWrap:'wrap' }}>
          {p.bhk && <span style={{ fontSize:11, background:'#EFF6FF', color:'#1D4ED8', padding:'2px 7px', borderRadius:6, fontWeight:600 }}>{p.bhk}</span>}
          {p.total_rooms && <span style={{ fontSize:11, background:'#F1F5F9', color:'#475569', padding:'2px 7px', borderRadius:6 }}>🛏 {p.total_rooms} rooms</span>}
          {p.max_adults && <span style={{ fontSize:11, background:'#F1F5F9', color:'#475569', padding:'2px 7px', borderRadius:6 }}>👥 Max {p.max_adults} adults</span>}
        </div>
        <div style={{ fontSize:12, color:'#64748B', marginBottom:3 }}>📍 {p.city}{p.address?`, ${p.address.split(',')[0]}`:''}</div>
        {p.floor_details && <div style={{ fontSize:12, color:'#64748B', marginBottom:3 }}>🏢 {p.floor_details}</div>}
        {p.available_from && <div style={{ fontSize:12, color:'#059669', fontWeight:500 }}>📅 Available {new Date(p.available_from).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>}
        <AmenityChips amenities={p.amenities}/>
        <div style={{ marginTop:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:11, color:'#94A3B8' }}>👁 {p.view_count||0} views</span>
          <span style={{ fontSize:12, fontWeight:600, color:'#3B82F6' }}>{t('viewDetails')}</span>
        </div>
      </div>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  const [f, setF] = useState(false);
  return (
    <input value={value} onChange={onChange} placeholder={placeholder}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{ flex:1, padding:'10px 14px', border:`1.5px solid ${f?'#3B82F6':'rgba(255,255,255,.15)'}`,
               borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit',
               background:'rgba(255,255,255,.08)', color:'#fff', caretColor:'#fff',
               transition:'all 150ms',
               boxShadow:f?'0 0 0 3px rgba(59,130,246,.2)':'none' }}/>
  );
}

export default function Marketplace() {
  const nav = useNavigate();
  const t   = useT();
  const [listings, setListings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [city,     setCity]     = useState('');
  const [type,     setType]     = useState('');
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => {
    setMounted(true);
    publicFetch('/api/marketplace')
      .then(d => { setListings(d); setFiltered(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let r = listings;
    if (city.trim()) r = r.filter(p => p.city?.toLowerCase().includes(city.toLowerCase()));
    if (type)        r = r.filter(p => p.property_type === type);
    setFiltered(r);
  }, [city, type, listings]);

  const types = [...new Set(listings.map(p => p.property_type).filter(Boolean))];
  const DEFAULT_TYPES = ['1BHK','2BHK','3BHK','Villa','Studio','Duplex'];

  return (
    <div style={{ minHeight:'100vh', background:'#080D1A' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, backgroundImage:'linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)', backgroundSize:'52px 52px' }}/>
      <div style={{ position:'fixed', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,.1) 0%,transparent 70%)', top:-80, right:-60, pointerEvents:'none', zIndex:0 }}/>

      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:20, background:'rgba(8,13,26,.92)', backdropFilter:'blur(14px)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px' }}>
          <button onClick={() => nav('/')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:13 }}>RP</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>RentPro</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>Property Marketplace</div>
            </div>
          </button>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => nav('/auth/tenant')}
              style={{ fontSize:12, color:'rgba(255,255,255,.5)', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontFamily:'inherit', transition:'all 150ms' }}
              onMouseEnter={e=>{e.currentTarget.style.color='#fff';e.currentTarget.style.background='rgba(255,255,255,.1)';}}
              onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,.5)';e.currentTarget.style.background='rgba(255,255,255,.06)';}}>
              Tenant login
            </button>
            <button onClick={() => nav('/auth/landlord')}
              style={{ fontSize:12, color:'#fff', background:'linear-gradient(135deg,#3B82F6,#2563EB)', border:'none', borderRadius:8, padding:'7px 16px', cursor:'pointer', fontFamily:'inherit', fontWeight:600, boxShadow:'0 4px 14px rgba(59,130,246,.3)' }}>
              List your property →
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ position:'relative', zIndex:1, textAlign:'center', padding:'56px 24px 36px', opacity:mounted?1:0, transform:mounted?'none':'translateY(16px)', transition:'all 500ms ease' }}>
        <h1 style={{ fontSize:44, fontWeight:800, letterSpacing:-.8, lineHeight:1.12, marginBottom:14, background:'linear-gradient(135deg,#fff 30%,rgba(255,255,255,.5) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          {t('findYourNextHome')}
        </h1>
        <p style={{ fontSize:15, color:'rgba(255,255,255,.4)', maxWidth:420, margin:'0 auto 32px', lineHeight:1.75 }}>
          Browse verified properties listed by landlords. No middlemen, no hidden fees.
        </p>
        {/* Filters */}
        <div style={{ display:'flex', gap:10, maxWidth:560, margin:'0 auto', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:10 }}>
          <SearchInput value={city} onChange={e=>setCity(e.target.value)} placeholder="{t('searchCity')}"/>
          <select value={type} onChange={e=>setType(e.target.value)}
            style={{ padding:'10px 12px', background:'rgba(255,255,255,.06)', border:'1.5px solid rgba(255,255,255,.12)', borderRadius:10, fontSize:13, color:type?'#fff':'rgba(255,255,255,.45)', fontFamily:'inherit', outline:'none', cursor:'pointer', minWidth:130 }}>
            <option value="">{ t('allTypes')}</option>
            {(types.length ? types : DEFAULT_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding:'0 24px 72px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <span style={{ fontSize:14, color:'rgba(255,255,255,.4)' }}>
            {loading ? 'Loading properties…' : `${filtered.length} propert${filtered.length===1?'y':'ies'} available`}
          </span>
          {(city||type) && <button onClick={()=>{setCity('');setType('');}} style={{ fontSize:12, color:'#60A5FA', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Clear filters ✕</button>}
        </div>

        {loading && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background:'rgba(255,255,255,.04)', borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,.06)' }}>
                <div className="skeleton" style={{ height:190 }}/>
                <div style={{ padding:14 }}>
                  <div className="skeleton" style={{ height:16, width:'65%', marginBottom:8 }}/>
                  <div className="skeleton" style={{ height:12, width:'45%', marginBottom:6 }}/>
                  <div className="skeleton" style={{ height:12, width:'55%' }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🏠</div>
            <div style={{ fontSize:18, fontWeight:600, color:'rgba(255,255,255,.6)', marginBottom:8 }}>
              {listings.length === 0 ? t('noProperties') : 'No properties match your search'}
            </div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,.3)' }}>
              {listings.length === 0 ? 'Landlords will list properties here soon.' : 'Try a different city or type.'}
            </div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
            {filtered.map(p => <PropCard key={p.id} p={p} onClick={() => nav(`/marketplace/${p.id}`)}/>)}
          </div>
        )}
      </div>
    </div>
  );
}
