/**
 * Datadog RUM (Real User Monitoring) initialization
 * Includes beforeSend hook to add user context and scrub PII
 */

import { datadogRum } from "@datadog/browser-rum";
import type { RumEvent } from "@datadog/browser-rum";
import { $i } from "@/account";

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
function addUserContext(event: RumEvent): void {
	// Only add user context if user is logged in
	if ($i) {
		// Add non-PII user identifiers
		event.context = {
			...event.context,
			user: {
				// Use user ID instead of username/email
				id: $i.id,
				// Add role information (useful for debugging permission issues)
				isAdmin: $i.isAdmin || false,
				isModerator: $i.isModerator || false,
				// Add account creation date (helps identify new vs. old users)
				createdAt: $i.createdAt,
				// DO NOT include: username, name, email, or any other PII
			},
		};
	}
}

/**
 * Initialize Datadog RUM with privacy-first configuration
 */
export function initializeDatadogRUM() {
	datadogRum.init({
		applicationId: "f1848258-6d09-4b8e-8ea7-1c6505e4efcc",
		clientToken: "pub27683dfd2b81f24d71148f67bafaec63",
		site: "datadoghq.com",
		service: "goblin",
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
				addUserContext(event);
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
	if ($i) {
		datadogRum.setUser({
			id: $i.id,
		});
	}
}

/**
 * Update user context after login
 * Call this function after successful login
 */
export function updateDatadogUser() {
	if ($i) {
		datadogRum.setUser({
			id: $i.id,
		});
	} else {
		// Clear user context on logout
		datadogRum.clearUser();
	}
}
