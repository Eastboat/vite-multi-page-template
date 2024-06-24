import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export function multiPagePlugin(): Plugin {
  const virtualModuleId = 'virtual:multi-page-redirect';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'vite-plugin-multi-page',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `
          const pages = ${JSON.stringify(Object.keys(entryPoints))};
          const path = window.location.pathname.split('/')[1];
          if (pages.includes(path)) {
            window.location.href = '/' + path + '/' + path + '.html';
          }
        `;
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url!;
        const parts = url.split('/');
        if (parts.length > 2 && entryPoints[parts[1]]) {
          req.url = '/' + parts.slice(2).join('/');
        }
        next();
      });
    },
    generateBundle(options, bundle) {
      for (const fileName in bundle) {
        if (fileName.endsWith('.html')) {
          const [dir, file] = fileName.split('/');
          if (entryPoints[dir]) {
            const content = bundle[fileName].source as string;
            delete bundle[fileName];
            this.emitFile({
              type: 'asset',
              fileName: `${dir}/${file}`,
              source: content,
            });
          }
        }
      }
    },
  };
}

const entryPoints: Record<string, string> = {
  home: 'views/home/home.html',
  main: 'views/main/main.html',
  user: 'views/user/user.html',
};

export { entryPoints };
