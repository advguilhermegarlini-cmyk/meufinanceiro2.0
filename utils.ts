// Timezone: America/Cuiaba (Sinop, MT)

export const SINOP_TIMEZONE = 'America/Cuiaba';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    timeZone: SINOP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    timeZone: SINOP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getCurrentSinopDate = () => {
  // Returns current date object adjusted to timezone perception if needed,
  // but simpler to just use ISO string for storage and formatter for display.
  // This helper returns an ISO string based on current time.
  return new Date().toISOString();
};

export const getMonthName = (date: Date) => {
  return date.toLocaleDateString('pt-BR', { month: 'long', timeZone: SINOP_TIMEZONE });
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const GITHUB_COLORS = [
  '#58a6ff', // Blue
  '#3fb950', // Green
  '#f85149', // Red
  '#bc8cff', // Purple
  '#d29922', // Orange/Yellow
  '#ff7b72', // Pinkish Red
  '#79c0ff', // Light Blue
  '#d2a8ff', // Light Purple
];