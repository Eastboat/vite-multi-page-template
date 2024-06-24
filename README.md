# vite-multi-page-template

> 基于Vite构建的PC端多页模板，开箱即用，支持：

- [x] 多入口资源配置和构建
- [ ] vue sfc模版 (tsx)
- [ ] scss预处理器
- [ ] stylelint进行css规范检查
- [ ] TypeScript
- [ ] eslint代码规范检查
- [ ] prettier
- [ ] Vite dev server & HMR
- [ ] proxy代理
- [ ] 静态资源处理

## Scripts

```bash
npm run dev   # 启动开发服务器
npm run build # 构建项目
npm run lint  # 运行 ESLint
npm run lint:css # 运行 Stylelint
npm run format # 运行 Prettier 格式化
```

## 项目搭建

### 1.vite多页面应用模式

> [Vite官网-多页面应用模式](https://cn.vitejs.dev/guide/build.html#multi-page-app)

- [vite项目中index.html 与项目根目录的关系](https://cn.vitejs.dev/guide/#index-html-and-project-root)：**index.html 在项目最外层而不是在 public 文件夹内。这是有意而为之的：在开发期间 Vite 是一个服务器，而 index.html 是该 Vite 项目的入口文件。**

- 官方文档对于多页模式的描述中说到，如果想要新建一个单页，只需要在**项目根目录（注意：不是src目录！）**。因为vite启动时，会以根目录启动一个开发服务器，可以简单理解为开发服务器托管了整个项目的文件（但其实内部做了一些其他处理如处理public目录等）

  ```txt
  ├── package.json
  ├── vite.config.js
  ├── index.html
  ├── main.js
  └── nested
      ├── index.html
      └── nested.js
  ```

  ```js
  // vite.config.js
  import { resolve } from 'path'
  import { defineConfig } from 'vite'

  export default defineConfig({
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          nested: resolve(__dirname, 'nested/index.html'),
        },
      },
    },
  })
  ```

根据我们的自己业务需要，我们设置好多页应用的入口文件

```txt
views            
├─ home          
│  ├─ home.html  
│  ├─ home.scss  
│  └─ home.ts    
├─ main          
│  ├─ main.html  
│  ├─ main.scss  
│  └─ main.ts    
└─ user          
   ├─ user.html  
   └─ user.scss  
```

并设置vite打包出口：

```js
// vite.config.js
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/views/main/main.html'),
        home: path.resolve(__dirname, 'src/views/home/home.html'),
        user: path.resolve(__dirname, 'src/views/user/user.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
```

最终执行`npm run build`打包的时候，会生成如下的文件：

```txt
dist                             
├─ assets                        
│  ├─ home.css                   
│  ├─ home.js                    
│  ├─ main.css                   
│  ├─ main.js                    
│  ├─ modulepreload-polyfill.js  
│  └─ user.css                   
└─ src                           
   └─ views                      
      ├─ home                    
      │  └─ home.html            
      ├─ main                    
      │  └─ main.html            
      └─ user                    
         └─ user.html            
```

也就是说，线上用于也必须通过`http://localhost/src/views/main/main.html` 来访问！有点怪怪的，我们预期的输出应该是：

```txt
dist                             
├─ assets                        
│  ├─ home.css                   
│  ├─ home.js                    
│  ├─ main.css                   
│  ├─ main.js                    
│  ├─ modulepreload-polyfill.js  
│  └─ user.css                   
├─ home.html                    
├─ main.html                    
└─ user.html                    
```

### 2.dev-server & HMR

```js
// vite.config.js
// ......
 server: {
    host: '0.0.0.0', // 允许外部访问
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
// ......
```

dev环境下采用 connect-history-api-fallback 提供路由支持, 或者自定义server中间件重定向

```bash
pnpm add connect-history-api-fallback -D
```

```js
// build/vite/vite-plugin-multi-page.ts
import history from 'connect-history-api-fallback';
// ......
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
      //           '🚀 ~ file: vite-plugin-multi-page.ts:137 ~ server.middlewares.use ~ req.url:',
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
//......
```
- xxx/main --->  xxx/src/views/main/main.html
- xxx/home --->  xxx/src/views/home/home.html
- xxx/user --->  xxx/src/views/user/user.html

### 3. tsx支持

```js
pnpm add react react-dom
```

```js
pnpm add typescript @types/react @types/react-dom @vitejs/plugin-react -D
```


### 4. 预处理器

### 5. 静态资源处理

#### font

#### img

#### scss

```bash
pnpm add sass -D
```

设置公共文件

```bash
mkdir src/styles
touch src/styles/global.scss
```

在 `vite.config.js` 中设置全局变量的文件
```js
// vite.config.js
// ......
 css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/global.scss";`,
      },
    },
  },

// ......
```

#### css


### 6. TS支持

```bash
pnpm add typescript -D
```
在项目根目录创建 `tsconfig.json` 文件：
```js
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "jsx": "preserve",
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "lib": ["ESNext", "DOM"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts"],
  "exclude": ["node_modules"]
}

```

### 6. 代码规范检查

- 请注意，Vite 仅执行 .ts 文件的转译工作，并不执行 任何类型检查。并假定类型检查已经被你的 IDE 或构建过程处理了。

```bash
pnpm add stylelint stylelint-config-standard-scss stylelint-order -D
```
创建 .stylelintrc.json 文件
```js
{
  "extends": ["stylelint-config-standard-scss"],
  "plugins": ["stylelint-order"],
  "rules": {
    "order/order": [
      "custom-properties",
      "dollar-variables",
      "declarations",
      "rules",
      "at-rules"
    ],
    "order/properties-alphabetical-order": true
  }
}

```

```bash
pnpm add eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-prettier eslint-config-prettier -D
```
| package name                     | remark |
| -------------------------------- | ------ |
| eslint                           |        |
| @typescript-eslint/parser        |        |
| @typescript-eslint/eslint-plugin |        |
| eslint-plugin-prettier           |        |
| eslint-config-prettier           |        |



 





```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off'
  }
};

```


### 7. 代码格式化

```bash
pnpm add prettier -D
```
`.prettierrc`
```js
{
  "singleQuote": true,
  "semi": true
}

```

## package list

| 包名                      | 说明                                         | 地址                                                     |
| ------------------------- | -------------------------------------------- | -------------------------------------------------------- |
| `vite-plugin-vue-layouts` | 使用 Vite 的 Vue 3应用程序的基于路由器的布局 | https://github.com/johncampionjr/vite-plugin-vue-layouts |

## 鸣谢

- https://laracasts.com/discuss/channels/vite/vite-mpa
- https://github.com/vbenjs/vite-plugin-html/blob/main/README.zh_CN.md
- https://github.com/Miofly/vite-plugin-multi-pages/tree/master