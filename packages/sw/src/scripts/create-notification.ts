/*
 * Notification manager for SW
 */
import type { BadgeNames, PushNotificationDataMap } from "@/types";
import { char2fileName } from "@/scripts/twemoji-base";
import { cli } from "@/scripts/operations";
import { getAccountFromId } from "@/scripts/get-account-from-id";
import { swLang } from "@/scripts/lang";
import { getUserName } from "@/scripts/get-user-name";

const closeNotificationsByTags = async (tags: string[]): Promise<void> => {
	for (const n of (
		await Promise.all(
			tags.map((tag) => globalThis.registration.getNotifications({ tag })),
		)
	).flat()) {
		n.close();
	}
};

const iconUrl = (name: BadgeNames): string =>
	`/static-assets/tabler-badges/${name}.png`;
/* How to add a new badge:
 * 1. Find the icon and download png from https://tabler-icons.io/
 * 2. vips resize ~/Downloads/icon-name.png vipswork.png 0.4; vips scRGB2BW vipswork.png ~/icon-name.png"[compression=9,strip]"; rm vipswork.png;
 * 3. mv ~/icon-name.png ~/misskey/packages/backend/assets/tabler-badges/
 * 4. Add 'icon-name' to BadgeNames
 * 5. Add `badge: iconUrl('icon-name'),`
 */

export async function createNotification<
	K extends keyof PushNotificationDataMap,
>(data: PushNotificationDataMap[K]): Promise<void> {
	const n = await composeNotification(data);

	if (n) {
		return self.registration.showNotification(...n);
	} else {
		console.error("Could not compose notification", data);
		return createEmptyNotification();
	}
}

