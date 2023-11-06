//! ID generation utility based on [cuid2]

use cfg_if::cfg_if;
use chrono::Utc;
use once_cell::sync::OnceCell;
use radix_fmt::radix_36;
use std::cmp;

use crate::impl_into_napi_error;

#[derive(thiserror::Error, Debug, PartialEq, Eq)]
#[error("ID generator has not been initialized yet")]
pub struct ErrorUninitialized;

impl_into_napi_error!(ErrorUninitialized);

static FINGERPRINT: OnceCell<String> = OnceCell::new();
static GENERATOR: OnceCell<cuid2::CuidConstructor> = OnceCell::new();

const TIME_2000: i64 = 946_684_800_000;
const TIMESTAMP_LENGTH: u16 = 8;

/// Initializes Cuid2 generator. Must be called before any [create_id].
pub fn init_id<'a>(length: u16, fingerprint: &'a str) {
    FINGERPRINT.get_or_init(move || format!("{}{}", fingerprint, cuid2::create_id()));
    GENERATOR.get_or_init(move || {
        cuid2::CuidConstructor::new()
            // length to pass shoule be greater than or equal to 8.
            .with_length(cmp::max(length - TIMESTAMP_LENGTH, 8))
            .with_fingerprinter(|| FINGERPRINT.get().unwrap().clone())
    });
}

/// Returns Cuid2 with the length specified by [init_id]. Must be called after
/// [init_id], otherwise returns [ErrorUninitialized].
/// The current timestamp via [chrono::Utc] is used if `date_num` is `0`.
pub fn create_id(date_num: i64) -> Result<String, ErrorUninitialized> {
    match GENERATOR.get() {
        None => Err(ErrorUninitialized),
        Some(gen) => {
            let date_num = if date_num > 0 {
                date_num
            } else {
                Utc::now().timestamp_millis()
            };
            let time = cmp::max(date_num - TIME_2000, 0);
            Ok(format!(
                "{:0>8}{}",
                radix_36(time).to_string(),
                gen.create_id()
            ))
        }
    }
}

cfg_if! {
    if #[cfg(feature = "napi")] {
        use napi_derive::napi;

        /// Calls [init_id] inside. Must be called before [native_create_id].
        #[napi]
        pub fn native_init_id_generator(length: u16, fingerprint: String) {
            init_id(length, &fingerprint);
        }

        /// Generates
        #[napi]
        pub fn native_create_id(date_num: i64) -> String {
            create_id(date_num).unwrap()
        }
    }
}

#[cfg(test)]
mod unit_test {
    use crate::util::id;
    use pretty_assertions::{assert_eq, assert_ne};
    use std::thread;

    #[test]
    fn can_generate_unique_ids() {
        assert_eq!(id::create_id(0), Err(id::ErrorUninitialized));
        id::init_id(16, "");
        assert_eq!(id::create_id(0).unwrap().len(), 16);
        assert_ne!(id::create_id(0).unwrap(), id::create_id(0).unwrap());
        let id1 = thread::spawn(|| id::create_id(0).unwrap());
        let id2 = thread::spawn(|| id::create_id(0).unwrap());
        assert_ne!(id1.join().unwrap(), id2.join().unwrap());
    }
}
