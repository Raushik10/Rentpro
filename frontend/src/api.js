// frontend/src/api.js
// Centralized API helper — imported by all pages to avoid circular deps with App.js

export const API_BASE_URL = process.env.REACT_APP_API_URL ;

export const api = async (path, opts = {}) => {
  const token = localStorage.getItem('rp_token');
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const apiUpload = async (path, formData) => {
  const token = localStorage.getItem('rp_token');
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
};
