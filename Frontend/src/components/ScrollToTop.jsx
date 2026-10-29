import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
/** Every page opens at the top. Hash links (e.g. /#gallery) are handled by PublicLayout. */
export default function ScrollToTop() {
    const { pathname, hash } = useLocation();
    useEffect(() => { if ('scrollRestoration' in history)
        history.scrollRestoration = 'manual'; }, []);
    useLayoutEffect(() => { if (!hash)
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [pathname]);
    return null;
}
