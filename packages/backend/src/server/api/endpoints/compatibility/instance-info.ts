import * as mfm from "mfm-js";
import { toHtml } from "@/mfm/to-html.js";
import config from "@/config/index.js";
import { fetchMeta } from "@/misc/fetch-meta.js";
import {
	Users,
	Notes,
	Instances,
	UserProfiles,
	Emojis,
	DriveFiles,
} from "@/models/index.js";
import type { Emoji } from "@/models/entities/emoji.js";
import type { User } from "@/models/entities/user.js";
import { IsNull, In } from "typeorm";
import { MAX_NOTE_TEXT_LENGTH, FILE_TYPE_BROWSERSAFE } from "@/const.js";
import define from "../../define.js";

export const meta = {
	requireCredential: false,
	requireCredentialPrivateMode: true,
	allowGet: true,

	tags: ["meta"],
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async () => {
	const now = Date.now();
	const [meta, total, localPosts, instanceCount, firstAdmin, emojis] =
		await Promise.all([
			fetchMeta(true),
			Users.count({ where: { host: IsNull() } }),
			Notes.count({ where: { userHost: IsNull(), replyId: IsNull() } }),
			Instances.count(),
			Users.findOne({
				where: {
					host: IsNull(),
					isAdmin: true,
					isDeleted: false,
					isBot: false,
				},
				order: { id: "ASC" },
			}),
			Emojis.find({
				where: { host: IsNull(), type: In(FILE_TYPE_BROWSERSAFE) },
				select: ["id", "name", "originalUrl", "publicUrl"],
			}).then((l) =>
				l.reduce((a, e) => {
					a[e.name] = e;
					return a;
				}, {} as Record<string, Emoji>),
			),
		]);

	const descSplit = splitN(meta.description, "\n", 2);
	const shortDesc = markup(descSplit.length > 0 ? descSplit[0] : "");
	const longDesc = markup(meta.description ?? "");

	return {
		uri: config.hostname,
		title: meta.name,
		short_description: shortDesc,
		description: longDesc,
		email: meta.maintainerEmail,
		version: config.version,
		urls: {
			streaming_api: `wss://${config.host}`,
		},
		stats: {
			user_count: total,
			status_count: localPosts,
			domain_count: instanceCount,
		},
		thumbnail: meta.logoImageUrl,
		languages: meta.langs,
		registrations: !meta.disableRegistration,
		approval_required: false,
		invites_enabled: false,
		configuration: {
			accounts: {
				max_featured_tags: 16,
			},
			statuses: {
				max_characters: MAX_NOTE_TEXT_LENGTH,
				max_media_attachments: 16,
				characters_reserved_per_url: 0,
			},
			media_attachments: {
				supported_mime_types: FILE_TYPE_BROWSERSAFE,
				image_size_limit: 10485760,
				image_matrix_limit: 16777216,
				video_size_limit: 41943040,
				video_frame_rate_limit: 60,
				video_matrix_limit: 2304000,
			},
			polls: {
				max_options: 10,
				max_characters_per_option: 50,
				min_expiration: 15,
				max_expiration: -1,
			},
		},
		contact_account: await getContact(firstAdmin, emojis),
		rules: [],
	};
});

const splitN = (s: string | null, split: string, n: number): string[] => {
	const ret: string[] = [];
	if (s == null) return ret;
	if (s === "") {
		ret.push(s);
		return ret;
	}

	let start = 0;
	let pos = s.indexOf(split);
	if (pos === -1) {
		ret.push(s);
		return ret;
	}

	for (let i = 0; i < n - 1; i++) {
		ret.push(s.substring(start, pos));
		start = pos + split.length;
		pos = s.indexOf(split, start);
		if (pos === -1) break;
	}
	ret.push(s.substring(start));

	return ret;
};

type ContactType = {
	id: string;
	username: string;
	acct: string;
	display_name: string;
	note?: string;
	noindex?: boolean;
	fields?: {
		name: string;
		value: string;
		verified_at: string | null;
	}[];
	locked: boolean;
	bot: boolean;
	created_at: string;
	url: string;
	followers_count: number;
	following_count: number;
	statuses_count: number;
	last_status_at?: string;
	emojis: any;
} | null;

const getContact = async (
	user: User | null,
	emojis: Record<string, Emoji>,
): Promise<ContactType> => {
	if (!user) return null;

	let contact: ContactType = {
		id: user.id,
		username: user.username,
		acct: user.username,
		display_name: user.name ?? user.username,
		locked: user.isLocked,
		bot: user.isBot,
		created_at: user.createdAt.toISOString(),
		url: `${config.url}/@${user.username}`,
		followers_count: user.followersCount,
		following_count: user.followingCount,
		statuses_count: user.notesCount,
		last_status_at: user.lastActiveDate?.toISOString(),
		emojis: emojis
			? user.emojis
					.filter((e, i, a) => e in emojis && a.indexOf(e) === i)
					.map((e) => ({
						shortcode: e,
						static_url: emojis[e].publicUrl,
						url: emojis[e].originalUrl,
						visible_in_picker: true,
					}))
			: [],
	};

	const [profile] = await Promise.all([
		UserProfiles.findOne({ where: { userId: user.id } }),
		loadDriveFiles(contact, "avatar", user.avatarId),
		loadDriveFiles(contact, "header", user.bannerId),
	]);

	if (!profile) {
		return contact;
	}

	contact = {
		...contact,
		note: markup(profile.description ?? ""),
		noindex: profile.noCrawle,
		fields: profile.fields.map((f) => ({
			name: f.name,
			value: f.value,
			verified_at: null,
		})),
	};

	return contact;
};

const loadDriveFiles = async (
	contact: any,
	key: string,
	fileId: string | null,
) => {
	if (fileId) {
		const file = await DriveFiles.findOneBy({ id: fileId });
		if (file) {
			contact[key] = file.webpublicUrl ?? file.url;
			contact[`${key}_static`] = contact[key];
		}
	}
};

const markup = (text: string): string => toHtml(mfm.parse(text)) ?? "";
