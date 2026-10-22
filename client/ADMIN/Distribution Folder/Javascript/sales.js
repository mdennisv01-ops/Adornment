document.addEventListener('DOMContentLoaded', async () => {
  const api = window.AdminAPI; const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = value => new Intl.NumberFormat(undefined, {style:'currency',currency:'USD'}).format(Number(value || 0));
  const rows = document.querySelector('.orders-table tbody'); if (!rows) return;
  const status = new URLSearchParams(location.search).get('status');
  try {
    const result = await api.orders({ page: 1, pageSize: 100, ...(status ? {status} : {}) }); const orders = result.items || [];
    const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const metrics = document.querySelectorAll('.metrics-grid .metric-value');
    if (metrics[0]) metrics[0].textContent = money(total);
    if (metrics[1]) metrics[1].textContent = String(result.total ?? orders.length);
    if (metrics[2]) metrics[2].textContent = String(orders.filter(order => order.status === 'PENDING').length);
    if (metrics[3]) metrics[3].textContent = money(orders.length ? total / orders.length : 0);
    rows.innerHTML = orders.map(order => {
      const customer = order.customer || {}; const address = order.shippingAddress || {};
      const items = (order.items || []).map(item => `<span class="item-line">${safe(item.name)} (${money(item.unitPrice)}) × ${item.quantity}${item.size ? ` · ${safe(item.size)}` : ''}</span>`).join('');
      const date = new Date(order.createdAt);
      const actions = ['PENDING','PAID'].includes(order.status) ? `<button class="btn btn-fulfill" data-fulfill="${safe(order._id)}">Fulfill Order</button>` : '';
      return `<tr><td class="order-id">${safe(order.orderNumber)}</td><td><div class="customer-info"><span class="c-name">${safe(customer.username || 'Customer')}</span><span class="c-location">${safe([address.city,address.country].filter(Boolean).join(', '))}</span></div></td><td><div class="item-list">${items}</div></td><td class="order-date">${date.toLocaleDateString()}<br><small>${date.toLocaleTimeString()}</small></td><td class="order-amount">${money(order.total)}</td><td><span class="status-badge ${order.payment?.status === 'SUCCEEDED' ? 'paid' : 'pending'}">${safe(order.payment?.status || 'UNPAID')}</span></td><td><span class="status-badge ${safe(order.status.toLowerCase())}">${safe(order.status)}</span></td><td><div class="action-btns">${actions}<button class="btn btn-view" data-view="${safe(order._id)}">View Details</button></div></td></tr>`;
    }).join('') || '<tr><td colspan="8">No orders found.</td></tr>';
    document.querySelectorAll('.quick-view-link').forEach(link => { link.href = 'sales.html?status=PENDING'; });
  } catch (error) { rows.innerHTML = `<tr><td colspan="8">Could not load orders: ${safe(error.message)}</td></tr>`; }
  rows.addEventListener('click', async event => {
    const fulfill = event.target.closest('[data-fulfill]'); const view = event.target.closest('[data-view]');
    if (view) { try { const order = await api.request(`/orders/${view.dataset.view}`); alert(`${order.orderNumber}\nStatus: ${order.status}\nTotal: ${money(order.total)}\nDelivery: ${[order.shippingAddress?.line1,order.shippingAddress?.city,order.shippingAddress?.country].filter(Boolean).join(', ')}`); } catch (error) { alert(error.message); } }
    if (fulfill) { fulfill.disabled = true; try { await api.fulfill(fulfill.dataset.fulfill); location.reload(); } catch (error) { alert(error.message); fulfill.disabled = false; } }
  });
});
