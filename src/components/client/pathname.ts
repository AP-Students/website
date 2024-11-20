import { useState } from 'react';

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  // Add event listeners directly
  const handlePathChange = () => {
    setPathname(window.location.pathname);
  };

  // Initial path setup and event listeners for navigation events
  if (typeof window !== "undefined") {
    window.addEventListener('popstate', handlePathChange);
    window.addEventListener('pushstate', handlePathChange);

    // Clean up by overriding these methods if the hook will be used across multiple components
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handlePathChange();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handlePathChange();
    };
  }

  return pathname;
}

export default usePathname;
