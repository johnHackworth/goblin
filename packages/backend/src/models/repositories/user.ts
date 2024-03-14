import { In, Not } from "typeorm";
import Ajv from "ajv";
import type { ILocalUser, IRemoteUser } from "@/models/entities/user.js";
import { User } from "@/models/entities/user.js";
import config from "@/config/index.js";
import type { Packed } from "@/misc/schema.js";
import type { Promiseable } from "@/prelude/await-all.js";
import { awaitAll } from "@/prelude/await-all.js";
import { populateEmojis } from "@/misc/populate-emojis.js";
import { getAntennas } from "@/misc/antenna-cache.js";
import { USER_ACTIVE_THRESHOLD, USER_ONLINE_THRESHOLD } from "@/const.js";
import { Cache } from "@/misc/cache.js";
import { db } from "@/db/postgre.js";
import { isActor, getApId } from "@/remote/activitypub/type.js";
import DbResolver from "@/remote/activitypub/db-resolver.js";
import Resolver from "@/remote/activitypub/resolver.js";
import { createPerson } from "@/remote/activitypub/models/person.js";
import {
	AnnouncementReads,
	Announcements,
	Blockings,
	ChannelFollowings,
	DriveFiles,
	Followings,
	FollowRequests,
	Instances,
	MessagingMessages,
	Mutings,
	RenoteMutings,
	Notes,
	NoteUnreads,
	Notifications,
	Pages,
	UserGroupJoinings,
	UserNotePinings,
	UserProfiles,
	UserSecurityKeys,
} from "../index.js";
import type { Instance } from "../entities/instance.js";

const userInstanceCache = new Cache<Instance | null>(
	"userInstance",
	60 * 60 * 3,
);

type IsUserDetailed<Detailed extends boolean> = Detailed extends true
	? Packed<"UserDetailed">
	: Packed<"UserLite">;
type IsMeAndIsUserDetailed<
	ExpectsMe extends boolean | null,
	Detailed extends boolean,
> = Detailed extends true
	? ExpectsMe extends true
		? Packed<"MeDetailed">
		: ExpectsMe extends false
		? Packed<"UserDetailedNotMe">
		: Packed<"UserDetailed">
	: Packed<"UserLite">;

const ajv = new Ajv();

const localUsernameSchema = {
	type: "string",
	pattern: /^\w{1,50}$/.toString().slice(1, -1),
} as const;
const passwordSchema = { type: "string", minLength: 1 } as const;
const nameSchema = { type: "string", minLength: 1, maxLength: 50 } as const;
const descriptionSchema = {
	type: "string",
	minLength: 1,
	maxLength: 2048,
} as const;
const locationSchema = { type: "string", minLength: 1, maxLength: 50 } as const;
const birthdaySchema = {
	type: "string",
	pattern: /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.toString().slice(1, -1),
} as const;

function isLocalUser(user: User): user is ILocalUser;
function isLocalUser<T extends { host: User["host"] }>(
	user: T,
): user is T & { host: null };
/**
 * Returns true if the user is local.
 *
 * @param user The user to check.
 * @returns True if the user is local.
 */
function isLocalUser(user: User | { host: User["host"] }): boolean {
	return user.host == null;
}

function isRemoteUser(user: User): user is IRemoteUser;
function isRemoteUser<T extends { host: User["host"] }>(
	user: T,
): user is T & { host: string };
/**
 * Returns true if the user is remote.
 *
 * @param user The user to check.
 * @returns True if the user is remote.
 */
function isRemoteUser(user: User | { host: User["host"] }): boolean {
	return !isLocalUser(user);
}

