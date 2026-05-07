import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LangProvider }         from './i18n';
import Landing                  from './pages/Landing';
import Auth                     from './pages/Auth';
import ForcePasswordChange       from './pages/ForcePasswordChange';
import LandlordDashboard        from './pages/LandlordDashboard';
import TenantDashboard          from './pages/TenantDashboard';
import AdminDashboard           from './pages/AdminDashboard';
import Marketplace              from './pages/Marketplace';
import PropertyDetail           from './pages/PropertyDetail';
import { ToastProvider }        from './components/Toast';

export const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function AppRoutes() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('rp_token');
    if (!token) { setLoading(false); return; }
    try {
      const API = process.env.REACT_APP_API_URL ;
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { localStorage.removeItem('rp_token'); setUser(null); }
      else setUser(await res.json());
    } catch {
      localStorage.removeItem('rp_token'); setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login  = (token, userData) => { localStorage.setItem('rp_token', token); setUser(userData); };
  const logout = () => { localStorage.removeItem('rp_token'); setUser(null); };

  const mustChange = user?.must_change_pwd || user?.mustChangePwd;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16 }}>
      <div style={{ width:40, height:40, background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:15 }}>RP</div>
      <div className="spinner spinner-dark" style={{ width:22, height:22 }}/>
    </div>
  );

  return (
    <AuthCtx.Provider value={{ user, login, logout, refreshUser }}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/"                element={!user ? <Landing/>     : <Navigate to={`/${user.role}`}/>}/>
            <Route path="/auth/:role"      element={!user ? <Auth/>        : <Navigate to={`/${user.role}`}/>}/>
            <Route path="/marketplace"     element={<Marketplace/>}/>
            <Route path="/marketplace/:id" element={<PropertyDetail/>}/>

            {/* Force password change */}
            <Route path="/set-password" element={user && mustChange ? <ForcePasswordChange/> : <Navigate to="/"/>}/>

            {/* Protected dashboards */}
            <Route path="/landlord/*" element={
              !user                    ? <Navigate to="/"/>      :
              mustChange               ? <ForcePasswordChange/>  :
              user.role==='landlord'   ? <LandlordDashboard/>    : <Navigate to="/"/>
            }/>
            <Route path="/tenant/*" element={
              !user                ? <Navigate to="/"/>      :
              mustChange           ? <ForcePasswordChange/>  :
              user.role==='tenant' ? <TenantDashboard/>      : <Navigate to="/"/>
            }/>
            <Route path="/admin/*" element={
              user?.role==='admin' ? <AdminDashboard/> : <Navigate to="/"/>
            }/>

            <Route path="*" element={<Navigate to="/"/>}/>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthCtx.Provider>
  );
}

// LangProvider wraps everything so all pages can use useT()
export default function App() {
  return (
    <LangProvider>
      <AppRoutes/>
    </LangProvider>
  );
}
