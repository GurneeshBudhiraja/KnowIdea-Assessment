import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    action: {
      default_title: 'Know Idea Gmail Plugin',
    },
    icons: {
      "16": "./icon/icon.png"
    }
  },
});
