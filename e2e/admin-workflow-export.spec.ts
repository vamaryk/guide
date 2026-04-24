import { test, expect } from '@playwright/test';
import { loginToAdmin, mockYandexMaps } from './helpers';
import { installMockApi } from './mock-api';

test('manager logs in, finds booking, updates status and exports csv', async ({ page }) => {
  const uniqueContact = `e2e-manager-${Date.now()}@example.com`;

  await mockYandexMaps(page);
  await installMockApi(page);
  await page.goto('/');
  await page.getByPlaceholder(/ваше имя/i).fill('E2E Менеджер');
  await page.getByPlaceholder(/\+7 или email/i).fill(uniqueContact);
  await page.getByPlaceholder(/например, 25 апреля/i).fill('12 мая');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /отправить заявку/i }).click();
  await expect(page.getByText(/заявка на объект/i)).toBeVisible();

  await loginToAdmin(page);

  await page.getByPlaceholder(/имя, контакт, объект, комментарий/i).fill(uniqueContact);
  await page.locator('form').filter({ has: page.getByRole('button', { name: 'Найти' }) }).getByRole('button', { name: 'Найти' }).click();
  await expect(page.getByText(uniqueContact)).toBeVisible();

  await page.getByLabel(/комментарий менеджера/i).fill('E2E: подтверждено и поставлено в работу.');
  await page.locator('select').nth(1).selectOption('confirmed');
  await page.getByRole('button', { name: /сохранить workflow/i }).click();
  await expect(page.getByText(/workflow заявки обновлён/i)).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /экспорт csv/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('bookings-export.csv');
});
