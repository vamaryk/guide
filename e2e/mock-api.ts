import type { Page, Route } from '@playwright/test';

type Audience = 'Семьи' | 'Студенты' | 'Бизнес';
type BookingStatus = 'new' | 'contacted' | 'in_progress' | 'confirmed' | 'done' | 'canceled';

type Excursion = {
  slug: string;
  name: string;
  city: string;
  industry: string;
  audience: Audience;
  price: string;
  duration: string;
  blurb: string;
  tags: string[];
  coordinates: [number, number];
  address: string;
  safety: string;
  format: string;
  schedule: string;
  audienceDetails: string;
  includes: string[];
  highlights: string[];
  fullDescription: string;
};

type Booking = {
  id: string;
  name: string;
  contact: string;
  format: string;
  date: string;
  objectSlug: string;
  consent: true;
  status: BookingStatus;
  managerComment: string;
  lastContactAt: string | null;
  updatedAt: string;
  createdAt: string;
};

type MockState = {
  objects: Excursion[];
  bookings: Booking[];
  sessions: Set<string>;
};

function nowIso() {
  return new Date().toISOString();
}

function createSeedState(): MockState {
  return {
    sessions: new Set<string>(),
    bookings: [],
    objects: [
      {
        slug: 'fabrika-mariya',
        name: 'Фабрика «Мария»',
        city: 'Саратов',
        industry: 'Пищевая промышленность',
        audience: 'Семьи',
        price: 'от 500 ₽',
        duration: '1.5 часа',
        blurb: 'Экскурсия по производственной линии, мастер-класс и безопасный маршрут для детей 7+.',
        tags: ['Для детей 7+', 'Сувенир'],
        coordinates: [46.0244, 51.5922],
        address: 'Саратов, промышленная зона',
        safety: 'Инструктаж и сопровождение гида.',
        format: 'Семейная экскурсия выходного дня',
        schedule: 'Сб–Вс, 11:00 / 14:00',
        audienceDetails: 'Для семей с детьми и школьных мини-групп.',
        includes: ['Вход на объект', 'Сопровождение гида'],
        highlights: ['Производственная линия', 'Фото-зона'],
        fullDescription: 'Маршрут показывает, как устроено современное производство, через понятные семейные сценарии.',
      },
      {
        slug: 'engels-tec-tour',
        name: 'Энергетический маршрут ТЭЦ',
        city: 'Энгельс',
        industry: 'Энергетика',
        audience: 'Студенты',
        price: 'бесплатно',
        duration: '2 часа',
        blurb: 'Живой разговор с инженерами, карьерные треки и сертификат участника.',
        tags: ['Бесплатно', 'Сертификат'],
        coordinates: [46.1266, 51.4803],
        address: 'Энгельс, энергетический комплекс',
        safety: 'Инструктаж и сопровождение инженера.',
        format: 'Профориентационный маршрут для учебных групп',
        schedule: 'Будни, 10:00 / 13:00',
        audienceDetails: 'Для школьных и студенческих групп.',
        includes: ['Экскурсия по объекту', 'Сертификат участника'],
        highlights: ['Энергетическая инфраструктура', 'Диалог с экспертами'],
        fullDescription: 'Экскурсия для профориентации и знакомства с современной энергетикой.',
      },
      {
        slug: 'balakovo-machine-cluster',
        name: 'Машиностроительный кластер',
        city: 'Балаково',
        industry: 'Машиностроение',
        audience: 'Бизнес',
        price: 'по запросу',
        duration: '3 часа',
        blurb: 'Индивидуальный сценарий для команд: экскурсия, экспертная сессия и деловой нетворкинг.',
        tags: ['Для бизнеса', 'Кастомизация'],
        coordinates: [47.8204, 52.0317],
        address: 'Балаково, индустриальный парк',
        safety: 'Персональный маршрут и согласованный состав группы.',
        format: 'B2B-визит с экспертной частью',
        schedule: 'По согласованию',
        audienceDetails: 'Для корпоративных команд и партнёров.',
        includes: ['Индивидуальная программа', 'Экспертная сессия'],
        highlights: ['Производственные решения', 'Нетворкинг'],
        fullDescription: 'Формат для компаний, которым нужен содержательный визит на предприятие.',
      },
    ],
  };
}

function json(route: Route, status: number, payload: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(payload),
  });
}

function getToken(route: Route) {
  return route.request().headers()['x-admin-token'] ?? '';
}

function isAuthorized(route: Route, state: MockState) {
  const token = getToken(route);
  return Boolean(token && state.sessions.has(token));
}

function matchesSearch(booking: Booking, search: string) {
  const query = search.toLowerCase();
  return [booking.name, booking.contact, booking.objectSlug, booking.format, booking.managerComment]
    .join(' ')
    .toLowerCase()
    .includes(query);
}

function filterBookings(state: MockState, requestUrl: URL) {
  const search = requestUrl.searchParams.get('search')?.trim() ?? '';
  const status = requestUrl.searchParams.get('status')?.trim() ?? '';

  return state.bookings.filter((booking) => {
    if (status && booking.status !== status) return false;
    if (search && !matchesSearch(booking, search)) return false;
    return true;
  });
}

