/**
 * ユーザーが設定する必要のある情報
 */
export type Source = {
	repository_url?: string;
	feedback_url?: string;
	url: string;
	port: number;
	disableHsts?: boolean;
	db: {
		host: string;
		port: number;
		db: string;
		user: string;
		pass: string;
		disableCache?: boolean;
		extra?: { [x: string]: string };
	};
	redis: {
		host: string;
		port: number;
		family?: number;
		pass?: string;
		db?: number;
		prefix?: string;
		user?: string;
		tls?: { [y: string]: string };
	};
	cacheServer?: {
		host: string;
		port: number;
		family?: number;
		pass?: string;
		db?: number;
		prefix?: string;
		user?: string;
		tls?: { [z: string]: string };
	};
	elasticsearch: {
		host: string;
		port: number;
		ssl?: boolean;
		user?: string;
		pass?: string;
		index?: string;
	};
	sonic: {
		host: string;
		port: number;
		auth?: string;
		collection?: string;
		bucket?: string;
	};
	meilisearch: {
		host: string;
		port: number;
		apiKey?: string;
		ssl: boolean;
	};

	proxy?: string;
	proxySmtp?: string;
	proxyBypassHosts?: string[];

	allowedPrivateNetworks?: string[];

	maxFileSize?: number;

	accesslog?: string;

	clusterLimit?: number;

	onlyQueueProcessor?: boolean;

	cuid?: {
		length?: number;
		fingerprint?: string;
	};

	outgoingAddressFamily?: "ipv4" | "ipv6" | "dual";

	deliverJobConcurrency?: number;
	inboxJobConcurrency?: number;
	deliverJobPerSec?: number;
	inboxJobPerSec?: number;
	deliverJobMaxAttempts?: number;
	inboxJobMaxAttempts?: number;

	syslog: {
		host: string;
		port: number;
	};

	mediaProxy?: string;
	proxyRemoteFiles?: boolean;

	twa: {
		nameSpace?: string;
		packageName?: string;
		sha256CertFingerprints?: string[];
	};

	reservedUsernames?: string[];

	// Managed hosting stuff
	maxUserSignups?: number;
	isManagedHosting?: boolean;
	maxNoteLength?: number;
	maxCaptionLength?: number;
	deepl: {
		managed?: boolean;
		authKey?: string;
		isPro?: boolean;
	};
	libreTranslate: {
		managed?: boolean;
		apiUrl?: string;
		apiKey?: string;
	};
	email: {
		managed?: boolean;
		address?: string;
		host?: string;
		port?: number;
		user?: string;
		pass?: string;
		useImplicitSslTls?: boolean;
	};
	objectStorage: {
		managed?: boolean;
		baseUrl?: string;
		bucket?: string;
		prefix?: string;
		endpoint?: string;
		region?: string;
		accessKey?: string;
		secretKey?: string;
		useSsl?: boolean;
		connnectOverProxy?: boolean;
		setPublicReadOnUpload?: boolean;
		s3ForcePathStyle?: boolean;
	};
	summalyProxyUrl?: string;
};

/**
 * Misskeyが自動的に(ユーザーが設定した情報から推論して)設定する情報
 */
export type Mixin = {
	version: string;
	host: string;
	hostname: string;
	scheme: string;
	wsScheme: string;
	apiUrl: string;
	wsUrl: string;
	authUrl: string;
	driveUrl: string;
	userAgent: string;
	clientEntry: string;
};

export type Config = Source & Mixin;
