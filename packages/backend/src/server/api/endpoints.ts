import type { Schema } from "@/misc/schema.js";

import * as ep___admin_meta from "./endpoints/admin/meta.js";
import * as ep___admin_abuseUserReports from "./endpoints/admin/abuse-user-reports.js";
import * as ep___admin_accounts_create from "./endpoints/admin/accounts/create.js";
import * as ep___admin_accounts_delete from "./endpoints/admin/accounts/delete.js";
import * as ep___admin_accounts_hosted from "./endpoints/admin/accounts/hosted.js";
import * as ep___admin_ad_create from "./endpoints/admin/ad/create.js";
import * as ep___admin_ad_delete from "./endpoints/admin/ad/delete.js";
import * as ep___admin_ad_list from "./endpoints/admin/ad/list.js";
import * as ep___admin_ad_update from "./endpoints/admin/ad/update.js";
import * as ep___admin_announcements_create from "./endpoints/admin/announcements/create.js";
import * as ep___admin_announcements_delete from "./endpoints/admin/announcements/delete.js";
import * as ep___admin_announcements_list from "./endpoints/admin/announcements/list.js";
import * as ep___admin_announcements_update from "./endpoints/admin/announcements/update.js";
import * as ep___admin_deleteAllFilesOfAUser from "./endpoints/admin/delete-all-files-of-a-user.js";
import * as ep___admin_drive_cleanRemoteFiles from "./endpoints/admin/drive/clean-remote-files.js";
import * as ep___admin_drive_cleanup from "./endpoints/admin/drive/cleanup.js";
import * as ep___admin_drive_files from "./endpoints/admin/drive/files.js";
import * as ep___admin_drive_showFile from "./endpoints/admin/drive/show-file.js";
import * as ep___admin_emoji_addAliasesBulk from "./endpoints/admin/emoji/add-aliases-bulk.js";
import * as ep___admin_emoji_add from "./endpoints/admin/emoji/add.js";
import * as ep___admin_emoji_copy from "./endpoints/admin/emoji/copy.js";
import * as ep___admin_emoji_deleteBulk from "./endpoints/admin/emoji/delete-bulk.js";
import * as ep___admin_emoji_delete from "./endpoints/admin/emoji/delete.js";
import * as ep___admin_emoji_importZip from "./endpoints/admin/emoji/import-zip.js";
import * as ep___admin_emoji_listRemote from "./endpoints/admin/emoji/list-remote.js";
import * as ep___admin_emoji_list from "./endpoints/admin/emoji/list.js";
import * as ep___admin_emoji_removeAliasesBulk from "./endpoints/admin/emoji/remove-aliases-bulk.js";
import * as ep___admin_emoji_setAliasesBulk from "./endpoints/admin/emoji/set-aliases-bulk.js";
import * as ep___admin_emoji_setCategoryBulk from "./endpoints/admin/emoji/set-category-bulk.js";
import * as ep___admin_emoji_setLicenseBulk from "./endpoints/admin/emoji/set-license-bulk.js";
import * as ep___admin_emoji_update from "./endpoints/admin/emoji/update.js";
import * as ep___admin_federation_deleteAllFiles from "./endpoints/admin/federation/delete-all-files.js";
import * as ep___admin_federation_refreshRemoteInstanceMetadata from "./endpoints/admin/federation/refresh-remote-instance-metadata.js";
import * as ep___admin_federation_removeAllFollowing from "./endpoints/admin/federation/remove-all-following.js";
import * as ep___admin_federation_updateInstance from "./endpoints/admin/federation/update-instance.js";
import * as ep___admin_getIndexStats from "./endpoints/admin/get-index-stats.js";
import * as ep___admin_getTableStats from "./endpoints/admin/get-table-stats.js";
import * as ep___admin_getUserIps from "./endpoints/admin/get-user-ips.js";
import * as ep___admin_invite from "./endpoints/admin/invite.js";
import * as ep___admin_moderators_add from "./endpoints/admin/moderators/add.js";
import * as ep___admin_moderators_remove from "./endpoints/admin/moderators/remove.js";
import * as ep___admin_promo_create from "./endpoints/admin/promo/create.js";
import * as ep___admin_queue_clear from "./endpoints/admin/queue/clear.js";
import * as ep___admin_queue_deliverDelayed from "./endpoints/admin/queue/deliver-delayed.js";
import * as ep___admin_queue_inboxDelayed from "./endpoints/admin/queue/inbox-delayed.js";
import * as ep___admin_queue_stats from "./endpoints/admin/queue/stats.js";
import * as ep___admin_relays_add from "./endpoints/admin/relays/add.js";
import * as ep___admin_relays_list from "./endpoints/admin/relays/list.js";
import * as ep___admin_relays_remove from "./endpoints/admin/relays/remove.js";
import * as ep___admin_resetPassword from "./endpoints/admin/reset-password.js";
import * as ep___admin_resolveAbuseUserReport from "./endpoints/admin/resolve-abuse-user-report.js";
import * as ep___admin_search_indexAll from "./endpoints/admin/search/index-all.js";
import * as ep___admin_sendEmail from "./endpoints/admin/send-email.js";
import * as ep___admin_sendModMail from "./endpoints/admin/send-mod-mail.js";
import * as ep___admin_serverInfo from "./endpoints/admin/server-info.js";
import * as ep___admin_showModerationLogs from "./endpoints/admin/show-moderation-logs.js";
import * as ep___admin_showUser from "./endpoints/admin/show-user.js";
import * as ep___admin_showUsers from "./endpoints/admin/show-users.js";
import * as ep___admin_silenceUser from "./endpoints/admin/silence-user.js";
import * as ep___admin_suspendUser from "./endpoints/admin/suspend-user.js";
import * as ep___admin_unsilenceUser from "./endpoints/admin/unsilence-user.js";
import * as ep___admin_unsuspendUser from "./endpoints/admin/unsuspend-user.js";
import * as ep___admin_updateMeta from "./endpoints/admin/update-meta.js";
import * as ep___admin_vacuum from "./endpoints/admin/vacuum.js";
import * as ep___admin_deleteAccount from "./endpoints/admin/delete-account.js";
import * as ep___admin_updateUserNote from "./endpoints/admin/update-user-note.js";
import * as ep___announcements from "./endpoints/announcements.js";
import * as ep___antennas_create from "./endpoints/antennas/create.js";
import * as ep___antennas_delete from "./endpoints/antennas/delete.js";
import * as ep___antennas_list from "./endpoints/antennas/list.js";
import * as ep___antennas_markRead from "./endpoints/antennas/markread.js";
import * as ep___antennas_notes from "./endpoints/antennas/notes.js";
import * as ep___antennas_show from "./endpoints/antennas/show.js";
import * as ep___antennas_update from "./endpoints/antennas/update.js";
import * as ep___ap_get from "./endpoints/ap/get.js";
import * as ep___ap_show from "./endpoints/ap/show.js";
import * as ep___app_create from "./endpoints/app/create.js";
import * as ep___app_show from "./endpoints/app/show.js";
import * as ep___auth_accept from "./endpoints/auth/accept.js";
import * as ep___auth_session_generate from "./endpoints/auth/session/generate.js";
import * as ep___auth_session_show from "./endpoints/auth/session/show.js";
import * as ep___auth_session_userkey from "./endpoints/auth/session/userkey.js";
import * as ep___blocking_create from "./endpoints/blocking/create.js";
import * as ep___blocking_delete from "./endpoints/blocking/delete.js";
import * as ep___blocking_list from "./endpoints/blocking/list.js";
import * as ep___channels_create from "./endpoints/channels/create.js";
import * as ep___channels_featured from "./endpoints/channels/featured.js";
import * as ep___channels_follow from "./endpoints/channels/follow.js";
import * as ep___channels_followed from "./endpoints/channels/followed.js";
import * as ep___channels_owned from "./endpoints/channels/owned.js";
import * as ep___channels_search from "./endpoints/channels/search.js";
import * as ep___channels_show from "./endpoints/channels/show.js";
import * as ep___channels_timeline from "./endpoints/channels/timeline.js";
import * as ep___channels_unfollow from "./endpoints/channels/unfollow.js";
import * as ep___channels_update from "./endpoints/channels/update.js";
import * as ep___charts_activeUsers from "./endpoints/charts/active-users.js";
import * as ep___charts_apRequest from "./endpoints/charts/ap-request.js";
import * as ep___charts_drive from "./endpoints/charts/drive.js";
import * as ep___charts_federation from "./endpoints/charts/federation.js";
import * as ep___charts_hashtag from "./endpoints/charts/hashtag.js";
import * as ep___charts_instance from "./endpoints/charts/instance.js";
import * as ep___charts_notes from "./endpoints/charts/notes.js";
import * as ep___charts_user_drive from "./endpoints/charts/user/drive.js";
import * as ep___charts_user_following from "./endpoints/charts/user/following.js";
import * as ep___charts_user_notes from "./endpoints/charts/user/notes.js";
import * as ep___charts_user_reactions from "./endpoints/charts/user/reactions.js";
import * as ep___charts_users from "./endpoints/charts/users.js";
import * as ep___clips_addNote from "./endpoints/clips/add-note.js";
import * as ep___clips_removeNote from "./endpoints/clips/remove-note.js";
import * as ep___clips_create from "./endpoints/clips/create.js";
import * as ep___clips_delete from "./endpoints/clips/delete.js";
import * as ep___clips_list from "./endpoints/clips/list.js";
import * as ep___clips_notes from "./endpoints/clips/notes.js";
import * as ep___clips_show from "./endpoints/clips/show.js";
import * as ep___clips_update from "./endpoints/clips/update.js";
import * as ep___drive from "./endpoints/drive.js";
import * as ep___drive_files from "./endpoints/drive/files.js";
import * as ep___drive_files_attachedNotes from "./endpoints/drive/files/attached-notes.js";
import * as ep___drive_files_checkExistence from "./endpoints/drive/files/check-existence.js";
import * as ep___drive_files_captionImage from "./endpoints/drive/files/caption-image.js";
import * as ep___drive_files_create from "./endpoints/drive/files/create.js";
import * as ep___drive_files_delete from "./endpoints/drive/files/delete.js";
import * as ep___drive_files_findByHash from "./endpoints/drive/files/find-by-hash.js";
import * as ep___drive_files_find from "./endpoints/drive/files/find.js";
import * as ep___drive_files_show from "./endpoints/drive/files/show.js";
import * as ep___drive_files_update from "./endpoints/drive/files/update.js";
import * as ep___drive_files_uploadFromUrl from "./endpoints/drive/files/upload-from-url.js";
import * as ep___drive_folders from "./endpoints/drive/folders.js";
import * as ep___drive_folders_create from "./endpoints/drive/folders/create.js";
import * as ep___drive_folders_delete from "./endpoints/drive/folders/delete.js";
import * as ep___drive_folders_find from "./endpoints/drive/folders/find.js";
import * as ep___drive_folders_show from "./endpoints/drive/folders/show.js";
import * as ep___drive_folders_update from "./endpoints/drive/folders/update.js";
import * as ep___drive_stream from "./endpoints/drive/stream.js";
import * as ep___emailAddress_available from "./endpoints/email-address/available.js";
import * as ep___emoji from "./endpoints/emoji.js";
import * as ep___endpoint from "./endpoints/endpoint.js";
import * as ep___endpoints from "./endpoints/endpoints.js";
import * as ep___exportCustomEmojis from "./endpoints/export-custom-emojis.js";
import * as ep___federation_followers from "./endpoints/federation/followers.js";
import * as ep___federation_following from "./endpoints/federation/following.js";
import * as ep___federation_instances from "./endpoints/federation/instances.js";
import * as ep___federation_showInstance from "./endpoints/federation/show-instance.js";
import * as ep___federation_updateRemoteUser from "./endpoints/federation/update-remote-user.js";
import * as ep___federation_users from "./endpoints/federation/users.js";
import * as ep___federation_stats from "./endpoints/federation/stats.js";
import * as ep___following_create from "./endpoints/following/create.js";
import * as ep___following_delete from "./endpoints/following/delete.js";
import * as ep___following_invalidate from "./endpoints/following/invalidate.js";
import * as ep___following_requests_accept from "./endpoints/following/requests/accept.js";
import * as ep___following_requests_cancel from "./endpoints/following/requests/cancel.js";
import * as ep___following_requests_list from "./endpoints/following/requests/list.js";
import * as ep___following_requests_reject from "./endpoints/following/requests/reject.js";
import * as ep___gallery_featured from "./endpoints/gallery/featured.js";
import * as ep___gallery_popular from "./endpoints/gallery/popular.js";
import * as ep___gallery_posts from "./endpoints/gallery/posts.js";
import * as ep___gallery_posts_create from "./endpoints/gallery/posts/create.js";
import * as ep___gallery_posts_delete from "./endpoints/gallery/posts/delete.js";
import * as ep___gallery_posts_like from "./endpoints/gallery/posts/like.js";
import * as ep___gallery_posts_show from "./endpoints/gallery/posts/show.js";
import * as ep___gallery_posts_unlike from "./endpoints/gallery/posts/unlike.js";
import * as ep___gallery_posts_update from "./endpoints/gallery/posts/update.js";
import * as ep___getOnlineUsersCount from "./endpoints/get-online-users-count.js";
import * as ep___hashtags_list from "./endpoints/hashtags/list.js";
import * as ep___hashtags_search from "./endpoints/hashtags/search.js";
import * as ep___hashtags_show from "./endpoints/hashtags/show.js";
import * as ep___hashtags_trend from "./endpoints/hashtags/trend.js";
import * as ep___hashtags_users from "./endpoints/hashtags/users.js";
import * as ep___i from "./endpoints/i.js";
import * as ep___i_2fa_done from "./endpoints/i/2fa/done.js";
import * as ep___i_2fa_keyDone from "./endpoints/i/2fa/key-done.js";
import * as ep___i_2fa_passwordLess from "./endpoints/i/2fa/password-less.js";
import * as ep___i_2fa_registerKey from "./endpoints/i/2fa/register-key.js";
import * as ep___i_2fa_register from "./endpoints/i/2fa/register.js";
import * as ep___i_2fa_updateKey from "./endpoints/i/2fa/update-key.js";
import * as ep___i_2fa_removeKey from "./endpoints/i/2fa/remove-key.js";
import * as ep___i_2fa_unregister from "./endpoints/i/2fa/unregister.js";
import * as ep___i_apps from "./endpoints/i/apps.js";
import * as ep___i_authorizedApps from "./endpoints/i/authorized-apps.js";
import * as ep___i_changePassword from "./endpoints/i/change-password.js";
import * as ep___i_deleteAccount from "./endpoints/i/delete-account.js";
import * as ep___i_exportBlocking from "./endpoints/i/export-blocking.js";
import * as ep___i_exportFollowing from "./endpoints/i/export-following.js";
import * as ep___i_exportMute from "./endpoints/i/export-mute.js";
import * as ep___i_exportNotes from "./endpoints/i/export-notes.js";
import * as ep___i_importPosts from "./endpoints/i/import-posts.js";
import * as ep___i_exportUserLists from "./endpoints/i/export-user-lists.js";
import * as ep___i_favorites from "./endpoints/i/favorites.js";
import * as ep___i_gallery_likes from "./endpoints/i/gallery/likes.js";
import * as ep___i_gallery_posts from "./endpoints/i/gallery/posts.js";
import * as ep___i_getWordMutedNotesCount from "./endpoints/i/get-word-muted-notes-count.js";
import * as ep___i_importBlocking from "./endpoints/i/import-blocking.js";
import * as ep___i_importFollowing from "./endpoints/i/import-following.js";
import * as ep___i_importMuting from "./endpoints/i/import-muting.js";
import * as ep___i_importUserLists from "./endpoints/i/import-user-lists.js";
import * as ep___i_notifications from "./endpoints/i/notifications.js";
import * as ep___i_pageLikes from "./endpoints/i/page-likes.js";
import * as ep___i_pages from "./endpoints/i/pages.js";
import * as ep___i_pin from "./endpoints/i/pin.js";
import * as ep___i_readAllMessagingMessages from "./endpoints/i/read-all-messaging-messages.js";
import * as ep___i_readAllUnreadNotes from "./endpoints/i/read-all-unread-notes.js";
import * as ep___i_readAnnouncement from "./endpoints/i/read-announcement.js";
import * as ep___i_regenerateToken from "./endpoints/i/regenerate-token.js";
import * as ep___i_registry_getAll from "./endpoints/i/registry/get-all.js";
import * as ep___i_registry_getDetail from "./endpoints/i/registry/get-detail.js";
import * as ep___i_registry_getUnsecure from "./endpoints/i/registry/get-unsecure.js";
import * as ep___i_registry_get from "./endpoints/i/registry/get.js";
import * as ep___i_registry_keysWithType from "./endpoints/i/registry/keys-with-type.js";
import * as ep___i_registry_keys from "./endpoints/i/registry/keys.js";
import * as ep___i_registry_remove from "./endpoints/i/registry/remove.js";
import * as ep___i_registry_scopes from "./endpoints/i/registry/scopes.js";
import * as ep___i_registry_set from "./endpoints/i/registry/set.js";
import * as ep___i_revokeToken from "./endpoints/i/revoke-token.js";
import * as ep___i_signinHistory from "./endpoints/i/signin-history.js";
import * as ep___i_unpin from "./endpoints/i/unpin.js";
import * as ep___i_updateEmail from "./endpoints/i/update-email.js";
import * as ep___i_update from "./endpoints/i/update.js";
import * as ep___i_userGroupInvites from "./endpoints/i/user-group-invites.js";
import * as ep___i_webhooks_create from "./endpoints/i/webhooks/create.js";
import * as ep___i_webhooks_show from "./endpoints/i/webhooks/show.js";
import * as ep___i_webhooks_list from "./endpoints/i/webhooks/list.js";
import * as ep___i_webhooks_update from "./endpoints/i/webhooks/update.js";
import * as ep___i_webhooks_delete from "./endpoints/i/webhooks/delete.js";
import * as ep___messaging_history from "./endpoints/messaging/history.js";
import * as ep___messaging_messages from "./endpoints/messaging/messages.js";
import * as ep___messaging_messages_create from "./endpoints/messaging/messages/create.js";
import * as ep___messaging_messages_delete from "./endpoints/messaging/messages/delete.js";
import * as ep___messaging_messages_read from "./endpoints/messaging/messages/read.js";
import * as ep___meta from "./endpoints/meta.js";
import * as ep___sounds from "./endpoints/get-sounds.js";
import * as ep___miauth_genToken from "./endpoints/miauth/gen-token.js";
import * as ep___mute_create from "./endpoints/mute/create.js";
import * as ep___mute_delete from "./endpoints/mute/delete.js";
import * as ep___mute_list from "./endpoints/mute/list.js";
import * as ep___renote_mute_create from "./endpoints/renote-mute/create.js";
import * as ep___renote_mute_delete from "./endpoints/renote-mute/delete.js";
import * as ep___renote_mute_list from "./endpoints/renote-mute/list.js";
import * as ep___my_apps from "./endpoints/my/apps.js";
import * as ep___notes from "./endpoints/notes.js";
import * as ep___notes_children from "./endpoints/notes/children.js";
import * as ep___notes_clips from "./endpoints/notes/clips.js";
import * as ep___notes_conversation from "./endpoints/notes/conversation.js";
import * as ep___notes_create from "./endpoints/notes/create.js";
import * as ep___notes_delete from "./endpoints/notes/delete.js";
import * as ep___notes_edit from "./endpoints/notes/edit.js";
import * as ep___notes_favorites_create from "./endpoints/notes/favorites/create.js";
import * as ep___notes_favorites_delete from "./endpoints/notes/favorites/delete.js";
import * as ep___notes_featured from "./endpoints/notes/featured.js";
import * as ep___notes_globalTimeline from "./endpoints/notes/global-timeline.js";
import * as ep___notes_hybridTimeline from "./endpoints/notes/hybrid-timeline.js";
import * as ep___notes_localTimeline from "./endpoints/notes/local-timeline.js";
import * as ep___notes_recommendedTimeline from "./endpoints/notes/recommended-timeline.js";
import * as ep___notes_mentions from "./endpoints/notes/mentions.js";
import * as ep___notes_reblogtrail from "./endpoints/notes/reblogtrail.js";
import * as ep___notes_ancestors from "./endpoints/notes/ancestors.js";
import * as ep___notes_polls_recommendation from "./endpoints/notes/polls/recommendation.js";
import * as ep___notes_polls_vote from "./endpoints/notes/polls/vote.js";
import * as ep___notes_reactions from "./endpoints/notes/reactions.js";
import * as ep___notes_reactions_create from "./endpoints/notes/reactions/create.js";
import * as ep___notes_reactions_delete from "./endpoints/notes/reactions/delete.js";
import * as ep___notes_renotes from "./endpoints/notes/renotes.js";
import * as ep___notes_replies from "./endpoints/notes/replies.js";
import * as ep___notes_searchByTag from "./endpoints/notes/search-by-tag.js";
import * as ep___notes_search from "./endpoints/notes/search.js";
import * as ep___notes_show from "./endpoints/notes/show.js";
import * as ep___notes_state from "./endpoints/notes/state.js";
import * as ep___notes_threadMuting_create from "./endpoints/notes/thread-muting/create.js";
import * as ep___notes_threadMuting_delete from "./endpoints/notes/thread-muting/delete.js";
import * as ep___notes_timeline from "./endpoints/notes/timeline.js";
import * as ep___notes_translate from "./endpoints/notes/translate.js";
import * as ep___notes_unrenote from "./endpoints/notes/unrenote.js";
import * as ep___notes_userListTimeline from "./endpoints/notes/user-list-timeline.js";
import * as ep___notes_watching_create from "./endpoints/notes/watching/create.js";
import * as ep___notes_watching_delete from "./endpoints/notes/watching/delete.js";
import * as ep___notifications_create from "./endpoints/notifications/create.js";
import * as ep___notifications_markAllAsRead from "./endpoints/notifications/mark-all-as-read.js";
import * as ep___notifications_read from "./endpoints/notifications/read.js";
import * as ep___pagePush from "./endpoints/page-push.js";
import * as ep___pages_create from "./endpoints/pages/create.js";
import * as ep___pages_delete from "./endpoints/pages/delete.js";
import * as ep___pages_featured from "./endpoints/pages/featured.js";
import * as ep___pages_like from "./endpoints/pages/like.js";
import * as ep___pages_show from "./endpoints/pages/show.js";
import * as ep___pages_unlike from "./endpoints/pages/unlike.js";
import * as ep___pages_update from "./endpoints/pages/update.js";
import * as ep___ping from "./endpoints/ping.js";
import * as ep___recommendedInstances from "./endpoints/recommended-instances.js";
import * as ep___pinnedUsers from "./endpoints/pinned-users.js";
import * as ep___customMOTD from "./endpoints/custom-motd.js";
import * as ep___customSplashIcons from "./endpoints/custom-splash-icons.js";
import * as ep___latestVersion from "./endpoints/latest-version.js";
import * as ep___release from "./endpoints/release.js";
import * as ep___promo_read from "./endpoints/promo/read.js";
import * as ep___requestResetPassword from "./endpoints/request-reset-password.js";
import * as ep___resetDb from "./endpoints/reset-db.js";
import * as ep___resetPassword from "./endpoints/reset-password.js";
import * as ep___serverInfo from "./endpoints/server-info.js";
import * as ep___stats from "./endpoints/stats.js";
import * as ep___sw_show_registration from "./endpoints/sw/show-registration.js";
import * as ep___sw_update_registration from "./endpoints/sw/update-registration.js";
import * as ep___sw_register from "./endpoints/sw/register.js";
import * as ep___sw_unregister from "./endpoints/sw/unregister.js";
import * as ep___test from "./endpoints/test.js";
import * as ep___username_available from "./endpoints/username/available.js";
import * as ep___users from "./endpoints/users.js";
import * as ep___users_clips from "./endpoints/users/clips.js";
import * as ep___users_followers from "./endpoints/users/followers.js";
import * as ep___users_following from "./endpoints/users/following.js";
import * as ep___users_gallery_posts from "./endpoints/users/gallery/posts.js";
import * as ep___users_getFrequentlyRepliedUsers from "./endpoints/users/get-frequently-replied-users.js";
import * as ep___users_groups_create from "./endpoints/users/groups/create.js";
import * as ep___users_groups_delete from "./endpoints/users/groups/delete.js";
import * as ep___users_groups_invitations_accept from "./endpoints/users/groups/invitations/accept.js";
import * as ep___users_groups_invitations_reject from "./endpoints/users/groups/invitations/reject.js";
import * as ep___users_groups_invite from "./endpoints/users/groups/invite.js";
import * as ep___users_groups_joined from "./endpoints/users/groups/joined.js";
import * as ep___users_groups_leave from "./endpoints/users/groups/leave.js";
import * as ep___users_groups_owned from "./endpoints/users/groups/owned.js";
import * as ep___users_groups_pull from "./endpoints/users/groups/pull.js";
import * as ep___users_groups_show from "./endpoints/users/groups/show.js";
import * as ep___users_groups_transfer from "./endpoints/users/groups/transfer.js";
import * as ep___users_groups_update from "./endpoints/users/groups/update.js";
import * as ep___users_lists_create from "./endpoints/users/lists/create.js";
import * as ep___users_lists_delete from "./endpoints/users/lists/delete.js";
import * as ep___users_lists_delete_all from "./endpoints/users/lists/delete-all.js";
import * as ep___users_lists_list from "./endpoints/users/lists/list.js";
import * as ep___users_lists_pull from "./endpoints/users/lists/pull.js";
import * as ep___users_lists_push from "./endpoints/users/lists/push.js";
import * as ep___users_lists_show from "./endpoints/users/lists/show.js";
import * as ep___users_lists_update from "./endpoints/users/lists/update.js";
import * as ep___users_notes from "./endpoints/users/notes.js";
import * as ep___users_pages from "./endpoints/users/pages.js";
import * as ep___users_reactions from "./endpoints/users/reactions.js";
import * as ep___users_recommendation from "./endpoints/users/recommendation.js";
import * as ep___users_relation from "./endpoints/users/relation.js";
import * as ep___users_reportAbuse from "./endpoints/users/report-abuse.js";
import * as ep___users_searchByUsernameAndHost from "./endpoints/users/search-by-username-and-host.js";
import * as ep___users_search from "./endpoints/users/search.js";
import * as ep___users_show from "./endpoints/users/show.js";
import * as ep___users_stats from "./endpoints/users/stats.js";
import * as ep___admin_driveCapOverride from "./endpoints/admin/drive-capacity-override.js";

