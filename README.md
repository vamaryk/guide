# Гид по промышленному туризму Саратовской области

Одностраничный сайт в стиле glassmorphism, собранный на `React + TypeScript + Vite + Tailwind CSS` по материалам из `concept.md`, `R.md` и `TA.md`.

## Документация по SDD

Проектовая документация перестроена в формате `Scenario-Driven Development`.

Основные документы:
- [docs/sdd.md](C:/Users/mlnch/Desktop/гид/docs/sdd.md) — индекс SDD-документации
- [docs/sdd/overview.md](C:/Users/mlnch/Desktop/гид/docs/sdd/overview.md) — контекст, акторы и нефункциональные требования
- [docs/sdd/landing-and-discovery.md](C:/Users/mlnch/Desktop/гид/docs/sdd/landing-and-discovery.md) — сценарии лендинга, каталога и карты
- [docs/sdd/booking.md](C:/Users/mlnch/Desktop/гид/docs/sdd/booking.md) — сценарий бронирования
- [docs/sdd/admin-auth.md](C:/Users/mlnch/Desktop/гид/docs/sdd/admin-auth.md) — сценарий входа администратора
- [docs/sdd/admin-operations.md](C:/Users/mlnch/Desktop/гид/docs/sdd/admin-operations.md) — workflow, CSV и CRUD объектов
- [docs/sdd/traceability-matrix.md](C:/Users/mlnch/Desktop/гид/docs/sdd/traceability-matrix.md) — матрица трассировки `scenario -> tests -> API -> code`
- [docs/site-checklist.md](C:/Users/mlnch/Desktop/гид/docs/site-checklist.md) — приёмка по сценариям

Практический смысл для этого репозитория:
- сначала формулируется пользовательский или операционный сценарий
- затем к нему привязываются UI, API, данные и хранение
- после этого добавляется автоматическая или ручная проверка сценария

## Запуск

```bash
pnpm install
cp .env.example .env
```

Сгенерируйте hash пароля администратора:

```bash
npm run admin:hash-password -- "your-strong-password"
```

Вставьте результат в `ADMIN_PASSWORD_HASH` внутри `.env`, затем запустите frontend и backend в двух терминалах:

```bash
npm run dev
npm run server:dev
```

## Переменные окружения

Базовая конфигурация вынесена в `.env.example`:

```bash
PORT=8787
VITE_YANDEX_MAPS_API_KEY=your_yandex_maps_key
ADMIN_LOGIN=admin
ADMIN_PASSWORD_HASH=replace_with_generated_hash
```

Что важно:
- `VITE_YANDEX_MAPS_API_KEY` нужен для реальной карты Яндекс.
- `ADMIN_LOGIN` и `ADMIN_PASSWORD_HASH` используются backend-авторизацией `/admin`.
- Plain-text пароль в коде больше не хранится.

## Сборка

```bash
npm run build
npm run preview
```

## Тесты

```bash
npm run test
```

## E2E

Базовый браузерный контур собран на Playwright.

Запуск:

```bash
npm run e2e
```

Для отладки в окне браузера:

```bash
npm run e2e:headed
```

Что покрыто:
- `Гость -> каталог -> подробнее -> бронирование`
- `Гость -> карта -> popup -> подробности объекта`
- `Менеджер -> login -> поиск заявки -> смена статуса -> CSV export`
- `Менеджер -> создание объекта -> проверка появления на лендинге`

Playwright поднимает frontend через `webServer`, а API в e2e замещается stateful mock-контуром внутри тестов. Это даёт воспроизводимые браузерные сценарии без зависимости от `tsx`-старта backend в текущей среде.

## Что реализовано

- hero-секция с сегментацией аудитории
- интерактивная карта региона
- каталог экскурсий с фильтрацией
- секции: о проекте, преимущества, как это работает, галерея, FAQ
- блок партнёров
- финальный CTA и форма заявки
- карта объектов на Яндекс Картах с реальными координатами по Саратовской области
- popup-связка карты с каталогом и модальные карточки объектов
- backend API для объектов, бронирований и admin-сессий
- SQLite-хранилище для каталога, заявок и admin-сессий
- функциональная форма бронирования с отправкой на `/api/bookings`
- защищённая `/admin` с логином и hash-пароля
- workflow заявок со статусами и комментарием менеджера
- экспорт заявок из админки в CSV
- чек-лист приёмки в `docs/site-checklist.md`
- автотесты frontend и backend

## Сценарии MVP

Текущий MVP описан через восемь основных сценариев:

- `SDD-1` просмотр лендинга
- `SDD-2` изучение объекта через каталог
- `SDD-3` изучение объекта через карту
- `SDD-4` бронирование объекта
- `SDD-5` вход администратора
- `SDD-6` workflow заявок в admin
- `SDD-7` экспорт заявок в CSV
- `SDD-8` CRUD объектов в admin

Подробное описание теперь разложено по feature-документам в `docs/sdd/`, а общая навигация лежит в `docs/sdd.md`.

## Backend API

Базовый сервер лежит в `server/` и реализует:

- `GET /api/health`
- `POST /api/admin/login`
- `GET /api/admin/session`
- `POST /api/admin/logout`
- `GET /api/objects`
- `GET /api/objects/:slug`
- `POST /api/objects`
- `PUT /api/objects/:slug`
- `DELETE /api/objects/:slug`
- `GET /api/bookings`
- `GET /api/bookings/export.csv`
- `POST /api/bookings`
- `PATCH /api/bookings/:id/workflow`

Хранилище:
- SQLite база: `server/data/catalog.sqlite`
- JSON-файлы `server/data/objects.json` и `server/data/bookings.json` используются как источник начальной миграции

## Admin

Админ-панель доступна по пути:

```text
/admin
```

В ней доступны:
- вход по `ADMIN_LOGIN` и `ADMIN_PASSWORD_HASH`
- поиск заявок по имени, контакту, формату, `objectSlug` и комментарию
- фильтрация заявок по статусам `new`, `contacted`, `in_progress`, `confirmed`, `done`, `canceled`
- обновление workflow заявки и комментария менеджера
- экспорт текущего списка заявок в CSV
- создание, редактирование и удаление объектов каталога

## Проверка по SDD

Для изменений в проекте удобно использовать такой порядок:

1. Зафиксировать сценарий или изменить существующий feature-документ в `docs/sdd/`.
2. Обновить [docs/sdd/traceability-matrix.md](C:/Users/mlnch/Desktop/гид/docs/sdd/traceability-matrix.md).
3. Проверить, какие UI/API/данные сценарий затрагивает.
4. Обновить автотесты или приёмочный чек-лист.
5. Прогнать `npm run test` и `npm run build`.

## Процесс для новых изменений

Рекомендуемый рабочий цикл:

1. Сначала выбрать или создать сценарий в `docs/sdd/`.
2. Затем обновить traceability matrix.
3. Только после этого менять код.
4. Завершать задачу обновлением тестов и чек-листа.

## Структура

```text
src/
  App.tsx
  admin/AdminPage.tsx
  index.css
  main.tsx

server/
  auth.ts
  db.ts
  hash-password.ts
  index.ts
```
