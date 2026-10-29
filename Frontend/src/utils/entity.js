
import { FILES_URL } from './constants';

/** Works with a populated document or a plain ID string. */
export const idOf = (value) =>
  typeof value === 'string'
    ? value
    : value?._id ?? value?.id ?? '';

/** Returns a readable user name. */
export const nameOf = (user) => {
  if (!user) return '—';
  if (typeof user === 'string') return '—';

  return (
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.fullName ||
    user.name ||
    user.email ||
    '—'
  );
};

/** Converts a name into initials. */
export const initialsOf = (name = '') =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

/** Returns a room number. */
export const roomNo = (room) =>
  !room || typeof room === 'string'
    ? '—'
    : String(room.roomNumber ?? '—');

/** Returns the populated room type name. */
export const roomTypeNameOf = (value) => {
  const type = value?.roomType;

  return type && typeof type === 'object'
    ? type.name ?? ''
    : '';
};

/** Backward-compatible room type helper. */
export const roomTypeName = roomTypeNameOf;

/** Returns a readable room label. */
export const roomLabel = (room) =>
  !room || typeof room === 'string'
    ? '—'
    : [
        `Room ${roomNo(room)}`,
        roomTypeNameOf(room),
      ]
        .filter(Boolean)
        .join(' · ');

/** Uses the room price override, then the room type base price. */
export const rateOf = (room) =>
  Number(room?.price ?? room?.roomType?.basePrice ?? 0);

/**
 * Converts uploaded image paths to URLs.
 * Full URLs, data URLs and public /images paths pass through unchanged.
 */
export const imageUrl = (path) => {
  if (!path || typeof path !== 'string') return '';

  if (
    /^(https?:\/\/|data:|\/images\/)/i.test(path)
  ) {
    return path;
  }

  return `${FILES_URL}/${path.replace(/^\/+/, '')}`;
};

/** Fallback images for room cards. */
export const FALLBACK_IMAGES = [
  '/images/deluxe.webp',
  '/images/dark.webp',
  '/images/twin.webp',
  '/images/suite.webp',
];

/** Returns a fallback image by index. */
export const fallbackImage = (index = 0) =>
  FALLBACK_IMAGES[
    Math.abs(Number(index) || 0) % FALLBACK_IMAGES.length
  ];

/** Returns a room type image or fallback. */
export const typeImage = (type, index = 0) =>
  imageUrl(type?.images?.[0]) || fallbackImage(index);

/** Creates a URL-friendly slug. */
export const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Reads the first available property.
 * Supports nested paths and both call styles:
 * pick(room, 'price', 'roomType.basePrice')
 * pick(room, ['price', 'roomType.basePrice'])
 */
export const pick = (obj, ...keys) => {
  if (
    !obj ||
    typeof obj !== 'object' ||
    Array.isArray(obj)
  ) {
    return undefined;
  }

  const paths = keys.flat();

  for (const path of paths) {
    if (typeof path !== 'string') continue;

    const value = path.split('.').reduce(
      (current, key) => {
        if (current == null) return undefined;
        return current[key];
      },
      obj
    );

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
};

/** Returns an ID from a string or populated object. */
export const uid = (value) =>
  typeof value === 'string'
    ? value
    : value?._id ?? value?.id ?? '';

/** Downloads data as a CSV file. */
export function downloadCsv(name, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return;

  const cols = Object.keys(rows[0]);

  const escapeCsv = (value) =>
    `"${String(value ?? '').replace(/"/g, '""')}"`;

  const csv = [
    cols.map(escapeCsv).join(','),
    ...rows.map((row) =>
      cols.map((column) => escapeCsv(row[column])).join(',')
    ),
  ].join('\n');

  const blob = new Blob(
    ['\ufeff', csv],
    { type: 'text/csv;charset=utf-8' }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `${name}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
