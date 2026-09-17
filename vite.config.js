import { defineConfig } from 'vite';

import shotServer from './tools/shotServer.js';

export default defineConfig({
  plugins: [shotServer()],
  test: {
    include: ['src/**/*.test.js'],
    environment: 'node',
    passWithNoTests: true,
  },
});
