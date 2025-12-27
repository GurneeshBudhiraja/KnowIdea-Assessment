import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  outDir: "dist/",
  webExt: {
    disabled: true,
  },
  manifest: {
    action: {
      default_title: 'KnowIdea Gmail Plugin',
    },
    icons: {
      "16": "./icon/icon.png"
    },
    permissions: ['tabs'],
  },
});
