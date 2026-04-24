import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const mockObjects = [
  {
    slug: 'fabrika-mariya',
    name: 'Фабрика «Мария»',
    city: 'Саратов',
    industry: 'Пищевая промышленность',
    audience: 'Семьи',
    price: 'от 500 ₽',
    duration: '1.5 часа',
    blurb: 'Экскурсия по производственной линии.',
    tags: ['Для детей 7+'],
    coordinates: [46.0244, 51.5922],
    address: 'Саратов',
    safety: 'Инструктаж',
    format: 'Семейная экскурсия выходного дня',
    schedule: 'Сб–Вс',
    audienceDetails: 'Для семей',
    includes: ['Вход'],
    highlights: ['Линия'],
    fullDescription: 'Полное описание фабрики.',
  },
  {
    slug: 'engels-tec-tour',
    name: 'Энергетический маршрут ТЭЦ',
    city: 'Энгельс',
    industry: 'Энергетика',
    audience: 'Студенты',
    price: 'бесплатно',
    duration: '2 часа',
    blurb: 'Живой разговор с инженерами.',
    tags: ['Бесплатно'],
    coordinates: [46.1266, 51.4803],
    address: 'Энгельс',
    safety: 'Инструктаж',
    format: 'Профориентационный маршрут',
    schedule: 'Будни',
    audienceDetails: 'Для студентов',
    includes: ['Экскурсия'],
    highlights: ['Энергетика'],
    fullDescription: 'Полное описание ТЭЦ.',
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState({}, '', '/');

  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/api/objects')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: mockObjects }),
        } as Response);
      }

      if (url.includes('/api/bookings') && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Заявка отправлена.' }),
        } as Response);
      }

      if (url.includes('/api/bookings')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [] }),
        } as Response);
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    }),
  );
});

describe('Landing page', () => {
  it('renders the main title and loads catalog from backend', async () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /Гид по промышленному туризму Саратовской области/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Фабрика «Мария»').length).toBeGreaterThan(0);
    });
  });

  it('filters catalog cards by audience', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Энергетический маршрут ТЭЦ').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Студенты' }));

    const catalogSection = document.getElementById('catalog');
    expect(catalogSection).not.toBeNull();
    expect(within(catalogSection!).getByText('Энергетический маршрут ТЭЦ')).toBeInTheDocument();
    expect(within(catalogSection!).queryByText('Фабрика «Мария»')).not.toBeInTheDocument();
  });

  it('opens detailed object modal from catalog', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Подробнее/i }).length).toBeGreaterThan(0);
    });

    const detailsButtons = screen.getAllByRole('button', { name: /Подробнее/i });
    fireEvent.click(detailsButtons[detailsButtons.length - 1]);

    expect(screen.getByRole('heading', { name: /Краткий профиль объекта/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Забронировать объект/i })).toBeInTheDocument();
  });

  it('submits booking form', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Отправить заявку/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Ваше имя/i), { target: { value: 'Тест' } });
    fireEvent.change(screen.getByPlaceholderText(/\+7 или email/i), { target: { value: '+79000000000' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Отправить заявку/i }));

    await waitFor(() => {
      expect(screen.getByText(/Заявка отправлена/i)).toBeInTheDocument();
    });
  });
});
