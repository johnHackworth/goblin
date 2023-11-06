use napi::{bindgen_prelude::*, Error, Status};
use napi_derive::napi;

static CHAR_COLLECTION: &str = "0123456789abcdefghijklmnopqrstuvwxyz";

// -- NAPI exports --

#[napi]
pub enum IdConvertType {
    MastodonId,
    FirefishId,
}

#[napi]
pub fn convert_id(in_id: String, id_convert_type: IdConvertType) -> napi::Result<String> {
    use IdConvertType::*;
    match id_convert_type {
        MastodonId => {
            let mut out: i128 = 0;
            for (i, c) in in_id.to_lowercase().chars().rev().enumerate() {
                out += num_from_char(c)? as i128 * 36_i128.pow(i as u32);
            }

            Ok(out.to_string())
        }
        FirefishId => {
            let mut input: i128 = match in_id.parse() {
                Ok(s) => s,
                Err(_) => {
                    return Err(Error::new(
                        Status::InvalidArg,
                        "Unable to parse ID as MastodonId",
                    ))
                }
            };
            let mut out = String::new();

            while input != 0 {
                out.insert(0, char_from_num((input % 36) as u8)?);
                input /= 36;
            }

            Ok(out)
        }
    }
}

// -- end --

#[inline(always)]
fn num_from_char(character: char) -> napi::Result<u8> {
    for (i, c) in CHAR_COLLECTION.chars().enumerate() {
        if c == character {
            return Ok(i as u8);
        }
    }

    Err(Error::new(
        Status::InvalidArg,
        "Invalid character in parsed base36 id",
    ))
}

#[inline(always)]
fn char_from_num(number: u8) -> napi::Result<char> {
    CHAR_COLLECTION
        .chars()
        .nth(number as usize)
        .ok_or(Error::from_status(Status::Unknown))
}
