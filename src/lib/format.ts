export const formatPercent = (value: number | null) =>
	value === null ? '–' : `${Math.round(value)}%`;
