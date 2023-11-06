use serde::Deserialize;
use std::env;
use std::fs;
use urlencoding::encode;

use sea_orm_migration::prelude::*;

const DB_URL_ENV: &str = "DATABASE_URL";
const CACHE_URL_ENV: &str = "CACHE_URL";
const CACHE_PREFIX_ENV: &str = "CACHE_PREFIX";

#[cfg(feature = "convert")]
mod vec_to_json;

#[tokio::main]
async fn main() {
    let cwd = env::current_dir().unwrap();
    let yml = fs::File::open(cwd.join("../../.config/default.yml"))
        .expect("Failed to open '.config/default.yml'");
    let config: Config = serde_yaml::from_reader(yml).expect("Failed to parse yaml");

    if env::var_os(DB_URL_ENV).is_none() {
        env::set_var(
            DB_URL_ENV,
            format!(
                "postgres://{}:{}@{}:{}/{}",
                config.db.user,
                encode(&config.db.pass),
                config.db.host,
                config.db.port,
                config.db.db,
            ),
        );
    };

    if env::var_os(CACHE_URL_ENV).is_none() {
        let redis_conf = match config.cache_server {
            None => config.redis,
            Some(conf) => conf,
        };
        let redis_proto = match redis_conf.tls {
            None => "redis",
            Some(_) => "rediss",
        };
        let redis_uri_userpass = match redis_conf.user {
            None => "".to_string(),
            Some(user) => format!("{}:{}@", user, encode(&redis_conf.pass.unwrap_or_default())),
        };
        let redis_uri_hostport = format!("{}:{}", redis_conf.host, redis_conf.port);
        let redis_uri = format!(
            "{}://{}{}/{}",
            redis_proto, redis_uri_userpass, redis_uri_hostport, redis_conf.db
        );
        env::set_var(CACHE_URL_ENV, redis_uri);
        env::set_var(
            CACHE_PREFIX_ENV,
            if redis_conf.prefix.is_empty() {
                config.url.host_str().unwrap()
            } else {
                &redis_conf.prefix
            },
        );
    }

    cli::run_cli(migration::Migrator).await;

    #[cfg(feature = "convert")]
    vec_to_json::convert().await;
}

#[derive(Debug, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub url: url::Url,
    pub db: DbConfig,
    pub redis: RedisConfig,
    pub cache_server: Option<RedisConfig>,
}

#[derive(Debug, PartialEq, Deserialize)]
pub struct DbConfig {
    pub host: String,
    pub port: u32,
    pub db: String,
    pub user: String,
    pub pass: String,
}

#[derive(Debug, PartialEq, Deserialize)]
pub struct RedisConfig {
    pub host: String,
    pub port: u32,
    pub user: Option<String>,
    pub pass: Option<String>,
    pub tls: Option<TlsConfig>,
    #[serde(default)]
    pub db: u32,
    #[serde(default)]
    pub prefix: String,
}

#[derive(Debug, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TlsConfig {
    pub host: String,
    pub reject_unauthorized: bool,
}
