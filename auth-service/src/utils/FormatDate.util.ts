export type FormatDateOptions = Intl.DateTimeFormatOptions & {
  locale?: string;
};

export function formatDate(
  input: Date | string | number,
  options: FormatDateOptions = {},
): string {
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const { locale = 'en-US', ...formatOptions } = options;
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...formatOptions,
  });

  return formatter.format(date);
}
