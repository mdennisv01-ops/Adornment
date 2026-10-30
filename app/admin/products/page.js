'use client';
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import Icon from '../../../components/icon';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', slug: '' });
  const [show, setShow] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', price: '', categorySlug: '', sizes: 'S,M,L', colors: '', stock: 0 });

  async function load() {
    try {
      const [d, c] = await Promise.all([api('/products?pageSize=100', { staff: true }), api('/products/categories')]);
      setProducts(d.items || []); setCategories(c || []);
      if (!form.categorySlug && c?.length) setForm((x) => ({ ...x, categorySlug: c[0].slug }));
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { if (!localStorage.getItem('adornment_staff_access_token')) location.href='/admin/login'; else load(); }, []);

  async function create(e) {
    e.preventDefault(); setError('');
    const sizes = form.sizes.split(',').map((x) => x.trim()).filter(Boolean);
    const colors = form.colors.split(',').map((x) => x.trim()).filter(Boolean);
    const variants = (sizes.length ? sizes : [undefined]).flatMap((size) => colors.length ? colors.map((color) => ({ size, color, stock: Number(form.stock) })) : [{ size, stock: Number(form.stock) }]);
    try {
      await api('/products', { staff: true, method: 'POST', body: JSON.stringify({ name: form.name, description: form.description, price: Number(form.price), currency: 'NGN', categorySlug: form.categorySlug, variants }) });
      setShow(false); await load();
    } catch (e) { setError(e.message); }
  }

  async function createCategory(e) {
    e.preventDefault(); setError('');
    const slug = newCategory.slug || newCategory.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      const category = await api('/products/categories', { staff: true, method: 'POST', body: JSON.stringify({ name: newCategory.name, slug }) });
      setCategories((list) => [...list, category].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((x) => ({ ...x, categorySlug: category.slug }));
      setNewCategory({ name: '', slug: '' }); setShowCategory(false);
    } catch (e) { setError(e.message); }
  }

  async function uploadImage(productId, file) {
    if (!file) return; setError(''); const body = new FormData(); body.append('image', file); body.append('isPrimary', 'true');
    try { await api(`/products/${productId}/images`, { staff: true, method: 'POST', body }); await load(); } catch (e) { setError(e.message); }
  }

  const filteredCategories = categories.filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()));
  const visibleProducts = products.filter((p) => (!categoryFilter || p.category?.slug === categoryFilter) && (!productSearch || `${p.name} ${p.sku}`.toLowerCase().includes(productSearch.toLowerCase())));

  return <>
    <div className="admin-top"><div><div className="eyebrow">Catalogue</div><h1>Products</h1></div><button className="admin-btn" onClick={() => setShow(!show)}><Icon name="plus" size={12}/> Add product</button></div>
    {error && <p style={{ color: '#a33' }}>{error}</p>}
    {show && <form className="admin-content" onSubmit={create} style={{ marginBottom: 16 }}>
      <div className="admin-toolbar"><h2 style={{ font: '20px var(--serif)', margin: 0 }}>New product</h2><button className="admin-btn">Save product</button></div>
      <div className="admin-form-grid admin-form-grid-three">
        <label>Product name<input placeholder="Product name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
        <label>Price in NGN<input placeholder="Price" type="number" min="1" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}/></label>
        <label>Category<div className="admin-category-control"><select required value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}><option value="">Select category</option>{filteredCategories.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}</select><button type="button" className="admin-icon-btn" onClick={() => setShowCategory(!showCategory)} title="Add category"><Icon name="plus" size={14}/></button></div></label>
        <label>Search categories<input placeholder="Search category" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)}/></label>
        <label>Sizes<input placeholder="S,M,L" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })}/></label>
        <label>Colors<input placeholder="Optional" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })}/></label>
        <label>Stock per variant<input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}/></label>
        <label className="admin-form-full">Description<textarea rows="4" placeholder="Product details" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></label>
      </div>
      {showCategory && <div className="admin-category-panel"><div className="admin-toolbar"><h3 style={{ margin: 0 }}>Add category</h3></div><div className="admin-category-form"><input aria-label="Category name" placeholder="Category name" required={showCategory} value={newCategory.name} onChange={(e) => setNewCategory({ name: e.target.value, slug: e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })}/><input aria-label="Category slug" placeholder="Slug" required={showCategory} value={newCategory.slug} onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}/><button type="button" className="admin-btn" onClick={createCategory}>Add category</button></div></div>}
      <p style={{ fontSize: 10, color: '#798188' }}>Each size/color combination becomes a stock-tracked variant.</p>
    </form>}
    <div className="admin-content">
      <div className="admin-toolbar admin-catalog-toolbar"><h2 style={{ font: '20px var(--serif)', margin: 0 }}>Catalogue</h2><div className="admin-search-controls"><input aria-label="Search products" placeholder="Search products" value={productSearch} onChange={(e) => setProductSearch(e.target.value)}/><select aria-label="Filter by category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="">All categories</option>{categories.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}</select></div></div>
      <table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Variants</th><th>State</th><th>Product image</th></tr></thead><tbody>{visibleProducts.map((p) => <tr key={p._id}><td><b>{p.name}</b><br/><span style={{ color: '#899198' }}>SKU {p.sku}</span></td><td>{p.category?.name || '—'}</td><td>₦{Number(p.price).toLocaleString()}</td><td>{p.variants?.length || 0}</td><td><span className="status">{p.isPublished ? 'Published' : 'Draft'}</span></td><td><label className="admin-btn" style={{ display: 'inline-block', cursor: 'pointer' }}>Upload<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => uploadImage(p._id, e.target.files?.[0])}/></label></td></tr>)}</tbody></table>
      {!visibleProducts.length && <div className="admin-placeholder">{error ? 'Connect your merchant account to load products.' : 'No products match this search or category.'}</div>}
    </div>
  </>;
}
