import { Plugin } from 'vite';
import fs from 'fs-extra';
import path from 'path';

function moveHtmlFiles(): Plugin {
  return {
    name: 'move-html-files',
    closeBundle: async () => {
      const srcDir = path.resolve(__dirname, 'dist/src/pages');
      const destDir = path.resolve(__dirname, 'dist');

      const entries = await fs.readdir(srcDir);

      for (const entry of entries) {
        const srcPath = path.join(srcDir, entry, 'index.html');
        const destPath = path.join(destDir, entry, 'index.html');

        if (await fs.pathExists(srcPath)) {
          await fs.move(srcPath, destPath, { overwrite: true });
        }
      }
      // 删除空的 src 目录
      await fs.remove(path.resolve(__dirname, 'dist/src'));
    },
  };
}
