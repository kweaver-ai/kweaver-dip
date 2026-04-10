import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import path from 'path';
import { name } from './package.json';

const packageName = name.split('/')[1];
const TEMPLATE_PATH = './templates/index.html'; // HTML 模板路径

declare const process: {
  env: {
    NODE_ENV?: string;
  };
};

const DEV_PORT = 1105; // 开发服务器端口

export default defineConfig({
  // ========== 插件配置 ==========
  plugins: [
    pluginReact(),
    pluginLess({
      lessLoaderOptions: {
        lessOptions: {
          javascriptEnabled: true,
          modifyVars: {
            '@ant-prefix': packageName, // 自定义前缀，避免与其他项目冲突
          },
        },
      },
    }),
    pluginSvgr({
      svgrOptions: {
        exportType: 'default', // 导出默认组件
      },
    }),
  ],

  // ========== 构建配置 ==========
  source: {
    entry: {
      index: './src/index.tsx',
    },
  },

  resolve: {
    // 配置别名，支持TypeScript路径映射
    alias: {
      // 配置 TypeScript 路径映射对应的别名
      '@': path.resolve(__dirname, 'src'),
    },
  },

  html: {
    template: TEMPLATE_PATH,
    mountId: packageName + '-root', // 修改根元素的 id
  },

  output: {
    // 开发环境生成 sourcemap，生产环境不生成
    sourceMap: {
      js: process.env.NODE_ENV === 'development' ? 'eval-source-map' : false,
      css: process.env.NODE_ENV === 'development',
    },
    assetPrefix: './', // 静态资源路径前缀，用于解决相对路径问题
    polyfill: 'usage', // 仅引入使用到的polyfill，减小包大小
  },

  // ========== 开发环境配置 ==========
  server: {
    port: DEV_PORT,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },

  dev: {
    assetPrefix: './', // 静态资源路径前缀，用于解决相对路径问题
    client: {
      protocol: 'ws',
      host: 'localhost',
      port: DEV_PORT,
    },
    lazyCompilation: false,
  },

  // ========== 微前端配置 ==========
  tools: {
    rspack: {
      output: {
        library: packageName,
        libraryTarget: 'umd',
        chunkLoadingGlobal: `webpackJsonp_${packageName}`,
      },
    },
  },
});
