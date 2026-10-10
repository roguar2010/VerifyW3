import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import MobileNav from './MobileNav';
import NetworkCanvas from './NetworkCanvas';

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="relative overflow-x-hidden pb-20 md:pb-0 min-h-screen">
      <NetworkCanvas />
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