import * as ep___users_tumblr from "./endpoints/users/tumblr.js";
import * as ep___users_tumblr_feed from "./endpoints/notes/tumblr.js";

//Firefish Move
import * as ep___i_move from "./endpoints/i/move.js";
import * as ep___i_known_as from "./endpoints/i/known-as.js";

const getEps = [
	["note/reblogtrail", ep___notes_reblogtrail],
	["tumblr/user", ep___users_tumblr],
	["tumblr/feed", ep___users_tumblr_feed],
	["note/ancestors", ep___notes_ancestors],
];

const postEps = [
	["admin/meta", ep___admin_meta],
	["admin/abuse-user-reports", ep___admin_abuseUserReports],
	["admin/accounts/create", ep___admin_accounts_create],
	["admin/accounts/delete", ep___admin_accounts_delete],
	["admin/accounts/hosted", ep___admin_accounts_hosted],
	["admin/ad/create", ep___admin_ad_create],
	["admin/ad/delete", ep___admin_ad_delete],
	["admin/ad/list", ep___admin_ad_list],
	["admin/ad/update", ep___admin_ad_update],
	["admin/announcements/create", ep___admin_announcements_create],
	["admin/announcements/delete", ep___admin_announcements_delete],
	["admin/announcements/list", ep___admin_announcements_list],
	["admin/announcements/update", ep___admin_announcements_update],
	["admin/delete-all-files-of-a-user", ep___admin_deleteAllFilesOfAUser],
	["admin/drive/clean-remote-files", ep___admin_drive_cleanRemoteFiles],
	["admin/drive/cleanup", ep___admin_drive_cleanup],
	["admin/drive/files", ep___admin_drive_files],
	["admin/drive/show-file", ep___admin_drive_showFile],
	["admin/emoji/add-aliases-bulk", ep___admin_emoji_addAliasesBulk],
	["admin/emoji/add", ep___admin_emoji_add],
	["admin/emoji/copy", ep___admin_emoji_copy],
	["admin/emoji/delete-bulk", ep___admin_emoji_deleteBulk],
	["admin/emoji/delete", ep___admin_emoji_delete],
	["admin/emoji/import-zip", ep___admin_emoji_importZip],
	["admin/emoji/list-remote", ep___admin_emoji_listRemote],
	["admin/emoji/list", ep___admin_emoji_list],
	["admin/emoji/remove-aliases-bulk", ep___admin_emoji_removeAliasesBulk],
	["admin/emoji/set-aliases-bulk", ep___admin_emoji_setAliasesBulk],
	["admin/emoji/set-category-bulk", ep___admin_emoji_setCategoryBulk],
	["admin/emoji/set-license-bulk", ep___admin_emoji_setLicenseBulk],
	["admin/emoji/update", ep___admin_emoji_update],
	["admin/federation/delete-all-files", ep___admin_federation_deleteAllFiles],
	[
		"admin/federation/refresh-remote-instance-metadata",
		ep___admin_federation_refreshRemoteInstanceMetadata,
	],
	[
		"admin/federation/remove-all-following",
		ep___admin_federation_removeAllFollowing,
	],
	["admin/federation/update-instance", ep___admin_federation_updateInstance],
	["admin/get-index-stats", ep___admin_getIndexStats],
	["admin/get-table-stats", ep___admin_getTableStats],
	["admin/get-user-ips", ep___admin_getUserIps],
	["admin/invite", ep___admin_invite],
	["admin/moderators/add", ep___admin_moderators_add],
	["admin/moderators/remove", ep___admin_moderators_remove],
	["admin/promo/create", ep___admin_promo_create],
	["admin/queue/clear", ep___admin_queue_clear],
	["admin/queue/deliver-delayed", ep___admin_queue_deliverDelayed],
	["admin/queue/inbox-delayed", ep___admin_queue_inboxDelayed],
	["admin/queue/stats", ep___admin_queue_stats],
	["admin/relays/add", ep___admin_relays_add],
	["admin/relays/list", ep___admin_relays_list],
	["admin/relays/remove", ep___admin_relays_remove],
	["admin/reset-password", ep___admin_resetPassword],
	["admin/resolve-abuse-user-report", ep___admin_resolveAbuseUserReport],
	["admin/search/index-all", ep___admin_search_indexAll],
	["admin/send-email", ep___admin_sendEmail],
	["admin/send-mod-mail", ep___admin_sendModMail],
	["admin/server-info", ep___admin_serverInfo],
	["admin/show-moderation-logs", ep___admin_showModerationLogs],
	["admin/show-user", ep___admin_showUser],
	["admin/show-users", ep___admin_showUsers],
	["admin/silence-user", ep___admin_silenceUser],
	["admin/suspend-user", ep___admin_suspendUser],
	["admin/unsilence-user", ep___admin_unsilenceUser],
	["admin/unsuspend-user", ep___admin_unsuspendUser],
	["admin/update-meta", ep___admin_updateMeta],
	["admin/vacuum", ep___admin_vacuum],
	["admin/delete-account", ep___admin_deleteAccount],
	["admin/update-user-note", ep___admin_updateUserNote],
	["announcements", ep___announcements],
	["antennas/create", ep___antennas_create],
	["antennas/delete", ep___antennas_delete],
	["antennas/list", ep___antennas_list],
	["antennas/mark-read", ep___antennas_markRead],
	["antennas/notes", ep___antennas_notes],
	["antennas/show", ep___antennas_show],
	["antennas/update", ep___antennas_update],
	["ap/get", ep___ap_get],
	["ap/show", ep___ap_show],
	["app/create", ep___app_create],
	["app/show", ep___app_show],
	["auth/accept", ep___auth_accept],
	["auth/session/generate", ep___auth_session_generate],
	["auth/session/show", ep___auth_session_show],
	["auth/session/userkey", ep___auth_session_userkey],
	["blocking/create", ep___blocking_create],
	["blocking/delete", ep___blocking_delete],
	["blocking/list", ep___blocking_list],
	["channels/create", ep___channels_create],
	["channels/featured", ep___channels_featured],
	["channels/follow", ep___channels_follow],
	["channels/followed", ep___channels_followed],
	["channels/owned", ep___channels_owned],
	["channels/search", ep___channels_search],
	["channels/show", ep___channels_show],
	["channels/timeline", ep___channels_timeline],
	["channels/unfollow", ep___channels_unfollow],
	["channels/update", ep___channels_update],
	["charts/active-users", ep___charts_activeUsers],
	["charts/ap-request", ep___charts_apRequest],
	["charts/drive", ep___charts_drive],
	["charts/federation", ep___charts_federation],
	["charts/hashtag", ep___charts_hashtag],
	["charts/instance", ep___charts_instance],
	["charts/notes", ep___charts_notes],
	["charts/user/drive", ep___charts_user_drive],
	["charts/user/following", ep___charts_user_following],
	["charts/user/notes", ep___charts_user_notes],
	["charts/user/reactions", ep___charts_user_reactions],
	["charts/users", ep___charts_users],
	["clips/add-note", ep___clips_addNote],
	["clips/remove-note", ep___clips_removeNote],
	["clips/create", ep___clips_create],
	["clips/delete", ep___clips_delete],
	["clips/list", ep___clips_list],
	["clips/notes", ep___clips_notes],
	["clips/show", ep___clips_show],
	["clips/update", ep___clips_update],
	["drive", ep___drive],
	["drive/files", ep___drive_files],
	["drive/files/attached-notes", ep___drive_files_attachedNotes],
	["drive/files/caption-image", ep___drive_files_captionImage],
	["drive/files/check-existence", ep___drive_files_checkExistence],
	["drive/files/create", ep___drive_files_create],
	["drive/files/delete", ep___drive_files_delete],
	["drive/files/find-by-hash", ep___drive_files_findByHash],
	["drive/files/find", ep___drive_files_find],
	["drive/files/show", ep___drive_files_show],
	["drive/files/update", ep___drive_files_update],
	["drive/files/upload-from-url", ep___drive_files_uploadFromUrl],
	["drive/folders", ep___drive_folders],
	["drive/folders/create", ep___drive_folders_create],
	["drive/folders/delete", ep___drive_folders_delete],
	["drive/folders/find", ep___drive_folders_find],
	["drive/folders/show", ep___drive_folders_show],
	["drive/folders/update", ep___drive_folders_update],
	["drive/stream", ep___drive_stream],
	["email-address/available", ep___emailAddress_available],
	["emoji", ep___emoji],
	["endpoint", ep___endpoint],
	["endpoints", ep___endpoints],
	["export-custom-emojis", ep___exportCustomEmojis],
	["federation/followers", ep___federation_followers],
	["federation/following", ep___federation_following],
	["federation/instances", ep___federation_instances],
	["federation/show-instance", ep___federation_showInstance],
	["federation/update-remote-user", ep___federation_updateRemoteUser],
	["federation/users", ep___federation_users],
	["federation/stats", ep___federation_stats],
	["following/create", ep___following_create],
	["following/delete", ep___following_delete],
	["following/invalidate", ep___following_invalidate],
	["following/requests/accept", ep___following_requests_accept],
	["following/requests/cancel", ep___following_requests_cancel],
	["following/requests/list", ep___following_requests_list],
	["following/requests/reject", ep___following_requests_reject],
	["gallery/featured", ep___gallery_featured],
	["gallery/popular", ep___gallery_popular],
	["gallery/posts", ep___gallery_posts],
	["gallery/posts/create", ep___gallery_posts_create],
	["gallery/posts/delete", ep___gallery_posts_delete],
	["gallery/posts/like", ep___gallery_posts_like],
	["gallery/posts/show", ep___gallery_posts_show],
	["gallery/posts/unlike", ep___gallery_posts_unlike],
	["gallery/posts/update", ep___gallery_posts_update],
	["get-online-users-count", ep___getOnlineUsersCount],
	["hashtags/list", ep___hashtags_list],
	["hashtags/search", ep___hashtags_search],
	["hashtags/show", ep___hashtags_show],
	["hashtags/trend", ep___hashtags_trend],
	["hashtags/users", ep___hashtags_users],
	["i", ep___i],
	["i/known-as", ep___i_known_as],
	["i/move", ep___i_move],
	["i/2fa/done", ep___i_2fa_done],
	["i/2fa/key-done", ep___i_2fa_keyDone],
	["i/2fa/password-less", ep___i_2fa_passwordLess],
	["i/2fa/register-key", ep___i_2fa_registerKey],
	["i/2fa/register", ep___i_2fa_register],
	["i/2fa/update-key", ep___i_2fa_updateKey],
	["i/2fa/remove-key", ep___i_2fa_removeKey],
	["i/2fa/unregister", ep___i_2fa_unregister],
	["i/apps", ep___i_apps],
	["i/authorized-apps", ep___i_authorizedApps],
	["i/change-password", ep___i_changePassword],
	["i/delete-account", ep___i_deleteAccount],
	["i/export-blocking", ep___i_exportBlocking],
	["i/export-following", ep___i_exportFollowing],
	["i/export-mute", ep___i_exportMute],
	["i/export-notes", ep___i_exportNotes],
	["i/import-posts", ep___i_importPosts],
	["i/export-user-lists", ep___i_exportUserLists],
	["i/favorites", ep___i_favorites],
	["i/gallery/likes", ep___i_gallery_likes],
	["i/gallery/posts", ep___i_gallery_posts],
	["i/get-word-muted-notes-count", ep___i_getWordMutedNotesCount],
	["i/import-blocking", ep___i_importBlocking],
	["i/import-following", ep___i_importFollowing],
	["i/import-muting", ep___i_importMuting],
	["i/import-user-lists", ep___i_importUserLists],
	["i/notifications", ep___i_notifications],
	["i/page-likes", ep___i_pageLikes],
	["i/pages", ep___i_pages],
	["i/pin", ep___i_pin],
	["i/read-all-messaging-messages", ep___i_readAllMessagingMessages],
	["i/read-all-unread-notes", ep___i_readAllUnreadNotes],
	["i/read-announcement", ep___i_readAnnouncement],
	["i/regenerate-token", ep___i_regenerateToken],
	["i/registry/get-all", ep___i_registry_getAll],
	["i/registry/get-detail", ep___i_registry_getDetail],
	["i/registry/get-unsecure", ep___i_registry_getUnsecure],
	["i/registry/get", ep___i_registry_get],
	["i/registry/keys-with-type", ep___i_registry_keysWithType],
	["i/registry/keys", ep___i_registry_keys],
	["i/registry/remove", ep___i_registry_remove],
	["i/registry/scopes", ep___i_registry_scopes],
	["i/registry/set", ep___i_registry_set],
	["i/revoke-token", ep___i_revokeToken],
	["i/signin-history", ep___i_signinHistory],
	["i/unpin", ep___i_unpin],
	["i/update-email", ep___i_updateEmail],
	["i/update", ep___i_update],
	["i/user-group-invites", ep___i_userGroupInvites],
	["i/webhooks/create", ep___i_webhooks_create],
	["i/webhooks/list", ep___i_webhooks_list],
	["i/webhooks/show", ep___i_webhooks_show],
	["i/webhooks/update", ep___i_webhooks_update],
	["i/webhooks/delete", ep___i_webhooks_delete],
	["messaging/history", ep___messaging_history],
	["messaging/messages", ep___messaging_messages],
	["messaging/messages/create", ep___messaging_messages_create],
	["messaging/messages/delete", ep___messaging_messages_delete],
	["messaging/messages/read", ep___messaging_messages_read],
	["meta", ep___meta],
	["miauth/gen-token", ep___miauth_genToken],
	["mute/create", ep___mute_create],
	["mute/delete", ep___mute_delete],
	["mute/list", ep___mute_list],
	["my/apps", ep___my_apps],
	["notes", ep___notes],
	["notes/children", ep___notes_children],
	["notes/clips", ep___notes_clips],
	["notes/conversation", ep___notes_conversation],
	["notes/create", ep___notes_create],
	["notes/delete", ep___notes_delete],
	["notes/edit", ep___notes_edit],
	["notes/favorites/create", ep___notes_favorites_create],
	["notes/favorites/delete", ep___notes_favorites_delete],
	["notes/featured", ep___notes_featured],
	["notes/global-timeline", ep___notes_globalTimeline],
	["notes/hybrid-timeline", ep___notes_hybridTimeline],
	["notes/local-timeline", ep___notes_localTimeline],
	["notes/recommended-timeline", ep___notes_recommendedTimeline],
	["notes/mentions", ep___notes_mentions],
	["notes/polls/recommendation", ep___notes_polls_recommendation],
	["notes/polls/vote", ep___notes_polls_vote],
	["notes/reactions", ep___notes_reactions],
	["notes/reactions/create", ep___notes_reactions_create],
	["notes/reactions/delete", ep___notes_reactions_delete],
	["notes/renotes", ep___notes_renotes],
	["notes/replies", ep___notes_replies],
	["notes/search-by-tag", ep___notes_searchByTag],
	["notes/search", ep___notes_search],
	["notes/show", ep___notes_show],
	["notes/state", ep___notes_state],
	["notes/thread-muting/create", ep___notes_threadMuting_create],
	["notes/thread-muting/delete", ep___notes_threadMuting_delete],
	["notes/timeline", ep___notes_timeline],
	["notes/translate", ep___notes_translate],
	["notes/unrenote", ep___notes_unrenote],
	["notes/user-list-timeline", ep___notes_userListTimeline],
	["notes/watching/create", ep___notes_watching_create],
	["notes/watching/delete", ep___notes_watching_delete],
	["notifications/create", ep___notifications_create],
	["notifications/mark-all-as-read", ep___notifications_markAllAsRead],
	["notifications/read", ep___notifications_read],
	["page-push", ep___pagePush],
	["pages/create", ep___pages_create],
	["pages/delete", ep___pages_delete],
	["pages/featured", ep___pages_featured],
	["pages/like", ep___pages_like],
	["pages/show", ep___pages_show],
	["pages/unlike", ep___pages_unlike],
	["pages/update", ep___pages_update],
	["ping", ep___ping],
	["pinned-users", ep___pinnedUsers],
	["recommended-instances", ep___recommendedInstances],
	["renote-mute/create", ep___renote_mute_create],
	["renote-mute/delete", ep___renote_mute_delete],
	["renote-mute/list", ep___renote_mute_list],
	["custom-motd", ep___customMOTD],
	["custom-splash-icons", ep___customSplashIcons],
	["latest-version", ep___latestVersion],
	["release", ep___release],
	["promo/read", ep___promo_read],
	["request-reset-password", ep___requestResetPassword],
	["reset-db", ep___resetDb],
	["reset-password", ep___resetPassword],
	["server-info", ep___serverInfo],
	["stats", ep___stats],
	["sw/register", ep___sw_register],
	["sw/unregister", ep___sw_unregister],
	["sw/show-registration", ep___sw_show_registration],
	["sw/update-registration", ep___sw_update_registration],
	["test", ep___test],
	["username/available", ep___username_available],
	["users", ep___users],
	["users/clips", ep___users_clips],
	["users/followers", ep___users_followers],
	["users/following", ep___users_following],
	["users/gallery/posts", ep___users_gallery_posts],
	["users/get-frequently-replied-users", ep___users_getFrequentlyRepliedUsers],
	["users/groups/create", ep___users_groups_create],
	["users/groups/delete", ep___users_groups_delete],
	["users/groups/invitations/accept", ep___users_groups_invitations_accept],
	["users/groups/invitations/reject", ep___users_groups_invitations_reject],
	["users/groups/invite", ep___users_groups_invite],
	["users/groups/joined", ep___users_groups_joined],
	["users/groups/leave", ep___users_groups_leave],
	["users/groups/owned", ep___users_groups_owned],
	["users/groups/pull", ep___users_groups_pull],
	["users/groups/show", ep___users_groups_show],
	["users/groups/transfer", ep___users_groups_transfer],
	["users/groups/update", ep___users_groups_update],
	["users/lists/create", ep___users_lists_create],
	["users/lists/delete", ep___users_lists_delete],
	["users/lists/delete-all", ep___users_lists_delete_all],
	["users/lists/list", ep___users_lists_list],
	["users/lists/pull", ep___users_lists_pull],
	["users/lists/push", ep___users_lists_push],
	["users/lists/show", ep___users_lists_show],
	["users/lists/update", ep___users_lists_update],
	["users/notes", ep___users_notes],
	["users/pages", ep___users_pages],
	["users/reactions", ep___users_reactions],
	["users/recommendation", ep___users_recommendation],
	["users/relation", ep___users_relation],
	["users/report-abuse", ep___users_reportAbuse],
	["users/search-by-username-and-host", ep___users_searchByUsernameAndHost],
	["users/search", ep___users_search],
	["users/show", ep___users_show],
	["users/stats", ep___users_stats],
	["admin/drive-capacity-override", ep___admin_driveCapOverride],
	["get-sounds", ep___sounds],
];

