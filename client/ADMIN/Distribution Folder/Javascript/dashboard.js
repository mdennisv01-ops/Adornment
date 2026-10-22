document.addEventListener('DOMContentLoaded', async () => {
  const api = window.AdminAPI;
  const el = id => document.getElementById(id);
  const currency = n => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n || 0));
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const modal = el('stock-modal'); let selectedVariant = null;
  const seller = localStorage.getItem('adornment_staff_name'); if (seller && el('seller-name')) el('seller-name').textContent = seller;
  const quick = el('quick-view-btn'); if (quick) quick.href = 'sales.html?status=PENDING';
  try {
    const data = await api.overview();
    if (el('total-sales')) el('total-sales').textContent = currency(data.revenue);
    if (el('active-listings')) el('active-listings').textContent = Number(data.productCount || 0).toLocaleString();
    if (el('pending-orders')) el('pending-orders').textContent = Number(data.pendingOrderCount || 0).toLocaleString();
    if (el('inventory-summary')) el('inventory-summary').textContent = `${data.lowStockCount || 0} low stock`;
    const lowStockList = document.querySelector('.dashboard-analytics-grid .scrollable-card .widget-list');
    if (lowStockList) lowStockList.innerHTML = (data.lowStockItems || []).map(item => `<div class="widget-item"><div class="item-details"><span class="item-name">${safe(item.productName)}</span><span class="item-meta">${safe([item.size,item.color].filter(Boolean).join(' / '))} · Stock ${item.stock}</span></div><button class="action-btn add-stock-btn" data-variant="${safe(item.variantId)}" data-product="${safe(item.productName)}">Add Stock</button></div>`).join('') || '<p>No low stock items.</p>';
    const catalogData=await api.products({page:1,pageSize:10});
    const catalogList=document.querySelectorAll('.dashboard-analytics-grid .scrollable-card .widget-list')[1];
    if(catalogList)catalogList.innerHTML=(catalogData.items||[]).map(product=>`<div class="widget-item"><div class="item-details"><span class="item-name">${safe(product.name)}</span><span class="item-meta">${safe(product.category?.name||'')} · ${currency(product.price)}</span></div><a href="Inventory.html">Manage</a></div>`).join('')||'<p>No products yet.</p>';
    const activity = document.querySelector('.activity-list');
    if (activity) activity.innerHTML = (data.recentOrders || []).map(order => `<li class="activity-item"><span class="time-stamp">${new Date(order.createdAt).toLocaleString()}:</span><span class="activity-text">Order <strong>${safe(order.orderNumber)}</strong> · ${safe(order.status)} · ${currency(order.total)}</span></li>`).join('') || '<li class="activity-item">No recent orders.</li>';
  } catch (error) { console.error(error); }
  const catalogMessage=el('catalog-message'),catalogList=el('catalog-list'),productForm=el('product-form');
  if(productForm){
    try{
      const [categoryData,productData]=await Promise.all([api.request('/products/categories'),api.products({page:1,pageSize:100})]);
      const categorySelect=el('product-category');(categoryData||[]).forEach(category=>{const option=document.createElement('option');option.value=category.slug;option.textContent=category.name;categorySelect.append(option)});
      const renderCatalog=items=>{catalogList.innerHTML=(items||[]).map(product=>`<article style="border-top:1px solid #ddd;padding:12px 4px"><strong>${safe(product.name)}</strong> · ${currency(product.price)} · ${safe(product.category?.name||'')} · ${product.isPublished?'Published':'Hidden'}<div>${(product.variants||[]).map(variant=>`<span style="margin-right:12px">${safe([variant.size,variant.color].filter(Boolean).join(' / ')||'Standard')}: ${variant.stock} <button class="action-btn add-stock-btn" data-variant="${safe(variant._id)}" data-product="${safe(product.name)}">Restock</button></span>`).join('')}</div><button data-edit="${safe(product._id)}" data-name="${safe(product.name)}" data-price="${safe(product.price)}">Edit</button> <button data-publish="${safe(product._id)}" data-state="${product.isPublished?'false':'true'}">${product.isPublished?'Unpublish':'Publish'}</button> <button data-delete="${safe(product._id)}">Delete</button></article>`).join('')||'<p>No products found.</p>'};renderCatalog(productData.items||[]);
      productForm.addEventListener('submit',async event=>{event.preventDefault();const form=new FormData(productForm);const button=productForm.querySelector('[type=submit]');button.disabled=true;catalogMessage.textContent='Creating product…';try{const product=await api.request('/products',{method:'POST',body:JSON.stringify({name:form.get('name').trim(),price:Number(form.get('price')),currency:'USD',categorySlug:form.get('categorySlug'),variants:[{size:form.get('size').trim()||undefined,color:form.get('color').trim()||undefined,stock:Number(form.get('stock'))}]})});const image=form.get('image');if(image?.size){const upload=new FormData();upload.append('image',image);upload.append('isPrimary','true');await api.request(`/products/${product._id}/images`,{method:'POST',body:upload})}catalogMessage.textContent='Product created.';location.reload()}catch(error){catalogMessage.textContent=error.message}finally{button.disabled=false}});
      catalogList.addEventListener('click',async event=>{const publish=event.target.closest('[data-publish]'),remove=event.target.closest('[data-delete]'),edit=event.target.closest('[data-edit]');try{if(edit){const name=prompt('Product name:',edit.dataset.name);if(name===null)return;const price=prompt('Price:',edit.dataset.price);if(price===null)return;await api.request(`/products/${edit.dataset.edit}`,{method:'PATCH',body:JSON.stringify({name:name.trim(),price:Number(price)})});location.reload()}if(publish){await api.request(`/products/${publish.dataset.publish}`,{method:'PATCH',body:JSON.stringify({isPublished:publish.dataset.state==='true'})});location.reload()}if(remove&&confirm('Delete this product?')){await api.request(`/products/${remove.dataset.delete}`,{method:'DELETE'});location.reload()}}catch(error){catalogMessage.textContent=error.message}});
    }catch(error){if(catalogMessage)catalogMessage.textContent=error.message}
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('.add-stock-btn'); if (!button || !modal) return;
    selectedVariant = button.dataset.variant; el('modal-product-name').textContent = `Add Stock: ${button.dataset.product}`; modal.classList.add('active');
  });
  const close = () => modal && modal.classList.remove('active');
  if (el('cancel-modal-btn')) el('cancel-modal-btn').addEventListener('click', close);
  if (el('confirm-modal-btn')) el('confirm-modal-btn').addEventListener('click', async () => {
    const quantity = Number(el('stock-quantity-input').value); if (!selectedVariant || !Number.isInteger(quantity) || quantity < 1) return;
    const button = el('confirm-modal-btn'); button.disabled = true;
    try { await api.restock(selectedVariant, quantity, 'Dashboard restock'); location.reload(); }
    catch (error) { alert(error.message); }
    finally { button.disabled = false; }
  });
});
