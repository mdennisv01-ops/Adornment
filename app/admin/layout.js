'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '../../components/icon';
export default function AdminLayout({children}) {
  const path = usePathname();
  if (path === '/admin/login') return children;
  return <div className="admin-layout"><aside className="admin-side"><Link className="wordmark" href="/admin">adornment<span style={{color:'#d09070'}}>.</span></Link><nav><Link href="/admin"><Icon name="grid" size={14}/> Overview</Link><Link href="/admin/products"><Icon name="bag" size={14}/> Products</Link><Link href="/admin/inventory"><Icon name="box" size={14}/> Inventory</Link><Link href="/admin/orders"><Icon name="receipt" size={14}/> Orders</Link><Link href="/admin/profile"><Icon name="user" size={14}/> Profile</Link><Link href="/admin/login" onClick={()=>{localStorage.removeItem('adornment_staff_access_token');localStorage.removeItem('adornment_staff_name')}}><Icon name="logout" size={14}/> Sign out</Link></nav></aside><section className="admin-main">{children}</section></div>;
}
