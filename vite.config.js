import { defineConfig } from 'vite';
// import vue from "@vitejs/plugin-vue";
// import vueJsx from "@vitejs/plugin-vue-jsx";
// import Pages from "vite-plugin-pages";
// import Layouts from "vite-plugin-vue-layouts";
// import viteCompression from "vite-plugin-compression";
// import image from "@rollup/plugin-image";
import path from 'path';
import { vitePluginHtmlServerMiddleware } from './build/vite/vite-plugin-mpa-server-middleware';
import mpaPlugin from './build/vite/vite-plugin-multi-page';
import {
  getPagesInfo,
  getMPAIO,
  getHistoryReWriteRuleList,
} from './build/vite/mpa-utils';

export default defineConfig({
  plugins: [
    // vue(),
    // vueJsx(),
    // Pages({
    //   dirs: "src/pages",
    //   extensions: ["vue", "ts"],
    // }),
    // Layouts({
    //   layoutsDir: "src/layouts",
    // }),
    // viteCompression(),
    // image(),
    // vitePluginHtmlServerMiddleware(),
    mpaPlugin({
      scanDir: 'src/views',
      scanFile: '*.ts',
      filename: '[name].html',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/global.scss";`,
      },
    },
  },
  build: {
    // rollupOptions: {
    //   input: {
    //     main: path.resolve(__dirname, 'src/views/main/main.html'),
    //     home: path.resolve(__dirname, 'src/views/home/home.html'),
    //     user: path.resolve(__dirname, 'src/views/user/user.html'),
    //   },
    //   output: {
    //     entryFileNames: 'assets/[name].js',
    //     chunkFileNames: 'assets/[name].js',
    //     assetFileNames: 'assets/[name].[ext]',
    //   },
    // },
    // rollupOptions: {
    //   input: getMPAIO(process.cwd(), {
    //     scanDir: 'src/views',
    //     scanFile: '*.ts', // 使用通配符匹配所有 .ts 文件
    //     filename: '[name].html',
    //   }),
    //   output: {
    //     entryFileNames: 'assets/[name]-[hash].js',
    //     chunkFileNames: 'assets/[name]-[hash].js',
    //     assetFileNames: 'assets/[name]-[hash].[ext]',
    //   },
    // },
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    host: '0.0.0.0', // 允许外部访问,监听所有地址，包括局域网和公网地址
    port: 3000, // 指定端口号
    // open: '/src/views/main/main.html', // 开发服务器启动时，自动在浏览器中打开应用程序.默认打开main页面
    watch: {
      /*
        Vite 服务器的文件监听器默认会监听 root 目录，同时会跳过 .git/、node_modules/，以及 Vite 的 cacheDir 和 build.outDir 这些目录。当监听到文件更新时，Vite 会应用 HMR 并且只在需要时更新页面。
      */
      usePolling: true, // 传递给 chokidar 的文件系统监听器选项。
    },
    fs: {
      /*
        控制 Vite 开发服务器的文件系统访问范围，提升开发环境的安全性和一致性。在配置 Vite 项目时，建议根据实际需求启用此选项，以确保项目文件访问的安全性和规范性。
      */
      strict: true, // 严格限制文件系统的访问范围
    },
    /**
     * 继承自 http-proxy
     */
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true, // 选项会同时改变 host 和 origin 头以匹配目标
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
