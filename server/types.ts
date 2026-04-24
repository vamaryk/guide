export type Audience = 'Семьи' | 'Студенты' | 'Бизнес';
export type BookingStatus = 'new' | 'contacted' | 'in_progress' | 'confirmed' | 'done' | 'canceled';

export type ObjectRecord = {
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
  imageUrl?: string; // 👈 добавлено
};

export type BookingRecord = {
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