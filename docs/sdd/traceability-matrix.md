# Traceability Matrix

## Матрица трассировки

| Scenario | Что проверяем | Автотесты | API | Основной код |
| --- | --- | --- | --- | --- |
| `SDD-1` | Лендинг загружается, каталог приходит с backend, навигация не блокирует поток пользователя | `src/App.test.tsx` -> `renders the main title and loads catalog from backend`; `e2e/landing-booking.spec.ts` | `GET /api/objects` | `src/App.tsx`, `src/index.css` |
| `SDD-2` | Фильтрация каталога и открытие подробной карточки объекта | `src/App.test.tsx` -> `filters catalog cards by audience`, `opens detailed object modal from catalog`; `e2e/landing-booking.spec.ts` | `GET /api/objects`, `GET /api/objects/:slug` | `src/App.tsx` |
| `SDD-3` | Карта объектов, popup и переход к подробностям объекта | `e2e/map-discovery.spec.ts`; ручная приёмка в `docs/site-checklist.md` | frontend-интеграция с картой | `src/components/YandexRegionMap.tsx`, `src/App.tsx` |
| `SDD-4` | Отправка заявки и создание записи со статусом `new` | `src/App.test.tsx` -> `submits booking form`; `server/index.test.ts` -> `creates booking with workflow defaults`; `e2e/landing-booking.spec.ts`, `e2e/admin-workflow-export.spec.ts` | `POST /api/bookings` | `src/App.tsx`, `server/index.ts`, `server/db.ts` |
| `SDD-5` | Вход в admin по логину и hash-паролю, проверка сессии | `src/admin/AdminPage.test.tsx` -> `shows login form before authorization`, `authorizes and loads objects and bookings`; `server/index.test.ts` -> `authenticates admin and exposes session state`, `protects admin bookings route without token`; `e2e/admin-workflow-export.spec.ts`, `e2e/admin-object-crud.spec.ts` | `POST /api/admin/login`, `GET /api/admin/session`, `POST /api/admin/logout` | `src/admin/AdminPage.tsx`, `server/index.ts`, `server/auth.ts` |
| `SDD-6` | Поиск, фильтрация и сохранение workflow заявки | `src/admin/AdminPage.test.tsx` -> `sends search and workflow update after login`; `server/index.test.ts` -> `filters bookings, updates workflow and exports csv`; `e2e/admin-workflow-export.spec.ts` | `GET /api/bookings`, `PATCH /api/bookings/:id/workflow` | `src/admin/AdminPage.tsx`, `server/index.ts`, `server/db.ts` |
| `SDD-7` | Экспорт текущей выборки заявок в CSV | `src/admin/AdminPage.test.tsx` -> `exports bookings to csv`; `server/index.test.ts` -> `filters bookings, updates workflow and exports csv`; `e2e/admin-workflow-export.spec.ts` | `GET /api/bookings/export.csv` | `src/admin/AdminPage.tsx`, `server/index.ts` |
| `SDD-8` | Создание, обновление и удаление объектов каталога | `src/admin/AdminPage.test.tsx` -> `submits object create form`; `server/index.test.ts` -> `creates, updates and deletes object through admin routes`; `e2e/admin-object-crud.spec.ts` | `GET /api/objects`, `POST /api/objects`, `PUT /api/objects/:slug`, `DELETE /api/objects/:slug` | `src/admin/AdminPage.tsx`, `server/index.ts`, `server/db.ts` |

## Как обновлять матрицу

1. При появлении нового сценария добавить новую строку.
2. Указать хотя бы один источник проверки: автотест или ручную приёмку.
3. Указать минимальный набор API и файлов, без которых сценарий не работает.
4. Если сценарий не покрыт автотестом, явно оставить ссылку на ручную проверку.
