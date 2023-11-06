use crate::impl_into_napi_error;

#[derive(thiserror::Error, Debug, PartialEq, Eq)]
pub enum Error {
    #[error("Failed to parse string: {0}")]
    ParseError(#[from] parse_display::ParseError),
    #[error("Failed to get database connection: {0}")]
    DbConnError(#[from] crate::database::error::Error),
    #[error("Database operation error: {0}")]
    DbOperationError(#[from] sea_orm::DbErr),
    #[error("Requested entity not found")]
    NotFound,
}

impl_into_napi_error!(Error);
