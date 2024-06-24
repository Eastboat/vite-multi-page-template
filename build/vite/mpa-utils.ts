import type { Rewrite } from 'connect-history-api-fallback';
import fg from 'fast-glob'; // https://github.com/mrmlnc/fast-glob#readme
import path from 'path';
import { defineConfig } from 'vite';

// 定义 MpaOptions 类型
interface MpaOptions {
  scanDir: string;
  scanFile: string;
  filename: string;
}

// 获取页面信息
// export function getPagesInfo({ scanDir, scanFile }: MpaOptions) {
//   console.log('🚀 ~ file: mpa.ts:15 ~ getPagesInfo ~ scanFile:', scanFile);
//   console.log('🚀 ~ file: mpa.ts:15 ~ getPagesInfo ~ scanDir:', scanDir);
//   const allFiles = fg.sync(`${scanDir}/**/${scanFile}`);
//   const pages = {};

//   allFiles.forEach((file) => {
//     const pageName = path.dirname(file).split('/').pop();
//     pages[pageName] = {
//       entry: file,
//       filename: `${pageName}/index.html`,
//     };
//   });

//   return pages;
// }
export function getPagesInfo({ scanDir, scanFile, filename }: MpaOptions) {
  const allFiles = fg.sync(`${scanDir}/*/${scanFile}`);
  const pages = {};

  allFiles.forEach((file) => {
    const dirName = path.dirname(file).split('/').pop();
    const entryName = path.basename(file, path.extname(file));
    pages[dirName] = {
      entry: file,
      filename: filename.replace('[name]', dirName),
    };
  });

  return pages;
}

// 获取多页面应用的输入输出配置
export function getMPAIO(root: string, options: MpaOptions) {
  const pages = getPagesInfo(options);
  const input = {};

  // Object.keys(pages).forEach((key) => {
  //   input[key] = path.resolve(root, pages[key].filename);
  // });

  Object.keys(pages).forEach((key) => {
    input[key] = path.resolve(root, options.scanDir, key, pages[key].filename);
  });

  return input;
}

// 如果需要开发服务器支持，可以添加以下代码
// 获取历史 API 回退的重写规则列表
export function getHistoryReWriteRuleList(options: MpaOptions): Rewrite[] {
  const pages = getPagesInfo(options);
  const list: Rewrite[] = [];

  // Object.keys(pages).forEach((pageName) => {
  //   list.push({
  //     from: new RegExp(`^/${pageName}/?$`),
  //     to: `/${pageName}/index.html`,
  //   });
  // });
  Object.keys(pages).forEach((pageName) => {
    list.push({
      from: new RegExp(`^/${pageName}/?$`),
      to: `/${pageName}/${pages[pageName].filename}`,
    });
  });

  return list;
}
