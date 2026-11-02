import { useEffect } from 'react';

// The stylesheets switch whole layouts from classes on <body>.
export function useBodyClass(name: string, on: boolean) {
  useEffect(() => {
    document.body.classList.toggle(name, on);
    return () => document.body.classList.remove(name);
  }, [name, on]);
}
