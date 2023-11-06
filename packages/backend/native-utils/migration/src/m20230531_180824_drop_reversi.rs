use sea_orm_migration::{
    prelude::*,
    sea_orm::{DbBackend, Statement},
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        if manager.get_database_backend() == DbBackend::Sqlite {
            return Ok(());
        }

        let db = manager.get_connection();
        db.query_one(Statement::from_string(
            DbBackend::Postgres,
            Table::drop()
                .table(ReversiGame::Table)
                .if_exists()
                .to_string(PostgresQueryBuilder),
        ))
        .await?;
        db.query_one(Statement::from_string(
            DbBackend::Postgres,
            Table::drop()
                .table(ReversiMatching::Table)
                .if_exists()
                .to_string(PostgresQueryBuilder),
        ))
        .await?;

        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts
        Ok(())
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
enum ReversiGame {
    Table,
}
#[derive(Iden)]
enum ReversiMatching {
    Table,
}
