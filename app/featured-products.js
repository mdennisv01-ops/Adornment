'use client';
import { useEffect, useState } from 'react';
import ProductCard from './product-card';
import { catalog } from '../lib/catalog';
import { api, normalizeProduct } from '../lib/api';

export default function FeaturedProducts({ start = 0, count = 4 }) {
  const [products, setProducts] = useState(catalog.slice(start, start + count));
  useEffect(() => {
    let active = true;
    api('/products?page=1&pageSize=100')
      .then((result) => {
        if (!active || !result?.items?.length) return;
        const live = result.items.map(normalizeProduct);
        setProducts(start ? live.slice(4, 8).length ? live.slice(4, 8) : live.slice(0, count) : live.slice(0, count));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [count, start]);
  return <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id}/>)}</div>;
}
