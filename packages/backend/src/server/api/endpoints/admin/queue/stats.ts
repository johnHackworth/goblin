import {
	deliverQueue,
	inboxQueue,
	dbQueue,
	objectStorageQueue,
	backgroundQueue,
} from "@/queue/queues.js";
import define from "../../../define.js";

export const meta = {
	tags: ["admin"],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: "object",
		optional: false,
		nullable: false,
		properties: {
			deliver: {
				optional: false,
				nullable: false,
				ref: "QueueCount",
			},
			inbox: {
				optional: false,
				nullable: false,
				ref: "QueueCount",
			},
			db: {
				optional: false,
				nullable: false,
				ref: "QueueCount",
			},
			objectStorage: {
				optional: false,
				nullable: false,
				ref: "QueueCount",
			},
			backgroundQueue: {
				optional: false,
				nullable: false,
				ref: "QueueCount",
			},
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async (ps) => {
	const deliverJobCounts = await deliverQueue.getJobCounts();
	const inboxJobCounts = await inboxQueue.getJobCounts();
	const dbJobCounts = await dbQueue.getJobCounts();
	const objectStorageJobCounts = await objectStorageQueue.getJobCounts();
	const backgroundJobCounts = await backgroundQueue.getJobCounts();

	return {
		deliver: deliverJobCounts,
		inbox: inboxJobCounts,
		db: dbJobCounts,
		objectStorage: objectStorageJobCounts,
		backgroundQueue: backgroundJobCounts,
	};
});
