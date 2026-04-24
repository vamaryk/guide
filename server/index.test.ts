import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createPasswordHash } from './auth';

process.env.ADMIN_LOGIN = 'admin';
process.env.ADMIN_PASSWORD_HASH = createPasswordHash('secret');

const { resetDatabase } = await import('./db');
const { app } = await import('./index');

async function loginAsAdmin() {
  const response = await request(app).post('/api/admin/login').send({
    login: 'admin',
    password: 'secret',
  });

  return response.body.token as string;
}

describe('backend api', () => {
  beforeEach(() => {
    resetDatabase();
  });

  it('returns health status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('authenticates admin and exposes session state', async () => {
    const loginResponse = await request(app).post('/api/admin/login').send({ login: 'admin', password: 'secret' });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeTypeOf('string');

    const sessionResponse = await request(app)
      .get('/api/admin/session')
      .set('x-admin-token', loginResponse.body.token);

    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.authenticated).toBe(true);
  });

  it('protects admin bookings route without token', async () => {
    const response = await request(app).get('/api/bookings');
    expect(response.status).toBe(401);
  });

  it('returns objects catalog publicly', async () => {
    const response = await request(app).get('/api/objects');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items[0]).toHaveProperty('slug');
  });

  it('creates booking with workflow defaults', async () => {
    const response = await request(app).post('/api/bookings').send({
      name: 'Тестовый пользователь',
      contact: '+7 900 000-00-00',
      format: 'Семейная экскурсия',
      date: '25 апреля',
      objectSlug: 'fabrika-mariya',
      consent: true,
    });

    expect(response.status).toBe(201);
    expect(response.body.booking.status).toBe('new');
    expect(response.body.booking.managerComment).toBe('');
    expect(response.body.booking.lastContactAt).toBeNull();
  });

  it('filters bookings, updates workflow and exports csv', async () => {
    await request(app).post('/api/bookings').send({
      name: 'Ирина',
      contact: '+7 900 000-00-02',
      format: 'Семейная экскурсия',
      date: '27 апреля',
      objectSlug: 'fabrika-mariya',
      consent: true,
    });

    const secondBooking = await request(app).post('/api/bookings').send({
      name: 'Дмитрий',
      contact: 'dm@example.com',
      format: 'Бизнес-визит',
      date: '28 апреля',
      objectSlug: 'balakovo-machine-cluster',
      consent: true,
    });

    const token = await loginAsAdmin();
    const patchResponse = await request(app)
      .patch(`/api/bookings/${secondBooking.body.booking.id}/workflow`)
      .set('x-admin-token', token)
      .send({
        status: 'confirmed',
        managerComment: 'Созвон проведен, группа подтверждена.',
        lastContactAt: '2026-04-11T10:00:00.000Z',
      });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.booking.status).toBe('confirmed');

    const filtered = await request(app)
      .get('/api/bookings')
      .set('x-admin-token', token)
      .query({ search: 'dm@example.com', status: 'confirmed' });

    expect(filtered.status).toBe(200);
    expect(filtered.body.items).toHaveLength(1);

    const csv = await request(app)
      .get('/api/bookings/export.csv')
      .set('x-admin-token', token)
      .query({ status: 'confirmed' });

    expect(csv.status).toBe(200);
    expect(csv.header['content-type']).toContain('text/csv');
    expect(csv.text).toContain('managerComment');
    expect(csv.text).toContain('Дмитрий');
  });

  it('creates, updates and deletes object through admin routes', async () => {
    const token = await loginAsAdmin();

    const newObject = {
      slug: 'test-object',
      name: 'Тестовый объект',
      city: 'Саратов',
      industry: 'Приборостроение',
      audience: 'Студенты',
      price: 'от 1000 ₽',
      duration: '2 часа',
      blurb: 'Подробная тестовая карточка для проверки CRUD маршрутов.',
      tags: ['Тест', 'Учебный'],
      coordinates: [51.5331, 46.0342],
      address: 'Саратов, тестовый адрес',
      safety: 'Инструктаж и сопровождение на протяжении всего маршрута.',
      format: 'Учебный маршрут',
      schedule: 'По записи',
      audienceDetails: 'Для учебных групп и кураторов.',
      includes: ['Вход', 'Гид'],
      highlights: ['Цех', 'Лаборатория'],
      fullDescription: 'Развернутое описание тестового объекта для проверки создания, обновления и удаления.',
    };

    const createResponse = await request(app).post('/api/objects').set('x-admin-token', token).send(newObject);
    expect(createResponse.status).toBe(201);

    const updateResponse = await request(app)
      .put('/api/objects/test-object')
      .set('x-admin-token', token)
      .send({ ...newObject, name: 'Обновленный тестовый объект' });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.item.name).toBe('Обновленный тестовый объект');

    const deleteResponse = await request(app).delete('/api/objects/test-object').set('x-admin-token', token);
    expect(deleteResponse.status).toBe(200);
  });
});
