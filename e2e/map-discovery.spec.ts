import { test, expect } from '@playwright/test';
import { mockYandexMaps } from './helpers';
import { installMockApi } from './mock-api';

test('guest opens map marker popup and navigates to catalog details', async ({ page }) => {
  await mockYandexMaps(page);
  await installMockApi(page);
  await page.goto('/');

  await expect(page.getByLabel(/карта объектов саратовской области/i)).toBeVisible();
  await page.getByRole('button', { name: /энергетический маршрут тэц, энгельс/i }).click();
  await expect(page.locator('#map').getByRole('heading', { name: /энергетический маршрут тэц/i })).toBeVisible();

  await page.getByRole('button', { name: /подробнее из каталога/i }).click();
  await expect(page.locator('.fixed.inset-0').getByRole('heading', { name: /энергетический маршрут тэц/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /краткий профиль объекта/i })).toBeVisible();
});
