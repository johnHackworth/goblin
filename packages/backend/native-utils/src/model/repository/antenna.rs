use async_trait::async_trait;
use cfg_if::cfg_if;
use sea_orm::EntityTrait;

use crate::database;
use crate::model::entity::{antenna, user_group_joining};
use crate::model::error::Error;
use crate::model::schema::Antenna;

use super::macros::impl_pack_by_id;
use super::Repository;

#[async_trait]
impl Repository<Antenna> for antenna::Model {
    async fn pack(self) -> Result<Antenna, Error> {
        let db = database::get_database()?;
        let user_group_joining = match self.user_group_joining_id {
            None => None,
            Some(id) => user_group_joining::Entity::find_by_id(id).one(db).await?,
        };
        let user_group_id = match user_group_joining {
            None => None,
            Some(m) => Some(m.user_group_id),
        };

        cfg_if! {
            if #[cfg(feature = "napi")] {
                let created_at: String = self.created_at.to_rfc3339();
            } else {
                let created_at: chrono::DateTime<chrono::Utc> = self.created_at.into();
            }
        }

        Ok(Antenna {
            id: self.id,
            created_at,
            name: self.name,
            keywords: self.keywords.into(),
            exclude_keywords: self.exclude_keywords.into(),
            src: self.src.try_into()?,
            user_list_id: self.user_list_id,
            user_group_id,
            users: self.users,
            instances: self.instances.into(),
            case_sensitive: self.case_sensitive,
            notify: self.notify,
            with_replies: self.with_replies,
            with_file: self.with_file,
            has_unread_note: false,
        })
    }

    async fn pack_by_id(id: String) -> Result<Antenna, Error> {
        impl_pack_by_id!(antenna::Entity, id)
    }
}
