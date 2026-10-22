'use client';
import Link from 'next/link';
import { naira } from '../lib/catalog';
import { addProductToCart } from '../lib/api';

export default function ProductCard({ product }) {
  async function add(e) { e.preventDefault(); e.stopPropagation(); const variant = product.variants?.find((item) => item.stock > 0) || product.variants?.[0]; if (product.apiProduct && (!variant || variant.stock < 1)) { alert('This piece is currently out of stock.'); return; } try { await addProductToCart(product, variant?._id); } catch (error) { alert(error.message); } }
  return <article className="product-card"><Link href={`/product/${product.id}`} className="product-image"><img src={product.image} alt={product.name}/>{product.tag && <span className="product-badge">{product.tag}</span>}<button className="heart" aria-label="Save item" onClick={e=>{e.preventDefault();e.currentTarget.classList.toggle('saved')}}>♡</button></Link><div className="product-info"><div className="product-category">{product.category}<span className="rating">{product.rating==='New'?'':'★ '}{product.rating}{product.reviews?` (${product.reviews})`:''}</span></div><Link href={`/product/${product.id}`}><h3 className="product-name">{product.name}</h3></Link><div className="price-row"><b>{naira(product.price)}</b>{product.oldPrice > 0 && <span className="old-price">{naira(product.oldPrice)}</span>}</div><button className="text-link add-product" onClick={add}>Add to bag +</button></div></article>;
}
