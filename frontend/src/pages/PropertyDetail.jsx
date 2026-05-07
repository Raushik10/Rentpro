import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const publicFetch = async (path, opts) => {
  const res  = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed');
  return data;
};

// ── Stable input for enquiry form ─────────────────────────────────────────
function EnqInput({ label, value, onChange, placeholder, type = 'text', required }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }}>
        {label}{required && <span style={{ color:'#EF4444' }}> *</span>}
      </label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{ width:'100%', padding:'10px 13px', border:`1.5px solid ${f?'#3B82F6':'#E2E8F0'}`,
                 borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit',
                 background:'#fff', color:'#0F172A',
                 boxShadow:f?'0 0 0 3px rgba(59,130,246,.1)':'none',
                 transition:'all 150ms' }}/>
    </div>
  );
}

export default function PropertyDetail() {
  const { id } = useParams();
  const nav    = useNavigate();

  const [prop,     setProp]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [imgIdx,   setImgIdx]   = useState(0);
  const [showEnq,  setShowEnq]  = useState(false);
  const [submitted,setSubmitted]= useState(false);
  const [sending,  setSending]  = useState(false);
  const [enqErr,   setEnqErr]   = useState('');

  // Enquiry form state — separate vars (not object) to avoid 1-letter bug
  const [eName,    setEName]    = useState('');
  const [eEmail,   setEEmail]   = useState('');
  const [ePhone,   setEPhone]   = useState('');
  const [eDate,    setEDate]    = useState('');
  const [eMsg,     setEMsg]     = useState('');

  useEffect(() => {
    setLoading(true);
    publicFetch(`/api/marketplace/property/${id}`)
      .then(data => {
        setProp(data);
        // record view
        publicFetch(`/api/marketplace/property/${id}/view`, { method:'POST' }).catch(()=>{});
      })
      .catch(() => setProp(null))
      .finally(() => setLoading(false));
  }, [id]);

  const submitEnquiry = async () => {
    setEnqErr('');
    if (!eName.trim() || !eEmail.trim() || !ePhone.trim()) {
      setEnqErr('Name, email and phone are required');
      return;
    }
    if (!eEmail.includes('@')) { setEnqErr('Please enter a valid email'); return; }
    setSending(true);
    try {
      await publicFetch(`/api/marketplace/property/${id}/enquire`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ name:eName, email:eEmail, phone:ePhone, moveInDate:eDate||null, message:eMsg||null }),
      });
      setSubmitted(true);
    } catch (e) { setEnqErr(e.message); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#080D1A', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
      <div className="spinner" style={{ width:28, height:28 }}/>
      <span style={{ fontSize:14, color:'rgba(255,255,255,.35)' }}>Loading property…</span>
    </div>
  );

  if (!prop) return (
    <div style={{ minHeight:'100vh', background:'#080D1A', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
      <div style={{ fontSize:48 }}>🏠</div>
      <div style={{ fontSize:18, fontWeight:600, color:'rgba(255,255,255,.6)' }}>Property not found</div>
      <button onClick={() => nav('/marketplace')} style={{ marginTop:8, padding:'9px 20px', borderRadius:10, background:'#3B82F6', color:'#fff', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600 }}>← Back to marketplace</button>
    </div>
  );

  const images = prop.images || [];
  const amenities = prop.amenities ? prop.amenities.split(',').map(a => a.trim()).filter(Boolean) : [];

  return (
    <div style={{ minHeight:'100vh', background:'#F1F5F9' }}>
      {/* Top nav */}
      <div style={{ background:'#0A0F1E', borderBottom:'1px solid rgba(255,255,255,.06)', padding:'0 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', height:54, display:'flex', alignItems:'center', gap:14 }}>
          <button onClick={() => nav('/marketplace')}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'rgba(255,255,255,.5)', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, transition:'color 130ms' }}
            onMouseEnter={e=>e.currentTarget.style.color='#fff'}
            onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.5)'}>
            ← Back to listings
          </button>
          <div style={{ width:1, height:16, background:'rgba(255,255,255,.1)' }}/>
          <span style={{ fontSize:13, color:'rgba(255,255,255,.4)' }} className="truncate">{prop.name}</span>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:24, alignItems:'start' }}>

          {/* LEFT: images + details */}
          <div>
            {/* Image gallery */}
            <div style={{ borderRadius:16, overflow:'hidden', marginBottom:20, background:'#E2E8F0', position:'relative' }}>
              {images.length > 0 ? (
                <>
                  <img src={`${API}${images[imgIdx]}`} alt={prop.name}
                    style={{ width:'100%', height:380, objectFit:'cover', display:'block' }}/>
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setImgIdx(i => (i-1+images.length)%images.length)}
                        style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,.55)', border:'none', color:'#fff', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
                      <button onClick={() => setImgIdx(i => (i+1)%images.length)}
                        style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,.55)', border:'none', color:'#fff', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                      <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', display:'flex', gap:5 }}>
                        {images.map((_,i) => <div key={i} onClick={() => setImgIdx(i)} style={{ width:i===imgIdx?20:6, height:6, borderRadius:999, background:i===imgIdx?'#fff':'rgba(255,255,255,.5)', cursor:'pointer', transition:'all 200ms' }}/>)}
                      </div>
                    </>
                  )}
                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div style={{ display:'flex', gap:8, padding:'10px', background:'rgba(0,0,0,.3)', overflowX:'auto' }}>
                      {images.map((img,i) => (
                        <img key={i} src={`${API}${img}`} alt="" onClick={() => setImgIdx(i)}
                          style={{ width:60, height:45, objectFit:'cover', borderRadius:6, cursor:'pointer', flexShrink:0, border:i===imgIdx?'2px solid #3B82F6':'2px solid transparent', opacity:i===imgIdx?1:.65, transition:'all 150ms' }}/>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ width:'100%', height:320, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
                  <span style={{ fontSize:52 }}>🏠</span>
                  <span style={{ fontSize:14, color:'#94A3B8' }}>No photos uploaded</span>
                </div>
              )}
            </div>

            {/* Property info */}
            <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:16, padding:24, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <h1 style={{ fontSize:22, fontWeight:800, color:'#0F172A', marginBottom:6 }}>{prop.name}</h1>
                  <div style={{ fontSize:14, color:'#64748B', display:'flex', alignItems:'center', gap:5 }}>
                    <span>📍</span> {prop.address ? `${prop.address}, ` : ''}{prop.city}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:26, fontWeight:800, color:'#0F172A' }}>₹{Number(prop.rent).toLocaleString()}</div>
                  <div style={{ fontSize:12, color:'#94A3B8' }}>per month</div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
                {[
                  ['Type',        prop.property_type || '—',       '🏠'],
                  ['BHK',         prop.bhk || '—',                 '🛏'],
                  ['Rooms',       prop.total_rooms ? `${prop.total_rooms} rooms` : '—', '🚪'],
                  ['Floor',       prop.floor_details || '—',       '🏢'],
                  ['Furnishing',  prop.furnishing || '—',          '🪑'],
                  ['Area',        prop.area_sqft ? `${prop.area_sqft} sq ft` : '—', '📐'],
                  ['Facing',      prop.facing || '—',              '🧭'],
                  ['Parking',     prop.parking || '—',             '🚗'],
                  ['Max adults',  prop.max_adults ? `${prop.max_adults} adults` : '—', '👥'],
                  ['Available',   prop.available_from ? new Date(prop.available_from).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : 'Immediately', '📅'],
                  ['Security dep.',prop.security_deposit ? `₹${Number(prop.security_deposit).toLocaleString()}` : 'Contact admin', '🔒'],
                ].map(([l,v,ic]) => (
                  <div key={l} style={{ background:'#F8FAFC', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ fontSize:11, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>{ic} {l}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{v}</div>
                  </div>
                ))}
              </div>

              {amenities.length > 0 && (
                <>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:10 }}>Amenities</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
                    {amenities.map(a => (
                      <span key={a} style={{ padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:500, background:'#EFF6FF', color:'#1D4ED8', border:'1px solid #BFDBFE' }}>{a}</span>
                    ))}
                  </div>
                </>
              )}

              {prop.description && (
                <>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:8 }}>About this property</div>
                  <div style={{ fontSize:13, color:'#475569', lineHeight:1.7, marginBottom:20, background:'#F8FAFC', borderRadius:10, padding:'12px 14px' }}>{prop.description}</div>
                </>
              )}

              {prop.house_rules && (
                <>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:8 }}>House rules</div>
                  <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'12px 14px', marginBottom:20 }}>
                    {prop.house_rules.split('\n').map((rule,i)=>(
                      <div key={i} style={{ fontSize:13, color:'#92400E', display:'flex', alignItems:'flex-start', gap:6, marginBottom:i<prop.house_rules.split('\n').length-1?5:0 }}>
                        <span style={{ flexShrink:0 }}>•</span>{rule}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Views */}
            <div style={{ fontSize:12, color:'#94A3B8', textAlign:'right' }}>
              👁 {prop.view_count || 0} people have viewed this property
            </div>
          </div>

          {/* RIGHT: enquiry card */}
          <div style={{ position:'sticky', top:20 }}>
            <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:16, padding:24, boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}>
              {submitted ? (
                /* Success state */
                <div style={{ textAlign:'center', padding:'24px 0' }}>
                  <div style={{ width:56, height:56, background:'#D1FAE5', border:'1px solid #6EE7B7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:22 }}>✓</div>
                  <h3 style={{ fontSize:17, fontWeight:700, color:'#0F172A', marginBottom:8 }}>Enquiry submitted!</h3>
                  <p style={{ fontSize:13, color:'#64748B', lineHeight:1.65, marginBottom:20 }}>
                    Thank you, {eName.split(' ')[0]}! Our team will review your enquiry and get back to you at <strong>{eEmail}</strong> shortly.
                  </p>
                  <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'11px 14px', fontSize:12, color:'#92400E', marginBottom:16, textAlign:'left' }}>
                    <strong>What happens next?</strong>
                    <div style={{ marginTop:4, lineHeight:1.6 }}>Our admin will review your request and contact you with payment and move-in details. Once confirmed, you'll receive login credentials for your tenant dashboard.</div>
                  </div>
                  <button onClick={() => nav('/marketplace')} style={{ width:'100%', padding:'10px', borderRadius:10, background:'#F1F5F9', border:'1px solid #E2E8F0', cursor:'pointer', fontFamily:'inherit', fontSize:13, color:'#475569', fontWeight:600 }}>
                    ← Browse more properties
                  </button>
                </div>
              ) : !showEnq ? (
                /* CTA state */
                <>
                  <div style={{ marginBottom:18 }}>
                    <div style={{ fontSize:26, fontWeight:800, color:'#0F172A' }}>₹{Number(prop.rent).toLocaleString()}<span style={{ fontSize:14, fontWeight:500, color:'#94A3B8' }}>/month</span></div>
                    {prop.available_from && <div style={{ fontSize:13, color:'#059669', fontWeight:500, marginTop:4 }}>📅 Available from {new Date(prop.available_from).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>}
                  </div>
                  <button onClick={() => setShowEnq(true)}
                    style={{ width:'100%', padding:'13px', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', border:'none', background:'linear-gradient(135deg,#3B82F6,#2563EB)', color:'#fff', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(59,130,246,.35)', marginBottom:12, transition:'all 160ms' }}
                    onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
                    onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                    I'm interested →
                  </button>
                  <div style={{ fontSize:12, color:'#94A3B8', textAlign:'center', lineHeight:1.6 }}>
                    No account needed · Free to enquire · Admin handles the process
                  </div>
                  <div style={{ marginTop:16, padding:'12px 14px', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:10 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>How it works</div>
                    {['Submit your interest below','Admin reviews and contacts you','Confirm payment to secure the property','Receive tenant login credentials','Move in!'].map((s,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:5 }}>
                        <div style={{ width:18, height:18, borderRadius:'50%', background:'#EFF6FF', color:'#3B82F6', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>{i+1}</div>
                        <div style={{ fontSize:12, color:'#475569', lineHeight:1.4 }}>{s}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Enquiry form state */
                <>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                    <h3 style={{ fontSize:16, fontWeight:700, color:'#0F172A' }}>Express your interest</h3>
                    <button onClick={() => { setShowEnq(false); setEnqErr(''); }}
                      style={{ background:'#F1F5F9', border:'none', cursor:'pointer', width:28, height:28, borderRadius:8, color:'#64748B', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                  </div>
                  {enqErr && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'9px 12px', fontSize:13, color:'#B91C1C', marginBottom:14 }}>{enqErr}</div>}
                  <EnqInput label="Full name" value={eName} onChange={e=>setEName(e.target.value)} placeholder="Your full name" required/>
                  <EnqInput label="Email" value={eEmail} onChange={e=>setEEmail(e.target.value)} placeholder="you@example.com" type="email" required/>
                  <EnqInput label="Phone" value={ePhone} onChange={e=>setEPhone(e.target.value)} placeholder="+91 9XXXXXXXXX" required/>
                  <EnqInput label="Preferred move-in date" value={eDate} onChange={e=>setEDate(e.target.value)} type="date"/>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }}>Message <span style={{ color:'#94A3B8', fontWeight:400 }}>(optional)</span></label>
                    <textarea value={eMsg} onChange={e=>setEMsg(e.target.value)} placeholder="Anything you'd like us to know…" rows={3}
                      style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', color:'#0F172A', resize:'vertical' }}/>
                  </div>
                  <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'9px 12px', fontSize:12, color:'#92400E', marginBottom:14 }}>
                    Your details will only be shared with our admin team — not with the landlord directly.
                  </div>
                  <button onClick={submitEnquiry} disabled={sending}
                    style={{ width:'100%', padding:'12px', borderRadius:12, fontSize:14, fontWeight:700, cursor:sending?'not-allowed':'pointer', border:'none', background:'linear-gradient(135deg,#3B82F6,#2563EB)', color:'#fff', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(59,130,246,.3)', opacity:sending?.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    {sending ? <span className="spinner" style={{ width:16, height:16 }}/> : 'Submit enquiry →'}
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
