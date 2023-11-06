use sea_orm::error::DbErr;

use crate::impl_into_napi_error;

#[derive(thiserror::Error, Debug, PartialEq, Eq)]
pub enum Error {
    #[error("The database connections have not been initialized yet")]
    Uninitialized,
    #[error("ORM error: {0}")]
    OrmError(#[from] DbErr),
}

impl_into_napi_error!(Error);
