export function convertMilliseconds(ms: number) {
	let seconds = Math.round(ms / 1000);
	let minutes = Math.round(seconds / 60);
	let hours = Math.round(minutes / 60);
	const days = Math.round(hours / 24);
	seconds %= 60;
	minutes %= 60;
	hours %= 24;

	const result = [];
	if (days > 0) result.push(`${days} day(s)`);
	if (hours > 0) result.push(`${hours} hour(s)`);
	if (minutes > 0) result.push(`${minutes} minute(s)`);
	if (seconds > 0) result.push(`${seconds} second(s)`);

	return result.join(", ");
}
