import { test, expect } from '@playwright/test';
import { mockYandexMaps } from './helpers';
import { installMockApi } from './mock-api';

test('guest opens object details and submits booking', async ({ page }) => {
  await mockYandexMaps(page);
  await installMockApi(page);
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /гид по промышленному туризму саратовской области/i }),
  ).toBeVisible();

  await page.locator('#catalog').getByRole('button', { name: /подробнее/i }).first().click();
  await expect(page.getByRole('heading', { name: /краткий профиль объекта/i })).toBeVisible();

  await page.getByRole('button', { name: /забронировать объект/i }).click();
  await page.getByPlaceholder(/ваше имя/i).fill('E2E Гость');
  await page.getByPlaceholder(/\+7 или email/i).fill('e2e-guest@example.com');
  await page.getByPlaceholder(/например, 25 апреля/i).fill('30 апреля');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /отправить заявку/i }).click();

  await expect(page.getByText(/заявка на объект/i)).toBeVisible();
});
