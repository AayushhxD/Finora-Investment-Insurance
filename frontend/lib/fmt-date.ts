/**
 * Format a date string to a consistent locale-independent format (DD Mon YYYY).
 * Using `en-IN` locale with explicit options avoids server/client hydration mismatches
 * caused by `toLocaleDateString()` using the user's locale on the client.
 */
export function fmtDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    })
  } catch {
    return '—'
  }
}

/** Short date — "5 Sep 2024" */
export function fmtDateShort(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    })
  } catch {
    return '—'
  }
}
