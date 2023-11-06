export function reducedMotion(): boolean {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
