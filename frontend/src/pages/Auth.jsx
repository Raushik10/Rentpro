import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../api';
import { PasswordStrength } from '../components/UI';
import { useT } from '../i18n';

const ROLE = {
  landlord: { gradient:'linear-gradient(160deg,#0D1B3E 0%,#1E3A8A 50%,#1D4ED8 100%)', accent:'#3B82F6', accentGlow:'rgba(59,130,246,.4)', label:'Landlord portal', title:'Welcome back,\nLandlord', desc:'Sign in to manage your properties, track rent and monitor your tenants.', features:['Add & manage properties','Issue and track tenant IDs','Payment reminders automated'], fcolor:'#60A5FA' },
  tenant:   { gradient:'linear-gradient(160deg,#052E16 0%,#064E3B 50%,#059669 100%)', accent:'#10B981', accentGlow:'rgba(16,185,129,.4)',   label:'Tenant portal',   title:'Welcome back,\nTenant',   desc:'Sign in to view your rent status, pay online and access your lease.',           features:['Pay rent via UPI / NEFT','View lease & contract','Payment history'],           fcolor:'#34D399' },
  admin:    { gradient:'linear-gradient(160deg,#1E1B4B 0%,#312E81 50%,#4F46E5 100%)', accent:'#8B5CF6', accentGlow:'rgba(139,92,246,.4)',  label:'Admin portal',    title:'Platform\nAdministration', desc:'Authorised personnel only. All access is monitored and logged.',               features:['Full platform control','Subscription tracking','Modify any record'],            fcolor:'#A78BFA' },
};

// ── Stable inputs OUTSIDE component ───────────────────────────────────────
function DInput({ label, accent='#3B82F6', type='text', value, onChange, placeholder, maxLength, style={} }) {
  const [focused, setFocused] = useState(false);
  const [shown,   setShown]   = useState(false);
  const isPwd = type === 'password';
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,.5)', display:'block', marginBottom:5 }}>{label}</label>}
      <div style={{ position:'relative' }}>
        <input type={isPwd?(shown?'text':'password'):type} value={value} onChange={onChange}
          placeholder={placeholder} maxLength={maxLength}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{ width:'100%', padding:isPwd?'10px 42px 10px 13px':'10px 13px', fontSize:13,
                   outline:'none', fontFamily:'inherit', borderRadius:10,
                   background:'rgba(255,255,255,.06)',
                   border:`1.5px solid ${focused?accent:'rgba(255,255,255,.1)'}`,
                   color:'#fff', caretColor:'#fff',
                   boxShadow:focused?`0 0 0 3px ${accent}25`:'none',
                   transition:'all 150ms', ...style }}/>
        {isPwd && (
          <button type="button" onClick={()=>setShown(s=>!s)}
            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                     background:'none', border:'none', cursor:'pointer',
                     color:'rgba(255,255,255,.4)', fontSize:14, padding:0,
                     display:'flex', alignItems:'center' }}>
            {shown ? '🙈' : '👁'}
          </button>
        )}
      </div>
    </div>
  );
}

function DSelect({ label, value, onChange, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,.5)', display:'block', marginBottom:5 }}>{label}</label>}
      <select value={value} onChange={onChange}
        style={{ width:'100%', padding:'10px 13px', fontSize:13, outline:'none', fontFamily:'inherit',
                 borderRadius:10, background:'rgba(255,255,255,.06)',
                 border:'1.5px solid rgba(255,255,255,.1)', color:'#fff', cursor:'pointer' }}>
        {children}
      </select>
    </div>
  );
}

function StepDots({ cur, tot, accent }) {
  return (
    <div style={{ display:'flex', gap:5, marginBottom:20 }}>
      {Array(tot).fill(null).map((_,i)=>(
        <div key={i} style={{ height:4, borderRadius:999, transition:'all 200ms',
                              width:i+1===cur?22:6,
                              background:i+1<=cur?accent:'rgba(255,255,255,.12)' }}/>
      ))}
    </div>
  );
}

