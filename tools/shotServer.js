// Dev-only Vite plugin: receives a captured image and writes it where it belongs.
// Used by tools/capture.html and tools/shareCard.html (public/shots/), and by tools/heroClip.html,
// whose hundreds of frames go to .frames/ instead - they are raw material for ffmpeg, not assets,
// and must never reach the repository. It never runs in a build.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const SAFE_ID = /^[a-z0-9-]+$/;

export default function shotServer({ outDir = 'public/shots', framesDir = '.frames' } = {}) {
  return {
    name: 'supra-shot-server',
    apply: 'serve',
    configureServer(server) {
      /** Reads the whole body; these are small images. */
      async function body(req) {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        return Buffer.concat(chunks);
      }

      // One numbered frame of a clip: /__frames/<clip>/0042.jpg
      server.middlewares.use('/__frames/', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        const [, clip, number] = req.url.match(/^\/([a-z0-9-]+)\/(\d{4})\.jpg$/) ?? [];
        if (!clip) {
          res.statusCode = 400;
          return res.end(`bad frame: ${req.url}`);
        }

        const file = resolve(server.config.root, framesDir, clip, `${number}.jpg`);
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, await body(req));
        res.statusCode = 200;
        res.end(`${number}.jpg`);
      });

      server.middlewares.use('/__shot/', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        // Chapter stills are WebP (the default); the share card (tools/shareCard.js) is a JPEG.
        const [, id, ext = 'webp'] = req.url.match(/^\/([^.]*)(?:\.(webp|jpg))?$/) ?? [];
        if (!id || !SAFE_ID.test(id)) {
          res.statusCode = 400;
          return res.end(`bad shot id: ${req.url}`);
        }

        const data = await body(req);
        const name = `${id}.${ext}`;
        const file = resolve(server.config.root, outDir, name);
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, data);

        server.config.logger.info(`[shots] wrote ${outDir}/${name} (${data.length} bytes)`);
        res.statusCode = 200;
        res.end(name);
      });
    },
  };
}
