#[macro_export]
macro_rules! impl_json_newtype {
    ($a:tt) => {
        impl From<$a> for Value {
            fn from(source: $a) -> Self {
                Value::Json(serde_json::to_value(source).ok().map(Box::new))
            }
        }

        impl TryGetable for $a {
            fn try_get_by<I: sea_orm::ColIdx>(
                res: &QueryResult,
                idx: I,
            ) -> Result<Self, TryGetError> {
                let json_value: serde_json::Value =
                    res.try_get_by(idx).map_err(TryGetError::DbErr)?;
                serde_json::from_value(json_value)
                    .map_err(|e| TryGetError::DbErr(DbErr::Json(e.to_string())))
            }
        }

        impl sea_query::ValueType for $a {
            fn try_from(v: Value) -> Result<Self, sea_query::ValueTypeErr> {
                match v {
                    Value::Json(Some(x)) => Ok($a(
                        serde_json::from_value(*x).map_err(|_| sea_query::ValueTypeErr)?
                    )),
                    _ => Err(sea_query::ValueTypeErr),
                }
            }

            fn type_name() -> String {
                stringify!($a).to_owned()
            }

            fn array_type() -> sea_query::ArrayType {
                sea_query::ArrayType::Json
            }

            fn column_type() -> sea_query::ColumnType {
                sea_query::ColumnType::JsonBinary
            }
        }

        impl sea_query::Nullable for $a {
            fn null() -> Value {
                Value::Json(None)
            }
        }
    };
}
