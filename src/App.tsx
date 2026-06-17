import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  Check,
  Factory,
  GraduationCap,
  MapPinned,
  Menu,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
  Filter,
  Clock,
  Banknote,
  Calendar, 
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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

type SelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function CustomSelect({ options, value, onChange, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label ?? placeholder ?? '';

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center h-10 justify-between rounded-xl border border-white/12 bg-ink px-4 py-2 text-left text-sm text-snow outline-none transition focus:border-aqua"
      >
        <span className="truncate pr-6">{displayText}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-mist transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-white/12 bg-ink shadow-xl">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-white/10 ${
                  isSelected ? 'bg-lemon/10 text-lemon' : 'text-snow'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-lemon" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setObjectsStatus('loading');
    fetch('/api/objects')
      .then((response) => response.json())
      .then((payload: { items: Excursion[] }) => {
        if (cancelled) return;
        setObjects(payload.items ?? []);
        setObjectsStatus('ready');
        setBookingForm((current) => ({
          ...current,
          objectSlug: current.objectSlug || payload.items?.[0]?.slug || '',
        }));
      })
      .catch(() => {
        if (!cancelled) setObjectsStatus('error');
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isAdminPage) return;
    let cancelled = false;
    setBookingsStatus('loading');
    fetch('/api/bookings')
      .then((response) => response.json())
      .then((payload: { items: Array<BookingPayload & { id: string; createdAt: string }> }) => {
        if (cancelled) return;
        setBookings(payload.items ?? []);
        setBookingsStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setBookingsStatus('error');
      });
    return () => { cancelled = true; };
  }, [isAdminPage, bookingStatus]);

  const filteredExcursions = useMemo(() => {
    if (audienceFilter === 'Все') return objects;
    return objects.filter((item) => item.audience === audienceFilter);
  }, [audienceFilter, objects]);

  const activeExcursion = useMemo(
    () => objects.find((item) => item.slug === activeExcursionSlug) ?? null,
    [activeExcursionSlug, objects],
  );

  const uniqueIndustries = useMemo(() => {
    return Array.from(new Set(objects.map((o) => o.industry))).sort();
  }, [objects]);

  const uniqueCities = useMemo(() => {
    return Array.from(new Set(objects.map((o) => o.city))).sort();
  }, [objects]);

  const selectedObject = useMemo(
    () => objects.find((item) => item.slug === selectedSlug) ?? null,
    [selectedSlug, objects],
  );

  const industryOptions: SelectOption[] = useMemo(() => [
    { value: '', label: 'Все отрасли' },
    ...uniqueIndustries.map((ind) => ({ value: ind, label: ind })),
  ], [uniqueIndustries]);

  const cityOptions: SelectOption[] = useMemo(() => [
    { value: '', label: 'Все города' },
    ...uniqueCities.map((city) => ({ value: city, label: city })),
  ], [uniqueCities]);

  const formatOptions: SelectOption[] = [
    { value: 'Семейная экскурсия', label: 'Семейная экскурсия' },
    { value: 'Учебная группа', label: 'Учебная группа' },
    { value: 'Бизнес-визит', label: 'Бизнес-визит' },
    { value: 'Партнёрский запрос', label: 'Партнёрский запрос' },
  ];

  const objectOptions: SelectOption[] = useMemo(() =>
    objects.map((item) => ({ value: item.slug, label: item.name })),
    [objects],
  );

  useEffect(() => {
    if (!activeExcursion) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [activeExcursion]);

  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFiltersOpen]);

  const openExcursionDetails = (slug: string) => setActiveExcursionSlug(slug);

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
              Базовая админ-страница для просмотра бронирований и синхронизации каталога объектов.
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

  const handleMapSelect = (slug: string | null) => setSelectedSlug(slug);

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
      if (!response.ok) throw new Error(payload.message ?? 'Не удалось отправить заявку.');
      setBookingStatus('success');
      setBookingMessage(payload.message ?? 'Заявка отправлена. Менеджер свяжется с вами.');
      setBookingForm(initialBookingState);
    } catch (error) {
      setBookingStatus('error');
      setBookingMessage(error instanceof Error ? error.message : 'Ошибка отправки заявки.');
    }
  };

  const handleApplyMobileFilters = () => {
    setMobileFiltersOpen(false);
  };

  const handleResetFilters = () => {
    setIndustryFilter(null);
    setCityFilter(null);
  };

  return (
    <div className="relative overflow-hidden">
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }

        @keyframes pathGlow {
          0%, 100% {
            border-color: rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.02);
            box-shadow: 0 0 0 rgba(255, 238, 94, 0);
          }
          25% {
            border-color: rgba(255, 238, 94, 0.6);
            background: rgba(255, 238, 94, 0.08);
            box-shadow: 0 0 30px rgba(255, 238, 94, 0.3);
          }
          50% {
            border-color: rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.02);
            box-shadow: 0 0 0 rgba(255, 238, 94, 0);
          }
        }

        .path-step {
          animation: pathGlow 8s ease-in-out infinite;
        }

        .path-step-1 {
          animation-delay: 0s;
        }

        .path-step-2 {
          animation-delay: 2s;
        }

        .path-step-3 {
          animation-delay: 4s;
        }

        .path-step-4 {
          animation-delay: 6s;
        }

        @keyframes pathPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          25% {
            opacity: 1;
            transform: scale(1.01);
          }
          50% {
            opacity: 0.3;
            transform: scale(1);
          }
        }

        .path-number {
          animation: pathPulse 8s ease-in-out infinite;
        }

        .path-number-1 {
          animation-delay: 0s;
        }

        .path-number-2 {
          animation-delay: 2s;
        }

        .path-number-3 {
          animation-delay: 4s;
        }

        .path-number-4 {
          animation-delay: 6s;
        }

        @media (max-width: 768px) {
          .path-step {
            animation: pathGlow 8s ease-in-out infinite;
          }
          
          .path-step-1 {
            animation-delay: 0s;
          }

          .path-step-2 {
            animation-delay: 2s;
          }

          .path-step-3 {
            animation-delay: 4s;
          }

          .path-step-4 {
            animation-delay: 6s;
          }
        }
      `}</style>
      
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-hero-grid bg-[size:74px_74px] opacity-20" />

      <header className="fixed inset-x-0 top-0 z-40 rounded-[1.5em] mx-4 my-2 border-b border-white/10 bg-ink/70 backdrop-blur-xl md:mx-6">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 md:px-6">
          <a href="#top" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lemon">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg uppercase tracking-[0.12em] text-snow">Гид</p>
            </div>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-mist md:flex">
            {navigation.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-snow">{item.label}</a>
            ))}
          </nav>
          <a href="#booking" className="hidden rounded-xl border border-lemon px-5 py-3 text-sm font-semibold text-lemon transition hover:bg-yellow-300 hover:rounded-full hover:text-ink md:inline-flex">
            Забронировать
          </a>
          <button
            type="button"
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-white/10 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-4 text-sm text-mist">
              {navigation.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>
              ))}
              <a href="#booking" onClick={() => setMenuOpen(false)} className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-lemon px-5 py-3 font-semibold text-ink">
                Забронировать
              </a>
            </nav>
          </div>
        )}
      </header>

      <main id="top" className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 pb-6 pt-28 md:px-6 md:pb-8">
        <section className="relative mb-10 px-4 pt-8 sm:px-6 lg:px-8 md:pt-20">
            <div className="relative z-10 w-full grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center text-center lg:text-left">
                <div className="space-y-6 flex flex-col items-center lg:block">
                <h1 className="max-w-full break-words font-display text-2xl uppercase text-snow sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl md:max-w-4xl leading-[1.2] sm:leading-[1.25] lg:leading-[1.2]">
                    Гид по промышленному туризму Саратовской области
                </h1>
                <p className="max-w-2xl text-base leading-7 text-mist md:text-lg md:leading-8">
                    Откройте для себя уникальные маршруты по действующим предприятиям, электростанциям и историческим заводам региона. 
                    Интерактивная карта, подробные описания программ — всё в одном месте.
                </p>
                <button
                    type="button"
                    onClick={() => document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' })}
                    className="relative inline-block z-[1] overflow-hidden rounded-lg border-[0.25em] border-[#FFEE5E] bg-hero-grid px-8 py-4 tracking-[2px] text-white shadow-[12px_12px_0_-5px_#FFEE5E] transition-all duration-300 hover:bg-[#FFEE5E] hover:text-[#513A50] hover:shadow-[0_0_0.25em_#FFEE5E]"
                >
                    Посмотреть карту
                </button>
                </div>
                <div className="relative h-[400px] w-full flex items-center justify-center">
                {/* Орбитальные кольца */}
                <div className="absolute w-[200px] h-[200px] border border-white/10 rounded-full animate-[spin_25s_linear_infinite]">
                    <div className="absolute top-0 left-1/2 w-1 h-1 bg-lemon rounded-full animate-pulse"></div>
                    <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-lemon/50 rounded-full animate-pulse delay-75"></div>
                </div>
                <div className="absolute w-[310px] h-[310px] border border-white/10/60 rounded-full animate-[spin_40s_linear_infinite_reverse]">
                    <div className="absolute top-1/2 right-0 w-1.5 h-1.5 bg-aqua rounded-full animate-pulse delay-1000"></div>
                    <div className="absolute top-0 left-1/4 w-1 h-1 bg-lemon rounded-full animate-pulse delay-150"></div>
                </div>
                <div className="absolute w-[420px] h-[420px] border border-white/10/30 rounded-full border-dashed animate-[spin_55s_linear_infinite]">
                    <div className="absolute -top-1 left-1/2 w-2 h-2 bg-lemon rounded-full animate-pulse"></div>
                    <div className="absolute top-1/2 -right-1 w-2 h-2 bg-aqua rounded-full animate-pulse delay-300"></div>
                    <div className="absolute -bottom-1 left-1/3 w-2 h-2 bg-lemon/70 rounded-full animate-pulse delay-500"></div>
                </div>
                <div className="absolute w-[420px] h-[420px] animate-[spin_10s_linear_infinite] pointer-events-none">
                    <div className="absolute top-0 left-1/2 w-px h-1/2 bg-gradient-to-b from-lemon/60 via-lemon/20 to-transparent origin-bottom"></div>
                </div>
                <div className="absolute w-[260px] h-[260px] rounded-full bg-lemon/5 animate-[pulse_4s_ease-in-out_infinite]"></div>
                <div className="absolute w-[260px] h-[260px] rounded-full bg-lemon/10 animate-[pulse_4s_ease-in-out_infinite_1s]"></div>
                
                {/* ✅ Два квадрата для фотографий по диагонали */}
                {/* Верхний правый квадрат */}
                <div className="absolute top-4 right-8 w-20 h-20 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center overflow-hidden animate-[float_3s_ease-in-out_infinite]">
                    <div className="w-full h-full flex items-center justify-center text-mist/40">
                    <img src="https://promtourism.ru/assets/cache_image/slider/photo-2024-07-28-23-18-19_1920x1100_cf6.jpg" alt="Изображение" className="w-full h-full object-cover"/>
                    </div>
                </div>
                
                {/* Нижний левый квадрат */}
                <div className="absolute bottom-4 left-8 w-20 h-20 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center overflow-hidden animate-[float_3s_ease-in-out_infinite_1.5s]">
                    <div className="w-full h-full flex items-center justify-center text-mist/40">
                    <img src="https://runews24.ru/assets/images/uploads/2024/7/2/ca69c3e3efc002eafbbe40b415493ee4.jpg" alt="Изображение" className="w-full h-full object-cover"/>
                    </div>
                </div>

                {/* Основная карточка */}
                <div className="relative glass-panel p-6 rounded-xl border border-white/10 max-w-xs w-full transform rotate-3 hover:rotate-0 transition-transform duration-500 animate-float backdrop-blur-xl">
                    <div className="absolute -top-px -right-px w-16 h-16 overflow-hidden rounded-tr-xl">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-lemon/20 to-transparent transform rotate-45 translate-x-8 -translate-y-8 animate-pulse"></div>
                    </div>
                    <div className="flex justify-between items-start mb-4">
                    <div className="bg-orange-500/10 text-orange-400 p-2 rounded animate-pulse">
                        <Zap className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-[10px] text-lemon/80 tracking-widest">ID: #FACILITY-X</span>
                    </div>
                    <h3 className="text-lg font-medium text-snow mb-1">Объекты промтуризма</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs text-mist font-mono">
                    <div className="grid grid-cols-2 gap-2 text-xs text-mist font-mono">
                    <div className="animate-pulse delay-75">ERA: MODERN</div>
                    </div>
                    {/* <div className="animate-pulse delay-75">POWER: 1403 MW</div>
                    <div className="animate-pulse delay-150">YEAR: 1967</div>
                    <div className="animate-pulse delay-200">LAT: 52.05°</div>
                    <div className="animate-pulse delay-300">LON: 47.76°</div> */}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                    <div className="w-1 h-1 bg-lemon rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-lemon rounded-full animate-bounce delay-75"></div>
                    <div className="w-1 h-1 bg-lemon rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
                </div>
            </div>
        </section>

        <section id="map" className="px-4 py-6 md:px-8 md:py-9">
          <div className="mb-6">
            <span className="eyebrow">Интерактивная карта</span>
            <h2 className="break-words font-display text-3xl uppercase md:text-4xl">
              Объекты на карте Саратовской области
            </h2>
          </div>

          <div className="mb-4 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex w-full items-center justify-between rounded-xl border border-white/12 bg-ink/80 px-5 py-4 text-left backdrop-blur-sm transition hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-lemon" />
                <span className="font-medium text-snow">Фильтры</span>
                {(industryFilter || cityFilter) && (
                  <span className="rounded-full bg-lemon/20 px-2.5 py-0.5 text-xs font-semibold text-lemon">
                    Активны
                  </span>
                )}
              </div>
              <ChevronDown className="h-5 w-5 text-mist" />
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1.3fr_0.7fr]">
            <div className="min-w-0 w-full">
              <YandexRegionMap
                objects={objects}
                onOpenDetails={handleMapOpenDetails}
                onSelect={handleMapSelect}
                industryFilter={industryFilter}
                cityFilter={cityFilter}
              />
              
              {selectedObject && (
                <div className="mt-4 glass-panel rounded-3xl p-4 sm:p-5 lg:hidden">
                  <p className="text-sm text-aqua truncate">{selectedObject.industry}</p>
                  <h3 className="mt-2 break-words font-display text-xl sm:text-2xl uppercase text-snow">
                    {selectedObject.name}
                  </h3>
                  <p className="mt-2 text-sm text-mist">{selectedObject.city}</p>
                  <p className="mt-3 text-sm leading-6 text-mist">{selectedObject.blurb}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="chip">{selectedObject.price}</span>
                    <span className="chip">{selectedObject.duration}</span>
                    <span className="chip">{selectedObject.audience}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMapOpenDetails(selectedObject.slug)}
                    className="mt-5 inline-flex items-center rounded-xl bg-lemon px-4 py-3 text-sm font-semibold text-ink transition hover:bg-yellow-300 w-full sm:w-auto justify-center"
                  >
                    Подробнее из каталога
                  </button>
                </div>
              )}
            </div>

            <div className="hidden flex-col gap-4 min-w-0 max-w-full lg:flex">
              <div className="glass-panel rounded-3xl p-4 sm:p-5 z-[1]">
                <h3 className="font-display text-base sm:text-lg uppercase text-snow">Фильтры</h3>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs text-mist">Отрасль</label>
                    <CustomSelect
                      options={industryOptions}
                      value={industryFilter ?? ''}
                      onChange={(val) => setIndustryFilter(val || null)}
                      placeholder="Все отрасли"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-mist">Город</label>
                    <CustomSelect
                      options={cityOptions}
                      value={cityFilter ?? ''}
                      onChange={(val) => setCityFilter(val || null)}
                      placeholder="Все города"
                    />
                  </div>
                  {(industryFilter || cityFilter) && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm text-lemon transition hover:bg-white/10"
                    >
                      Сбросить фильтры
                    </button>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-mist">
                  <span className="text-mist/70">Легенда:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 shrink-0 ring-1 ring-yellow-300/50" />
                    <span className="font-medium text-snow">Выбранный объект</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0" />
                    <span>Пищевая пром.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                    <span>Энергетика</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span>Машиностроение</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-500 shrink-0" />
                    <span>Нефтегазовая</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0" />
                    <span>Мебельное пр-во</span>
                  </div>
                </div>
              </div>

              {selectedObject && (
                <div className="glass-panel rounded-3xl p-4 sm:p-5 overflow-hidden">
                  <p className="text-sm text-aqua truncate">{selectedObject.industry}</p>
                  <h3 className="mt-2 break-words font-display text-xl sm:text-2xl uppercase text-snow">
                    {selectedObject.name}
                  </h3>
                  <p className="mt-2 text-sm text-mist">{selectedObject.city}</p>
                  <p className="mt-3 text-sm leading-6 text-mist">{selectedObject.blurb}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="chip">{selectedObject.price}</span>
                    <span className="chip">{selectedObject.duration}</span>
                    <span className="chip">{selectedObject.audience}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMapOpenDetails(selectedObject.slug)}
                    className="mt-5 inline-flex items-center rounded-xl bg-lemon px-4 py-3 text-sm font-semibold text-ink transition hover:bg-yellow-300 w-full sm:w-auto justify-center"
                  >
                    Подробнее из каталога
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileFiltersOpen(false)}
            />
            
            <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-[32px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),rgba(255,255,255,0.04)),linear-gradient(160deg,rgba(1,165,166,0.24),rgba(10,16,42,0.95))] p-5 shadow-2xl animate-slide-up">
              <div className="mb-6 flex items-center justify-between">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20" />
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-snow transition hover:bg-white/20"
                  aria-label="Закрыть фильтры"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <h3 className="font-display text-xl uppercase text-snow">Фильтры</h3>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-mist">Отрасль</label>
                  <CustomSelect
                    options={industryOptions}
                    value={industryFilter ?? ''}
                    onChange={(val) => setIndustryFilter(val || null)}
                    placeholder="Все отрасли"
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm text-mist">Город</label>
                  <CustomSelect
                    options={cityOptions}
                    value={cityFilter ?? ''}
                    onChange={(val) => setCityFilter(val || null)}
                    placeholder="Все города"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/12 bg-white/5 p-4">
                <p className="text-sm font-medium text-snow">Легенда:</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-yellow-400 ring-1 ring-yellow-300/50" />
                    <span className="text-mist">Выбранный объект</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-mist">Пищевая пром.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-mist">Энергетика</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-mist">Машиностроение</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-violet-500" />
                    <span className="text-mist">Нефтегазовая</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-orange-500" />
                    <span className="text-mist">Мебельное пр-во</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {(industryFilter || cityFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleResetFilters();
                      handleApplyMobileFilters();
                    }}
                    className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3.5 text-sm font-medium text-lemon transition hover:bg-white/10"
                  >
                    Сбросить фильтры
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleApplyMobileFilters}
                  className="w-full rounded-xl bg-lemon px-4 py-3.5 text-sm font-semibold text-ink transition hover:bg-yellow-300"
                >
                  Применить фильтры
                </button>
              </div>
              
              <div className="h-6" />
            </div>
          </div>
        )}

        <section id="catalog" className="px-4 py-6 md:px-8 md:py-9">
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
                    className={`min-w-0 rounded-xl px-3 py-2 text-center text-xs transition sm:px-4 sm:text-sm ${
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
                <article key={item.slug} className="glass-panel min-w-0 rounded-3xl p-5 flex flex-col">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm text-aqua">{item.industry}</p>
                        <h3 className="mt-2 break-words font-display text-xl uppercase hyphens-auto sm:text-2xl line-clamp-2 md:min-h-[3.5rem] leading-tight">
                        {item.name}
                        </h3>
                    </div>
                    <span className="hidden chip self-start sm:shrink-0 md:block">{item.city}</span>
                    </div>
                    <div className="mt-2.5 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2">
                    {item.imageUrl ? (
                        <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-44 sm:h-52 object-cover rounded-2xl transition-transform duration-300 hover:scale-[1.02]"
                        loading="lazy"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.image-placeholder')) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'image-placeholder w-full h-44 sm:h-52 rounded-2xl bg-white/5 flex flex-col items-center justify-center gap-2 text-mist/40';
                            placeholder.innerHTML = `
                                <svg class="h-8 w-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" />
                                </svg>
                                <span class="text-xs">Изображение недоступно</span>
                            `;
                            parent.appendChild(placeholder);
                            }
                        }}
                        />
                    ) : (
                        <div className="w-full h-44 sm:h-52 rounded-2xl bg-white/5 flex flex-col items-center justify-center gap-2 text-mist/40">
                        <svg className="h-8 w-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">Нет изображения</span>
                        </div>
                    )}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-mist flex-1">{item.blurb}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                    <span className="chip flex items-center gap-1.5">
                        <Banknote className="h-3.5 w-3.5" />
                        {item.price}
                    </span>
                    <span className="chip flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {item.duration}
                    </span>
                    <span className="chip flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {item.audience}
                    </span>
                    </div>
                    {/* ✅ Кнопки в сетке 2 на 1, каждая занимает половину ширины */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => openExcursionDetails(item.slug)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-lemon px-4 py-3 text-sm font-semibold text-ink transition hover:bg-yellow-300 w-full">
                        Подробнее
                    </button>
                    <button type="button" onClick={() => redirectToBooking(item.slug)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-snow transition hover:bg-white/15 w-full">
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
              Промышленный туризм — это возможность увидеть производство своими глазами. 
              Экскурсии на действующие заводы и фабрики Саратовской области, где Вы узнаете, 
              как создаются продукты, познакомитесь с современными технологиями и поймёте, 
              почему промышленность может быть интересна. 
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                'Профориентация и образовательный эффект',
                'Прозрачная логистика и понятное бронирование',
                'Единая цифровая точка доступа к объектам региона',
                'Поддержка нацпроекта и развитие имиджа области',
              ].map((item) => (
                <div key={item} className="rounded-3xl border border-white/12 bg-white/8 p-4 text-sm leading-6 text-snow">{item}</div>
              ))}
            </div>
          </div>
          <div className="section-shell">
            <span className="eyebrow">Преимущества</span>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { icon: Users, title: 'Для семей', text: 'Безопасные экскурсии для детей 7+, интерактивные программы.' },
                { icon: GraduationCap, title: 'Для студентов', text: 'Бесплатные профориентационные экскурсии и помощь в трудоустройстве на предприятия.' },
                { icon: BriefcaseBusiness, title: 'Для бизнеса', text: 'Корпоративные туры для команд и бенчмаркинг производственных процессов.' },
                { icon: Factory, title: 'Для предприятий', text: 'Включение в реестр промышленного туризма и рост кадрового бренда.' },
              ].map((item) => (
                <div key={item.title} className="glass-panel rounded-3xl p-5">
                  <item.icon className="h-8 w-8 text-lemon" />
                  <h3 className="mt-4 break-words font-display text-xl uppercase">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-mist">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-6 md:px-8 md:py-9">
          <span className="eyebrow">Как это работает</span>
          <h2 className="break-words font-display text-3xl uppercase md:text-4xl">Путь от интереса до поездки</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-4 relative">
            {/* Соединительная линия для десктопа */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-lemon/30 to-transparent" style={{ zIndex: 0 }} />
            
            {[
              { step: '01', title: 'Выберите экскурсию', text: 'Изучите карту или каталог предприятий Саратовской области.' },
              { step: '02', title: 'Узнайте детали', text: 'В карточке экскурсии: программа, длительность, возрастные ограничения, правила безопасности и др.' },
              { step: '03', title: 'Забронируйте дату', text: 'Выберите удобную дату. Система покажет доступные слоты для посещения.' },
              { step: '04', title: 'Получите подтверждение', text: 'Мы свяжемся с Вами для уточнения деталей.' },
            ].map((item, index) => (
              <div key={item.step} className={`glass-panel rounded-3xl p-5 path-step path-step-${index + 1} relative`} style={{ zIndex: 1 }}>
                <p className={`font-display text-4xl text-lemon path-number path-number-${index + 1}`}>{item.step}</p>
                <h3 className="mt-4 break-words font-display text-xl uppercase">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-mist">{item.text}</p>
                
                {/* Точка-соединитель для мобильных */}
                {index < 3 && (
                  <div className="md:hidden absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-lemon/20 border-2 border-lemon/40 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-lemon" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section id="gallery" className="px-4 py-6 md:px-8 md:py-9">
          <span className="eyebrow">Галерея</span>
          <div className="flex gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="break-words font-display text-3xl uppercase md:text-4xl">Визуальный ритм</h2>
          </div>
          {/* <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {galleryCards.map((item, index) => (
              <article key={item} className="relative min-h-[260px] overflow-hidden rounded-3xl border border-white/12 bg-white/8 p-5">
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
          </div> */}
          <div className="mt-8 block min-[1000px]:hidden">
            <div className="swiper-gallery-wrapper relative">
                <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={16}
                slidesPerView={1}
                breakpoints={{ 640: { slidesPerView: 2, spaceBetween: 16 }, 768: { slidesPerView: 3, spaceBetween: 20 } }}
                navigation={{ prevEl: '.swiper-gallery-prev', nextEl: '.swiper-gallery-next' }}
                pagination={{ el: '.swiper-gallery-pagination', clickable: true, dynamicBullets: true }}
                className="swiper-gallery"
                >
                {[
                    'https://promtourism.ru/assets/cache_image/catalog/kozlovye-krany-saratovskoj-gehs_1640x920_652.jpg',
                    'https://promtourism.ru/assets/images/catalog/23-12-05-0016.jpg',
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCFPm5CgrzdWOybocmR12HYJk4o287AcaVSyL7Ke25MGm1RnlhOsc5VbU&s=10',
                    'https://sdelanounas.ru/i/d/3/d/d3d3LnJ1c2h5ZHJvLnJ1L3VwbG9hZC9pYmxvY2svODFkL1NhckdFU196aW1hLmpwZz9fX2lkPTg3MzQ3.jpg',
                    'https://www.gazprommash.ru/sites/default/files/buhb4047.jpg',
                    'https://nversia.ru/imgs/thumbs_news/1734951921_1625278148_720-480.jpg',
                    'https://reporter64.ru/cache/webp/ala_1677748458640068ea7c8be_1200_0_55.webp',
                    'https://news.sarbc.ru/files2/resized_500_500/3/9/c/39ckb54szvmypdx.jpg',
                    'https://nta-pfo.ru/upload/iblock/9f7/uqxemhbt0ebrrzr4b62do6rmkgk4p9ra.jpeg',
                ].map((url, index) => (
                    <SwiperSlide key={index}>
                    <div className="w-full h-[200px] rounded-3xl bg-white/5 border border-white/8 overflow-hidden">
                        <img 
                        src={url} 
                        alt={`Изображение ${index + 1}`} 
                        className="w-full h-full object-cover"
                        />
                    </div>
                    </SwiperSlide>
                ))}
                </Swiper>
                <button className="swiper-gallery-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-ink/80 text-snow backdrop-blur-sm transition-all hover:bg-lemon hover:text-ink hover:border-lemon -ml-4 sm:-ml-6" aria-label="Предыдущий слайд">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button className="swiper-gallery-next absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-ink/80 text-snow backdrop-blur-sm transition-all hover:bg-lemon hover:text-ink hover:border-lemon -mr-4 sm:-mr-6" aria-label="Следующий слайд">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
                <div className="swiper-gallery-pagination absolute bottom-4 left-1/2 z-10 w-auto flex -translate-x-1/2 items-center gap-2"></div>
            </div>
            </div>

            <div className="mt-8 hidden min-[1000px]:grid grid-cols-4 grid-rows-3 gap-5 h-[600px]">
            <div className="row-span-1 w-full h-full rounded-3xl bg-white/5 border border-white/8 overflow-hidden">
                <img src="https://promtourism.ru/assets/cache_image/catalog/kozlovye-krany-saratovskoj-gehs_1640x920_652.jpg" alt="Изображение 1" className="w-full h-full object-cover" />
            </div>
            <div className="col-span-2 row-span-2 w-full h-full rounded-3xl bg-white/5 border border-white/8 overflow-hidden">
                <img src="https://promtourism.ru/assets/images/catalog/23-12-05-0016.jpg" alt="Изображение 2" className="w-full h-full object-cover" />
            </div>
            <div className="col-start-4 row-span-1 w-full h-full rounded-3xl bg-white/5 border border-white/8 overflow-hidden">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCFPm5CgrzdWOybocmR12HYJk4o287AcaVSyL7Ke25MGm1RnlhOsc5VbU&s=10" alt="Изображение 3" className="w-full h-full object-cover" />
            </div>
            <div className="row-start-2 w-full h-full rounded-3xl bg-white/5 border border-white/8 overflow-hidden">
                <img src="https://sdelanounas.ru/i/d/3/d/d3d3LnJ1c2h5ZHJvLnJ1L3VwbG9hZC9pYmxvY2svODFkL1NhckdFU196aW1hLmpwZz9fX2lkPTg3MzQ3.jpg" alt="Изображение 4" className="w-full h-full object-cover" />
            </div>
            <div className="col-start-4 row-start-2 w-full h-full rounded-3xl bg-white/5 border border-white/8 overflow-hidden">
                <img src="https://www.gazprommash.ru/sites/default/files/buhb4047.jpg" alt="Изображение 5" className="w-full h-full object-cover" />
            </div>
            <div className="row-start-3 w-full h-full rounded-3xl bg-white/5 border border-white/8 overflow-hidden">
                <img src="https://nversia.ru/imgs/thumbs_news/1734951921_1625278148_720-480.jpg" alt="Изображение 6" className="w-full h-full object-cover" />
            </div>
            <div className="row-start-3 w-full h-full rounded-3xl bg-white/5 border border-white/8 overflow-hidden">
                <img src="https://reporter64.ru/cache/webp/ala_1677748458640068ea7c8be_1200_0_55.webp" alt="Изображение 7" className="w-full h-full object-cover" />
            </div>
            <div className="row-start-3 w-full h-full rounded-3xl bg-white/5 border border-white/8 overflow-hidden">
                <img src="https://news.sarbc.ru/files2/resized_500_500/3/9/c/39ckb54szvmypdx.jpg" alt="Изображение 8" className="w-full h-full object-cover" />
            </div>
            <div className="row-start-3 w-full h-full rounded-3xl bg-white/5 border border-white/8 overflow-hidden">
                <img src="https://nta-pfo.ru/upload/iblock/9f7/uqxemhbt0ebrrzr4b62do6rmkgk4p9ra.jpeg" alt="Изображение 9" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>

        <section id="faq" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="section-shell">
            <span className="eyebrow">FAQ</span>
            <h2 className="break-words font-display text-3xl uppercase md:text-4xl">Частые вопросы</h2>
            <p className="mt-5 text-base leading-7 text-mist">Узнайте ответы на часто задаваемые вопросы</p>
          </div>
          <div className="space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <article key={item.q} className="glass-panel overflow-hidden rounded-3xl">
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
              <h2 className="break-words font-display text-3xl uppercase md:text-4xl">Проект реализуется при поддержке</h2>
              <p className="mt-5 text-base leading-7 text-mist">
                Сайт позиционируется как единая региональная витрина промышленного туризма: помогает предприятиям
                входить в программу, а посетителям быстро понимать, что и где можно посмотреть.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {partners.map((item) => (
                <div key={item} className="glass-panel break-words rounded-3xl p-5 text-center font-display text-lg uppercase text-snow">{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section id="booking" className="section-shell">
  <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
    <div>
      <span className="eyebrow">Забронировать экскурсию</span>
      <h2 className="break-words font-display text-3xl uppercase md:text-5xl">Оставьте заявку на объект</h2>
      <p className="mt-5 text-base leading-7 text-mist">
        Заполните форму и получите подтверждение экскурсии. Мы свяжемся с Вами для уточнения деталей.
      </p>
    </div>
    
    <form className="glass-panel rounded-3xl p-5" onSubmit={handleBookingSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm text-mist">Имя</span>
          <input 
            type="text" 
            value={bookingForm.name} 
            onChange={(event) => setBookingForm((current) => ({ ...current, name: event.target.value }))} 
            placeholder="Ваше имя" 
            className="w-full h-10 rounded-xl border border-white/12 bg-white/10 px-4 text-snow outline-none transition placeholder:text-mist/70 focus:border-aqua" 
          />
        </label>
        
        <label className="block">
          <span className="mb-2 block text-sm text-mist">Телефон или email</span>
          <input 
            type="text" 
            value={bookingForm.contact} 
            onChange={(event) => setBookingForm((current) => ({ ...current, contact: event.target.value }))} 
            placeholder="+7 или email" 
            className="w-full h-10 rounded-xl border border-white/12 bg-white/10 px-4 text-snow outline-none transition placeholder:text-mist/70 focus:border-aqua" 
          />
        </label>
        
        <label className="block">
          <span className="mb-2 block text-sm text-mist">Формат визита</span>
          <CustomSelect
            options={formatOptions}
            value={bookingForm.format}
            onChange={(val) => setBookingForm((current) => ({ ...current, format: val }))}
          />
        </label>
        
        <label className="block">
          <span className="mb-2 block text-sm text-mist">Дата</span>
          <input 
            type="date" 
            value={bookingForm.date} 
            onChange={(event) => setBookingForm((current) => ({ ...current, date: event.target.value }))} 
            className="w-full h-10 rounded-xl border border-white/12 bg-white/10 px-4 text-snow outline-none transition focus:border-aqua [color-scheme:dark] [&::-webkit-datetime-edit]:text-mist/70 [&::-webkit-datetime-edit-fields-wrapper]:text-mist/70 [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm text-mist">Объект</span>
        <CustomSelect
          options={objectOptions}
          value={bookingForm.objectSlug}
          onChange={(val) => setBookingForm((current) => ({ ...current, objectSlug: val }))}
          placeholder="Выберите объект"
        />
      </label>

      <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-mist">
        <input
          type="checkbox"
          checked={bookingForm.consent}
          onChange={(event) => setBookingForm((current) => ({ ...current, consent: event.target.checked }))}
          className="mt-1 h-4 w-4 rounded-xl border-white/20 bg-white/10 accent-lemon"
        />
        Согласен на обработку персональных данных и получение ответа по заявке.
      </label>

      {bookingMessage && (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
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
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-lemon px-6 py-3 font-semibold text-ink transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-mist"
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
          <div className="glass-panel relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-3xl p-6 md:p-8">
            <button
              type="button"
              aria-label="Закрыть карточку объекта"
              onClick={() => setActiveExcursionSlug(null)}
              className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-snow"
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
              <div className="rounded-3xl border border-white/12 bg-white/6 p-5">
                <h3 className="font-display text-xl uppercase">Краткий профиль объекта</h3>
                <div className="mt-4 space-y-3 text-sm leading-6 text-mist">
                  <p><span className="text-snow">Адрес:</span> {activeExcursion.address}</p>
                  <p><span className="text-snow">Формат:</span> {activeExcursion.format}</p>
                  <p><span className="text-snow">График:</span> {activeExcursion.schedule}</p>
                  <p><span className="text-snow">Безопасность:</span> {activeExcursion.safety}</p>
                  <p><span className="text-snow">Аудитория:</span> {activeExcursion.audienceDetails}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/6 p-5">
                <h3 className="font-display text-xl uppercase">Что входит</h3>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-mist">
                  {activeExcursion.includes.map((item) => (<li key={item}>• {item}</li>))}
                </ul>
                <h3 className="mt-6 font-display text-xl uppercase">Ключевые точки маршрута</h3>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-mist">
                  {activeExcursion.highlights.map((item) => (<li key={item}>• {item}</li>))}
                </ul>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => redirectToBooking(activeExcursion.slug)} className="inline-flex items-center gap-2 rounded-xl bg-lemon px-5 py-3 font-semibold text-ink transition hover:bg-yellow-300">Забронировать объект</button>
              <button type="button" onClick={() => setActiveExcursionSlug(null)} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-medium text-snow transition hover:bg-white/15">Закрыть</button>
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