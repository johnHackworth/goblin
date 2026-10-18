/**
 * Datadog RUM (Real User Monitoring) initialization
 * Includes beforeSend hook to add user context and scrub PII
 */

import { datadogRum } from "@datadog/browser-rum";
import type { RumEvent } from "@datadog/browser-rum";

// Structural type for the current account — kept dependency-free so this
// module never imports @/account (that would create an import cycle that
// breaks $i initialization order at startup)
export type RumUser = {
	id: string;
	isAdmin?: boolean | null;
	isModerator?: boolean | null;
	createdAt?: string;
} | null;

/**
 * Scrub PII from URLs, headers, and other sensitive data
 * Modifies event in place
 */
function scrubPII(event: RumEvent): void {
	// Scrub email addresses from URLs and text
	const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

	// Scrub the view URL
	if (event.view?.url) {
		event.view.url = event.view.url.replace(emailRegex, "[EMAIL_REDACTED]");
	}

	// Scrub resource URLs
	if (event.type === "resource" && event.resource?.url) {
		event.resource.url = event.resource.url.replace(
			emailRegex,
			"[EMAIL_REDACTED]",
		);
	}

	// Scrub action target names that might contain PII
	if (event.type === "action" && event.action?.target?.name) {
		event.action.target.name = event.action.target.name.replace(
			emailRegex,
			"[EMAIL_REDACTED]",
		);
	}

	// Scrub error messages
	if (event.type === "error" && event.error?.message) {
		event.error.message = event.error.message.replace(
			emailRegex,
			"[EMAIL_REDACTED]",
		);
	}
}

/**
 * Add user context to RUM events
 * Modifies event in place
 */
function addUserContext(event: RumEvent, user: RumUser): void {
	// Only add user context if user is logged in
	if (user) {
		// Add non-PII user identifiers
		event.context = {
			...event.context,
			user: {
				// Use user ID instead of username/email
				id: user.id,
				// Add role information (useful for debugging permission issues)
				isAdmin: user.isAdmin || false,
				isModerator: user.isModerator || false,
				// Add account creation date (helps identify new vs. old users)
				createdAt: user.createdAt,
				// DO NOT include: username, name, email, or any other PII
			},
		};
	}
}

/**
 * Initialize Datadog RUM with privacy-first configuration
 */
export function initializeDatadogRUM(user: RumUser = null) {
	datadogRum.init({
		applicationId: "faef8ab5-aa18-4312-bc37-75695281aa9a",
		clientToken: "pub7a73df8b6d006ba062ca946e052a611c",
		site: "datadoghq.com",
		service: "goblin",
		remoteConfiguration: {
			id: 'ebe7460f-1fe0-4125-b6e9-53cf369ab29f',
		},
		env: _DEV_ ? "development" : "production",
		version: _VERSION_,
		sessionSampleRate: 100,
		sessionReplaySampleRate: 100,
		trackUserInteractions: true,
		trackResources: true,
		trackLongTasks: true,
		// Mask user input to prevent capturing sensitive data in session replays
		defaultPrivacyLevel: "mask-user-input",
		// Use beforeSend to add user context and scrub PII
		beforeSend: (event) => {
			try {
				// Add user context (modifies event in place)
				addUserContext(event, user);
				// Scrub any PII that might have leaked through (modifies event in place)
				scrubPII(event);
				// Return true to send the event
				return true;
			} catch (error) {
				console.error("Error in Datadog RUM beforeSend:", error);
				// Return true to send the event even if processing fails
				return true;
			}
		},
	});

	// Start session replay recording
	datadogRum.startSessionReplayRecording();

	// Update user context when user logs in/out
	// This will be automatically picked up by the beforeSend hook
	if (user) {
		datadogRum.setUser({
			id: user.id,
		});
	}
}

/**
 * Update user context after login
 * Call this function after successful login
 */
export function updateDatadogUser(user: RumUser) {
	if (user) {
		datadogRum.setUser({
			id: user.id,
		});
	} else {
		// Clear user context on logout
		datadogRum.clearUser();
	}
}
