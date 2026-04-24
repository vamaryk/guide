import { expect, Page } from '@playwright/test';

export async function mockYandexMaps(page: Page) {
  await page.addInitScript(() => {
    class MockYMap {
      host: HTMLElement;

      constructor(element: HTMLElement) {
        this.host = element;
      }

      addChild(child: unknown) {
        const marker = child as { __markerElement?: HTMLElement } | undefined;
        if (marker?.__markerElement) {
          this.host.appendChild(marker.__markerElement);
        }
        return child;
      }

      destroy() {}
    }

    class MockLayer {}

    class MockMarker {
      __markerElement: HTMLElement;

      constructor(_props: unknown, element: HTMLElement) {
        this.__markerElement = element;
      }
    }

    (window as Window & { ymaps3?: unknown }).ymaps3 = {
      ready: Promise.resolve(),
      YMap: MockYMap,
      YMapDefaultSchemeLayer: MockLayer,
      YMapDefaultFeaturesLayer: MockLayer,
      YMapMarker: MockMarker,
    };
  });
}

export async function loginToAdmin(page: Page) {
  await page.goto('/admin');
  await page.getByLabel(/Логин администратора/i).fill('admin');
  await page.getByLabel(/Пароль администратора/i).fill('e2e-admin-password');
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page.getByRole('heading', { name: /заявки, workflow и каталог объектов/i })).toBeVisible();
}
