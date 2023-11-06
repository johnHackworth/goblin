export function shareAvailable(): boolean {
	if (navigator.share) {
		return true;
	}
	return false;
}