async function composeNotification(
	data: PushNotificationDataMap[keyof PushNotificationDataMap],
): Promise<[string, NotificationOptions] | null> {
	const i18n = await (swLang.i18n ?? swLang.fetchLocale());
	const { t } = i18n;
	switch (data.type) {
		/*
		case 'driveFileCreated': // TODO (Server Side)
			return [t('_notification.fileUploaded'), {
				body: body.name,
				icon: body.url,
				data
			}];
		*/
		case "notification":
			switch (data.body.type) {
				case "follow": {
					// users/showの型定義をswos.apiへ当てはめるのが困難なのでapiFetch.requestを直接使用
					const account = await getAccountFromId(data.userId);
					if (!account) return null;
					const userDetail = await cli.request(
						"users/show",
						{ userId: data.body.userId },
						account.token,
					);
					return [
						t("_notification.youWereFollowed"),
						{
							body: getUserName(data.body.user),
							icon: data.body.user.avatarUrl,
							badge: iconUrl("user-plus"),
							data,
							actions: userDetail.isFollowing
								? []
								: [
										{
											action: "follow",
											title: t("_notification._actions.followBack"),
										},
								  ],
						},
					];
				}

				case "mention":
					return [
						t("_notification.youGotMention", {
							name: getUserName(data.body.user),
						}),
						{
							body: data.body.note.text || "",
							icon: data.body.user.avatarUrl,
							badge: iconUrl("at"),
							data,
							actions: [
								{
									action: "reply",
									title: t("_notification._actions.reply"),
								},
							],
						},
					];

				case "reply":
					return [
						t("_notification.youGotReply", {
							name: getUserName(data.body.user),
						}),
						{
							body: data.body.note.text || "",
							icon: data.body.user.avatarUrl,
							badge: iconUrl("reply"),
							data,
							actions: [
								{
									action: "reply",
									title: t("_notification._actions.reply"),
								},
							],
						},
					];

				case "renote":
					return [
						t("_notification.youRenoted", {
							name: getUserName(data.body.user),
						}),
						{
							body: data.body.note.text || "",
							icon: data.body.user.avatarUrl,
							badge: iconUrl("retweet"),
							data,
							actions: [
								{
									action: "showUser",
									title: getUserName(data.body.user),
								},
							],
						},
					];

				case "quote":
					return [
						t("_notification.youGotQuote", {
							name: getUserName(data.body.user),
						}),
						{
							body: data.body.note.text || "",
							icon: data.body.user.avatarUrl,
							badge: iconUrl("quote-right"),
							data,
							actions: [
								{
									action: "reply",
									title: t("_notification._actions.reply"),
								},
								...(data.body.note.visibility === "public" ||
								data.body.note.visibility === "home"
									? [
											{
												action: "renote",
												title: t("_notification._actions.renote"),
											},
									  ]
									: []),
							],
						},
					];

				case "reaction": {
					let reaction = data.body.reaction;
					let badge: string | undefined;

					if (reaction.startsWith(":")) {
						// カスタム絵文字の場合
						const name = reaction.substring(1, reaction.length - 1);
						const badgeUrl = new URL(`/emoji/${name}.webp`, origin);
						badgeUrl.searchParams.set("badge", "1");
						badge = badgeUrl.href;
						reaction = name.split("@")[0];
					} else {
						// Unicode絵文字の場合
						badge = `/twemoji-badge/${char2fileName(reaction)}.png`;
					}

					if (
						await fetch(badge)
							.then((res) => res.status !== 200)
							.catch(() => true)
					) {
						badge = iconUrl("plus");
					}

					return [
						`${reaction} ${getUserName(data.body.user)}`,
						{
							body: data.body.note.text || "",
							icon: data.body.user.avatarUrl,
							badge,
							data,
							actions: [
								{
									action: "showUser",
									title: getUserName(data.body.user),
								},
							],
						},
					];
				}

				case "pollVote":
					return [
						t("_notification.youGotPoll", {
							name: getUserName(data.body.user),
						}),
						{
							body: data.body.note.text || "",
							icon: data.body.user.avatarUrl,
							badge: iconUrl("poll-h"),
							data,
						},
					];

				case "pollEnded":
					return [
						t("_notification.pollEnded"),
						{
							body: data.body.note.text || "",
							badge: iconUrl("clipboard-check-solid"),
							data,
						},
					];

				case "receiveFollowRequest":
					return [
						t("_notification.youReceivedFollowRequest"),
						{
							body: getUserName(data.body.user),
							icon: data.body.user.avatarUrl,
							badge: iconUrl("clock"),
							data,
							actions: [
								{
									action: "accept",
									title: t("accept"),
								},
								{
									action: "reject",
									title: t("reject"),
								},
							],
						},
					];

				case "followRequestAccepted":
					return [
						t("_notification.yourFollowRequestAccepted"),
						{
							body: getUserName(data.body.user),
							icon: data.body.user.avatarUrl,
							badge: iconUrl("check"),
							data,
						},
					];

				case "groupInvited":
					return [
						t("_notification.youWereInvitedToGroup", {
							userName: getUserName(data.body.user),
						}),
						{
							body: data.body.invitation.group.name,
							badge: iconUrl("id-card-alt"),
							data,
							actions: [
								{
									action: "accept",
									title: t("accept"),
								},
								{
									action: "reject",
									title: t("reject"),
								},
							],
						},
					];

				case "app":
					return [
						data.body.header || data.body.body,
						{
							body: data.body.header && data.body.body,
							icon: data.body.icon,
							data,
						},
					];

				default:
					return null;
			}
		case "unreadMessagingMessage":
			if (data.body.groupId === null) {
				return [
					t("_notification.youGotMessagingMessageFromUser", {
						name: getUserName(data.body.user),
					}),
					{
						icon: data.body.user.avatarUrl,
						badge: iconUrl("comments"),
						tag: `messaging:user:${data.body.userId}`,
						data,
						renotify: true,
					},
				];
			}
			return [
				t("_notification.youGotMessagingMessageFromGroup", {
					name: data.body.group.name,
				}),
				{
					icon: data.body.user.avatarUrl,
					badge: iconUrl("comments"),
					tag: `messaging:group:${data.body.groupId}`,
					data,
					renotify: true,
				},
			];
		default:
			return null;
	}
}

export async function createEmptyNotification(): Promise<void> {
	return new Promise<void>(async (res) => {
		const i18n = await (swLang.i18n ?? swLang.fetchLocale());
		const { t } = i18n;

		await self.registration.showNotification(
			t("_notification.emptyPushNotificationMessage"),
			{
				silent: true,
				badge: iconUrl("null"),
				tag: "read_notification",
			},
		);

		res();

		setTimeout(async () => {
			for (const n of [
				...(await self.registration.getNotifications({
					tag: "user_visible_auto_notification",
				})),
				...(await self.registration.getNotifications({
					tag: "read_notification",
				})),
			]) {
				n.close();
			}
		}, 1000);
	});
}
