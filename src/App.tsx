import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  Factory,
  GraduationCap,
  Menu,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { AdminPage } from './admin/AdminPage';
import { YandexRegionMap } from './components/YandexRegionMap';
import { faqItems, galleryCards, navigation, partners, type Audience, type Excursion } from './data';

type AudienceFilter = 'Все' | Audience;

type BookingPayload = {
  name: string;
  contact: string;
  format: string;
  date: string;
  objectSlug: string;
  consent: boolean;
};

const initialBookingState: BookingPayload = {
  name: '',
  contact: '',
  format: 'Семейная экскурсия',
  date: '',
  objectSlug: '',
  consent: false,
};

function LandingPage() {
  const isAdminPage = window.location.pathname === '/admin';
  const [menuOpen, setMenuOpen] = useState(false);
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>('Все');
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [activeExcursionSlug, setActiveExcursionSlug] = useState<string | null>(null);
  const [objects, setObjects] = useState<Excursion[]>([]);
  const [objectsStatus, setObjectsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [bookings, setBookings] = useState<Array<BookingPayload & { id: string; createdAt: string }>>([]);
  const [bookingsStatus, setBookingsStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [bookingForm, setBookingForm] = useState<BookingPayload>(initialBookingState);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [bookingMessage, setBookingMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    setObjectsStatus('loading');
    fetch('/api/objects')
      .then((response) => response.json())
      .then((payload: { items: Excursion[] }) => {
        if (cancelled) {
          return;
        }

        setObjects(payload.items ?? []);
        setObjectsStatus('ready');
        setBookingForm((current) => ({
          ...current,
          objectSlug: current.objectSlug || payload.items?.[0]?.slug || '',
        }));
      })
      .catch(() => {
        if (!cancelled) {
          setObjectsStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAdminPage) {
      return;
    }

    let cancelled = false;
    setBookingsStatus('loading');

    fetch('/api/bookings')
      .then((response) => response.json())
      .then((payload: { items: Array<BookingPayload & { id: string; createdAt: string }> }) => {
        if (cancelled) {
          return;
        }

        setBookings(payload.items ?? []);
        setBookingsStatus('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setBookingsStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAdminPage, bookingStatus]);

  const filteredExcursions = useMemo(() => {
    if (audienceFilter === 'Все') {
      return objects;
    }

    return objects.filter((item) => item.audience === audienceFilter);
  }, [audienceFilter, objects]);

  const activeExcursion = useMemo(
    () => objects.find((item) => item.slug === activeExcursionSlug) ?? null,
    [activeExcursionSlug, objects],
  );
  const featuredObject = objects[0] ?? null;

  useEffect(() => {
    if (!activeExcursion) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeExcursion]);

  const openExcursionDetails = (slug: string) => {
    setActiveExcursionSlug(slug);
  };

  const redirectToBooking = (slug: string) => {
    const target = objects.find((item) => item.slug === slug);
    setBookingForm((current) => ({
      ...current,
      objectSlug: slug,
      format:
        target?.audience === 'Бизнес'
          ? 'Бизнес-визит'
          : target?.audience === 'Студенты'
            ? 'Учебная группа'
            : 'Семейная экскурсия',
    }));
    setActiveExcursionSlug(null);
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isAdminPage) {
    return (
      <div className="min-h-screen bg-ink px-4 py-24 text-snow md:px-6">
        <div className="mx-auto max-w-[1500px] space-y-6">
          <div className="section-shell">
            <span className="eyebrow">Admin</span>
            <h1 className="font-display text-4xl uppercase">Панель заявок</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-mist">
              Базовая админ-страница для просмотра бронирований и синхронизации каталога объектов с backend API.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="section-shell">
              <h2 className="font-display text-2xl uppercase">Каталог API</h2>
              <p className="mt-3 text-sm text-mist">
                {objectsStatus === 'loading' && 'Загружаем объекты…'}
                {objectsStatus === 'error' && 'Не удалось получить объекты из backend.'}
                {objectsStatus === 'ready' && `В backend доступно ${objects.length} объектов.`}
              </p>
              <div className="mt-5 space-y-3">
                {objects.map((item) => (
                  <div key={item.slug} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="font-display text-lg uppercase">{item.name}</p>
                    <p className="mt-1 text-sm text-mist">{item.city} · {item.industry}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="section-shell">
              <h2 className="font-display text-2xl uppercase">Последние бронирования</h2>
              <p className="mt-3 text-sm text-mist">
                {bookingsStatus === 'loading' && 'Загружаем заявки…'}
                {bookingsStatus === 'error' && 'Не удалось получить заявки.'}
                {bookingsStatus === 'ready' && `Всего заявок: ${bookings.length}.`}
              </p>
              <div className="mt-5 space-y-3">
                {bookings.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-6">
                    <p className="font-display text-lg uppercase">{item.name}</p>
                    <p className="text-mist">{item.contact}</p>
                    <p className="text-mist">{item.format} · {item.date}</p>
                    <p className="text-mist">Объект: {item.objectSlug}</p>
                    <p className="text-mist">Создано: {new Date(item.createdAt).toLocaleString('ru-RU')}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  const handleMapOpenDetails = (slug: string) => {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => setActiveExcursionSlug(slug), 250);
  };

  const handleBookingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!bookingForm.consent) {
      setBookingStatus('error');
      setBookingMessage('Нужно подтвердить согласие на обработку персональных данных.');
      return;
    }

    setBookingStatus('submitting');
    setBookingMessage('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingForm),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? 'Не удалось отправить заявку.');
      }

      setBookingStatus('success');
      setBookingMessage(payload.message ?? 'Заявка отправлена. Менеджер свяжется с вами.');
      setBookingForm(initialBookingState);
    } catch (error) {
      setBookingStatus('error');
      setBookingMessage(error instanceof Error ? error.message : 'Ошибка отправки заявки.');
    }
  };

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-hero-grid bg-[size:74px_74px] opacity-20" />

      <header className="fixed inset-x-0 top-0 z-40 rounded-[1.5em] mx-4 my-2 border-b border-white/10 bg-ink/70 backdrop-blur-xl md:mx-6">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 md:px-6">
          <a href="#top" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lemon">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg uppercase tracking-[0.12em] text-snow">Гид</p>
              <p className="text-xs text-mist">Промышленный туризм Саратовской области</p>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-mist md:flex">
            {navigation.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-snow">
                {item.label}
              </a>
            ))}
          </nav>

          <a href="#booking" className="hidden rounded-xl border border-lemon px-5 py-3 text-sm font-semibold text-lemon transition hover:bg-yellow-300 hover:rounded-full hover:text-ink md:inline-flex">
            Забронировать
          </a>

          <button
            type="button"
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-4 text-sm text-mist">
              {navigation.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              ))}
              <a href="#booking" onClick={() => setMenuOpen(false)} className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-lemon px-5 py-3 font-semibold text-ink">
                Забронировать
              </a>
            </nav>
          </div>
        )}
      </header>

      <main id="top" className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 pb-6 pt-28 md:px-6 md:pb-8">
        <section className="section-shell relative overflow-hidden px-4 pt-8 sm:px-6 lg:px-8 md:pt-12">
            <div className="absolute -right-8 top-8 h-32 w-32 rounded-full bg-aqua/20 blur-3xl sm:-right-16 sm:top-12 sm:h-48 sm:w-48" />
            <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-lemon/10 blur-3xl sm:left-0 sm:h-40 sm:w-40" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-6">
                <span className="eyebrow">Digital guide · 2026</span>
                
                <h1 className="max-w-full break-words font-display text-2xl uppercase text-snow sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl md:max-w-4xl">
                    Гид по промышленному туризму Саратовской области
                </h1>
                
                <p className="max-w-2xl text-base leading-7 text-mist md:text-lg">
                    Гид по промышленному наследию и будущему Саратовской области с картографической визуализацией.
                </p>

                <div className="flex gap-3">
                    <button
                    type="button"
                    onClick={() => setAudienceFilter('Семьи')}
                    className="w-full rounded-3xl border border-lemon/50 bg-lemon/10 px-4 py-3 text-sm font-semibold text-lemon transition hover:bg-yellow-300 hover:text-ink sm:w-auto sm:px-5 sm:text-base"
                    >
                    Для семей
                    </button>
                    <button
                    type="button"
                    onClick={() => setAudienceFilter('Студенты')}
                    className="w-full rounded-3xl border border-aqua/50 bg-aqua/10 px-4 py-3 text-sm font-semibold text-aqua transition hover:bg-aqua hover:text-ink sm:w-auto sm:px-5 sm:text-base"
                    >
                    Для студентов
                    </button>
                    <button
                    type="button"
                    onClick={() => setAudienceFilter('Бизнес')}
                    className="w-full rounded-3xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-snow transition hover:border-lemon/50 sm:w-auto sm:px-5 sm:text-base"
                    >
                    Для бизнеса
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {[
                    { value: 'n+', label: 'предприятий в экосистеме' },
                    { value: '25 000', label: 'экскурсантов по итогам 2025 года' },
                    ].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-white/12 bg-white/8 p-4">
                        <div className="font-display text-2xl text-lemon sm:text-3xl">{item.value}</div>
                        <p className="mt-2 text-sm leading-6 text-mist">{item.label}</p>
                    </div>
                    ))}
                </div>
                </div>

                <div className="flex flex-col gap-4">
                <div className="glass-panel animate-float rounded-[30px] p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                    <span className="chip text-xs sm:text-sm">Главный маршрут недели</span>
                    <div className="flex items-center gap-1 text-lemon">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">4.9</span>
                    </div>
                    </div>
                    <h2 className="mt-4 break-words hyphens-auto font-display text-2xl uppercase sm:text-3xl">
                    {featuredObject?.name ?? 'Загрузка объекта…'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-mist sm:mt-3">
                    {featuredObject?.blurb ?? 'Получаем данные из backend-каталога.'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                    {featuredObject && (
                        <>
                        <span className="chip">{featuredObject.price}</span>
                        <span className="chip">{featuredObject.duration}</span>
                        <span className="chip">{featuredObject.city}</span>
                        </>
                    )}
                    </div>
                    <button
                    type="button"
                    onClick={() => featuredObject && openExcursionDetails(featuredObject.slug)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/12 px-4 py-3 text-sm font-medium text-snow transition hover:bg-white/18 sm:mt-6 sm:w-auto sm:justify-start"
                    disabled={!featuredObject}
                    >
                    Открыть карточку объекта
                    <ArrowRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="glass-panel rounded-[28px] p-4 sm:p-5">
                    <ShieldCheck className="h-7 w-7 text-success sm:h-8 sm:w-8" />
                    <p className="mt-3 font-display text-lg uppercase sm:mt-4 sm:text-xl">Безопасно</p>
                    <p className="mt-2 text-sm leading-6 text-mist">Инструктаж, возрастные сценарии и маршруты с контролируемым доступом.</p>
                    </div>
                    <div className="glass-panel rounded-[28px] p-4 sm:p-5">
                    <Sparkles className="h-7 w-7 text-lemon sm:h-8 sm:w-8" />
                    <p className="mt-3 font-display text-lg uppercase sm:mt-4 sm:text-xl">Подробно</p>
                    <p className="mt-2 text-sm leading-6 text-mist">Карточки объектов раскрываются в модальном окне, не ломая логику лендинга.</p>
                    </div>
                </div>
                </div>
            </div>
        </section>

        <section id="map" className="section-shell">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="eyebrow">Интерактивная карта</span>
              <h2 className="break-words font-display text-3xl uppercase md:text-4xl">Объекты на карте Саратовской области</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Пищевое', 'Энергетика', 'Машиностроение', 'Живые маршруты'].map((tag) => (
                <span key={tag} className="chip">{tag}</span>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <YandexRegionMap objects={objects} onOpenDetails={handleMapOpenDetails} />

            <div className="space-y-4">
              {[
                { icon: Building2, title: 'Объектные маркеры', text: 'На карте отмечены реальные экскурсионные точки, а не только города. Каждый маркер связан с карточкой объекта.' },
                { icon: ShieldCheck, title: 'Popup с кратким контентом', text: 'При выборе объекта пользователь сразу видит краткое описание, формат маршрута и переход к полному описанию.' },
                { icon: BadgeCheck, title: 'Связка с каталогом', text: 'Кнопка «Подробнее из каталога» открывает расширенную карточку и ведёт пользователя к форме бронирования.' },
              ].map((item) => (
                <div key={item.title} className="glass-panel rounded-[28px] p-5">
                  <item.icon className="h-7 w-7 text-aqua" />
                  <h3 className="mt-4 break-words font-display text-xl uppercase">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-mist">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="catalog" className="section-shell">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="eyebrow">Каталог экскурсий</span>
              <h2 className="break-words font-display text-3xl uppercase md:text-4xl">Маршруты под разные сегменты</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {(['Все', 'Семьи', 'Студенты', 'Бизнес'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAudienceFilter(item)}
                  className={`min-w-0 rounded-full px-3 py-2 text-center text-xs transition sm:px-4 sm:text-sm ${
                    audienceFilter === item ? 'bg-lemon font-semibold text-ink' : 'border border-white/15 bg-white/10 text-mist hover:text-snow'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {filteredExcursions.map((item) => (
              <article key={item.slug} className="glass-panel min-w-0 rounded-[30px] p-5">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-aqua">{item.industry}</p>
                    <h3 className="mt-2 break-words font-display text-xl uppercase hyphens-auto sm:text-2xl">{item.name}</h3>
                  </div>
                  <span className="chip self-start sm:shrink-0">{item.city}</span>
                </div>
                <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4">
                    {item.imageUrl ? (
                    <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-44 sm:h-52 object-cover rounded-2xl transition-transform duration-300 hover:scale-[1.02]"
                        loading="lazy"
                        onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    ) : (
                    <div className="w-full h-44 sm:h-52 rounded-2xl bg-white/5 flex flex-col items-center justify-center gap-2 text-mist/40">
                        <svg className="h-8 w-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">Нет изображения</span>
                    </div>
                    )}
                </div>
                <p className="mt-4 text-sm leading-6 text-mist">{item.blurb}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="chip">{item.price}</span>
                  <span className="chip">{item.duration}</span>
                  <span className="chip">{item.audience}</span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => openExcursionDetails(item.slug)} className="inline-flex items-center gap-2 rounded-full bg-lemon px-4 py-3 text-sm font-semibold text-ink transition hover:bg-yellow-300">
                    Подробнее
                  </button>
                  <button type="button" onClick={() => redirectToBooking(item.slug)} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-snow transition hover:bg-white/15">
                    Забронировать
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="section-shell">
            <span className="eyebrow">О проекте</span>
            <h2 className="break-words font-display text-3xl uppercase md:text-4xl">Что такое промышленный туризм</h2>
            <p className="mt-5 text-base leading-7 text-mist">
              Это не музейная витрина, а живой доступ к производству: экскурсии на заводы и фабрики, которые помогают
              понять, как создаются реальные продукты, где работают инженеры и почему промышленность может быть
              интересной семьям, школьникам и командам бизнеса.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                'Профориентация и образовательный эффект',
                'Прозрачная логистика и понятное бронирование',
                'Единая цифровая точка доступа к объектам региона',
                'Поддержка нацпроекта и развитие имиджа области',
              ].map((item) => (
                <div key={item} className="rounded-3xl border border-white/12 bg-white/8 p-4 text-sm leading-6 text-snow">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="section-shell">
            <span className="eyebrow">Преимущества</span>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { icon: Users, title: 'Для семей', text: 'Безопасные маршруты 7+, понятные цены и подробные карточки объектов.' },
                { icon: GraduationCap, title: 'Для студентов', text: 'Профориентационные треки, сертификаты и бесплатные квоты для учебных групп.' },
                { icon: BriefcaseBusiness, title: 'Для бизнеса', text: 'Индивидуальные программы, деловые визиты и backend для заявок и CRM-логики.' },
                { icon: Factory, title: 'Для предприятий', text: 'Рост узнаваемости, кадровый бренд и включение в региональную витрину маршрутов.' },
              ].map((item) => (
                <div key={item.title} className="glass-panel rounded-[28px] p-5">
                  <item.icon className="h-8 w-8 text-lemon" />
                  <h3 className="mt-4 break-words font-display text-xl uppercase">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-mist">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell">
          <span className="eyebrow">Как это работает</span>
          <h2 className="break-words font-display text-3xl uppercase md:text-4xl">Путь от интереса до поездки</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-4">
            {[
              { step: '01', title: 'Выберите объект', text: 'Карта и каталог ведут к одной и той же карточке маршрута с единым набором данных.' },
              { step: '02', title: 'Откройте детали', text: 'Модальное окно показывает полное описание, формат, программу, меры безопасности и состав услуги.' },
              { step: '03', title: 'Выберите маршрут', text: 'Кнопка бронирования сразу подставляет объект в форму и сохраняет контекст пользователя.' },
              { step: '04', title: 'Отправьте заявку', text: 'Форма уходит в backend API и создаёт запись бронирования, готовую для CRM или панели менеджера.' },
            ].map((item) => (
              <div key={item.step} className="glass-panel rounded-[28px] p-5">
                <p className="font-display text-4xl text-lemon">{item.step}</p>
                <h3 className="mt-4 break-words font-display text-xl uppercase">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-mist">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="gallery" className="section-shell">
            <span className="eyebrow">Галерея</span>
            <div className="flex gap-3 md:flex-row md:items-end md:justify-between">
                <h2 className="break-words font-display text-3xl uppercase md:text-4xl">Визуальный ритм</h2>
            </div>

            {/* Existing scene cards — unchanged */}
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {galleryCards.map((item, index) => (
                <article
                    key={item}
                    className="relative min-h-[260px] overflow-hidden rounded-[30px] border border-white/12 bg-white/8 p-5"
                >
                    <div
                    aria-hidden="true"
                    className={`absolute inset-0 ${
                        index % 2 === 0
                        ? 'bg-[radial-gradient(circle_at_top_left,rgba(1,165,166,0.35),transparent_35%),linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]'
                        : 'bg-[radial-gradient(circle_at_bottom_right,rgba(255,238,94,0.2),transparent_30%),linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]'
                    }`}
                    />
                    <div className="relative flex h-full flex-col justify-between">
                    <span className="chip">Сцена {index + 1}</span>
                    <p className="max-w-xs break-words text-xl leading-tight">{item}</p>
                    </div>
                </article>
                ))}
            </div>

            {/* Swiper: Visible below 1000px */}
            <div className="mt-8 block min-[1000px]:hidden">
                <div className="swiper-gallery-wrapper relative">
                <Swiper
                    modules={[Navigation, Pagination]}
                    spaceBetween={16}
                    slidesPerView={1}
                    breakpoints={{
                    640: { slidesPerView: 2, spaceBetween: 16 },
                    768: { slidesPerView: 3, spaceBetween: 20 },
                    }}
                    navigation={{
                    prevEl: '.swiper-gallery-prev',
                    nextEl: '.swiper-gallery-next',
                    }}
                    pagination={{
                    el: '.swiper-gallery-pagination',
                    clickable: true,
                    dynamicBullets: true,
                    }}
                    className="swiper-gallery"
                >
                    {Array.from({ length: 9 }).map((_, index) => (
                    <SwiperSlide key={index}>
                        <div className="w-full aspect-video rounded-[30px] bg-white/5 border border-white/8 flex flex-col items-center justify-center gap-5 text-mist/40 overflow-hidden">
                        <span className="text-sm">Изображение {index + 1}</span>
                        </div>
                    </SwiperSlide>
                    ))}
                </Swiper>

                {/* Custom Navigation Buttons */}
                <button
                    className="swiper-gallery-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-ink/80 text-snow backdrop-blur-sm transition-all hover:bg-lemon hover:text-ink hover:border-lemon -ml-4 sm:-ml-6"
                    aria-label="Предыдущий слайд"
                >
                    <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    className="swiper-gallery-next absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-ink/80 text-snow backdrop-blur-sm transition-all hover:bg-lemon hover:text-ink hover:border-lemon -mr-4 sm:-mr-6"
                    aria-label="Следующий слайд"
                >
                    <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Custom Pagination */}
                <div className="swiper-gallery-pagination absolute bottom-4 left-1/2 z-10 w-auto flex -translate-x-1/2 items-center gap-2"></div>
                </div>
            </div>

            {/* Grid of image placeholders: Visible at 1000px and above */}
            <div className="mt-8 hidden min-[1000px]:grid grid-cols-4 grid-rows-3 gap-5">
                {/* Row 1 */}
                <div className="row-span-1 w-full aspect-video rounded-[30px] bg-white/5 border border-white/8 flex flex-col items-center justify-center gap-5 text-mist/40">
                <span className="text-sm">Изображение</span>
                </div>
                <div className="col-span-2 row-span-2 rounded-[30px] bg-white/5 border border-white/8 flex flex-col items-center justify-center gap-5 text-mist/40">
                <span className="text-sm">Изображение</span>
                </div>
                <div className="col-start-4 row-span-1 w-full aspect-video rounded-[30px] bg-white/5 border border-white/8 flex flex-col items-center justify-center gap-5 text-mist/40">
                <span className="text-sm">Изображение</span>
                </div>

                {/* Row 2 */}
                <div className="row-start-2 aspect-video rounded-[30px] bg-white/5 border border-white/8 flex flex-col items-center justify-center gap-5 text-mist/40">
                <span className="text-sm">Изображение</span>
                </div>
                <div className="col-start-4 row-start-2 rounded-[30px] bg-white/5 border border-white/8 flex flex-col items-center justify-center gap-5 text-mist/40">
                <span className="text-sm">Изображение</span>
                </div>

                {/* Row 3 — four blocks across */}
                <div className="row-start-3 aspect-video rounded-[30px] bg-white/5 border border-white/8 flex flex-col items-center justify-center gap-5 text-mist/40">
                <span className="text-sm">Изображение</span>
                </div>
                <div className="row-start-3 aspect-video rounded-[30px] bg-white/5 border border-white/8 flex flex-col items-center justify-center gap-5 text-mist/40">
                <span className="text-sm">Изображение</span>
                </div>
                <div className="row-start-3 aspect-video rounded-[30px] bg-white/5 border border-white/8 flex flex-col items-center justify-center gap-5 text-mist/40">
                <span className="text-sm">Изображение</span>
                </div>
                <div className="row-start-3 aspect-video rounded-[30px] bg-white/5 border border-white/8 flex flex-col items-center justify-center gap-5 text-mist/40">
                <span className="text-sm">Изображение</span>
                </div>
            </div>
        </section>

        <section id="faq" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="section-shell">
            <span className="eyebrow">FAQ</span>
            <h2 className="break-words font-display text-3xl uppercase md:text-4xl">Частые вопросы</h2>
            <p className="mt-5 text-base leading-7 text-mist">
              Узнайте ответы на частозадаваемые вопросы
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <article key={item.q} className="glass-panel overflow-hidden rounded-[28px]">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq((current) => (current === index ? -1 : index))}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                  >
                    <h3 className="break-words font-display text-xl">{item.q}</h3>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-lemon transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <p className="px-5 pb-5 text-sm leading-6 text-mist">{item.a}</p>}
                </article>
              );
            })}
          </div>
        </section>

        <section className="section-shell">
          <span className="eyebrow">Партнёры и поддержка</span>
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="break-words font-display text-3xl uppercase md:text-4xl">Кому сайт помогает расти</h2>
              <p className="mt-5 text-base leading-7 text-mist">
                Лендинг позиционируется как единая региональная витрина промышленного туризма: помогает предприятиям
                входить в программу, а посетителям быстро понимать, что и где можно посмотреть.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {partners.map((item) => (
                <div key={item} className="glass-panel break-words rounded-[28px] p-5 text-center font-display text-lg uppercase text-snow">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="booking" className="section-shell">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="eyebrow">Забронировать экскурсию</span>
              <h2 className="break-words font-display text-3xl uppercase md:text-5xl">Оставьте заявку на объект</h2>
              <p className="mt-5 text-base leading-7 text-mist">
                Форма связана с базовым backend API и создаёт реальную заявку бронирования. Объект можно выбрать вручную
                или получить автоматически после перехода из карточки маршрута.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="chip">POST /api/bookings</span>
                <span className="chip">Валидация на сервере</span>
                <span className="chip">JSON-хранилище MVP</span>
              </div>
            </div>

            <form className="glass-panel rounded-[32px] p-5" onSubmit={handleBookingSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-mist">Имя</span>
                  <input type="text" value={bookingForm.name} onChange={(event) => setBookingForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ваше имя" className="w-full rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-snow outline-none transition placeholder:text-mist/70 focus:border-aqua" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-mist">Телефон или email</span>
                  <input type="text" value={bookingForm.contact} onChange={(event) => setBookingForm((current) => ({ ...current, contact: event.target.value }))} placeholder="+7 или email" className="w-full rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-snow outline-none transition placeholder:text-mist/70 focus:border-aqua" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-mist">Формат визита</span>
                  <select value={bookingForm.format} onChange={(event) => setBookingForm((current) => ({ ...current, format: event.target.value }))} className="w-full rounded-2xl border border-white/12 bg-ink px-4 py-3 text-snow outline-none focus:border-aqua">
                    <option>Семейная экскурсия</option>
                    <option>Учебная группа</option>
                    <option>Бизнес-визит</option>
                    <option>Партнёрский запрос</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-mist">Дата</span>
                  <input type="text" value={bookingForm.date} onChange={(event) => setBookingForm((current) => ({ ...current, date: event.target.value }))} placeholder="Например, 25 апреля" className="w-full rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-snow outline-none transition placeholder:text-mist/70 focus:border-aqua" />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm text-mist">Объект</span>
                <select value={bookingForm.objectSlug} onChange={(event) => setBookingForm((current) => ({ ...current, objectSlug: event.target.value }))} className="w-full rounded-2xl border border-white/12 bg-ink px-4 py-3 text-snow outline-none focus:border-aqua">
                  {objects.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-mist">
                <input
                  type="checkbox"
                  checked={bookingForm.consent}
                  onChange={(event) => setBookingForm((current) => ({ ...current, consent: event.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10"
                />
                Согласен на обработку персональных данных и получение ответа по заявке.
              </label>

              {bookingMessage && (
                <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  bookingStatus === 'success'
                    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-red-400/40 bg-red-500/10 text-red-200'
                }`}>
                  {bookingMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={bookingStatus === 'submitting'}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-lemon px-6 py-3 font-semibold text-ink transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-mist"
              >
                {bookingStatus === 'submitting' ? 'Отправка…' : 'Отправить заявку'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer id="contacts" className="mx-auto max-w-[1500px] px-4 pb-8 md:px-6">
        <div className="section-shell">
          <div className="grid gap-6 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div>
              <p className="break-words font-display text-2xl uppercase">Контакты проекта</p>
            </div>
            <a href="tel:+78452000000" className="flex items-center gap-3 text-sm text-snow">
              <Phone className="h-4 w-4 text-lemon" />
              +7 (8452) 00-00-00
            </a>
            <a href="mailto:hello@promtourism-saratov.ru" className="text-sm text-snow">
              hello@promtourism-saratov.ru
            </a>
          </div>
        </div>
      </footer>

      {activeExcursion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
          <div className="glass-panel relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[32px] p-6 md:p-8">
            <button
              type="button"
              aria-label="Закрыть карточку объекта"
              onClick={() => setActiveExcursionSlug(null)}
              className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-snow"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="pr-12">
              <p className="text-sm text-aqua">{activeExcursion.industry}</p>
              <h2 className="mt-3 break-words font-display text-3xl uppercase md:text-4xl">{activeExcursion.name}</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-mist">{activeExcursion.fullDescription}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="chip">{activeExcursion.city}</span>
              <span className="chip">{activeExcursion.price}</span>
              <span className="chip">{activeExcursion.duration}</span>
              <span className="chip">{activeExcursion.audience}</span>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-[28px] border border-white/12 bg-white/6 p-5">
                <h3 className="font-display text-xl uppercase">Краткий профиль объекта</h3>
                <div className="mt-4 space-y-3 text-sm leading-6 text-mist">
                  <p><span className="text-snow">Адрес:</span> {activeExcursion.address}</p>
                  <p><span className="text-snow">Формат:</span> {activeExcursion.format}</p>
                  <p><span className="text-snow">График:</span> {activeExcursion.schedule}</p>
                  <p><span className="text-snow">Безопасность:</span> {activeExcursion.safety}</p>
                  <p><span className="text-snow">Аудитория:</span> {activeExcursion.audienceDetails}</p>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/12 bg-white/6 p-5">
                <h3 className="font-display text-xl uppercase">Что входит</h3>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-mist">
                  {activeExcursion.includes.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <h3 className="mt-6 font-display text-xl uppercase">Ключевые точки маршрута</h3>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-mist">
                  {activeExcursion.highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => redirectToBooking(activeExcursion.slug)} className="inline-flex items-center gap-2 rounded-full bg-lemon px-5 py-3 font-semibold text-ink transition hover:bg-yellow-300">
                Забронировать объект
              </button>
              <button type="button" onClick={() => setActiveExcursionSlug(null)} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 font-medium text-snow transition hover:bg-white/15">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return window.location.pathname === '/admin' ? <AdminPage /> : <LandingPage />;
}

export default App;