'use client';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProductDetail from './product-detail';
import { catalog } from '../../../lib/catalog';
import { api, normalizeProduct } from '../../../lib/api';

export default function ProductPage(){
  const { id } = useParams();
  const sample = catalog.find((product) => product.id === id);
  const [product, setProduct] = useState(sample || null);
  const [loading, setLoading] = useState(!sample);
  useEffect(() => {
    if (sample) return;
    let active = true;
    api(`/products/${id}`).then((item) => { if (active) setProduct(normalizeProduct(item)); }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, sample]);
  if (loading) return <div className="page-wrap empty-state"><h2>Opening this piece…</h2></div>;
  if (!product) notFound();
  return <div className="page-wrap"><div className="breadcrumbs"><Link href="/">Home</Link><span>›</span><Link href="/shop">Shop</Link><span>›</span><span>{product.name}</span></div><ProductDetail product={product}/></div>;
}
