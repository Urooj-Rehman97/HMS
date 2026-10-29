import { useEffect } from 'react';
import { Link } from 'react-router-dom';
export default function NotFound() {
    useEffect(() => { document.title = 'Page not found — LuxuryStay'; }, []);
    return (<div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-24 text-center"><p className="eyebrow">Error 404</p><h1 className="mt-4 text-5xl">This page has checked out.</h1>
    <p className="mt-4 max-w-md text-mist">The page you’re looking for doesn’t exist or has moved.</p><div className="mt-8 flex gap-3"><Link to="/" className="btn-gold">Back to home</Link><Link to="/rooms" className="btn-glass">Browse rooms</Link></div></div>);
}
