export function isUserRelated(note: any, ids: Set<string>): boolean {
	if (ids.has(note.userId)) return true; // note author is muted
	if (note.mentions?.some((user: string) => ids.has(user))) return true; // any of mentioned users are muted
	if (note.reply && isUserRelated(note.reply, ids)) return true; // also check reply target
	if (note.renote && isUserRelated(note.renote, ids)) return true; // also check renote target
	return false;
}
