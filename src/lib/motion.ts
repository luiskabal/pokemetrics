import { readable } from 'svelte/store';
export const reducedMotion = readable(false, set => {
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  set(query.matches);
  const update = () => set(query.matches);
  query.addEventListener('change', update);
  return () => query.removeEventListener('change', update);
});
