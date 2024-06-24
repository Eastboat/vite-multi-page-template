import type { Plugin, ResolvedConfig } from 'vite';
import type { Rewrite } from 'connect-history-api-fallback';
import history from 'connect-history-api-fallback';
import fg from 'fast-glob';
import path from 'path';
import fs from 'node:fs';

interface MpaOptions {
  scanDir: string;
  scanFile: string;
  filename: string;
}

function getPagesInfo({ scanDir, scanFile, filename }: MpaOptions) {
  const allFiles = fg.sync(`${scanDir}/*/${scanFile}`);
  const pages = {};

  allFiles.forEach((file) => {
    const dirName = path.dirname(file).split('/').pop();
    pages[dirName] = {
      entry: file,
      filename: filename.replace('[name]', dirName),
    };
  });

  return pages;
}

function getMPAIO(root: string, options: MpaOptions) {
  /*
    { scanDir: 'src/views', scanFile: '*.ts', filename: '[name].html' }
  */
  const pages = getPagesInfo(options);
  /*
    {
      home: { entry: 'src/views/home/home.ts', filename: 'home.html' },
      main: { entry: 'src/views/main/main.ts', filename: 'main.html' }
    }
  */
  const input = {};
  Object.keys(pages).forEach((key) => {
    input[key] = path.resolve(root, options.scanDir, key, pages[key].filename);
  });
  /*
    {
      home: '/xxxx/src/views/home/home.html',
      main: '/xxxx/src/views/main/main.html'
    }
  */
  return input;
}

function getHistoryReWriteRuleList(options: MpaOptions): Rewrite[] {
  const pages = getPagesInfo(options);
  const list: Rewrite[] = [];
  Object.keys(pages).forEach((pageName) => {
    list.push({
      from: new RegExp(`/${pageName}/?$`),
      to: `/${options.scanDir}/${pageName}/${pages[pageName].filename}`,
    });
  });
  /*
      [
          { from: /^\/home\/?$/, to: '/home/home.html' },
          { from: /^\/main\/?$/, to: '/main/main.html' }
      ]
  */
  return list;
}

/**
 * @description: 自定义插件，实现多页面应用
 * @param {MpaOptions} options
 * @return {*}
 * @author: eastboat
 */
export default function mpaPlugin(options: MpaOptions): Plugin {
  /*
    { scanDir: 'src/views', scanFile: '*.ts', filename: '[name].html' }
  */
  let config: ResolvedConfig;
  return {
    name: 'vite-plugin-mpa',
    /*
      在解析 Vite 配置前调用。钩子接收原始用户配置（命令行选项指定的会与配置文件合并）和一个描述配置环境的变量，包含正在使用的 mode 和 command。
      它可以返回一个将被深度合并到现有配置中的部分配置对象，或者直接改变配置（如果默认的合并不能达到预期的结果）
    */
    config(config) {
      return {
        build: {
          rollupOptions: {
            input: getMPAIO(config.root || process.cwd(), options),
          },
        },
      };
    },
    // 在解析 Vite 配置后调用。使用这个钩子读取和存储最终解析的配置
    configResolved(resolvedConfig) {
      config = resolvedConfig; // 存储最终解析的配置
    },

    // 是用于配置开发服务器的钩子。最常见的用例是在内部 connect 应用程序中添加自定义中间件
    configureServer(server) {
      //   server.middlewares.use((req, res, next) => {
      //     // 自定义请求处理...
      //     const url = req.url;
      //     // 处理根路径
      //     if (url === '/') {
      //       req.url = '/index.html';
      //       return next();
      //     }
      //     // 处理页面路由
      //     const pages = getPagesInfo(options);
      //     const pageName = url.split('/')[1];
      //     if (pages[pageName]) {
      //       const filePath = path.join(
      //         config.root,
      //         options.scanDir,
      //         pageName,
      //         pages[pageName].filename,
      //       );
      //       if (fs.existsSync(filePath)) {
      //         req.url = `/${pageName}/${pages[pageName].filename}`;
      //         console.log(
      //           '🚀 ~ file: vite-plugin-multi-page2.ts:137 ~ server.middlewares.use ~ req.url:',
      //           req.url,
      //         );
      //         return next();
      //       }
      //     }
      //     // 处理静态资源
      //     if (url.includes('.')) {
      //       return next();
      //     }
      //     // 如果都不匹配，返回 404
      //     res.statusCode = 404;
      //     res.end('404 Not Found');
      //   });
      server.middlewares.use(
        history({
          rewrites: getHistoryReWriteRuleList(options),
          //   verbose: true, // 激活日志记录
          //   logger: console.log.bind(console),
          htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
        }),
      );
    },
    /*
      转换 index.html 的专用钩子。钩子接收当前的 HTML 字符串和转换上下文。上下文在开发期间暴露ViteDevServer实例，在构建期间暴露 Rollup 输出的包。
    */
    transformIndexHtml(html) {
      // 调整 HTML 中的资源引用路径
      return html.replace(/"\.\.?\//g, '"../');
    },
  };
}
