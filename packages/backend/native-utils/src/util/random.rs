use rand::{distributions::Alphanumeric, thread_rng, Rng};

/// Generate random string based on [thread_rng] and [Alphanumeric].
pub fn gen_string(length: u16) -> String {
    thread_rng()
        .sample_iter(Alphanumeric)
        .take(length.into())
        .map(char::from)
        .collect()
}

#[cfg(feature = "napi")]
#[napi_derive::napi]
pub fn native_random_str(length: u16) -> String {
    gen_string(length)
}

#[cfg(test)]
mod unit_test {
    use pretty_assertions::{assert_eq, assert_ne};
    use std::thread;

    use super::gen_string;

    #[test]
    fn can_generate_unique_strings() {
        assert_eq!(gen_string(16).len(), 16);
        assert_ne!(gen_string(16), gen_string(16));
        let s1 = thread::spawn(|| gen_string(16));
        let s2 = thread::spawn(|| gen_string(16));
        assert_ne!(s1.join().unwrap(), s2.join().unwrap());
    }
}
