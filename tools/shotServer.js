// Dev-only Vite plugin: receives a captured image and writes it to public/shots/.
// Used by tools/capture.html and tools/shareCard.html; it never runs in a build.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const SAFE_ID = /^[a-z0-9-]+$/;

export default function shotServer({ outDir = 'public/shots' } = {}) {
  return {
    name: 'supra-shot-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__shot/', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        // Chapter stills are WebP (the default); the share card (tools/shareCard.js) is a JPEG.
        const [, id, ext = 'webp'] = req.url.match(/^\/([^.]*)(?:\.(webp|jpg))?$/) ?? [];
        if (!id || !SAFE_ID.test(id)) {
          res.statusCode = 400;
          return res.end(`bad shot id: ${req.url}`);
        }

        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);

        const name = `${id}.${ext}`;
        const file = resolve(server.config.root, outDir, name);
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, Buffer.concat(chunks));

        server.config.logger.info(`[shots] wrote ${outDir}/${name} (${Buffer.concat(chunks).length} bytes)`);
        res.statusCode = 200;
        res.end(name);
      });
    },
  };
}
