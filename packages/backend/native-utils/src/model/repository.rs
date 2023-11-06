pub mod antenna;

use async_trait::async_trait;
use schemars::JsonSchema;

use super::error::Error;

/// Repositories have a packer that converts a database model to its
/// corresponding API schema.
#[async_trait]
pub trait Repository<T: JsonSchema> {
    async fn pack(self) -> Result<T, Error>;
    /// Retrieves one model by its id and pack it.
    async fn pack_by_id(id: String) -> Result<T, Error>;
}

mod macros {
    /// Provides the default implementation of
    /// [crate::model::repository::Repository::pack_by_id].
    macro_rules! impl_pack_by_id {
        ($a:ty, $b:ident) => {
            match <$a>::find_by_id($b)
                .one(crate::database::get_database()?)
                .await?
            {
                None => Err(Error::NotFound),
                Some(m) => m.pack().await,
            }
        };
    }

    pub(crate) use impl_pack_by_id;
}
