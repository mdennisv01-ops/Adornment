import './globals.css';
import SiteShell from './site-shell';

export const metadata = {
  title: 'Adornment — The marketplace for your next statement piece',
  description: 'Discover independent fashion and accessories on Adornment.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><SiteShell>{children}</SiteShell></body></html>;
}
