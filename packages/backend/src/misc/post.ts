export type Post = {
	text: string | null;
	cw: string | null;
	localOnly: boolean;
	createdAt: Date;
};

export function parse(acct: any): Post {
	return {
		text: acct.text,
		cw: acct.cw,
		localOnly: acct.localOnly,
		createdAt: new Date(acct.createdAt),
	};
}

export function toJson(acct: Post): string {
	return { text: acct.text, cw: acct.cw, localOnly: acct.localOnly }.toString();
}
