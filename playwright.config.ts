import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',  // ← raw data goes here
      suiteTitle: true,
    }],
    ['html', { open: 'never' }],       // keep existing HTML report too
  ],
  // ... rest of your existing config
});