'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductCard from '../product-card';
import { catalog, categories as fallbackCategories } from '../../lib/catalog';
import { api, normalizeProduct } from '../../lib/api';

export default function ShopView({ category, query, sort }) {
  const [products, setProducts] = useState(catalog);
  const [categories, setCategories] = useState(fallbackCategories);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([api('/products?page=1&pageSize=100'), api('/products/categories')])
      .then(([result, liveCategories]) => {
        if (!active) return;
        const liveProducts = result?.items?.map(normalizeProduct) || [];
        setProducts(liveProducts.length ? liveProducts : catalog);
        setPreview(!liveProducts.length);
        const apiCategories = liveCategories?.map((item) => item.name) || [];
        setCategories(['All pieces', ...new Set([...apiCategories, ...fallbackCategories.filter((name) => name !== 'All pieces')])]);
        setOnline(true);
      })
      .catch(() => { if (active) setPreview(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const selectedCategory = categories.find((item) => item.toLowerCase() === category.toLowerCase()) || category;
  const needle = query.trim().toLowerCase();
  const sameCategory = (left, right) => {
    const a = left.toLowerCase().replace(/[\s-]+/g, '');
    const b = right.toLowerCase().replace(/[\s-]+/g, '');
    return a === b || (['jumpsuit','jumpsuits'].includes(a) && ['jumpsuit','jumpsuits'].includes(b)) || (['2piece','twopieces'].includes(a) && ['2piece','twopieces'].includes(b));
  };
  let visible = products.filter((p) =>
    (selectedCategory === 'All pieces' || sameCategory(p.category, selectedCategory)) &&
    (!needle || `${p.name} ${p.category}`.toLowerCase().includes(needle))
  );
  if (sort === 'low') visible = [...visible].sort((a, b) => a.price - b.price);
  if (sort === 'high') visible = [...visible].sort((a, b) => b.price - a.price);

  return <><div className="shop-head"><div className="eyebrow">Thoughtful things, for you</div><h1 className="page-title">{selectedCategory}</h1><p style={{color:'var(--muted)',fontSize:12}}>Independent design, considered details, a little something special.</p></div><div className="shop-layout"><aside className="filters"><h3>Browse by edit</h3><div className="filter-list">{categories.map((item) => <Link key={item} className={item === selectedCategory ? 'active' : ''} href={item === 'All pieces' ? '/shop' : `/shop?category=${encodeURIComponent(item)}`}>{item}</Link>)}</div></aside><section><div className="shop-toolbar"><span>{loading ? 'Finding the latest pieces…' : `${visible.length} pieces to explore`}{preview && !loading ? <small className="api-note"> Preview catalogue</small> : null}</span><form className="shop-controls"><input name="q" type="search" placeholder="Search pieces" defaultValue={query} aria-label="Search products"/><input type="hidden" name="category" value={selectedCategory}/><select aria-label="Sort products" name="sort" defaultValue={sort}><option value="featured">Sort: Featured</option><option value="low">Price: Low to high</option><option value="high">Price: High to low</option></select><button className="btn small">Apply</button></form></div>{visible.length ? <div className="product-grid">{visible.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="empty-state"><h2>{loading ? 'Loading the collection…' : 'No pieces found'}</h2><p>Try another edit or explore everything we have.</p><Link className="btn" href="/shop">Shop all pieces</Link></div>}</section></div></>;
}
