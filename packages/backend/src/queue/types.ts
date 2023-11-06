import type { DriveFile } from "@/models/entities/drive-file.js";
import type { Note } from "@/models/entities/note";
import type { User } from "@/models/entities/user.js";
import type { Webhook } from "@/models/entities/webhook";
import type { IActivity } from "@/remote/activitypub/type.js";
import type httpSignature from "@peertube/http-signature";

export type DeliverJobData = {
	/** Actor */
	user: ThinUser;
	/** Activity */
	content: unknown;
	/** inbox URL to deliver */
	to: string;
};

export type InboxJobData = {
	activity: IActivity;
	signature: httpSignature.IParsedSignature;
};

export type DbJobData =
	| DbUserJobData
	| DbUserImportPostsJobData
	| DbUserImportJobData
	| DbUserDeleteJobData
	| DbUserImportMastoPostJobData;

export type DbUserJobData = {
	user: ThinUser;
	excludeMuting: boolean;
	excludeInactive: boolean;
};

export type DbUserDeleteJobData = {
	user: ThinUser;
	soft?: boolean;
};

export type DbUserImportJobData = {
	user: ThinUser;
	fileId: DriveFile["id"];
};

export type DbUserImportPostsJobData = {
	user: ThinUser;
	fileId: DriveFile["id"];
	signatureCheck: boolean;
};

export type DbUserImportMastoPostJobData = {
	user: ThinUser;
	post: any;
	signatureCheck: boolean;
};

export type ObjectStorageJobData =
	| ObjectStorageFileJobData
	| Record<string, unknown>;

export type ObjectStorageFileJobData = {
	key: string;
};

export type EndedPollNotificationJobData = {
	noteId: Note["id"];
};

export type WebhookDeliverJobData = {
	type: string;
	content: unknown;
	webhookId: Webhook["id"];
	userId: User["id"];
	to: string;
	secret: string;
	createdAt: number;
	eventId: string;
};

export type ThinUser = {
	id: User["id"];
};
