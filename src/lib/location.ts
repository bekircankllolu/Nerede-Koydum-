/**
 * Internal marker for "the user does not know where this is". Never rendered:
 * every surface resolves it through the translation layer instead.
 *
 * Older installs stored the Turkish UI string directly in the `loc` column,
 * which is why that value is still recognised here. Existing rows are left
 * exactly as they are — recognition is backward compatible, no migration and
 * no rewrite of user data.
 */
export const UNKNOWN_LOCATION_TOKEN = '__depo_unknown_location__';

/** What pre-localization builds wrote into `items.loc`. Read-only legacy. */
export const LEGACY_UNKNOWN_LOCATION = 'Konum bilinmiyor';

export function isUnknownLocation(loc: string | null | undefined): boolean {
  if (!loc) return true;
  const value = loc.trim();
  return value === ''
    || value === UNKNOWN_LOCATION_TOKEN
    || value === LEGACY_UNKNOWN_LOCATION;
}
