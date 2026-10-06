/**
 * A single shared, allocation-free pointer state. Listeners are attached once;
 * 3D scenes read it inside useFrame without causing React renders.
 */
export const pointer = {
  /** normalised -1 … 1 relative to the viewport */
  nx: 0,
  ny: 0,
  x: 0,
  y: 0,
};

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ny = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true },
  );
}
