import history from 'connect-history-api-fallback';
import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { getHistoryReWriteRuleList } from './mpa-utils';

export function vitePluginHtmlServerMiddleware(): Plugin {
  return {
    name: 'vite-plugin-mpa-server-middleware',
    configureServer(server) {
      server.middlewares.use(
        history({
          rewrites: getHistoryReWriteRuleList({
            scanDir: 'src/views',
            scanFile: '*.ts',
            filename: '[name].html',
          }),
        }),
      );
    },
  };
}
