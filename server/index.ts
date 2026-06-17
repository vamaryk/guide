import cors from 'cors';
import crypto from 'node:crypto';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import multer from 'multer';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { verifyPassword } from './auth';
import { loadEnvFiles } from './load-env';
import {
  createAdminSession,
  createBooking,
  createObject,
  deleteAdminSession,
  deleteObject,
  getBookingById,
  getObjectBySlug,
  hasAdminSession,
  listBookings,
  listObjects,
  updateBookingWorkflow,
  updateObject,
} from './db';
import type { BookingRecord, BookingStatus, ObjectRecord } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnvFiles();

export const app = express();
const port = Number(process.env.PORT ?? 8787);
const adminLogin = process.env.ADMIN_LOGIN ?? 'admin';
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH ?? '';

// ✅ Папка для загруженных изображений
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// ✅ Multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Допустимы только изображения (JPEG, PNG, WebP, GIF)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

const objectSchema = z.object({
  slug: z.string().trim().min(2),
  name: z.string().trim().min(2),
  city: z.string().trim().min(2),
  industry: z.string().trim().min(2),
  audience: z.enum(['Семьи', 'Студенты', 'Бизнес']),
  price: z.string().trim().min(2),
  duration: z.string().trim().min(2),
  blurb: z.string().trim().min(10),
  tags: z.array(z.string().trim().min(1)).min(1),
  coordinates: z.tuple([z.number(), z.number()]),
  address: z.string().trim().min(2),
  safety: z.string().trim().min(5),
  format: z.string().trim().min(2),
  schedule: z.string().trim().min(2),
  audienceDetails: z.string().trim().min(5),
  includes: z.array(z.string().trim().min(1)).min(1),
  highlights: z.array(z.string().trim().min(1)).min(1),
  fullDescription: z.string().trim().min(20),
  imageUrl: z.string().trim().optional().or(z.literal('')),
});

const bookingInputSchema = z.object({
  name: z.string().trim().min(2, 'Укажите имя.'),
  contact: z.string().trim().min(5, 'Укажите телефон или email.'),
  format: z.string().trim().min(2, 'Укажите формат визита.'),
  date: z.string().trim().min(2, 'Укажите дату.'),
  objectSlug: z.string().trim().min(2, 'Укажите объект.'),
  consent: z.literal(true),
});

const bookingWorkflowSchema = z.object({
  status: z.enum(['new', 'contacted', 'in_progress', 'confirmed', 'done', 'canceled']),
  managerComment: z.string().trim().max(3000).default(''),
  lastContactAt: z.string().datetime().nullable().optional(),
});

const adminLoginSchema = z.object({
  login: z.string().min(1, 'Введите логин администратора.'),
  password: z.string().min(1, 'Введите пароль администратора.'),
});

app.use(cors());
app.use(express.json());

// ✅ Раздача статических файлов (изображения)
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

function getAdminToken(req: express.Request) {
  const header = req.header('x-admin-token');
  return typeof header === 'string' ? header.trim() : '';
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = getAdminToken(req);
  if (!token || !hasAdminSession(token)) {
    res.status(401).json({ message: 'Требуется авторизация администратора.' });
    return;
  }
  next();
}

function escapeCsvValue(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function toBookingsCsv(items: BookingRecord[]) {
  const header = [
    'id',
    'name',
    'contact',
    'format',
    'date',
    'objectSlug',
    'status',
    'managerComment',
    'lastContactAt',
    'updatedAt',
    'createdAt',
  ];
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
      .map(escapeCsvValue)
      .join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/admin/login', (req, res) => {
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Некорректный запрос авторизации.' });
    return;
  }
  if (!adminPasswordHash) {
    res.status(500).json({ message: 'ADMIN_PASSWORD_HASH не настроен.' });
    return;
  }
  if (parsed.data.login !== adminLogin || !verifyPassword(parsed.data.password, adminPasswordHash)) {
    res.status(401).json({ message: 'Неверный логин или пароль администратора.' });
    return;
  }
  const token = crypto.randomUUID();
  createAdminSession(token);
  res.json({
    token,
    message: 'Авторизация выполнена.',
  });
});

app.get('/api/admin/session', (req, res) => {
  const token = getAdminToken(req);
  res.json({ authenticated: Boolean(token && hasAdminSession(token)) });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  deleteAdminSession(getAdminToken(req));
  res.json({ message: 'Сессия администратора завершена.' });
});

// ✅ Эндпоинт загрузки изображения
app.post('/api/upload', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ message: 'Файл слишком большой. Максимум 5 МБ.' });
        return;
      }
      res.status(400).json({ message: err.message });
      return;
    }
    if (err) {
      res.status(400).json({ message: err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: 'Файл не был загружен.' });
      return;
    }
    const publicUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({
      message: 'Изображение загружено.',
      url: publicUrl,
      filename: req.file.filename,
    });
  });
});

