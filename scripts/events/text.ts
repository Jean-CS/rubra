import { load } from "cheerio";
import { isHttpUrl } from "./types";

export const normalizeText = (value: string) =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLocaleLowerCase("pt-BR")
		.replace(/[^a-z0-9]+/g, " ")
		.trim();

export const compactText = (value: string) => value.replace(/\s+/g, " ").trim();

export const htmlToText = (value: string) => {
	const $ = load(`<main>${value}</main>`);
	return compactText($("main").text());
};

export const truncate = (value: string, maxLength = 320) => {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength - 1).trimEnd()}…`;
};

export const slugify = (value: string) => normalizeText(value).replace(/\s+/g, "-");

export const toLocalDateParts = (isoDate: string, timeZone: string) => {
	if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
		const [year, month, day] = isoDate.split("-").map(Number);
		const date = new Date(Date.UTC(year, month - 1, day));
		if (
			date.getUTCFullYear() !== year ||
			date.getUTCMonth() !== month - 1 ||
			date.getUTCDate() !== day
		) {
			throw new Error(`Data inválida: ${isoDate}`);
		}
		return { date: isoDate, time: undefined };
	}

	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) throw new Error(`Data inválida: ${isoDate}`);

	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	});
	const parts = Object.fromEntries(
		formatter.formatToParts(date).map(({ type, value }) => [type, value]),
	);

	return {
		date: `${parts.year}-${parts.month}-${parts.day}`,
		time: parts.minute === "00" ? `${parts.hour}h` : `${parts.hour}h${parts.minute}`,
	};
};

export const canonicalUrl = (value: string) => {
	if (!isHttpUrl(value)) throw new Error(`URL deve usar HTTP ou HTTPS: ${value}`);
	const url = new URL(value);
	url.hash = "";
	url.search = "";
	url.hostname = url.hostname.toLocaleLowerCase("en-US");
	url.pathname = url.pathname.replace(/\/+$/, "") || "/";
	return url.toString();
};
