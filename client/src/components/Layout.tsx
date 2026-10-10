import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Sections';
import Loader from '@/components/Loader';

function ScrollToHash() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (hash)
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0 });
  }, [hash, pathname]);
  return null;
}

export function Layout() {
  return (
    <div className="min-h-screen">
      <ScrollToHash />
      <Navbar />
      <main>
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
