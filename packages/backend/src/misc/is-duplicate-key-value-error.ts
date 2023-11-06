export function isDuplicateKeyValueError(e: unknown | Error): boolean {
	const nodeError = e as NodeJS.ErrnoException;
	return nodeError.code === "23505";
}
