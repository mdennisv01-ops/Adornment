export const API_BASE = '/api';

export function setAuthToken(token, staff = false) {
  if (typeof window === 'undefined' || !token) return false;
  const key = staff ? 'adornment_staff_access_token' : 'adornment_access_token';
  localStorage.setItem(key, token);
  window.dispatchEvent(new Event('auth-change'));
  return true;
}

export function clearAuthToken(staff = false) {
  if (typeof window === 'undefined') return;
  const key = staff ? 'adornment_staff_access_token' : 'adornment_access_token';
  localStorage.removeItem(key);
  window.dispatchEvent(new Event('auth-change'));
}

export function isSignedIn(staff = false) {
  if (typeof window === 'undefined') return false;
  const key = staff ? 'adornment_staff_access_token' : 'adornment_access_token';
  return Boolean(localStorage.getItem(key));
}

export async function api(path, options = {}) {
  const { staff, headers: customHeaders, ...fetchOptions } = options;
  const key = staff ? 'adornment_staff_access_token' : 'adornment_access_token';
  async function request(canRefresh) {
    const token = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    const headers = { ...(fetchOptions.body && !(fetchOptions.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}), ...customHeaders };
    const response = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers, credentials: 'include' });
    if (response.status === 401 && canRefresh && token) {
      const refreshed = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' }).catch(() => null);
      const refreshData = refreshed?.ok ? await refreshed.json().catch(() => ({})) : null;
      if (refreshData?.data?.accessToken) {
        setAuthToken(refreshData.data.accessToken, staff);
        return request(false);
      }
      clearAuthToken(staff);
    }
    const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.message || `Request failed (${response.status})`);
    return payload?.data;
  }
  return request(true);
}
export function saveCart(cart) { localStorage.setItem('adornment_cart', JSON.stringify(cart)); window.dispatchEvent(new Event('cart-change')); }
export function readCart() { try { return JSON.parse(localStorage.getItem('adornment_cart') || '[]'); } catch { return []; } }

export function normalizeProduct(raw) {
  const id = raw._id || raw.id;
  const category = raw.category?.name || raw.category || 'Collection';
  const image = raw.images?.find((item) => item.isPrimary)?.url || raw.images?.[0]?.url || raw.image || '/images/background.png';
  return {
    ...raw,
    id,
    apiProduct: Boolean(raw._id),
    productId: raw._id || raw.productId,
    name: raw.name,
    price: Number(raw.price),
    image: /^https?:\/\//i.test(image) ? image : image.startsWith('/') ? image : `/${image}`,
    category,
    categorySlug: raw.category?.slug || raw.categorySlug,
    rating: raw.rating || 'New',
    reviews: raw.reviews || 0,
    tag: raw.tag || '',
    variants: raw.variants || [],
  };
}

export async function addProductToCart(product, variantId, quantity = 1) {
  if (product.apiProduct && localStorage.getItem('adornment_access_token')) {
    const cart = await api('/orders/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId: product.productId || product.id, variantId, quantity }),
    });
    window.dispatchEvent(new Event('cart-change'));
    return cart;
  }
  const guestCart = readCart();
  const line = guestCart.find((item) => item.productId === product.id && item.variantId === variantId);
  if (line) line.quantity += quantity;
  else guestCart.push({ ...product, productId: product.apiProduct ? product.id : null, variantId: variantId || null, quantity });
  saveCart(guestCart);
  return guestCart;
}

export async function mergeGuestCart() {
  let pending = readCart();
  for (let index = 0; index < pending.length;) {
    const item = pending[index];
    if (item.productId && item.variantId) {
      await api('/orders/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId: item.productId, variantId: item.variantId, quantity: item.quantity }),
      });
      pending = pending.filter((_, i) => i !== index);
      saveCart(pending);
    } else index += 1;
  }
  window.dispatchEvent(new Event('cart-change'));
}
