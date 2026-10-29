'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api, isSignedIn, readCart } from '../lib/api';
import Icon from '../components/icon';

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let active = true;
    const update = () => {
      const nextSignedIn = isSignedIn();
      setSignedIn(nextSignedIn);
      const localCount = readCart().reduce((n, x) => n + x.quantity, 0);
      setCount(localCount);
      if (nextSignedIn) api('/orders/cart').then((cart) => { if (active) setCount((cart.items||[]).reduce((n,x)=>n+x.quantity,0) + readCart().filter(x=>!x.productId).reduce((n,x)=>n+x.quantity,0)); }).catch(() => {});
    };
    update(); window.addEventListener('cart-change', update); window.addEventListener('auth-change', update); window.addEventListener('storage', update);
    return () => { active = false; window.removeEventListener('cart-change', update); window.removeEventListener('auth-change', update); window.removeEventListener('storage', update); };
  }, []);
  if (pathname.startsWith('/admin')) return <main>{children}</main>;
  return <><div className="announcement">A little something for you — complimentary Awka delivery on orders over ₦100,000 <Icon name="chevronRight" size={14}/></div><header className="topbar"><Link className="wordmark" href="/">adornment<span>.</span></Link><nav className={`main-nav ${menuOpen?'open':''}`}><Link href="/shop" onClick={()=>setMenuOpen(false)}>Shop all</Link><Link href="/shop?category=Gowns" onClick={()=>setMenuOpen(false)}>Clothing</Link><Link href="/shop?category=Accessories" onClick={()=>setMenuOpen(false)}>Accessories</Link><Link href="/#story" onClick={()=>setMenuOpen(false)}>Our story</Link></nav><div className="top-actions"><Link className="icon-link" href="/shop" aria-label="Search"><svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><span className="action-label">Search</span></Link><Link className="icon-link" href={signedIn ? '/account' : '/login'} aria-label="Account"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20c.3-4 2.7-6 6.5-6s6.2 2 6.5 6"/></svg><span className="action-label">Account</span></Link><Link className="icon-link bag" href="/cart" aria-label="Shopping bag"><svg viewBox="0 0 24 24"><path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg><span className="action-label">Bag</span>{count > 0 && <b className="bag-count">{count}</b>}</Link><button className="menu-toggle" aria-label="Menu" onClick={()=>setMenuOpen(!menuOpen)}><Icon name={menuOpen?'close':'menu'} size={22}/></button></div></header><main>{children}</main><footer className="footer"><div className="footer-brand"><Link className="wordmark" href="/">adornment<span>.</span></Link><p>Pieces that feel like you.<br/>Designed with care, made to be lived in.</p></div><div><b>Explore</b><Link href="/shop">Shop all</Link><Link href="/shop?category=Gowns">Clothing</Link><Link href="/#story">Our story</Link></div><div><b>Help</b><Link href={signedIn ? '/account' : '/login'}>My account</Link><Link href="/orders">Track an order</Link><a href="mailto:hello@adornment.ng">Contact us</a><Link href="/admin/login">Merchant sign in</Link></div><div className="newsletter"><b>A note from us</b><p>New drops, considered edits, good things.</p><form onSubmit={e=>{e.preventDefault(); alert('You’re on the list. See you in your inbox!')}}><input type="email" placeholder="Your email address" required/><button>Join us <Icon name="arrow" size={14}/></button></form></div><div className="footer-bottom"><span>© 2025 Adornment Studio</span><span>Thoughtfully made in Awka, Nigeria</span><span>Instagram&nbsp;&nbsp; Pinterest</span></div></footer></>;
}
