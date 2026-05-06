const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
	day: "2-digit",
	month: "short",
	timeZone: "UTC",
});

const longDateFormatter = new Intl.DateTimeFormat("pt-BR", {
	day: "2-digit",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

export const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", {
	weekday: "short",
	timeZone: "UTC",
});

const formatShortDate = (date: Date) => shortDateFormatter.format(date).replace(".", "");

export const formatLongEventDate = (date: Date) =>
	longDateFormatter.format(date).replace(".", "");

export const formatEventDate = (date: Date, endDate?: Date) => {
	const start = formatShortDate(date);
	const end = endDate ? formatShortDate(endDate) : null;

	if (!end || end === start) return start;

	const sameMonth =
		date.getUTCFullYear() === endDate.getUTCFullYear() &&
		date.getUTCMonth() === endDate.getUTCMonth();

	return sameMonth ? `${date.getUTCDate()} a ${end}` : `${start} a ${end}`;
};

