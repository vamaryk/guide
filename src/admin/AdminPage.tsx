import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, LockKeyhole, LogOut, Plus, RefreshCw, Save, Search, Trash2 } from 'lucide-react';
import type { Audience, Excursion } from '../data';

type BookingStatus = 'new' | 'contacted' | 'in_progress' | 'confirmed' | 'done' | 'canceled';
type AuthState = 'checking' | 'authorized' | 'guest';

type BookingRecord = {
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

type WorkflowDraft = { status: BookingStatus; managerComment: string };

type ObjectFormState = {
  slug: string;
  name: string;
  city: string;
  industry: string;
  audience: Audience;
  price: string;
  duration: string;
  blurb: string;
  tags: string;
  latitude: string;
  longitude: string;
  address: string;
  safety: string;
  format: string;
  schedule: string;
  audienceDetails: string;
  includes: string;
  highlights: string;
  fullDescription: string;
};

const adminTokenKey = 'promtourism_admin_token';
const statusOptions: Array<{ value: '' | BookingStatus; label: string }> = [
  { value: '', label: 'Все статусы' },
  { value: 'new', label: 'Новые' },
  { value: 'contacted', label: 'Связались' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'confirmed', label: 'Подтверждены' },
  { value: 'done', label: 'Завершены' },
  { value: 'canceled', label: 'Отменены' },
];

const emptyObjectForm: ObjectFormState = {
  slug: '',
  name: '',
  city: '',
  industry: '',
  audience: 'Семьи',
  price: '',
  duration: '',
  blurb: '',
  tags: '',
  latitude: '51.5331',
  longitude: '46.0342',
  address: '',
  safety: '',
  format: '',
  schedule: '',
  audienceDetails: '',
  includes: '',
  highlights: '',
  fullDescription: '',
};

const textFields: Array<[string, keyof ObjectFormState]> = [
  ['Slug', 'slug'],
  ['Название', 'name'],
  ['Город', 'city'],
  ['Индустрия', 'industry'],
  ['Цена', 'price'],
  ['Длительность', 'duration'],
  ['Теги', 'tags'],
];

const textareaFields: Array<[string, keyof ObjectFormState]> = [
  ['Краткое описание', 'blurb'],
  ['Адрес', 'address'],
  ['Безопасность', 'safety'],
  ['Формат', 'format'],
  ['График', 'schedule'],
  ['Описание аудитории', 'audienceDetails'],
  ['Что входит', 'includes'],
  ['Ключевые точки', 'highlights'],
  ['Полное описание', 'fullDescription'],
];

const parseList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const readJson = async <T,>(response: Response) => (await response.json()) as T;
const getStoredToken = () => window.localStorage.getItem(adminTokenKey) ?? '';

function objectToForm(item: Excursion): ObjectFormState {
  return {
    slug: item.slug,
    name: item.name,
    city: item.city,
    industry: item.industry,
    audience: item.audience,
    price: item.price,
    duration: item.duration,
    blurb: item.blurb,
    tags: item.tags.join(', '),
    latitude: String(item.coordinates[0]),
    longitude: String(item.coordinates[1]),
    address: item.address,
    safety: item.safety,
    format: item.format,
    schedule: item.schedule,
    audienceDetails: item.audienceDetails,
    includes: item.includes.join(', '),
    highlights: item.highlights.join(', '),
    fullDescription: item.fullDescription,
  };
}

function formToPayload(form: ObjectFormState): Excursion {
  return {
    slug: form.slug.trim(),
    name: form.name.trim(),
    city: form.city.trim(),
    industry: form.industry.trim(),
    audience: form.audience,
    price: form.price.trim(),
    duration: form.duration.trim(),
    blurb: form.blurb.trim(),
    tags: parseList(form.tags),
    coordinates: [Number(form.latitude), Number(form.longitude)],
    address: form.address.trim(),
    safety: form.safety.trim(),
    format: form.format.trim(),
    schedule: form.schedule.trim(),
    audienceDetails: form.audienceDetails.trim(),
    includes: parseList(form.includes),
    highlights: parseList(form.highlights),
    fullDescription: form.fullDescription.trim(),
  };
}

export function AdminPage() {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [adminToken, setAdminToken] = useState(() => getStoredToken());
  const [authMessage, setAuthMessage] = useState('');
  const [loginValue, setLoginValue] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [objects, setObjects] = useState<Excursion[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [workflowDrafts, setWorkflowDrafts] = useState<Record<string, WorkflowDraft>>({});
  const [objectsStatus, setObjectsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [bookingsStatus, setBookingsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [bookingsSearch, setBookingsSearch] = useState('');
  const [bookingsFilter, setBookingsFilter] = useState<'' | BookingStatus>('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [objectMessage, setObjectMessage] = useState('');
  const [activeObjectSlug, setActiveObjectSlug] = useState<string | null>(null);
  const [objectForm, setObjectForm] = useState<ObjectFormState>(emptyObjectForm);

  const adminFetch = (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, { ...init, headers: { ...(init?.headers ?? {}), 'x-admin-token': adminToken } });

  const syncDrafts = (items: BookingRecord[]) => {
    setWorkflowDrafts(Object.fromEntries(items.map((item) => [item.id, { status: item.status, managerComment: item.managerComment }])));
  };

  const fetchObjects = async () => {
    setObjectsStatus('loading');
    try {
      const response = await fetch('/api/objects');
      const payload = await readJson<{ items: Excursion[] }>(response);
      setObjects(payload.items ?? []);
      setObjectsStatus(response.ok ? 'ready' : 'error');
    } catch {
      setObjectsStatus('error');
    }
  };

  const fetchBookings = async (searchValue = bookingsSearch, statusValue = bookingsFilter) => {
    setBookingsStatus('loading');
    try {
      const query = new URLSearchParams();
      if (searchValue.trim()) query.set('search', searchValue.trim());
      if (statusValue) query.set('status', statusValue);
      const response = await adminFetch(`/api/bookings${query.toString() ? `?${query.toString()}` : ''}`);
      const payload = await readJson<{ items: BookingRecord[] }>(response);
      setBookings(payload.items ?? []);
      syncDrafts(payload.items ?? []);
      setBookingsStatus(response.ok ? 'ready' : 'error');
    } catch {
      setBookingsStatus('error');
    }
  };

  useEffect(() => {
    const verify = async () => {
      if (!adminToken) {
        setAuthState('guest');
        return;
      }
      try {
        const response = await fetch('/api/admin/session', { headers: { 'x-admin-token': adminToken } });
        const payload = await readJson<{ authenticated: boolean }>(response);
        if (payload.authenticated) {
          setAuthState('authorized');
          await fetchObjects();
          await fetchBookings('', '');
          return;
        }
      } catch {}
      window.localStorage.removeItem(adminTokenKey);
      setAdminToken('');
      setAuthState('guest');
    };
    void verify();
  }, [adminToken]);

  useEffect(() => {
    const object = objects.find((item) => item.slug === activeObjectSlug);
    setObjectForm(object ? objectToForm(object) : emptyObjectForm);
  }, [activeObjectSlug, objects]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: loginValue, password: loginPassword }),
    });
    const payload = await readJson<{ token?: string; message?: string }>(response);
    if (!response.ok || !payload.token) {
      setAuthMessage(payload.message ?? 'Не удалось выполнить вход.');
      return;
    }
    window.localStorage.setItem(adminTokenKey, payload.token);
    setAdminToken(payload.token);
    setLoginPassword('');
    setAuthMessage('');
  };

  const handleExportCsv = async () => {
    const query = new URLSearchParams();
    if (bookingsSearch.trim()) query.set('search', bookingsSearch.trim());
    if (bookingsFilter) query.set('status', bookingsFilter);

    const response = await adminFetch(`/api/bookings/export.csv${query.toString() ? `?${query.toString()}` : ''}`);
    if (!response.ok) {
      const payload = await readJson<{ message?: string }>(response);
      setBookingMessage(payload.message ?? 'Не удалось экспортировать CSV.');
      return;
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'bookings-export.csv';
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
  };

  const handleLogout = async () => {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } finally {
      window.localStorage.removeItem(adminTokenKey);
      setAdminToken('');
      setAuthState('guest');
    }
  };

  const handleWorkflowSave = async (id: string) => {
    const draft = workflowDrafts[id];
    if (!draft) return;
    const response = await adminFetch(`/api/bookings/${id}/workflow`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, lastContactAt: new Date().toISOString() }),
    });
    const payload = await readJson<{ message?: string }>(response);
    setBookingMessage(payload.message ?? '');
    if (response.ok) await fetchBookings();
  };

  const handleObjectSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = formToPayload(objectForm);
    const isEditing = Boolean(activeObjectSlug);
    const response = await adminFetch(isEditing ? `/api/objects/${activeObjectSlug}` : '/api/objects', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await readJson<{ message?: string }>(response);
    setObjectMessage(body.message ?? '');
    if (response.ok) {
      setActiveObjectSlug(payload.slug);
      await fetchObjects();
    }
  };

  const handleDeleteObject = async (slug: string) => {
    const response = await adminFetch(`/api/objects/${slug}`, { method: 'DELETE' });
    const payload = await readJson<{ message?: string }>(response);
    setObjectMessage(payload.message ?? '');
    if (response.ok) {
      setActiveObjectSlug(null);
      await fetchObjects();
    }
  };

  if (authState !== 'authorized') {
    return (
      <div className="min-h-screen bg-ink px-4 py-10 text-snow md:px-6">
        <div className="mx-auto max-w-2xl section-shell">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="eyebrow">Admin Access</span>
              <h1 className="font-display text-4xl uppercase">Вход в административную панель</h1>
              <p className="mt-4 text-sm leading-6 text-mist">SQLite, workflow заявок и CRUD объектов доступны только после авторизации.</p>
            </div>
            <a href="/" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-medium text-snow transition hover:bg-white/15">
              <ArrowLeft className="h-4 w-4" />
              На сайт
            </a>
          </div>
          <form className="mt-8 glass-panel rounded-[30px] p-5" onSubmit={handleLogin}>
            <label className="block text-sm text-mist">
              Логин администратора
              <input type="text" value={loginValue} onChange={(event) => setLoginValue(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-snow outline-none focus:border-aqua" />
            </label>
            <label className="block text-sm text-mist">
              Пароль администратора
              <div className="relative mt-2">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
                <input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} className="w-full rounded-2xl border border-white/12 bg-white/10 py-3 pl-11 pr-4 text-snow outline-none focus:border-aqua" />
              </div>
            </label>
            {authMessage && <p className="mt-4 text-sm text-red-200">{authMessage}</p>}
            {authState === 'checking' && <p className="mt-4 text-sm text-mist">Проверяем активную сессию…</p>}
            <button type="submit" className="mt-6 inline-flex items-center gap-2 rounded-full bg-lemon px-5 py-3 font-semibold text-ink transition hover:bg-yellow-300">Войти</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink px-4 py-10 text-snow md:px-6">
      <div className="mx-auto max-w-[1500px] space-y-6 px-4 md:px-6">
        <section className="section-shell">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="eyebrow">Admin MVP</span>
              <h1 className="font-display text-4xl uppercase">Заявки, workflow и каталог объектов</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-medium text-snow transition hover:bg-white/15"><ArrowLeft className="h-4 w-4" />На лендинг</a>
              <button type="button" onClick={() => void handleLogout()} className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-5 py-3 text-sm font-medium text-red-100 transition hover:bg-red-500/20"><LogOut className="h-4 w-4" />Выйти</button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="section-shell">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div><span className="eyebrow">Bookings Workflow</span><h2 className="font-display text-3xl uppercase">Заявки</h2></div>
              <form className="grid gap-3 sm:grid-cols-[1fr_220px_auto]" onSubmit={(event) => void (event.preventDefault(), fetchBookings())}>
                <label className="relative block"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" /><input type="text" value={bookingsSearch} onChange={(event) => setBookingsSearch(event.target.value)} placeholder="Имя, контакт, объект, комментарий" className="w-full rounded-2xl border border-white/12 bg-white/10 py-3 pl-11 pr-4 text-sm text-snow outline-none transition placeholder:text-mist/70 focus:border-aqua" /></label>
                <select value={bookingsFilter} onChange={(event) => setBookingsFilter(event.target.value as '' | BookingStatus)} className="rounded-2xl border border-white/12 bg-ink px-4 py-3 text-sm text-snow outline-none focus:border-aqua">{statusOptions.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}</select>
                <button type="submit" className="inline-flex items-center justify-center rounded-2xl bg-lemon px-5 py-3 text-sm font-semibold text-ink transition hover:bg-yellow-300">Найти</button>
              </form>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={() => void fetchBookings()} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-snow transition hover:bg-white/15"><RefreshCw className="h-4 w-4" />Обновить список</button>
              <button type="button" onClick={() => void handleExportCsv()} className="inline-flex items-center gap-2 rounded-full bg-lemon px-4 py-2 text-sm font-semibold text-ink transition hover:bg-yellow-300">Экспорт CSV</button>
              {bookingMessage && <p className="text-sm text-aqua">{bookingMessage}</p>}
            </div>
            <div className="mt-6 space-y-3">
              {bookingsStatus === 'loading' && <div className="glass-panel rounded-[28px] p-5 text-sm text-mist">Загружаем заявки…</div>}
              {bookingsStatus === 'error' && <div className="glass-panel rounded-[28px] p-5 text-sm text-red-200">Не удалось получить заявки.</div>}
              {bookings.map((item) => {
                const draft = workflowDrafts[item.id] ?? { status: item.status, managerComment: item.managerComment };
                return (
                  <article key={item.id} className="glass-panel rounded-[28px] p-5">
                    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                      <div className="space-y-2 text-sm leading-6 text-mist">
                        <p className="font-display text-xl uppercase text-snow">{item.name}</p>
                        <p>{item.contact}</p>
                        <p>{item.format}</p>
                        <p>Дата визита: {item.date}</p>
                        <p>Объект: {item.objectSlug}</p>
                        <p>Создано: {new Date(item.createdAt).toLocaleString('ru-RU')}</p>
                        <p>Обновлено: {new Date(item.updatedAt).toLocaleString('ru-RU')}</p>
                      </div>
                      <div className="grid gap-4">
                        <label className="block text-sm text-mist">Статус<select value={draft.status} onChange={(event) => setWorkflowDrafts((current) => ({ ...current, [item.id]: { ...draft, status: event.target.value as BookingStatus } }))} className="mt-2 w-full rounded-2xl border border-white/12 bg-ink px-4 py-3 text-snow outline-none focus:border-aqua">{statusOptions.filter((item): item is { value: BookingStatus; label: string } => Boolean(item.value)).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                        <label className="block text-sm text-mist">Комментарий менеджера<textarea value={draft.managerComment} onChange={(event) => setWorkflowDrafts((current) => ({ ...current, [item.id]: { ...draft, managerComment: event.target.value } }))} rows={4} className="mt-2 w-full rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-snow outline-none focus:border-aqua" /></label>
                        <button type="button" onClick={() => void handleWorkflowSave(item.id)} className="inline-flex items-center gap-2 rounded-full bg-lemon px-4 py-3 text-sm font-semibold text-ink transition hover:bg-yellow-300"><Save className="h-4 w-4" />Сохранить workflow</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="section-shell">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div><span className="eyebrow">Objects CRUD</span><h2 className="font-display text-3xl uppercase">Каталог объектов</h2></div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => { setActiveObjectSlug(null); setObjectMessage(''); setObjectForm(emptyObjectForm); }} className="inline-flex items-center gap-2 rounded-full bg-lemon px-4 py-3 text-sm font-semibold text-ink transition hover:bg-yellow-300"><Plus className="h-4 w-4" />Новый объект</button>
                <button type="button" onClick={() => void fetchObjects()} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm text-snow transition hover:bg-white/15"><RefreshCw className="h-4 w-4" />Обновить</button>
              </div>
            </div>
            <div className="mt-6 grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
              <div className="space-y-3">
                {objectsStatus === 'loading' && <div className="glass-panel rounded-[28px] p-4 text-sm text-mist">Загружаем каталог…</div>}
                {objects.map((item) => (
                  <article key={item.slug} className={`rounded-[28px] border p-4 transition ${activeObjectSlug === item.slug ? 'border-aqua/60 bg-aqua/10' : 'border-white/12 bg-white/6 hover:border-white/20'}`}>
                    <button type="button" onClick={() => setActiveObjectSlug(item.slug)} className="w-full text-left">
                      <p className="font-display text-lg uppercase text-snow">{item.name}</p>
                      <p className="mt-1 text-sm text-mist">{item.city} · {item.industry}</p>
                    </button>
                    <button type="button" onClick={() => void handleDeleteObject(item.slug)} className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-100 transition hover:bg-red-500/20"><Trash2 className="h-3.5 w-3.5" />Удалить</button>
                  </article>
                ))}
              </div>
              <form className="glass-panel rounded-[30px] p-5" onSubmit={handleObjectSubmit}>
                <div className="flex items-center justify-between gap-4"><p className="font-display text-2xl uppercase">{activeObjectSlug ? 'Редактирование объекта' : 'Создание объекта'}</p>{objectMessage && <p className="text-sm text-aqua">{objectMessage}</p>}</div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {textFields.map(([label, field]) => <label key={field} className="block text-sm text-mist">{label}<input aria-label={label} type="text" value={objectForm[field]} onChange={(event) => setObjectForm((current) => ({ ...current, [field]: event.target.value }))} className="mt-2 w-full rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-snow outline-none focus:border-aqua" /></label>)}
                  <label className="block text-sm text-mist">Аудитория<select value={objectForm.audience} onChange={(event) => setObjectForm((current) => ({ ...current, audience: event.target.value as Audience }))} className="mt-2 w-full rounded-2xl border border-white/12 bg-ink px-4 py-3 text-snow outline-none focus:border-aqua"><option value="Семьи">Семьи</option><option value="Студенты">Студенты</option><option value="Бизнес">Бизнес</option></select></label>
                  <label className="block text-sm text-mist">Широта<input type="number" step="0.0001" value={objectForm.latitude} onChange={(event) => setObjectForm((current) => ({ ...current, latitude: event.target.value }))} className="mt-2 w-full rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-snow outline-none focus:border-aqua" /></label>
                  <label className="block text-sm text-mist">Долгота<input type="number" step="0.0001" value={objectForm.longitude} onChange={(event) => setObjectForm((current) => ({ ...current, longitude: event.target.value }))} className="mt-2 w-full rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-snow outline-none focus:border-aqua" /></label>
                </div>
                <div className="mt-4 grid gap-4">
                  {textareaFields.map(([label, field]) => <label key={field} className="block text-sm text-mist">{label}<textarea aria-label={label} value={objectForm[field]} onChange={(event) => setObjectForm((current) => ({ ...current, [field]: event.target.value }))} rows={field === 'fullDescription' ? 5 : 3} className="mt-2 w-full rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-snow outline-none focus:border-aqua" /></label>)}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-lemon px-5 py-3 font-semibold text-ink transition hover:bg-yellow-300"><Save className="h-4 w-4" />{activeObjectSlug ? 'Сохранить изменения' : 'Создать объект'}</button>
                  <button type="button" onClick={() => { setActiveObjectSlug(null); setObjectMessage(''); setObjectForm(emptyObjectForm); }} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 font-medium text-snow transition hover:bg-white/15">Сбросить форму</button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
