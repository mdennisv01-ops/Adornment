(function () {
  const base = window.API_BASE_URL || 'http://localhost:4000/api';
  const tokenKey = 'adornment_access_token';

  async function request(path, options = {}, retry = true) {
    const headers = new Headers(options.headers || {});
    const token = localStorage.getItem(tokenKey);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    const response = await fetch(`${base}${path}`, { ...options, headers, credentials: 'include' });
    if (response.status === 401 && retry && token) {
      const refreshed = await fetch(`${base}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (refreshed.ok) {
        const result = await refreshed.json();
        const next = result.data && result.data.accessToken;
        if (next) {
          localStorage.setItem(tokenKey, next);
          return request(path, options, false);
        }
      }
      localStorage.removeItem(tokenKey);
    }
    const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.message || `Request failed (${response.status})`);
    return payload?.data;
  }

  window.StorefrontAPI = {
    request,
    products: (params = {}) => request(`/products?${new URLSearchParams(params)}`),
    categories: () => request('/products/categories'),
    cart: () => request('/orders/cart'),
    addToCart: (productId, variantId, quantity = 1) => request('/orders/cart/items', {
      method: 'POST', body: JSON.stringify({ productId, variantId, quantity }),
    }),
    updateCart: (variantId, quantity) => request(`/orders/cart/items/${variantId}`, {
      method: 'PATCH', body: JSON.stringify({ quantity }),
    }),
    removeCart: (variantId) => request(`/orders/cart/items/${variantId}`, { method: 'DELETE' }),
    checkout: (shippingAddress) => request('/orders/checkout', {
      method: 'POST', body: JSON.stringify({ shippingAddress }),
    }),
    logout: async () => { try { await request('/auth/logout', { method: 'POST' }); } finally { localStorage.removeItem(tokenKey); } },
    isSignedIn: () => Boolean(localStorage.getItem(tokenKey)),
    saveToken: (token) => token && localStorage.setItem(tokenKey, token),
  };
})();
