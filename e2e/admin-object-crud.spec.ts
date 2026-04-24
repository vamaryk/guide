import { test, expect } from '@playwright/test';
import { loginToAdmin, mockYandexMaps } from './helpers';
import { installMockApi } from './mock-api';

test('manager creates object in admin and sees it on landing', async ({ page }) => {
  const slug = `e2e-object-${Date.now()}`;
  const name = `E2E Объект ${Date.now()}`;

  await installMockApi(page);
  await loginToAdmin(page);

  await page.getByRole('button', { name: /новый объект/i }).click();
  await page.getByLabel('Slug').fill(slug);
  await page.getByLabel('Название').fill(name);
  await page.getByLabel('Город').fill('Саратов');
  await page.getByLabel('Индустрия').fill('Тестовая индустрия');
  await page.getByLabel('Цена').fill('от 123 ₽');
  await page.getByLabel('Длительность').fill('1 час');
  await page.getByLabel('Теги').fill('Тест, E2E');
  await page.getByLabel('Краткое описание').fill('Достаточно длинное описание объекта для проверки e2e-сценария.');
  await page.getByLabel('Адрес').fill('Саратов, тестовый адрес');
  await page.getByLabel('Безопасность').fill('Инструктаж, сопровождение и согласованный безопасный маршрут.');
  await page.getByLabel('Формат').fill('Тестовый визит');
  await page.getByLabel('График').fill('По записи');
  await page.getByLabel('Описание аудитории').fill('Для групп, которым нужен тестовый сценарий посещения.');
  await page.getByLabel('Что входит').fill('Вход, гид');
  await page.getByLabel('Ключевые точки').fill('Цех, лаборатория');
  await page.getByLabel('Полное описание').fill(
    'Подробное описание тестового объекта для e2e-проверки создания и появления в общем каталоге сайта.',
  );
  await page.getByRole('button', { name: /создать объект/i }).click();

  await expect(page.getByText(/объект создан/i)).toBeVisible();

  await mockYandexMaps(page);
  await page.goto('/');
  await expect(page.locator('#catalog').getByRole('heading', { name })).toBeVisible();
});
