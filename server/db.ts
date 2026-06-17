import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BookingRecord, BookingStatus, ObjectRecord } from './types';

const require = createRequire(import.meta.url);

// ✅ Исправлено: правильный тип для DatabaseSync
type DatabaseSyncCtor = new (filename: string) => import('node:sqlite').DatabaseSync;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: DatabaseSyncCtor };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'catalog.sqlite');
const objectsJsonPath = path.join(dataDir, 'objects.json');
const bookingsJsonPath = path.join(dataDir, 'bookings.json');

type ObjectRow = Omit<ObjectRecord, 'tags' | 'coordinates' | 'includes' | 'highlights'> & {
  tags: string;
  latitude: number;
  longitude: number;
  includes: string;
  highlights: string;
  imageUrl: string;
};
type BookingRow = Omit<BookingRecord, 'consent'> & {
  consent: number;
};

let db: import('node:sqlite').DatabaseSync | null = null;

function parseJsonFile<T>(filePath: string, fallback: T): T {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function encodeObject(item: ObjectRecord): ObjectRow {
  return {
    slug: item.slug,
    name: item.name,
    city: item.city,
    industry: item.industry,
    audience: item.audience,
    price: item.price,
    duration: item.duration,
    blurb: item.blurb,
    tags: JSON.stringify(item.tags),
    latitude: item.coordinates[0],
    longitude: item.coordinates[1],
    address: item.address,
    safety: item.safety,
    format: item.format,
    schedule: item.schedule,
    audienceDetails: item.audienceDetails,
    includes: JSON.stringify(item.includes),
    highlights: JSON.stringify(item.highlights),
    fullDescription: item.fullDescription,
    imageUrl: item.imageUrl ?? '',
  };
}

function decodeObject(row: ObjectRow): ObjectRecord {
  return {
    slug: row.slug,
    name: row.name,
    city: row.city,
    industry: row.industry,
    audience: row.audience,
    price: row.price,
    duration: row.duration,
    blurb: row.blurb,
    tags: JSON.parse(row.tags) as string[],
    coordinates: [row.latitude, row.longitude],
    address: row.address,
    safety: row.safety,
    format: row.format,
    schedule: row.schedule,
    audienceDetails: row.audienceDetails,
    includes: JSON.parse(row.includes) as string[],
    highlights: JSON.parse(row.highlights) as string[],
    fullDescription: row.fullDescription,
    imageUrl: row.imageUrl || undefined,
  };
}

function decodeBooking(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    format: row.format,
    date: row.date,
    objectSlug: row.objectSlug,
    consent: Boolean(row.consent) as true,
    status: row.status,
    managerComment: row.managerComment,
    lastContactAt: row.lastContactAt,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  };
}

