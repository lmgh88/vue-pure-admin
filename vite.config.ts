import { resolve } from "path";
import { UserConfigExport, ConfigEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { loadEnv } from "./build/utils";
import { createProxy } from "./build/proxy";
import { viteMockServe } from "vite-plugin-mock";
import svgLoader from "vite-svg-loader";
import styleImport from "vite-plugin-style-import";
import VitePluginElementPlus from "vite-plugin-element-plus";

const pathResolve = (dir: string): any => {
  return resolve(__dirname, ".", dir);
};

const { VITE_PORT, VITE_PUBLIC_PATH, VITE_PROXY } = loadEnv();

const alias: Record<string, string> = {
  "/@": pathResolve("src"),
  //解决开发环境下的警告 You are running the esm-bundler build of vue-i18n. It is recommended to configure your bundler to explicitly replace feature flag globals with boolean literals to get proper tree-shaking in the final bundle.
  "vue-i18n": "vue-i18n/dist/vue-i18n.cjs.js"
};

const root: string = process.cwd();

export default ({ command }: ConfigEnv): UserConfigExport => {
  const prodMock = true;
  return {
    /**
     * 基本公共路径
     * /manages/ 可根据项目部署域名的后缀自行填写（全局搜/manages/替换）
     * @default '/'
     */
    base:
      process.env.NODE_ENV === "production" ? "/manages/" : VITE_PUBLIC_PATH,
    root,
    resolve: {
      alias
    },
    // 服务端渲染
    server: {
      // 是否开启 https
      https: false,
      /**
       * 端口号
       * @default 3000
       */
      port: VITE_PORT,
      host: "0.0.0.0",
      // 本地跨域代理
      proxy: createProxy(VITE_PROXY)
    },
    plugins: [
      vue(),
      vueJsx(),
      svgLoader(),
      styleImport({
        libs: [
          // 按需加载vxe-table
          {
            libraryName: "vxe-table",
            esModule: true,
            resolveComponent: name => `vxe-table/es/${name}`,
            resolveStyle: name => `vxe-table/es/${name}/style.css`
          }
        ]
      }),
      VitePluginElementPlus({ useSource: true }),
      viteMockServe({
        mockPath: "mock",
        localEnabled: command === "serve",
        prodEnabled: command !== "serve" && prodMock,
        injectCode: `
          import { setupProdMockServer } from './mockProdServer';
          setupProdMockServer();
        `,
        logger: true
      })
    ],
    optimizeDeps: {
      include: [
        "element-plus/lib/locale/lang/zh-cn",
        "element-plus/lib/locale/lang/en",
        "vxe-table/lib/locale/lang/zh-CN",
        "vxe-table/lib/locale/lang/en-US"
      ]
    },
    build: {
      // @ts-ignore
      sourcemap: false,
      brotliSize: false,
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 2000
    },
    define: {
      __INTLIFY_PROD_DEVTOOLS__: false
    }
  };
};
