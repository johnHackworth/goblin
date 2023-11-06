import { URL } from "node:url";
import type Bull from "bull";
import Logger from "@/services/logger.js";
import type { WebhookDeliverJobData } from "../types.js";
import { getResponse, StatusError } from "@/misc/fetch.js";
import { Webhooks } from "@/models/index.js";
import config from "@/config/index.js";

const logger = new Logger("webhook");

export default async (job: Bull.Job<WebhookDeliverJobData>) => {
	try {
		logger.debug(`delivering ${job.data.webhookId}`);

		const res = await getResponse({
			url: job.data.to,
			method: "POST",
			headers: {
				"User-Agent": "Firefish-Hooks",
				"X-Firefish-Host": config.host,
				"X-Firefish-Hook-Id": job.data.webhookId,
				"X-Firefish-Hook-Secret": job.data.secret,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				hookId: job.data.webhookId,
				userId: job.data.userId,
				eventId: job.data.eventId,
				createdAt: job.data.createdAt,
				type: job.data.type,
				body: job.data.content,
			}),
		});

		Webhooks.update(
			{ id: job.data.webhookId },
			{
				latestSentAt: new Date(),
				latestStatus: res.status,
			},
		);

		return "Success";
	} catch (res) {
		Webhooks.update(
			{ id: job.data.webhookId },
			{
				latestSentAt: new Date(),
				latestStatus: res instanceof StatusError ? res.statusCode : 1,
			},
		);

		if (res instanceof StatusError) {
			// 4xx
			if (res.isClientError) {
				return `${res.statusCode} ${res.statusMessage}`;
			}

			// 5xx etc.
			throw new Error(`${res.statusCode} ${res.statusMessage}`);
		} else {
			// DNS error, socket error, timeout ...
			throw res;
		}
	}
};
