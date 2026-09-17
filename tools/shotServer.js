// Dev-only Vite plugin: receives a captured chapter image and writes it to public/shots/.
// Used by tools/capture.html; it never runs in a build.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const SAFE_ID = /^[a-z0-9-]+$/;

export default function shotServer({ outDir = 'public/shots' } = {}) {
  return {
    name: 'vulcan-shot-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__shot/', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        const id = req.url.replace(/^\//, '').replace(/\.webp$/, '');
        if (!SAFE_ID.test(id)) {
          res.statusCode = 400;
          return res.end(`bad shot id: ${id}`);
        }

        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);

        const file = resolve(server.config.root, outDir, `${id}.webp`);
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, Buffer.concat(chunks));

        server.config.logger.info(`[shots] wrote ${outDir}/${id}.webp (${Buffer.concat(chunks).length} bytes)`);
        res.statusCode = 200;
        res.end(`${id}.webp`);
      });
    },
  };
}