function migrateJsonData(database: import('node:sqlite').DatabaseSync) {
  const objectCount = Number(
    (database.prepare('SELECT COUNT() as count FROM objects').get() as { count: number }).count ?? 0,
  );
  const bookingCount = Number(
    (database.prepare('SELECT COUNT() as count FROM bookings').get() as { count: number }).count ?? 0,
  );

  if (objectCount === 0) {
    const items = parseJsonFile<ObjectRecord[]>(objectsJsonPath, []);
    const insertObject = database.prepare(`INSERT INTO objects (
      slug, name, city, industry, audience, price, duration, blurb, tags, latitude, longitude,
      address, safety, format, schedule, audienceDetails, includes, highlights, fullDescription, imageUrl
    ) VALUES (
      @slug, @name, @city, @industry, @audience, @price, @duration, @blurb, @tags, @latitude, @longitude,
      @address, @safety, @format, @schedule, @audienceDetails, @includes, @highlights, @fullDescription, @imageUrl
    )`);
    for (const item of items) insertObject.run(encodeObject(item));
  }

  if (bookingCount === 0) {
    const items = parseJsonFile<Partial<BookingRecord>[]>(bookingsJsonPath, []);
    const insertBooking = database.prepare(`INSERT INTO bookings (
      id, name, contact, format, date, objectSlug, consent, status, managerComment, lastContactAt, updatedAt, createdAt
    ) VALUES (
      @id, @name, @contact, @format, @date, @objectSlug, @consent, @status, @managerComment, @lastContactAt, @updatedAt, @createdAt
    )`);
    for (const item of items) {
      const createdAt = item.createdAt ?? new Date().toISOString();
      insertBooking.run({
        id: item.id ?? `booking_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: item.name ?? '',
        contact: item.contact ?? '',
        format: item.format ?? '',
        date: item.date ?? '',
        objectSlug: item.objectSlug ?? '',
        consent: item.consent ? 1 : 0,
        status: item.status ?? 'new',
        managerComment: item.managerComment ?? '',
        lastContactAt: item.lastContactAt ?? null,
        updatedAt: item.updatedAt ?? createdAt,
        createdAt,
      });
    }
  }
}

export function getDb() {
  if (db) return db;
  mkdirSync(dataDir, { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS objects (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      industry TEXT NOT NULL,
      audience TEXT NOT NULL,
      price TEXT NOT NULL,
      duration TEXT NOT NULL,
      blurb TEXT NOT NULL,
      tags TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT NOT NULL,
      safety TEXT NOT NULL,
      format TEXT NOT NULL,
      schedule TEXT NOT NULL,
      audienceDetails TEXT NOT NULL,
      includes TEXT NOT NULL,
      highlights TEXT NOT NULL,
      fullDescription TEXT NOT NULL,
      imageUrl TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      format TEXT NOT NULL,
      date TEXT NOT NULL,
      objectSlug TEXT NOT NULL,
      consent INTEGER NOT NULL,
      status TEXT NOT NULL,
      managerComment TEXT NOT NULL DEFAULT '',
      lastContactAt TEXT,
      updatedAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      createdAt TEXT NOT NULL
    );
  `);

  // Автоматическая миграция для существующей БД
  try {
    db.prepare('ALTER TABLE objects ADD COLUMN imageUrl TEXT NOT NULL DEFAULT ""').run();
  } catch {
    /* колонка уже существует */
  }

  migrateJsonData(db);
  return db;
}

export function listObjects() {
  const database = getDb();
  const rows = database.prepare('SELECT * FROM objects ORDER BY rowid DESC').all() as ObjectRow[];
  return rows.map(decodeObject);
}

export function getObjectBySlug(slug: string) {
  const database = getDb();
  const row = database.prepare('SELECT * FROM objects WHERE slug = ?').get(slug) as ObjectRow | undefined;
  return row ? decodeObject(row) : null;
}

export function createObject(item: ObjectRecord) {
  const database = getDb();
  database
    .prepare(`INSERT INTO objects (
      slug, name, city, industry, audience, price, duration, blurb, tags, latitude, longitude,
      address, safety, format, schedule, audienceDetails, includes, highlights, fullDescription, imageUrl
    ) VALUES (
      @slug, @name, @city, @industry, @audience, @price, @duration, @blurb, @tags, @latitude, @longitude,
      @address, @safety, @format, @schedule, @audienceDetails, @includes, @highlights, @fullDescription, @imageUrl
    )`)
    .run(encodeObject(item));
  return item;
}

export function updateObject(previousSlug: string, item: ObjectRecord) {
  const database = getDb();
  database
    .prepare(`UPDATE objects SET
      slug = @slug, name = @name, city = @city, industry = @industry, audience = @audience,
      price = @price, duration = @duration, blurb = @blurb, tags = @tags, latitude = @latitude,
      longitude = @longitude, address = @address, safety = @safety, format = @format,
      schedule = @schedule, audienceDetails = @audienceDetails, includes = @includes,
      highlights = @highlights, fullDescription = @fullDescription, imageUrl = @imageUrl
    WHERE slug = @previousSlug`)
    .run({ ...encodeObject(item), previousSlug });
  return item;
}

export function deleteObject(slug: string) {
  const database = getDb();
  return database.prepare('DELETE FROM objects WHERE slug = ?').run(slug);
}

export function listBookings(filters: { search?: string; status?: BookingStatus | '' }) {
  const database = getDb();
  const clauses = ['1 = 1'];
  const params: Array<string> = [];

  if (filters.status) {
    clauses.push('status = ?');
    params.push(filters.status);
  }

  if (filters.search) {
    clauses.push('(LOWER(name) LIKE ? OR LOWER(contact) LIKE ? OR LOWER(objectSlug) LIKE ? OR LOWER(format) LIKE ? OR LOWER(managerComment) LIKE ?)');
    const query = `%${filters.search.toLowerCase()}%`;
    params.push(query, query, query, query, query);
  }

  const rows = database
    .prepare(`SELECT * FROM bookings WHERE ${clauses.join(' AND ')} ORDER BY datetime(createdAt) DESC`)
    .all(...params) as BookingRow[];
  return rows.map(decodeBooking);
}

export function createBooking(item: BookingRecord) {
  const database = getDb();
  database
    .prepare(`INSERT INTO bookings (
      id, name, contact, format, date, objectSlug, consent, status, managerComment, lastContactAt, updatedAt, createdAt
    ) VALUES (
      @id, @name, @contact, @format, @date, @objectSlug, @consent, @status, @managerComment, @lastContactAt, @updatedAt, @createdAt
    )`)
    .run({
      ...item,
      consent: item.consent ? 1 : 0,
    });
  return item;
}

export function getBookingById(id: string) {
  const database = getDb();
  const row = database.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as BookingRow | undefined;
  return row ? decodeBooking(row) : null;
}

export function updateBookingWorkflow(
  id: string,
  payload: { status: BookingStatus; managerComment: string; lastContactAt: string | null },
) {
  const database = getDb();
  const updatedAt = new Date().toISOString();
  database
    .prepare(`UPDATE bookings SET
      status = @status, managerComment = @managerComment, lastContactAt = @lastContactAt, updatedAt = @updatedAt
    WHERE id = @id`)
    .run({
      id,
      status: payload.status,
      managerComment: payload.managerComment,
      lastContactAt: payload.lastContactAt,
      updatedAt,
    });
  return getBookingById(id);
}

export function createAdminSession(token: string) {
  const database = getDb();
  database.prepare('INSERT INTO admin_sessions (token, createdAt) VALUES (?, ?)').run(token, new Date().toISOString());
}

export function hasAdminSession(token: string) {
  const database = getDb();
  const row = database.prepare('SELECT token FROM admin_sessions WHERE token = ?').get(token) as { token: string } | undefined;
  return Boolean(row);
}

export function deleteAdminSession(token: string) {
  const database = getDb();
  database.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
}

export function resetDatabase() {
  const database = getDb();
  database.exec(`DELETE FROM admin_sessions; DELETE FROM bookings; DELETE FROM objects;`);
  migrateJsonData(database);
}

export { dbPath };