function AuthBtn({ color, label, onClick, loading }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={loading}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ width:'100%', padding:'12px', borderRadius:12, fontSize:14, fontWeight:700,
               cursor:loading?'not-allowed':'pointer', border:`1.5px solid ${color}44`,
               background:`linear-gradient(135deg,${color},${color}cc)`, color:'#fff',
               fontFamily:'inherit', boxShadow:hov?`0 8px 28px ${color}55`:`0 4px 20px ${color}44`,
               transition:'all 160ms', opacity:loading?.7:1,
               transform:hov&&!loading?'translateY(-1px)':'none',
               display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
      {loading?<span className="spinner" style={{ width:16, height:16 }}/>:`${label} →`}
    </button>
  );
}

function ErrBanner({ error }) {
  if (!error) return null;
  return (
    <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)',
                  borderRadius:10, padding:'10px 14px', fontSize:13, color:'#FCA5A5',
                  marginBottom:16, display:'flex', alignItems:'flex-start', gap:8 }}>
      <span style={{ flexShrink:0 }}>⚠</span> {error}
    </div>
  );
}

function LoginToggle({ role, loginMode, setLoginMode, onReset }) {
  const idLabel = role==='tenant' ? 'Tenant ID' : 'Landlord ID';
  return (
    <div style={{ display:'flex', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:3, marginBottom:20 }}>
      {[['email','Email'],['id',idLabel]].map(([m,l])=>(
        <button key={m} onClick={()=>{ setLoginMode(m); onReset(); }}
          style={{ flex:1, padding:'7px 10px', borderRadius:8, fontSize:12, cursor:'pointer',
                   fontFamily:'inherit', border:'none', transition:'all 150ms',
                   background:loginMode===m?'rgba(255,255,255,.12)':'transparent',
                   color:loginMode===m?'#fff':'rgba(255,255,255,.4)',
                   fontWeight:loginMode===m?600:400 }}>
          {l}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function Auth() {
  const { role } = useParams();
  const nav = useNavigate();
  const { login } = useAuth();
  const cfg = ROLE[role] || ROLE.landlord;
  const t = useT();

  const [tab,       setTab]      = useState('signin');
  const [step,      setStep]     = useState(1);
  const [loginMode, setLoginMode] = useState('email');
  const [loading,   setLoading]  = useState(false);
  const [apiErr,    setApiErr]   = useState('');
  const [regDone,   setRegDone]  = useState(null);
  const [mounted,   setMounted]  = useState(false);

  // Sign-in fields
  const [email,    setEmail]    = useState('');
  const [loginId,  setLoginId]  = useState('');
  const [password, setPassword] = useState('');
  const [otp,      setOtp]      = useState('');

  // Register fields
  const [rName,  setRName]  = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rCity,  setRCity]  = useState('');
  const [rPlan,  setRPlan]  = useState('basic');
  const [rPwd,   setRPwd]   = useState('');
  const [rPwd2,  setRPwd2]  = useState('');
  const [rTerms, setRTerms] = useState(false);

  useEffect(() => { const t=setTimeout(()=>setMounted(true),60); return ()=>clearTimeout(t); }, []);

  const resetLogin = () => { setEmail(''); setLoginId(''); setPassword(''); setApiErr(''); };

  const doLogin = async () => {
    setApiErr(''); setLoading(true);
    try {
      const body = { password, expectedRole:role };
      if (loginMode==='email')      body.email      = email;
      else if (role==='tenant')     body.tenantId   = loginId;
      else                          body.landlordId = loginId;
      const res = await api('/api/auth/login',{ method:'POST', body:JSON.stringify(body) });
      login(res.token, { ...res, email:email||'' });
      nav(`/${res.role}`);
    } catch(e){ setApiErr(e.message); }
    finally { setLoading(false); }
  };

  const doRegister = async () => {
    setApiErr(''); setLoading(true);
    try {
      const res = await api('/api/auth/register',{ method:'POST', body:JSON.stringify({ name:rName, email:rEmail, password:rPwd, phone:rPhone, city:rCity, plan:rPlan }) });
      setRegDone(res);
      let cd=3;
      const t=setInterval(()=>{ cd--; const el=document.getElementById('reg-cd'); if(el) el.textContent=cd; if(cd<=0){clearInterval(t);setRegDone(null);setTab('signin');setStep(1);} },1000);
    } catch(e){ setApiErr(e.message); }
    finally { setLoading(false); }
  };

  if (regDone) return (
    <div style={{ minHeight:'100vh', background:'#080D1A', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#111827', border:'1px solid rgba(255,255,255,.1)', borderRadius:20, padding:'40px 36px', width:420, textAlign:'center', boxShadow:'0 32px 64px rgba(0,0,0,.5)' }}>
        <div style={{ width:60, height:60, background:'rgba(16,185,129,.15)', border:'1px solid rgba(16,185,129,.3)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:24 }}>✓</div>
        <h2 style={{ fontSize:22, fontWeight:700, color:'#fff', marginBottom:8 }}>Account Created!</h2>
        <p style={{ fontSize:14, color:'rgba(255,255,255,.45)', marginBottom:22 }}>Welcome, {rName.split(' ')[0]}!</p>
        <div style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:12, padding:'16px 20px', marginBottom:18, textAlign:'left' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>Your Landlord ID</div>
          <div style={{ fontFamily:'ui-monospace,monospace', fontSize:26, fontWeight:800, color:cfg.accent, letterSpacing:2 }}>{regDone.landlordId}</div>
        </div>
        <p style={{ fontSize:13, color:'rgba(255,255,255,.3)' }}>Redirecting in <strong id="reg-cd" style={{ color:'#fff' }}>3</strong>s…</p>
      </div>
    </div>
  );

  const LeftPanel = () => (
    <div style={{ width:400, flexShrink:0, background:cfg.gradient, display:'flex', flexDirection:'column', padding:40, position:'relative', overflow:'hidden', opacity:mounted?1:0, transform:mounted?'none':'translateX(-20px)', transition:'opacity 400ms ease, transform 400ms ease' }}>
      {[[220,220,-40,-50],[140,140,null,60,-40],[80,80,200,null,60]].map(([w,h,top,left,right],i)=>(
        <div key={i} style={{ position:'absolute', width:w, height:h, borderRadius:'50%', border:'1px solid rgba(255,255,255,.1)', top:top??undefined, bottom:i===2?60:undefined, left:left??undefined, right:right??undefined, pointerEvents:'none' }}/>
      ))}
      <div style={{ display:'flex', alignItems:'center', gap:10, position:'relative', zIndex:1, marginBottom:'auto' }}>
        <div style={{ width:36, height:36, background:'rgba(255,255,255,.15)', borderRadius:10, border:'1px solid rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14 }}>RP</div>
        <div><div style={{ color:'#fff', fontSize:15, fontWeight:700 }}>RentPro</div><div style={{ color:'rgba(255,255,255,.45)', fontSize:11 }}>{cfg.label}</div></div>
      </div>
      <div style={{ position:'relative', zIndex:1, marginBottom:32 }}>
        <h2 style={{ color:'#fff', fontSize:28, fontWeight:800, lineHeight:1.25, marginBottom:14, letterSpacing:-.5, whiteSpace:'pre-line' }}>{cfg.title}</h2>
        <p style={{ color:'rgba(255,255,255,.5)', fontSize:13, lineHeight:1.7 }}>{cfg.desc}</p>
      </div>
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap:8 }}>
        {cfg.features.map(f=>(
          <div key={f} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'rgba(255,255,255,.07)', borderRadius:10, border:'1px solid rgba(255,255,255,.07)' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:cfg.fcolor, flexShrink:0 }}/>
            <span style={{ color:'rgba(255,255,255,.7)', fontSize:12 }}>{f}</span>
          </div>
        ))}
      </div>
      <button onClick={()=>nav('/')} style={{ marginTop:28, position:'relative', zIndex:1, background:'none', border:'none', cursor:'pointer', fontSize:12, color:'rgba(255,255,255,.35)', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5, padding:0 }}>← Back to home</button>
    </div>
  );

  const TabBar = (tabs) => (
    <div style={{ display:'flex', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:3, marginBottom:28 }}>
      {tabs.map(([val,label])=>(
        <button key={val} onClick={()=>{ setTab(val); setStep(1); setApiErr(''); resetLogin(); }}
          style={{ flex:1, padding:'8px 12px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit', border:'none', transition:'all 150ms',
                   background:tab===val?'rgba(255,255,255,.1)':'transparent',
                   color:tab===val?'#fff':'rgba(255,255,255,.4)', fontWeight:tab===val?600:400 }}>
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#080D1A' }}>
      <LeftPanel/>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 32px', background:'#0D1424', opacity:mounted?1:0, transform:mounted?'none':'translateY(16px)', transition:'opacity 440ms ease 100ms, transform 440ms ease 100ms' }}>
        <div style={{ width:'100%', maxWidth:400 }}>

          {/* LANDLORD */}
          {role==='landlord' && (<>
            {TabBar([['signin',t('signIn')],['register',t('register')]])}
            {tab==='signin' && (<>
              <h1 style={{ fontSize:22, fontWeight:700, color:'#fff', marginBottom:4 }}>Landlord sign in</h1>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.4)', marginBottom:24 }}>Landlord accounts only — use the correct portal</p>
              <LoginToggle role={role} loginMode={loginMode} setLoginMode={setLoginMode} onReset={resetLogin}/>
              <ErrBanner error={apiErr}/>
              {loginMode==='email'
                ? <DInput label="Email address" type="email" value={email} onChange={e=>{setEmail(e.target.value);setApiErr('');}} placeholder="you@example.com" accent={cfg.accent}/>
                : <DInput label="Landlord ID" value={loginId} onChange={e=>{setLoginId(e.target.value);setApiErr('');}} placeholder="LL001" style={{ fontFamily:'ui-monospace,monospace',letterSpacing:1 }} accent={cfg.accent}/>
              }
              <DInput label="Password" type="password" value={password} onChange={e=>{setPassword(e.target.value);setApiErr('');}} placeholder="Your password" accent={cfg.accent}/>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:22 }}>
                <button style={{ background:'none', border:'none', fontSize:12, color:cfg.accent, cursor:'pointer', fontFamily:'inherit' }}>Forgot password?</button>
              </div>
              <AuthBtn color={cfg.accent} label="Sign in to dashboard" onClick={doLogin} loading={loading}/>
              <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,.3)', marginTop:18 }}>
                No account? <span style={{ color:cfg.accent, cursor:'pointer', fontWeight:600 }} onClick={()=>{setTab('register');setStep(1);setApiErr('');}}>Register as landlord</span>
              </p>
            </>)}
            {tab==='register' && step===1 && (<>
              <StepDots cur={1} tot={3} accent={cfg.accent}/>
              <h1 style={{ fontSize:22, fontWeight:700, color:'#fff', marginBottom:4 }}>Create your account</h1>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.4)', marginBottom:22 }}>Step 1 of 3 — Basic information</p>
              <ErrBanner error={apiErr}/>
              <DInput label="Full name *" value={rName} onChange={e=>{setRName(e.target.value);setApiErr('');}} placeholder="Your full name" accent={cfg.accent}/>
              <DInput label="Email address *" type="email" value={rEmail} onChange={e=>{setREmail(e.target.value);setApiErr('');}} placeholder="you@example.com" accent={cfg.accent}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <DInput label="Phone" value={rPhone} onChange={e=>setRPhone(e.target.value)} placeholder="+91 98XXXXXXXX" accent={cfg.accent}/>
                <DInput label="City" value={rCity} onChange={e=>setRCity(e.target.value)} placeholder="Mumbai" accent={cfg.accent}/>
              </div>
              <AuthBtn color={cfg.accent} label="Continue" onClick={()=>{ if(!rName.trim()){setApiErr('Name is required');return;} if(!rEmail.includes('@')){setApiErr('Valid email required');return;} setApiErr('');setStep(2); }} loading={false}/>
              <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,.3)', marginTop:16 }}>Have an account? <span style={{ color:cfg.accent, cursor:'pointer', fontWeight:600 }} onClick={()=>{setTab('signin');setApiErr('');}}>Sign in</span></p>
            </>)}
            {tab==='register' && step===2 && (<>
              <button onClick={()=>setStep(1)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'rgba(255,255,255,.4)', fontFamily:'inherit', padding:0, marginBottom:16, display:'flex', alignItems:'center', gap:4 }}>← Back</button>
              <StepDots cur={2} tot={3} accent={cfg.accent}/>
              <h1 style={{ fontSize:22, fontWeight:700, color:'#fff', marginBottom:4 }}>Choose your plan</h1>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.4)', marginBottom:20 }}>Step 2 of 3 — 30-day free trial included</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                {[['basic','Basic','₹999','/mo','Up to 2 properties','#3B82F6'],['pro','Pro','₹2,499','/mo','Unlimited properties','#8B5CF6']].map(([v,l,p,u,d,c])=>(
                  <div key={v} onClick={()=>setRPlan(v)} style={{ border:`${rPlan===v?'2px solid '+c:'1px solid rgba(255,255,255,.1)'}`, borderRadius:14, padding:16, cursor:'pointer', transition:'all 150ms', background:rPlan===v?`${c}18`:'rgba(255,255,255,.03)' }}>
                    <div style={{ fontWeight:700, fontSize:14, color:'#fff', marginBottom:4 }}>{l}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:c }}>{p}<span style={{ fontSize:12, fontWeight:500, color:'rgba(255,255,255,.3)' }}>{u}</span></div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:4 }}>{d}</div>
                  </div>
                ))}
              </div>
              <AuthBtn color={cfg.accent} label="Continue" onClick={()=>setStep(3)} loading={false}/>
            </>)}
            {tab==='register' && step===3 && (<>
              <button onClick={()=>setStep(2)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'rgba(255,255,255,.4)', fontFamily:'inherit', padding:0, marginBottom:16, display:'flex', alignItems:'center', gap:4 }}>← Back</button>
              <StepDots cur={3} tot={3} accent={cfg.accent}/>
              <h1 style={{ fontSize:22, fontWeight:700, color:'#fff', marginBottom:4 }}>Set your password</h1>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.4)', marginBottom:14 }}>Step 3 of 3 — Almost done!</p>
              <div style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:'10px 14px', marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:'rgba(255,255,255,.5)' }}>{rName} · {rEmail}</span>
                <span style={{ background:`${cfg.accent}22`, color:cfg.accent, padding:'2px 9px', borderRadius:999, fontSize:11, fontWeight:600 }}>Landlord</span>
              </div>
              <ErrBanner error={apiErr}/>
              <DInput label="Password (min 8 characters)" type="password" value={rPwd} onChange={e=>{setRPwd(e.target.value);setApiErr('');}} placeholder="Choose a strong password" accent={cfg.accent}/>
              {rPwd && <PasswordStrength value={rPwd}/>}
              <div style={{ marginTop:8 }}>
                <DInput label="Confirm password" type="password" value={rPwd2} onChange={e=>{setRPwd2(e.target.value);setApiErr('');}} placeholder="Repeat your password" accent={cfg.accent}/>
              </div>
              <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:20 }}>
                <input type="checkbox" id="terms" checked={rTerms} onChange={e=>setRTerms(e.target.checked)} style={{ marginTop:3, accentColor:cfg.accent }}/>
                <label htmlFor="terms" style={{ fontSize:12, color:'rgba(255,255,255,.4)', cursor:'pointer' }}>I agree to the Terms of Service and Privacy Policy</label>
              </div>
              <AuthBtn color={cfg.accent} label="Create account" onClick={()=>{ if(!rPwd||rPwd.length<8){setApiErr('Password must be at least 8 characters');return;} if(rPwd!==rPwd2){setApiErr('Passwords do not match');return;} if(!rTerms){setApiErr('Please accept the terms');return;} doRegister(); }} loading={loading}/>
            </>)}
          </>)}

          {/* TENANT */}
          {role==='tenant' && (<>
            {TabBar([['signin',t('signIn')],['howto','How it works']])}
            {tab==='signin' && (<>
              <h1 style={{ fontSize:22, fontWeight:700, color:'#fff', marginBottom:4 }}>Tenant sign in</h1>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.4)', marginBottom:24 }}>Tenant accounts only — use the correct portal</p>
              <LoginToggle role={role} loginMode={loginMode} setLoginMode={setLoginMode} onReset={resetLogin}/>
              <ErrBanner error={apiErr}/>
              {loginMode==='email'
                ? <DInput label="Email address" type="email" value={email} onChange={e=>{setEmail(e.target.value);setApiErr('');}} placeholder="you@example.com" accent={cfg.accent}/>
                : <DInput label="Tenant ID" value={loginId} onChange={e=>{setLoginId(e.target.value);setApiErr('');}} placeholder="TN-2025-001" style={{ fontFamily:'ui-monospace,monospace',letterSpacing:.5 }} accent={cfg.accent}/>
              }
              <DInput label="Password" type="password" value={password} onChange={e=>{setPassword(e.target.value);setApiErr('');}} placeholder="Enter your password" accent={cfg.accent}/>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:22 }}>
                <button style={{ background:'none', border:'none', fontSize:12, color:cfg.accent, cursor:'pointer', fontFamily:'inherit' }}>Forgot password?</button>
              </div>
              <AuthBtn color={cfg.accent} label="Sign in to portal" onClick={doLogin} loading={loading}/>
              <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,.3)', marginTop:18 }}>No Tenant ID? <span style={{ color:cfg.accent, cursor:'pointer', fontWeight:600 }} onClick={()=>setTab('howto')}>See how it works</span></p>
            </>)}
            {tab==='howto' && (<>
              <h1 style={{ fontSize:22, fontWeight:700, color:'#fff', marginBottom:14 }}>How tenant accounts work</h1>
              <div style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.25)', borderRadius:10, padding:'11px 14px', fontSize:13, color:'#FCD34D', marginBottom:18 }}><strong>Tenant accounts are created by your landlord.</strong> You cannot self-register.</div>
              {['Your landlord registers on RentPro','They add your property and issue you a Tenant ID','You receive your Tenant ID and a temporary password','Sign in with your Tenant ID and set your own password on first login','Access your rent status, pay online and view your lease'].map((s,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(16,185,129,.15)', color:'#34D399', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,.5)', lineHeight:1.55, paddingTop:3 }}>{s}</div>
                </div>
              ))}
              <AuthBtn color={cfg.accent} label="Go to sign in" onClick={()=>setTab('signin')} loading={false}/>
            </>)}
          </>)}

          {/* ADMIN */}
          {role==='admin' && (<>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(139,92,246,.12)', border:'1px solid rgba(139,92,246,.3)', borderRadius:999, padding:'4px 12px', fontSize:11, fontWeight:600, color:'#A78BFA', marginBottom:24 }}>🔒 Restricted access</div>
            <h1 style={{ fontSize:22, fontWeight:700, color:'#fff', marginBottom:4 }}>Admin sign in</h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.4)', marginBottom:22 }}>Authorised platform administrators only</p>
            <div style={{ background:'rgba(139,92,246,.08)', border:'1px solid rgba(139,92,246,.2)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#C4B5FD', marginBottom:18 }}>Admin accounts are created internally. Contact your platform owner for access.</div>
            <ErrBanner error={apiErr}/>
            <DInput label="Admin email" type="email" value={email} onChange={e=>{setEmail(e.target.value);setApiErr('');}} placeholder="admin@rentpro.in" accent={cfg.accent}/>
            <DInput label="Password" type="password" value={password} onChange={e=>{setPassword(e.target.value);setApiErr('');}} placeholder="Admin password" accent={cfg.accent}/>
            <DInput label="2FA / OTP code" value={otp} onChange={e=>{setOtp(e.target.value);setApiErr('');}} placeholder="6-digit code" maxLength={6} style={{ fontFamily:'ui-monospace,monospace',letterSpacing:4 }} accent={cfg.accent}/>
            <AuthBtn color={cfg.accent} label="Sign in to admin portal" onClick={()=>{ if(!otp||otp.length<6){setApiErr('Please enter your 6-digit OTP code');return;} doLogin(); }} loading={loading}/>
            <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,.3)', marginTop:18 }}><span style={{ cursor:'pointer' }} onClick={()=>nav('/')}>← Back to main site</span></p>
          </>)}

        </div>
      </div>
    </div>
  );
}