export const UserRepository = db.getRepository(User).extend({
	localUsernameSchema,
	passwordSchema,
	nameSchema,
	descriptionSchema,
	locationSchema,
	birthdaySchema,

	//#region Validators
	validateLocalUsername: ajv.compile(localUsernameSchema),
	validatePassword: ajv.compile(passwordSchema),
	validateName: ajv.compile(nameSchema),
	validateDescription: ajv.compile(descriptionSchema),
	validateLocation: ajv.compile(locationSchema),
	validateBirthday: ajv.compile(birthdaySchema),
	//#endregion

	async getRelation(me: User["id"], target: User["id"]) {
		return awaitAll({
			id: target,
			isFollowing: Followings.count({
				where: {
					followerId: me,
					followeeId: target,
				},
				take: 1,
			}).then((n) => n > 0),
			isFollowed: Followings.count({
				where: {
					followerId: target,
					followeeId: me,
				},
				take: 1,
			}).then((n) => n > 0),
			hasPendingFollowRequestFromYou: FollowRequests.count({
				where: {
					followerId: me,
					followeeId: target,
				},
				take: 1,
			}).then((n) => n > 0),
			hasPendingFollowRequestToYou: FollowRequests.count({
				where: {
					followerId: target,
					followeeId: me,
				},
				take: 1,
			}).then((n) => n > 0),
			isBlocking: Blockings.count({
				where: {
					blockerId: me,
					blockeeId: target,
				},
				take: 1,
			}).then((n) => n > 0),
			isBlocked: Blockings.count({
				where: {
					blockerId: target,
					blockeeId: me,
				},
				take: 1,
			}).then((n) => n > 0),
			isMuted: Mutings.count({
				where: {
					muterId: me,
					muteeId: target,
				},
				take: 1,
			}).then((n) => n > 0),
			isRenoteMuted: RenoteMutings.count({
				where: {
					muterId: me,
					muteeId: target,
				},
				take: 1,
			}).then((n) => n > 0),
		});
	},

	async getHasUnreadMessagingMessage(userId: User["id"]): Promise<boolean> {
		const mute = await Mutings.findBy({
			muterId: userId,
		});

		const joinings = await UserGroupJoinings.findBy({ userId: userId });

		const groupQs = Promise.all(
			joinings.map((j) =>
				MessagingMessages.createQueryBuilder("message")
					.where("message.groupId = :groupId", { groupId: j.userGroupId })
					.andWhere("message.userId != :userId", { userId: userId })
					.andWhere("NOT (:userId = ANY(message.reads))", { userId: userId })
					.andWhere("message.createdAt > :joinedAt", { joinedAt: j.createdAt }) // 自分が加入する前の会話については、未読扱いしない
					.getOne()
					.then((x) => x != null),
			),
		);

		const [withUser, withGroups] = await Promise.all([
			MessagingMessages.count({
				where: {
					recipientId: userId,
					isRead: false,
					...(mute.length > 0
						? { userId: Not(In(mute.map((x) => x.muteeId))) }
						: {}),
				},
				take: 1,
			}).then((count) => count > 0),
			groupQs,
		]);

		return withUser || withGroups.some((x) => x);
	},

	async getHasUnreadAnnouncement(userId: User["id"]): Promise<boolean> {
		const reads = await AnnouncementReads.findBy({
			userId: userId,
		});

		const count = await Announcements.countBy(
			reads.length > 0
				? {
						id: Not(In(reads.map((read) => read.announcementId))),
				  }
				: {},
		);

		return count > 0;
	},

	async userFromURI(uri: string): Promise<User | null> {
		const dbResolver = new DbResolver();
		let local = await dbResolver.getUserFromApId(uri);
		if (local) {
			return local;
		}

		// fetching Object once from remote
		const resolver = new Resolver();
		const object = (await resolver.resolve(uri)) as any;

		// /@user If a URI other than the id is specified,
		// the URI is determined here
		if (uri !== object.id) {
			local = await dbResolver.getUserFromApId(object.id);
			if (local != null) return local;
		}

		return isActor(object) ? await createPerson(getApId(object)) : null;
	},

	async getHasUnreadAntenna(userId: User["id"]): Promise<boolean> {
		// try {
		// 	const myAntennas = (await getAntennas()).filter(
		// 		(a) => a.userId === userId,
		// 	);

		// 	const unread =
		// 		myAntennas.length > 0
		// 			? await AntennaNotes.findOneBy({
		// 					antennaId: In(myAntennas.map((x) => x.id)),
		// 					read: false,
		// 			  })
		// 			: null;

		// 	return unread != null;
		// } catch (e) {
		// 	return false;
		// }
		return false; // TODO
	},

	async getHasUnreadChannel(userId: User["id"]): Promise<boolean> {
		const channels = await ChannelFollowings.findBy({ followerId: userId });

		const unread =
			channels.length > 0
				? await NoteUnreads.findOneBy({
						userId: userId,
						noteChannelId: In(channels.map((x) => x.followeeId)),
				  })
				: null;

		return unread != null;
	},

	async getHasUnreadNotification(userId: User["id"]): Promise<boolean> {
		const mute = await Mutings.findBy({
			muterId: userId,
		});
		const mutedUserIds = mute.map((m) => m.muteeId);

		const count = await Notifications.count({
			where: {
				notifieeId: userId,
				...(mutedUserIds.length > 0
					? { notifierId: Not(In(mutedUserIds)) }
					: {}),
				isRead: false,
			},
			take: 1,
		});

		return count > 0;
	},

	async getHasPendingReceivedFollowRequest(
		userId: User["id"],
	): Promise<boolean> {
		const count = await FollowRequests.countBy({
			followeeId: userId,
		});

		return count > 0;
	},

	getOnlineStatus(user: User): "unknown" | "online" | "active" | "offline" {
		if (user.hideOnlineStatus) return "unknown";
		if (user.lastActiveDate == null) return "unknown";
		const elapsed = Date.now() - user.lastActiveDate.getTime();
		return elapsed < USER_ONLINE_THRESHOLD
			? "online"
			: elapsed < USER_ACTIVE_THRESHOLD
			? "active"
			: "offline";
	},

	async getAvatarUrl(user: User): Promise<string> {
		if (user.avatar) {
			return (
				DriveFiles.getPublicUrl(user.avatar, true) ||
				this.getIdenticonUrl(user.id)
			);
		} else if (user.avatarId) {
			const avatar = await DriveFiles.findOneByOrFail({ id: user.avatarId });
			return (
				DriveFiles.getPublicUrl(avatar, true) || this.getIdenticonUrl(user.id)
			);
		} else if (user.username.endsWith('_at_tumblr_com')) {
				const tumblrUsername = user.username.replace(/_at_tumblr_com$/, '') ;
				return `https://api.tumblr.com/v2/blog/${tumblrUsername}/avatar`;
		} else {
			return this.getIdenticonUrl(user.id);
		}
	},

	getAvatarUrlSync(user: User): string {
		if (user.avatar) {
			return (
				DriveFiles.getPublicUrl(user.avatar, true) ||
				this.getIdenticonUrl(user.id)
			);
		} else if (user.username.endsWith('_at_tumblr_com')) {
				const tumblrUsername = user.username.replace(/_at_tumblr_com$/, '') ;
				return `https://api.tumblr.com/v2/blog/${tumblrUsername}/avatar`;
		} else {
			return this.getIdenticonUrl(user.id);
		}
	},

	getIdenticonUrl(userId: User["id"]): string {
		return `${config.url}/identicon/${userId}`;
	},

	async pack<
		ExpectsMe extends boolean | null = null,
		D extends boolean = false,
	>(
		src: User["id"] | User,
		me?: { id: User["id"] } | null | undefined,
		options?: {
			detail?: D;
			includeSecrets?: boolean;
		},
	): Promise<IsMeAndIsUserDetailed<ExpectsMe, D>> {
		const opts = Object.assign(
			{
				detail: false,
				includeSecrets: false,
			},
			options,
		);

		let user: User;

		if (typeof src === "object") {
			user = src;
			if (src.avatar === undefined && src.avatarId)
				src.avatar = (await DriveFiles.findOneBy({ id: src.avatarId })) ?? null;
			if (src.banner === undefined && src.bannerId)
				src.banner = (await DriveFiles.findOneBy({ id: src.bannerId })) ?? null;
		} else {
			user = await this.findOneOrFail({
				where: { id: src },
				relations: {
					avatar: true,
					banner: true,
				},
			});
		}

		const meId = me ? me.id : null;
		const isMe = meId === user.id;

		const relation =
			meId && !isMe && opts.detail
				? await this.getRelation(meId, user.id)
				: null;
		const pins = opts.detail
			? await UserNotePinings.createQueryBuilder("pin")
					.where("pin.userId = :userId", { userId: user.id })
					.innerJoinAndSelect("pin.note", "note")
					.orderBy("pin.id", "DESC")
					.getMany()
			: [];
		const profile = opts.detail
			? await UserProfiles.findOneByOrFail({ userId: user.id })
			: null;

		const followingCount =
			profile == null
				? null
				: profile.ffVisibility === "public" || isMe
				? user.followingCount
				: profile.ffVisibility === "followers" &&
				  relation &&
				  relation.isFollowing
				? user.followingCount
				: null;

		const followersCount =
			profile == null
				? null
				: profile.ffVisibility === "public" || isMe
				? user.followersCount
				: profile.ffVisibility === "followers" &&
				  relation &&
				  relation.isFollowing
				? user.followersCount
				: null;

		const falsy = opts.detail ? false : undefined;

		const packed = {
			id: user.id,
			name: user.name,
			username: user.username,
			host: user.host,
			fromRSS: !! user.tumblrUUID,
			avatarUrl: this.getAvatarUrlSync(user),
			avatarBlurhash: user.avatar?.blurhash || null,
			avatarColor: null, // 後方互換性のため
			isAdmin: user.isAdmin || falsy,
			isModerator: user.isModerator || falsy,
			isBot: user.isBot || falsy,
			isLocked: user.isLocked,
			isCat: user.isCat || falsy,
			speakAsCat: user.speakAsCat || falsy,
			instance: user.host
				? userInstanceCache
						.fetch(
							user.host,
							() => Instances.findOneBy({ host: user.host! }),
							(v) => v != null,
						)
						.then((instance) =>
							instance
								? {
										name: instance.name,
										softwareName: instance.softwareName,
										softwareVersion: instance.softwareVersion,
										iconUrl: instance.iconUrl,
										faviconUrl: instance.faviconUrl,
										themeColor: instance.themeColor,
								  }
								: undefined,
						)
				: undefined,
			emojis: populateEmojis(user.emojis, user.host),
			onlineStatus: this.getOnlineStatus(user),
			driveCapacityOverrideMb: user.driveCapacityOverrideMb,

			...(opts.detail
				? {
						url: profile!.url,
						uri: user.uri,
						movedToUri: user.movedToUri
							? await this.userFromURI(user.movedToUri)
							: null,
						alsoKnownAs: user.alsoKnownAs,
						createdAt: user.createdAt.toISOString(),
						updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
						lastFetchedAt: user.lastFetchedAt
							? user.lastFetchedAt.toISOString()
							: null,
						bannerUrl: user.banner
							? DriveFiles.getPublicUrl(user.banner, false)
							: null,
						bannerBlurhash: user.banner?.blurhash || null,
						bannerColor: null, // 後方互換性のため
						isSilenced: user.isSilenced || falsy,
						isSuspended: user.isSuspended || falsy,
						description: profile!.description,
						location: profile!.location,
						birthday: profile!.birthday,
						lang: profile!.lang,
						fields: profile!.fields,
						followersCount: followersCount || 0,
						followingCount: followingCount || 0,
						notesCount: user.notesCount,
						pinnedNoteIds: pins.map((pin) => pin.noteId),
						pinnedNotes: Notes.packMany(
							pins.map((pin) => pin.note!),
							me,
							{
								detail: true,
							},
						),
						pinnedPageId: profile!.pinnedPageId,
						pinnedPage: profile!.pinnedPageId
							? Pages.pack(profile!.pinnedPageId, me)
							: null,
						publicReactions: profile!.publicReactions,
						ffVisibility: profile!.ffVisibility,
						twoFactorEnabled: profile!.twoFactorEnabled,
						usePasswordLessLogin: profile!.usePasswordLessLogin,
						securityKeys: profile!.twoFactorEnabled
							? UserSecurityKeys.countBy({
									userId: user.id,
							  }).then((result) => result >= 1)
							: false,
				  }
				: {}),

			...(opts.detail && isMe
				? {
						avatarId: user.avatarId,
						bannerId: user.bannerId,
						injectFeaturedNote: profile!.injectFeaturedNote,
						receiveAnnouncementEmail: profile!.receiveAnnouncementEmail,
						alwaysMarkNsfw: profile!.alwaysMarkNsfw,
						autoSensitive: profile!.autoSensitive,
						carefulBot: profile!.carefulBot,
						autoAcceptFollowed: profile!.autoAcceptFollowed,
						noCrawle: profile!.noCrawle,
						preventAiLearning: profile!.preventAiLearning,
						isExplorable: user.isExplorable,
						isDeleted: user.isDeleted,
						hideOnlineStatus: user.hideOnlineStatus,
						hasUnreadSpecifiedNotes: NoteUnreads.count({
							where: { userId: user.id, isSpecified: true },
							take: 1,
						}).then((count) => count > 0),
						hasUnreadMentions: NoteUnreads.count({
							where: { userId: user.id, isMentioned: true },
							take: 1,
						}).then((count) => count > 0),
						hasUnreadAnnouncement: this.getHasUnreadAnnouncement(user.id),
						hasUnreadAntenna: this.getHasUnreadAntenna(user.id),
						hasUnreadChannel: this.getHasUnreadChannel(user.id),
						hasUnreadMessagingMessage: this.getHasUnreadMessagingMessage(
							user.id,
						),
						hasUnreadNotification: this.getHasUnreadNotification(user.id),
						hasPendingReceivedFollowRequest:
							this.getHasPendingReceivedFollowRequest(user.id),
						integrations: profile!.integrations,
						mutedWords: profile!.mutedWords,
						mutedInstances: profile!.mutedInstances,
						mutingNotificationTypes: profile!.mutingNotificationTypes,
						emailNotificationTypes: profile!.emailNotificationTypes,
				  }
				: {}),

			...(opts.includeSecrets
				? {
						email: profile!.email,
						emailVerified: profile!.emailVerified,
						securityKeysList: profile!.twoFactorEnabled
							? UserSecurityKeys.find({
									where: {
										userId: user.id,
									},
									select: {
										id: true,
										name: true,
										lastUsed: true,
									},
							  })
							: [],
				  }
				: {}),

			...(relation
				? {
						isFollowing: relation.isFollowing,
						isFollowed: relation.isFollowed,
						hasPendingFollowRequestFromYou:
							relation.hasPendingFollowRequestFromYou,
						hasPendingFollowRequestToYou: relation.hasPendingFollowRequestToYou,
						isBlocking: relation.isBlocking,
						isBlocked: relation.isBlocked,
						isMuted: relation.isMuted,
						isRenoteMuted: relation.isRenoteMuted,
				  }
				: {}),
		} as Promiseable<Packed<"User">> as Promiseable<
			IsMeAndIsUserDetailed<ExpectsMe, D>
		>;

		return await awaitAll(packed);
	},

	packMany<D extends boolean = false>(
		users: (User["id"] | User)[],
		me?: { id: User["id"] } | null | undefined,
		options?: {
			detail?: D;
			includeSecrets?: boolean;
		},
	): Promise<IsUserDetailed<D>[]> {
		return Promise.all(users.map((u) => this.pack(u, me, options)));
	},

	isLocalUser,
	isRemoteUser,
});