export interface IEndpointMeta {
	readonly stability?: "deprecated" | "experimental" | "stable";

	readonly tags?: ReadonlyArray<string>;

	readonly errors?: {
		readonly [key: string]: {
			readonly message: string;
			readonly code: string;
			readonly id: string;
		};
	};

	readonly res?: Schema;

	/**
	 * このエンドポイントにリクエストするのにユーザー情報が必須か否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly requireCredential?: boolean;

	/**
	 * 管理者のみ使えるエンドポイントか否か
	 */
	readonly requireAdmin?: boolean;

	/**
	 * 管理者またはモデレーターのみ使えるエンドポイントか否か
	 */
	readonly requireModerator?: boolean;

	/**
	 * エンドポイントのリミテーションに関するやつ
	 * 省略した場合はリミテーションは無いものとして解釈されます。
	 */
	readonly limit?: {
		/**
		 * 複数のエンドポイントでリミットを共有したい場合に指定するキー
		 */
		readonly key?: string;

		/**
		 * リミットを適用する期間(ms)
		 * このプロパティを設定する場合、max プロパティも設定する必要があります。
		 */
		readonly duration?: number;

		/**
		 * durationで指定した期間内にいくつまでリクエストできるのか
		 * このプロパティを設定する場合、duration プロパティも設定する必要があります。
		 */
		readonly max?: number;

		/**
		 * 最低でもどれくらいの間隔を開けてリクエストしなければならないか(ms)
		 */
		readonly minInterval?: number;
	};