export async function installMockApi(page: Page) {
  const state = createSeedState();

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === '/api/objects' && method === 'GET') {
      return json(route, 200, { items: state.objects });
    }

    if (path.startsWith('/api/objects/') && method === 'GET') {
      const slug = path.split('/').pop() ?? '';
      const item = state.objects.find((object) => object.slug === slug);
      return item
        ? json(route, 200, item)
        : json(route, 404, { message: 'Объект не найден.' });
    }

    if (path === '/api/bookings' && method === 'POST') {
      const body = JSON.parse(request.postData() ?? '{}') as Omit<Booking, 'id' | 'status' | 'managerComment' | 'lastContactAt' | 'updatedAt' | 'createdAt'>;
      const object = state.objects.find((item) => item.slug === body.objectSlug);
      if (!object) {
        return json(route, 400, { message: 'Выбранный объект не найден.' });
      }

      const createdAt = nowIso();
      const booking: Booking = {
        ...body,
        consent: true,
        id: `booking_${Date.now()}`,
        status: 'new',
        managerComment: '',
        lastContactAt: null,
        updatedAt: createdAt,
        createdAt,
      };
      state.bookings.unshift(booking);
      return json(route, 201, {
        message: `Заявка на объект «${object.name}» отправлена. Менеджер свяжется с вами.`,
        booking,
      });
    }

    if (path === '/api/admin/login' && method === 'POST') {
      const body = JSON.parse(request.postData() ?? '{}') as { login?: string; password?: string };
      if (body.login !== 'admin' || body.password !== 'e2e-admin-password') {
        return json(route, 401, { message: 'Неверный логин или пароль администратора.' });
      }

      const token = `token_${Date.now()}`;
      state.sessions.add(token);
      return json(route, 200, { token, message: 'Авторизация выполнена.' });
    }

    if (path === '/api/admin/session' && method === 'GET') {
      return json(route, 200, { authenticated: isAuthorized(route, state) });
    }

    if (path === '/api/admin/logout' && method === 'POST') {
      state.sessions.delete(getToken(route));
      return json(route, 200, { message: 'Сессия администратора завершена.' });
    }

    if (path === '/api/bookings' && method === 'GET') {
      if (!isAuthorized(route, state)) {
        return json(route, 401, { message: 'Требуется авторизация администратора.' });
      }

      return json(route, 200, { items: filterBookings(state, url) });
    }

    if (path === '/api/bookings/export.csv' && method === 'GET') {
      if (!isAuthorized(route, state)) {
        return json(route, 401, { message: 'Требуется авторизация администратора.' });
      }

      const items = filterBookings(state, url);
      const header = 'id,name,contact,format,date,objectSlug,status,managerComment,lastContactAt,updatedAt,createdAt';
      const rows = items.map((item) =>
        [
          item.id,
          item.name,
          item.contact,
          item.format,
          item.date,
          item.objectSlug,
          item.status,
          item.managerComment,
          item.lastContactAt ?? '',
          item.updatedAt,
          item.createdAt,
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(','),
      );

      return route.fulfill({
        status: 200,
        contentType: 'text/csv; charset=utf-8',
        headers: {
          'content-disposition': 'attachment; filename="bookings-export.csv"',
        },
        body: [header, ...rows].join('\n'),
      });
    }

    if (path.startsWith('/api/bookings/') && path.endsWith('/workflow') && method === 'PATCH') {
      if (!isAuthorized(route, state)) {
        return json(route, 401, { message: 'Требуется авторизация администратора.' });
      }

      const bookingId = path.split('/')[3] ?? '';
      const booking = state.bookings.find((item) => item.id === bookingId);
      if (!booking) {
        return json(route, 404, { message: 'Заявка не найдена.' });
      }

      const body = JSON.parse(request.postData() ?? '{}') as {
        status: BookingStatus;
        managerComment: string;
        lastContactAt?: string | null;
      };
      booking.status = body.status;
      booking.managerComment = body.managerComment;
      booking.lastContactAt = body.lastContactAt ?? null;
      booking.updatedAt = nowIso();

      return json(route, 200, { message: 'Workflow заявки обновлён.', booking });
    }

    if (path === '/api/objects' && method === 'POST') {
      if (!isAuthorized(route, state)) {
        return json(route, 401, { message: 'Требуется авторизация администратора.' });
      }

      const body = JSON.parse(request.postData() ?? '{}') as Excursion;
      state.objects.unshift(body);
      return json(route, 201, { message: 'Объект создан.', item: body });
    }

    if (path.startsWith('/api/objects/') && method === 'PUT') {
      if (!isAuthorized(route, state)) {
        return json(route, 401, { message: 'Требуется авторизация администратора.' });
      }

      const previousSlug = path.split('/').pop() ?? '';
      const body = JSON.parse(request.postData() ?? '{}') as Excursion;
      const index = state.objects.findIndex((item) => item.slug === previousSlug);
      if (index === -1) {
        return json(route, 404, { message: 'Объект не найден.' });
      }

      state.objects[index] = body;
      return json(route, 200, { message: 'Объект обновлён.', item: body });
    }

    if (path.startsWith('/api/objects/') && method === 'DELETE') {
      if (!isAuthorized(route, state)) {
        return json(route, 401, { message: 'Требуется авторизация администратора.' });
      }

      const slug = path.split('/').pop() ?? '';
      const index = state.objects.findIndex((item) => item.slug === slug);
      if (index === -1) {
        return json(route, 404, { message: 'Объект не найден.' });
      }

      state.objects.splice(index, 1);
      return json(route, 200, { message: 'Объект удалён.' });
    }

    return route.abort();
  });

  return state;
}