// ✅ Эндпоинт удаления изображения
app.delete('/api/upload/:filename', requireAdmin, (req, res) => {
  const { filename } = req.params;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    res.status(400).json({ message: 'Некорректное имя файла.' });
    return;
  }
  const filePath = path.join(uploadsDir, filename);
  if (!existsSync(filePath)) {
    res.status(404).json({ message: 'Файл не найден.' });
    return;
  }
  try {
    unlinkSync(filePath);
    res.json({ message: 'Изображение удалено.' });
  } catch {
    res.status(500).json({ message: 'Не удалось удалить файл.' });
  }
});

app.get('/api/objects', (_req, res) => {
  res.json({ items: listObjects() });
});

app.get('/api/objects/:slug', (req, res) => {
  const item = getObjectBySlug(req.params.slug);
  if (!item) {
    res.status(404).json({ message: 'Объект не найден.' });
    return;
  }
  res.json(item);
});

app.post('/api/objects', requireAdmin, (req, res) => {
  const parsed = objectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Некорректные данные объекта.' });
    return;
  }
  if (getObjectBySlug(parsed.data.slug)) {
    res.status(409).json({ message: 'Объект с таким slug уже существует.' });
    return;
  }
  const item = createObject(parsed.data as ObjectRecord);
  res.status(201).json({ message: 'Объект создан.', item });
});

app.put('/api/objects/:slug', requireAdmin, (req, res) => {
  const parsed = objectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Некорректные данные объекта.' });
    return;
  }
  if (!getObjectBySlug(req.params.slug)) {
    res.status(404).json({ message: 'Объект не найден.' });
    return;
  }
  const conflictingObject = getObjectBySlug(parsed.data.slug);
  if (parsed.data.slug !== req.params.slug && conflictingObject) {
    res.status(409).json({ message: 'Новый slug уже занят другим объектом.' });
    return;
  }
  const item = updateObject(req.params.slug, parsed.data as ObjectRecord);
  res.json({ message: 'Объект обновлён.', item });
});

app.delete('/api/objects/:slug', requireAdmin, (req, res) => {
  if (!getObjectBySlug(req.params.slug)) {
    res.status(404).json({ message: 'Объект не найден.' });
    return;
  }
  deleteObject(req.params.slug);
  res.json({ message: 'Объект удалён.' });
});

app.get('/api/bookings', requireAdmin, (req, res) => {
  const search = String(req.query.search ?? '').trim();
  const status = String(req.query.status ?? '').trim() as BookingStatus | '';
  const items = listBookings({ search, status });
  res.json({ items });
});

app.get('/api/bookings/export.csv', requireAdmin, (req, res) => {
  const search = String(req.query.search ?? '').trim();
  const status = String(req.query.status ?? '').trim() as BookingStatus | '';
  const items = listBookings({ search, status });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="bookings-export.csv"');
  res.send(toBookingsCsv(items));
});

app.post('/api/bookings', (req, res) => {
  const parsed = bookingInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Некорректные данные заявки.' });
    return;
  }
  const object = getObjectBySlug(parsed.data.objectSlug);
  if (!object) {
    res.status(400).json({ message: 'Выбранный объект не найден.' });
    return;
  }
  const now = new Date().toISOString();
  const nextBooking: BookingRecord = {
    ...parsed.data,
    id: `booking_${Date.now()}`,
    status: 'new',
    managerComment: '',
    lastContactAt: null,
    updatedAt: now,
    createdAt: now,
  };
  createBooking(nextBooking);
  res.status(201).json({
    message: `Заявка на объект «${object.name}» отправлена. Менеджер свяжется с вами.`,
    booking: nextBooking,
  });
});

app.patch('/api/bookings/:id/workflow', requireAdmin, (req, res) => {
  const parsed = bookingWorkflowSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Некорректные данные workflow заявки.' });
    return;
  }
  if (!getBookingById(req.params.id)) {
    res.status(404).json({ message: 'Заявка не найдена.' });
    return;
  }
  const booking = updateBookingWorkflow(req.params.id, {
    status: parsed.data.status,
    managerComment: parsed.data.managerComment,
    lastContactAt: parsed.data.lastContactAt ?? null,
  });
  res.json({ message: 'Workflow заявки обновлён.', booking });
});

if (process.argv[1] === __filename) {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Promtourism backend is running on http://localhost:${port}`);
    // eslint-disable-next-line no-console
    console.log(`Admin auth source: login=${adminLogin}, hash=${adminPasswordHash ? 'configured' : 'missing'}`);
  });
}