	/**
	 * ファイルの添付を必要とするか否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly requireFile?: boolean;

	/**
	 * サードパーティアプリからはリクエストすることができないか否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly secure?: boolean;

	/**
	 * プライベートモードでなら、このエンドポイントにリクエストするときにユーザー情報が必要か否か
	 * 省略した場合は false として解釈されます
	 */
	readonly requireCredentialPrivateMode?: boolean;

	/**
	 * エンドポイントの種類
	 * パーミッションの実現に利用されます。
	 */
	readonly kind?: string;

	readonly description?: string;

	/**
	 * GETでのリクエストを許容するか否か
	 */
	readonly allowGet?: boolean;

	/**
	 * 正常応答をキャッシュ (Cache-Control: public) する秒数
	 */
	readonly cacheSec?: number;
}

export interface IEndpoint {
	name: string;
	exec: any; // TODO: may be obosolete @ThatOneCalculator
	meta: IEndpointMeta;
	params: Schema;
	method: "POST" | "GET" | "PUT" | "DELETE";
}

const postEndpoints: IEndpoint[] = (postEps as [string, any]).map(
	([name, ep]) => {
		return {
			name: name,
			exec: ep.default,
			meta: ep.meta ?? {},
			params: ep.paramDef,
			method: "POST",
		};
	},
);

const getEndpoints: IEndpoint[] = (getEps as [string, any]).map(
	([name, ep]) => {
		return {
			name: name,
			exec: ep.default,
			meta: ep.meta ?? {},
			params: ep.paramDef,
			method: "GET",
		};
	},
);

export default postEndpoints.concat(getEndpoints);
