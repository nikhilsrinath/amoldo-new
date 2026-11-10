/**
 * Pixel samples of the Amoldo Technologies logo, used by the hero particle field to
 * assemble the logo. Each sample is a normalised (0..1) position plus whether it
 * belongs to the "A" mark (`red`, drawn darker) or the rest of the wordmark.
 */

const LOGO_SRC = "/brand/amoldo-logo.png";
/** Right edge of the "A" mark, as a fraction of the logo width. */
const MARK_EDGE = 0.162;

let logoSamplesPromise: Promise<{ x: number; y: number; red: boolean }[]> | null = null;

export function loadLogoSamples() {
  if (logoSamplesPromise) return logoSamplesPromise;
  logoSamplesPromise = new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const W = 640;
      const H = Math.round((W * img.naturalHeight) / img.naturalWidth);
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const cx = c.getContext("2d", { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0, W, H);
      const data = cx.getImageData(0, 0, W, H).data;
      const out: { x: number; y: number; red: boolean }[] = [];
      const step = 3;
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          const i = (y * W + x) * 4;
          if (data[i + 3] > 140) {
            out.push({ x: x / W, y: y / H, red: x / W < MARK_EDGE });
          }
        }
      }
      resolve(out);
    };
    img.onerror = () => resolve([]);
    img.src = LOGO_SRC;
  });
  return logoSamplesPromise;
}
