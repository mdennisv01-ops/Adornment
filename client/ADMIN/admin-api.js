(function () {
  const base = window.API_BASE_URL || 'http://localhost:4000/api';
  const key = 'adornment_staff_access_token';
  async function request(path, options = {}, retry = true) {
    const headers = new Headers(options.headers || {});
    const token = localStorage.getItem(key);
    if (!token) { location.href = 'login.html'; throw new Error('Please sign in again.'); }
    headers.set('Authorization', `Bearer ${token}`);
    if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    const response = await fetch(`${base}${path}`, { ...options, headers, credentials: 'include' });
    if (response.status === 401 && retry) {
      const refresh = await fetch(`${base}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (refresh.ok) {
        const payload = await refresh.json();
        if (payload.data?.accessToken) {
          localStorage.setItem(key, payload.data.accessToken);
          return request(path, options, false);
        }
      }
      localStorage.removeItem(key); localStorage.removeItem('adornment_staff_name');
      location.href = 'login.html';
    }
    const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.message || `Request failed (${response.status})`);
    return payload?.data;
  }
  window.AdminAPI = { request, products: p => request(`/products?${new URLSearchParams(p || {})}`),
    overview: () => request('/dashboard/overview'), orders: p => request(`/orders?${new URLSearchParams(p || {})}`),
    lowStock: () => request('/inventory/low-stock'), restock: (variantId, quantity, reason) => request('/inventory/restock', { method:'POST', body:JSON.stringify({variantId,quantity,reason}) }),
    fulfill: id => request(`/orders/${id}/fulfill`, { method:'PATCH' }),
    setOrderStatus: (id,status) => request(`/orders/${id}/status`, { method:'PATCH', body:JSON.stringify({status}) }),
    logout: async () => { try { await request('/auth/logout',{method:'POST'}); } finally { localStorage.removeItem(key);localStorage.removeItem('adornment_staff_name'); } } };
})();
