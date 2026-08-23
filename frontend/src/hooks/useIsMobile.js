import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 1024;

// Tracks whether the viewport is at most MOBILE_BREAKPOINT pixels wide.
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
