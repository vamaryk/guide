# SDD-индекс

Этот файл теперь является точкой входа в SDD-документацию проекта.

## Структура SDD

- [docs/sdd/overview.md](C:/Users/mlnch/Desktop/гид/docs/sdd/overview.md) — контекст продукта, акторы, нефункциональные требования и Definition of Done
- [docs/sdd/landing-and-discovery.md](C:/Users/mlnch/Desktop/гид/docs/sdd/landing-and-discovery.md) — сценарии лендинга, каталога и карты
- [docs/sdd/booking.md](C:/Users/mlnch/Desktop/гид/docs/sdd/booking.md) — сценарий бронирования объекта
- [docs/sdd/admin-auth.md](C:/Users/mlnch/Desktop/гид/docs/sdd/admin-auth.md) — сценарий входа администратора
- [docs/sdd/admin-operations.md](C:/Users/mlnch/Desktop/гид/docs/sdd/admin-operations.md) — workflow заявок, CSV-экспорт и CRUD объектов
- [docs/sdd/traceability-matrix.md](C:/Users/mlnch/Desktop/гид/docs/sdd/traceability-matrix.md) — трассировка сценариев к тестам, API и коду
- [docs/site-checklist.md](C:/Users/mlnch/Desktop/гид/docs/site-checklist.md) — приёмка сценариев

## Feature-карта

- `SDD-1` Просмотр лендинга
- `SDD-2` Изучение объекта через каталог
- `SDD-3` Изучение объекта через карту
- `SDD-4` Бронирование объекта
- `SDD-5` Вход администратора
- `SDD-6` Workflow заявок в admin
- `SDD-7` Экспорт заявок в CSV
- `SDD-8` CRUD объектов в admin

## Как использовать

1. Выбрать существующий сценарий или добавить новый feature-документ.
2. Зафиксировать ожидаемое поведение и затрагиваемые данные.
3. Обновить traceability matrix.
4. Обновить тесты и чек-лист.
5. Прогнать `npm run test` и `npm run build`.
