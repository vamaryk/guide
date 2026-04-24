import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPage } from './AdminPage';

const mockObjects = [
  {
    slug: 'fabrika-mariya',
    name: 'Фабрика «Мария»',
    city: 'Саратов',
    industry: 'Пищевая промышленность',
    audience: 'Семьи',
    price: 'от 500 ₽',
    duration: '1.5 часа',
    blurb: 'Экскурсия по производственной линии и мастер-класс.',
    tags: ['Для детей 7+'],
    coordinates: [51.5922, 46.0244],
    address: 'Саратов',
    safety: 'Инструктаж',
    format: 'Семейная экскурсия',
    schedule: 'Сб–Вс',
    audienceDetails: 'Для семей',
    includes: ['Вход'],
    highlights: ['Линия'],
    fullDescription: 'Полное описание объекта для теста админки.',
  },
];

const mockBookings = [
  {
    id: 'booking_1',
    name: 'Ирина',
    contact: '+79000000000',
    format: 'Семейная экскурсия',
    date: '25 апреля',
    objectSlug: 'fabrika-mariya',
    consent: true,
    status: 'new',
    managerComment: '',
    lastContactAt: null,
    updatedAt: '2026-04-10T10:00:00.000Z',
    createdAt: '2026-04-10T10:00:00.000Z',
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();

  vi.stubGlobal('URL', {
    ...window.URL,
    createObjectURL: vi.fn(() => 'blob:test'),
    revokeObjectURL: vi.fn(),
  });

  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const headers = init?.headers as Record<string, string> | undefined;

      if (url === '/api/admin/login' && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ token: 'token-1', message: 'Авторизация выполнена.' }),
        } as Response);
      }

      if (url === '/api/admin/session') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ authenticated: headers?.['x-admin-token'] === 'token-1' }),
        } as Response);
      }

      if (url === '/api/admin/logout' && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Сессия завершена.' }),
        } as Response);
      }

      if (url === '/api/objects' && (!init || !init.method)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: mockObjects }),
        } as Response);
      }

      if (url.startsWith('/api/bookings/export.csv')) {
        return Promise.resolve({
          ok: true,
          blob: async () => new Blob(['id,name\n1,Ирина'], { type: 'text/csv' }),
        } as Response);
      }

      if (url.startsWith('/api/bookings') && (!init || !init.method)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: mockBookings }),
        } as Response);
      }

      if (url.includes('/workflow') && init?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Workflow заявки обновлён.' }),
        } as Response);
      }

      if (url === '/api/objects' && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Объект создан.', item: mockObjects[0] }),
        } as Response);
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    }),
  );
});

describe('AdminPage', () => {
  it('shows login form before authorization', () => {
    render(<AdminPage />);
    expect(screen.getByRole('heading', { name: /Вход в административную панель/i })).toBeInTheDocument();
  });

  it('authorizes and loads objects and bookings', async () => {
    render(<AdminPage />);

    fireEvent.change(screen.getByLabelText(/Логин администратора/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/Пароль администратора/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByText('Фабрика «Мария»')).toBeInTheDocument();
      expect(screen.getByText('Ирина')).toBeInTheDocument();
    });
  });

  it('sends search and workflow update after login', async () => {
    const fetchSpy = vi.mocked(fetch);
    render(<AdminPage />);

    fireEvent.change(screen.getByLabelText(/Логин администратора/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/Пароль администратора/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByText('Ирина')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Имя, контакт, объект, комментарий/i), {
      target: { value: 'Ирина' },
    });
    fireEvent.change(screen.getByDisplayValue('Все статусы'), { target: { value: 'new' } });
    fireEvent.click(screen.getByRole('button', { name: 'Найти' }));

    fireEvent.change(screen.getByLabelText(/Комментарий менеджера/i), {
      target: { value: 'Перезвонили и подтвердили интерес.' },
    });
    fireEvent.change(screen.getAllByDisplayValue('Новые')[1], { target: { value: 'confirmed' } });
    fireEvent.click(screen.getByRole('button', { name: /Сохранить workflow/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/bookings?search=%D0%98%D1%80%D0%B8%D0%BD%D0%B0&status=new'),
        expect.anything(),
      );
      expect(screen.getByText(/Workflow заявки обновлён/i)).toBeInTheDocument();
    });
  });

  it('exports bookings to csv', async () => {
    const clickSpy = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickSpy);

    render(<AdminPage />);

    fireEvent.change(screen.getByLabelText(/Логин администратора/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/Пароль администратора/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByText('Ирина')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Экспорт CSV/i }));

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  it('submits object create form', async () => {
    render(<AdminPage />);

    fireEvent.change(screen.getByLabelText(/Логин администратора/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/Пароль администратора/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByText('Фабрика «Мария»')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Новый объект/i }));
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'new-object' } });
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Новый объект' } });
    fireEvent.change(screen.getByLabelText('Город'), { target: { value: 'Энгельс' } });
    fireEvent.change(screen.getByLabelText('Индустрия'), { target: { value: 'Энергетика' } });
    fireEvent.change(screen.getByLabelText('Цена'), { target: { value: 'бесплатно' } });
    fireEvent.change(screen.getByLabelText('Длительность'), { target: { value: '2 часа' } });
    fireEvent.change(screen.getByLabelText('Теги'), { target: { value: 'Тест, Новый' } });
    fireEvent.change(screen.getByLabelText('Краткое описание'), { target: { value: 'Достаточно длинное описание нового объекта для валидации.' } });
    fireEvent.change(screen.getByLabelText('Адрес'), { target: { value: 'Энгельс, тестовый адрес' } });
    fireEvent.change(screen.getByLabelText('Безопасность'), { target: { value: 'Инструктаж и сопровождение на маршруте.' } });
    fireEvent.change(screen.getByLabelText('Формат'), { target: { value: 'Учебный визит' } });
    fireEvent.change(screen.getByLabelText('График'), { target: { value: 'По записи' } });
    fireEvent.change(screen.getByLabelText('Описание аудитории'), { target: { value: 'Для учебных групп и посетителей.' } });
    fireEvent.change(screen.getByLabelText('Что входит'), { target: { value: 'Вход, Гид' } });
    fireEvent.change(screen.getByLabelText('Ключевые точки'), { target: { value: 'Линия, Лаборатория' } });
    fireEvent.change(screen.getByLabelText('Полное описание'), { target: { value: 'Подробное описание нового объекта с достаточным количеством текста для backend.' } });
    fireEvent.click(screen.getByRole('button', { name: /Создать объект/i }));

    await waitFor(() => {
      expect(screen.getByText(/Объект создан/i)).toBeInTheDocument();
    });
  });
});
