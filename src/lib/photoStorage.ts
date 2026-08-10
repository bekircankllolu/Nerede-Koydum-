import { Directory, File, Paths } from 'expo-file-system';

// Photos picked from the camera roll or camera live in a temporary/cache
// location that iOS is free to purge. Anything we intend to still show
// months from now has to be copied into the app's own document directory
// first — that is the whole point of this module.
const PHOTO_DIR_SEGMENTS = ['depo', 'photos'] as const;
const DEFAULT_EXT = 'jpg';

function photosDir(): Directory {
  return new Directory(Paths.document, ...PHOTO_DIR_SEGMENTS);
}

function ensureDir(): Directory {
  const dir = photosDir();
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Best-effort extension from a source URI, ignoring any query string. */
function extensionOf(uri: string): string {
  const withoutQuery = uri.split('?')[0];
  const lastSegment = withoutQuery.split('/').pop() || '';
  const dot = lastSegment.lastIndexOf('.');
  if (dot === -1 || dot === lastSegment.length - 1) return DEFAULT_EXT;
  const ext = lastSegment.slice(dot + 1).toLowerCase();
  // Guard against a "." that isn't really an extension (e.g. a directory name).
  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : DEFAULT_EXT;
}

function uniqueName(ext: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `p${Date.now()}_${rand}.${ext}`;
}

/**
 * True only for files this app owns inside depo/photos. Every delete path
 * checks this first so a stray URI — an old picker path from a previous app
 * version, a bundled asset — can never be deleted by us.
 */
export function isManagedPhoto(uri: string | null | undefined): boolean {
  if (!uri) return false;
  const dirUri = photosDir().uri;
  return uri.startsWith(dirUri);
}

/**
 * Copies a picked/captured photo into permanent storage.
 * Throws if the copy fails, so callers can abort before touching the DB.
 */
export async function persistPhoto(sourceUri: string): Promise<string> {
  const dir = ensureDir();
  const target = new File(dir, uniqueName(extensionOf(sourceUri)));
  const source = new File(sourceUri);
  await source.copy(target);
  return target.uri;
}

/**
 * Deletes a photo we own. Never throws: a leftover file is a much smaller
 * problem than a failed user action, so callers treat this as best-effort.
 */
export async function deleteManagedPhoto(uri: string | null | undefined): Promise<void> {
  if (!isManagedPhoto(uri)) return;
  try {
    const file = new File(uri as string);
    if (file.exists) file.delete();
  } catch (err) {
    if (__DEV__) console.warn('[photoStorage] could not delete photo', uri, err);
  }
}

/**
 * Whether the file behind a stored URI is actually still on disk. Used to
 * fall back gracefully instead of rendering a broken image.
 */
export function photoFileExists(uri: string | null | undefined): boolean {
  if (!uri) return false;
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}
