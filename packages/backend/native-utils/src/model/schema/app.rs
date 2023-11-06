use jsonschema::JSONSchema;
use once_cell::sync::Lazy;
use schemars::JsonSchema;
use utoipa::ToSchema;

use super::Schema;

#[derive(Clone, Debug, PartialEq, Eq, JsonSchema, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct App {
    pub id: String,
    pub name: String,
    #[schemars(url)]
    pub callback_url: Option<String>,
    #[schema(inline)]
    pub permission: Vec<AppPermission>,
    pub secret: Option<String>,
    pub is_authorized: Option<bool>,
}

/// This represents `permissions` in `packages/firefish-js/src/consts.ts`.
#[derive(Clone, Debug, PartialEq, Eq, JsonSchema, ToSchema)]
pub enum AppPermission {
    #[serde(rename = "read:account")]
    ReadAccount,
    #[serde(rename = "write:account")]
    WriteAccount,
    #[serde(rename = "read:blocks")]
    ReadBlocks,
    #[serde(rename = "write:blocks")]
    WriteBlocks,
    #[serde(rename = "read:drive")]
    ReadDrive,
    #[serde(rename = "write:drive")]
    WriteDrive,
    #[serde(rename = "read:favorites")]
    ReadFavorites,
    #[serde(rename = "write:favorites")]
    WriteFavorites,
    #[serde(rename = "read:following")]
    ReadFollowing,
    #[serde(rename = "write:following")]
    WriteFollowing,
    #[serde(rename = "read:messaging")]
    ReadMessaging,
    #[serde(rename = "write:messaging")]
    WriteMessaging,
    #[serde(rename = "read:mutes")]
    ReadMutes,
    #[serde(rename = "write:mutes")]
    WriteMutes,
    #[serde(rename = "read:notes")]
    ReadNotes,
    #[serde(rename = "write:notes")]
    WriteNotes,
    #[serde(rename = "read:notifications")]
    ReadNotifications,
    #[serde(rename = "write:notifications")]
    WriteNotifications,
    #[serde(rename = "read:reactions")]
    ReadReactions,
    #[serde(rename = "write:reactions")]
    WriteReactions,
    #[serde(rename = "write:votes")]
    WriteVotes,
    #[serde(rename = "read:pages")]
    ReadPages,
    #[serde(rename = "write:pages")]
    WritePages,
    #[serde(rename = "read:page-likes")]
    ReadPageLikes,
    #[serde(rename = "write:page-likes")]
    WritePageLikes,
    #[serde(rename = "read:user-groups")]
    ReadUserGroups,
    #[serde(rename = "write:user-groups")]
    WriteUserGroups,
    #[serde(rename = "read:channels")]
    ReadChannels,
    #[serde(rename = "write:channels")]
    WriteChannels,
    #[serde(rename = "read:gallery")]
    ReadGallery,
    #[serde(rename = "write:gallery")]
    WriteGallery,
    #[serde(rename = "read:gallery-likes")]
    ReadGalleryLikes,
    #[serde(rename = "write:gallery-likes")]
    WriteGalleryLikes,
}

impl Schema<Self> for App {}

pub static VALIDATOR: Lazy<JSONSchema> = Lazy::new(App::validator);

#[cfg(test)]
mod unit_test {
    use pretty_assertions::assert_eq;
    use serde_json::json;

    use crate::util::id::{create_id, init_id};
    use crate::util::random::gen_string;

    use super::VALIDATOR;

    #[test]
    fn app_valid() {
        init_id(16, "");
        let instance = json!({
            "id": create_id(0).unwrap(),
            "name": "Test App",
            "secret": gen_string(24),
            "callbackUrl": "urn:ietf:wg:oauth:2.0:oob",
            "permission": ["read:account", "write:account", "read:notes"],
        });

        assert!(VALIDATOR.is_valid(&instance));
    }

    #[test]
    fn app_invalid() {
        init_id(16, "");
        let instance = json!({
            "id": create_id(0).unwrap(),
            // "name" is required
            "name": null,
            // "permission" must be one of the app permissions
            "permission": ["write:invalid_perm", "write:notes"],
            // "secret" is a nullable string
            "secret": 123,
            // "is_authorized" is a nullable boolean
            "isAuthorized": "true-ish",
        });
        let result = VALIDATOR
            .validate(&instance)
            .expect_err("validation must fail");
        let mut paths: Vec<String> = result
            .map(|e| e.instance_path.to_string())
            .filter(|e| !e.is_empty())
            .collect();
        paths.sort();
        assert_eq!(
            paths,
            vec!["/isAuthorized", "/name", "/permission/0", "/secret"]
        );
    }
}
