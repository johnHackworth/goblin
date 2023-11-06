import { publishMainStream } from "@/services/stream.js";
import { pushNotification } from "@/services/push-notification.js";
import {
	Notifications,
	Mutings,
	NoteThreadMutings,
	UserProfiles,
	Users,
	Followings,
} from "@/models/index.js";
import { genId } from "@/misc/gen-id.js";
import type { User } from "@/models/entities/user.js";
import type { Notification } from "@/models/entities/notification.js";
import { sendEmailNotification } from "./send-email-notification.js";
import { shouldSilenceInstance } from "@/misc/should-block-instance.js";

export async function createNotification(
	notifieeId: User["id"],
	type: Notification["type"],
	data: Partial<Notification>,
) {
	if (data.notifierId && notifieeId === data.notifierId) {
		return null;
	}

	if (
		data.notifierId &&
		["mention", "reply", "renote", "quote", "reaction"].includes(type)
	) {
		const notifier = await Users.findOneBy({ id: data.notifierId });
		// suppress if the notifier does not exist or is silenced.
		if (!notifier) return null;

		// suppress if the notifier is silenced or in a silenced instance, and not followed by the notifiee.
		if (
			(notifier.isSilenced ||
				(Users.isRemoteUser(notifier) &&
					(await shouldSilenceInstance(notifier.host)))) &&
			!(await Followings.exist({
				where: { followerId: notifieeId, followeeId: data.notifierId },
			}))
		)
			return null;
	}

	const profile = await UserProfiles.findOneBy({ userId: notifieeId });

	const isMuted = profile?.mutingNotificationTypes.includes(type);

	if (data.note != null) {
		const threadMute = await NoteThreadMutings.findOneBy({
			userId: notifieeId,
			threadId: data.note.threadId || data.note.id,
		});

		if (threadMute) {
			return null;
		}
	}

	// Create notification
	const notification = await Notifications.insert({
		id: genId(),
		createdAt: new Date(),
		notifieeId: notifieeId,
		type: type,
		// 相手がこの通知をミュートしているようなら、既読を予めつけておく
		isRead: isMuted,
		...data,
	} as Partial<Notification>).then((x) =>
		Notifications.findOneByOrFail(x.identifiers[0]),
	);

	const packed = await Notifications.pack(notification, {});

	// Publish notification event
	publishMainStream(notifieeId, "notification", packed);

	// 2秒経っても(今回作成した)通知が既読にならなかったら「未読の通知がありますよ」イベントを発行する
	setTimeout(async () => {
		const fresh = await Notifications.findOneBy({ id: notification.id });
		if (fresh == null) return; // 既に削除されているかもしれない
		// We execute this before, because the server side "read" check doesnt work well with push notifications, the app and service worker will decide themself
		// when it is best to show push notifications
		pushNotification(notifieeId, "notification", packed);
		if (fresh.isRead) return;

		//#region ただしミュートしているユーザーからの通知なら無視
		const mutings = await Mutings.findBy({
			muterId: notifieeId,
		});
		if (
			data.notifierId &&
			mutings.map((m) => m.muteeId).includes(data.notifierId)
		) {
			return;
		}
		//#endregion

		publishMainStream(notifieeId, "unreadNotification", packed);

		if (type === "follow")
			sendEmailNotification.follow(
				notifieeId,
				await Users.findOneByOrFail({ id: data.notifierId! }),
			);
		if (type === "receiveFollowRequest")
			sendEmailNotification.receiveFollowRequest(
				notifieeId,
				await Users.findOneByOrFail({ id: data.notifierId! }),
			);
	}, 2000);

	return notification;
}
