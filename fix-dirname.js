// Fix container environment where globalThis.__dirname is set to '.'
// which breaks Node 22 createRequire in ESM packages like vite-plugin-pwa
if (typeof globalThis !== 'undefined' && globalThis.__dirname === '.') {
  delete globalThis.__dirname;
}
