import { Instances, NoteReactions, Notes, Users } from "@/models/index.js";
import define from "../define.js";
import { driveChart, notesChart, usersChart } from "@/services/chart/index.js";
import { IsNull } from "typeorm";

export const meta = {
	requireCredential: false,
	requireCredentialPrivateMode: true,

	tags: ["meta"],

	res: {
		type: "object",
		optional: false,
		nullable: false,
		properties: {
			notesCount: {
				type: "number",
				optional: false,
				nullable: false,
			},
			originalNotesCount: {
				type: "number",
				optional: false,
				nullable: false,
			},
			usersCount: {
				type: "number",
				optional: false,
				nullable: false,
			},
			originalUsersCount: {
				type: "number",
				optional: false,
				nullable: false,
			},
			instances: {
				type: "number",
				optional: false,
				nullable: false,
			},
			driveUsageLocal: {
				type: "number",
				optional: false,
				nullable: false,
			},
			driveUsageRemote: {
				type: "number",
				optional: false,
				nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async () => {
	const notesChartData = await notesChart.getChart("hour", 1, null);
	const notesCount =
		notesChartData.local.total[0] + notesChartData.remote.total[0];
	const originalNotesCount = notesChartData.local.total[0];

	const usersChartData = await usersChart.getChart("hour", 1, null);
	const usersCount =
		usersChartData.local.total[0] + usersChartData.remote.total[0];
	const originalUsersCount = usersChartData.local.total[0];
	const driveChartData = await driveChart.getChart("hour", 1, null);
	//TODO: fixme currently returns 0
	const driveUsageLocal = driveChartData.local.incSize[0];
	const driveUsageRemote = driveChartData.remote.incSize[0];

	const [
		reactionsCount,
		//originalReactionsCount,
		instances,
	] = await Promise.all([
		NoteReactions.count({ cache: 3600000 }), // 1 hour
		//NoteReactions.count({ where: { userHost: IsNull() }, cache: 3600000 }),
		Instances.count({ cache: 3600000 }),
	]);

	return {
		notesCount,
		originalNotesCount,
		usersCount,
		originalUsersCount,
		reactionsCount,
		//originalReactionsCount,
		instances,
		driveUsageLocal,
		driveUsageRemote,
	};
});
