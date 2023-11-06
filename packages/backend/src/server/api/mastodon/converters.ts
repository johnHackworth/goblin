import { Entity } from "megalodon";
import { convertId, IdType } from "../index.js";

function simpleConvert(data: any) {
	// copy the object to bypass weird pass by reference bugs
	const result = Object.assign({}, data);
	result.id = convertId(data.id, IdType.MastodonId);
	return result;
}

export function convertAccount(account: Entity.Account) {
	return simpleConvert(account);
}
export function convertAnnouncement(announcement: Entity.Announcement) {
	return simpleConvert(announcement);
}
export function convertAttachment(attachment: Entity.Attachment) {
	return simpleConvert(attachment);
}
export function convertFilter(filter: Entity.Filter) {
	return simpleConvert(filter);
}
export function convertList(list: Entity.List) {
	return simpleConvert(list);
}
export function convertFeaturedTag(tag: Entity.FeaturedTag) {
	return simpleConvert(tag);
}

export function convertNotification(notification: Entity.Notification) {
	notification.account = convertAccount(notification.account);
	notification.id = convertId(notification.id, IdType.MastodonId);
	if (notification.status)
		notification.status = convertStatus(notification.status);
	return notification;
}

export function convertPoll(poll: Entity.Poll) {
	return simpleConvert(poll);
}
export function convertRelationship(relationship: Entity.Relationship) {
	return simpleConvert(relationship);
}

export function convertStatus(status: Entity.Status) {
	status.account = convertAccount(status.account);
	status.id = convertId(status.id, IdType.MastodonId);
	if (status.in_reply_to_account_id)
		status.in_reply_to_account_id = convertId(
			status.in_reply_to_account_id,
			IdType.MastodonId,
		);
	if (status.in_reply_to_id)
		status.in_reply_to_id = convertId(status.in_reply_to_id, IdType.MastodonId);
	status.media_attachments = status.media_attachments.map((attachment) =>
		convertAttachment(attachment),
	);
	status.mentions = status.mentions.map((mention) => ({
		...mention,
		id: convertId(mention.id, IdType.MastodonId),
	}));
	if (status.poll) status.poll = convertPoll(status.poll);
	if (status.reblog) status.reblog = convertStatus(status.reblog);

	return status;
}
