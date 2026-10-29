import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BackToTop from '../components/BackToTop';
import { PageFallback } from '../components/common/EmptyState';
/** Wrapper for every public page. (Removed: GSAP + Lenis smooth-scroll + custom cursor - they delayed first paint and fought native scrolling.) */
export default function PublicLayout() {
    const { pathname, hash } = useLocation();
    useEffect(() => {
        if (hash) {
            const t = setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 60);
            return () => clearTimeout(t);
        }
    }, [pathname, hash]);
    return (<><Navbar /><main id="main"><Suspense fallback={<PageFallback />}><div key={pathname} className="page-enter"><Outlet /></div></Suspense></main><Footer /><BackToTop /></>);
}
