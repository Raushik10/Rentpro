import React, { createContext, useContext, useState, useCallback } from 'react';
const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);
let toastId = 0;
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++toastId;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);
  const icons = { success:'✓', error:'✕', info:'ℹ' };
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type} animate-slideDown`}>
            <span style={{ fontSize:16, fontWeight:700, flexShrink:0 }}>{icons[t.type]||'·'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
