/**
 * Centralized utility for handling timezone inconsistencies between Frontend and Backend.
 * 
 * Note: Backend currently has a timezone bug where it adds +7 hours incorrectly in some mappers
 * or treats UTC as local time. These helpers isolate the workarounds until Backend is fixed.
 */

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Adjusts a date received from the backend by subtracting the 7-hour offset.
 * Use this when displaying dates that come from backend endpoints known to have the +7h bug.
 */
export const adjustDateFromBackend = (date: Date | string | number): Date => {
  if (!date) return new Date();
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date();
  return new Date(d.getTime() - VIETNAM_OFFSET_MS);
};

/**
 * Adjusts a date for display by adding the 7-hour offset (manual UTC+7 conversion).
 */
export const adjustDateForDisplay = (date: Date | string | number): Date => {
  if (!date) return new Date();
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date();
  return new Date(d.getTime() + VIETNAM_OFFSET_MS);
};

/**
 * Formats a date string specifically for backend create/update showtime endpoints
 * which expect "yyyy-MM-dd HH:mm:ss" in "local" time.
 */
export const formatShowtimeDateForBackend = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
