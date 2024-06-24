import type { Plugin, ResolvedConfig } from 'vite';
import fg from 'fast-glob';
import path from 'path';
import fs from 'fs';

interface MpaOptions {
  scanDir: string;
  scanFile: string;
}

function getPagesInfo({ scanDir, scanFile }: MpaOptions) {
  const allFiles = fg.sync(`${scanDir}/*/${scanFile}`);
  const pages = {};

  allFiles.forEach((file) => {
    const dirName = path.dirname(file).split('/').pop();
    const fileName = path.basename(file);
    pages[dirName] = {
      entry: file,
      filename: fileName,
    };
  });

  return pages;
}

function getMPAIO(root: string, options: MpaOptions) {
  const pages = getPagesInfo(options);
  const input = {};

  Object.keys(pages).forEach((key) => {
    input[`${key}/${pages[key].filename}`] = path.resolve(
      root,
      pages[key].entry,
    );
  });

  return input;
}

export default function mpaPlugin(options: MpaOptions): Plugin {
  let config: ResolvedConfig;
  let pages: ReturnType<typeof getPagesInfo>;

  return {
    name: 'vite-plugin-mpa',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      pages = getPagesInfo(options);
    },

    config(config) {
      return {
        build: {
          rollupOptions: {
            input: getMPAIO(config.root || process.cwd(), options),
          },
        },
      };
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url;

        // 处理根路径
        if (url === '/') {
          const defaultPage = Object.keys(pages)[0];
          req.url = `/${defaultPage}/${pages[defaultPage].filename}`;
          return next();
        }

        // 处理页面路由
        const urlParts = url.split('/').filter(Boolean);
        if (urlParts.length >= 2) {
          const [pageName, fileName] = urlParts;
          if (pages[pageName] && pages[pageName].filename === fileName) {
            req.url = `/${options.scanDir}/${pageName}/${fileName}`;
            return next();
          }
        }

        // 处理静态资源
        if (url.includes('.')) {
          return next();
        }

        // 如果都不匹配，返回 404
        res.statusCode = 404;
        res.end('404 Not Found');
      });
    },

    transformIndexHtml(html, ctx) {
      // 调整 HTML 中的资源引用路径
      const pageName = ctx.filename.split('/').slice(-2)[0];
      return html.replace(/"\.\.?\//g, `"/${options.scanDir}/${pageName}/`);
    },
  };
}
