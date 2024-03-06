import cluster from "node:cluster";
import chalk from "chalk";
import { default as convertColor } from "color-convert";
import { format as dateFormat } from "date-fns";
import { envOption } from "../env.js";
import config from "@/config/index.js";

import * as SyslogPro from "syslog-pro";

type Domain = {
	name: string;
	color?: string;
};

type Level = "error" | "success" | "warning" | "debug" | "info";

export default class Logger {
	private domain: Domain;
	private parentLogger: Logger | null = null;
	private store: boolean;
	private syslogClient: any | null = null;

	constructor(domain: string, color?: string, store = true) {
		this.domain = {
			name: domain,
			color: color,
		};
		this.store = store;

		if (config.syslog) {
			this.syslogClient = new SyslogPro.RFC5424({
				applacationName: "Firefish",
				timestamp: true,
				encludeStructuredData: true,
				color: true,
				extendedColor: true,
				server: {
					target: config.syslog.host,
					port: config.syslog.port,
				},
			});
		}
	}

	public createSubLogger(domain: string, color?: string, store = true): Logger {
		const logger = new Logger(domain, color, store);
		logger.parentLogger = this;
		return logger;
	}

	private log(
		level: Level,
		message: string,
		data?: Record<string, any> | null,
		important = false,
		subDomains: Domain[] = [],
		store = true,
	): void {
		if (envOption.quiet) return;
		if (level === "info") return;
		if (!this.store) store = false;
		if (level === "debug") store = false;

		if (this.parentLogger) {
			this.parentLogger.log(
				level,
				message,
				data,
				important,
				[this.domain].concat(subDomains),
				store,
			);
			return;
		}

		const time = dateFormat(new Date(), "HH:mm:ss");
		const worker = cluster.isPrimary ? "*" : cluster.worker.id;
		const l =
			level === "error"
				? important
					? chalk.bgRed.white("ERR ")
					: chalk.red("ERR ")
				: level === "warning"
				? chalk.yellow("WARN")
				: level === "success"
				? important
					? chalk.bgGreen.white("DONE")
					: chalk.green("DONE")
				: level === "debug"
				? chalk.gray("VERB")
				: level === "info"
				? chalk.blue("INFO")
				: null;
		const domains = [this.domain]
			.concat(subDomains)
			.map((d) =>
				d.color
					? chalk.rgb(...convertColor.keyword.rgb(d.color))(d.name)
					: chalk.white(d.name),
			);
		const m =
			level === "error"
				? chalk.red(message)
				: level === "warning"
				? chalk.yellow(message)
				: level === "success"
				? chalk.green(message)
				: level === "debug"
				? chalk.gray(message)
				: level === "info"
				? message
				: null;

		let log = `${l} ${worker}\t[${domains.join(" ")}]\t${m}`;
		if (envOption.withLogTime) log = `${chalk.gray(time)} ${log}`;

		console.log(important ? chalk.bold(log) : log);

		if (store) {
			if (this.syslogClient) {
				const send =
					level === "error"
						? this.syslogClient.error
						: level === "warning"
						? this.syslogClient.warning
						: level === "success"
						? this.syslogClient.info
						: level === "debug"
						? this.syslogClient.info
						: level === "info"
						? this.syslogClient.info
						: (null as never);

				send
					.bind(this.syslogClient)(message)
					.catch(() => {});
			}
		}
	}

	public error(
		x: string | Error,
		data?: Record<string, any> | null,
		important = false,
	): void {
		// 実行を継続できない状況で使う
		if (x instanceof Error) {
			data = data || {};
			data.e = x;
			this.log("error", x.toString(), data, important);
		} else if (typeof x === "object") {
			this.log(
				"error",
				`${(x as any).message || (x as any).name || x}`,
				data,
				important,
			);
		} else {
			this.log("error", `${x}`, data, important);
		}
	}

	public warn(
		message: string,
		data?: Record<string, any> | null,
		important = false,
	): void {
		// 実行を継続できるが改善すべき状況で使う
		this.log("warning", message, data, important);
	}

	public succ(
		message: string,
		data?: Record<string, any> | null,
		important = false,
	): void {
		// 何かに成功した状況で使う
		this.log("success", message, data, important);
	}

	public debug(
		message: string,
		data?: Record<string, any> | null,
		important = false,
	): void {
		// デバッグ用に使う(開発者に必要だが利用者に不要な情報)
		if (process.env.NODE_ENV !== "production" || envOption.verbose) {
			this.log("debug", message, data, important);
		}
	}

	public info(
		message: string,
		data?: Record<string, any> | null,
		important = false,
	): void {
		// それ以外
		this.log("info", message, data, important);
	}
}
