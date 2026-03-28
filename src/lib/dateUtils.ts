/**
 * Consistent date formatting utilities for the entire application
 */

export const dateUtils = {
  /**
   * Format a date to a readable string: "Mar 28, 2026 at 2:30:45 PM"
   */
  formatDateTime: (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  },

  /**
   * Format a date to just the date: "Mar 28, 2026"
   */
  formatDate: (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  /**
   * Format a date to date and time separately: { date: "Mar 28, 2026", time: "2:30:45 PM" }
   */
  formatDateAndTime: (date: string | Date): { date: string; time: string } => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const dateStr = d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = d.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    return { date: dateStr, time: timeStr };
  },

  /**
   * Format a date range: "Mar 28, 2026 - Apr 05, 2026"
   */
  formatDateRange: (startDate: string | Date, endDate: string | Date): string => {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    const startStr = start.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const endStr = end.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return `${startStr} - ${endStr}`;
  },
};
