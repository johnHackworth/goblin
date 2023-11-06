mod macros;

use cfg_if::cfg_if;
use derive_more::{From, Into};
use sea_orm::{sea_query, DbErr, QueryResult, TryGetError, TryGetable, Value};
use serde::{Deserialize, Serialize};

use crate::impl_json_newtype;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, From, Into, Default)]
pub struct JsonKeyword(pub Vec<Vec<String>>);
impl_json_newtype!(JsonKeyword);

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, From, Into, Default)]
pub struct JsonStringVec(pub Vec<String>);
impl_json_newtype!(JsonStringVec);

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, From, Into, Default)]
pub struct JsonI32Vec(pub Vec<i32>);
impl_json_newtype!(JsonI32Vec);

cfg_if! {
    if #[cfg(feature = "noarray")] {
        pub type StringVec = JsonStringVec;
        pub type I32Vec = JsonI32Vec;
    } else {
        pub type StringVec = Vec<String>;
        pub type I32Vec = Vec<i32>;
    }
}
