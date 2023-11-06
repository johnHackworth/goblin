pub use sea_orm_migration::prelude::*;

mod m20230531_180824_drop_reversi;
mod m20230627_185451_index_note_url;
mod m20230709_000510_move_antenna_to_cache;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20230531_180824_drop_reversi::Migration),
            Box::new(m20230627_185451_index_note_url::Migration),
            Box::new(m20230709_000510_move_antenna_to_cache::Migration),
        ]
    }
}
