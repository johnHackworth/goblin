#[macro_export]
macro_rules! impl_into_napi_error {
    ($a:ty) => {
        #[cfg(feature = "napi")]
        impl Into<napi::Error> for $a {
            fn into(self) -> napi::Error {
                napi::Error::from_reason(self.to_string())
            }
        }
    };
}
