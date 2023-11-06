use redis::streams::StreamMaxlen;
use sea_orm::Statement;
use sea_orm_migration::prelude::*;
use std::env;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let cache_url = env::var("CACHE_URL").unwrap();
        let skip_copy = env::var("ANTENNA_MIGRATION_SKIP").unwrap_or_default();
        let copy_limit = env::var("ANTENNA_MIGRATION_COPY_LIMIT").unwrap_or_default();
        let read_limit: u64 = env::var("ANTENNA_MIGRATION_READ_LIMIT")
            .unwrap_or("10000".to_string())
            .parse()
            .unwrap();
        let copy_limit: i64 = match copy_limit.parse() {
            Ok(limit) => limit,
            Err(_) => 0,
        };

        if skip_copy == "true" {
            println!("Skipped antenna migration");
        } else {
            let prefix = env::var("CACHE_PREFIX").unwrap();

            let db = manager.get_connection();
            let bk = manager.get_database_backend();

            let count_stmt =
                Statement::from_string(bk, "SELECT COUNT(1) FROM antenna_note".to_owned());
            let total_num = db
                .query_one(count_stmt)
                .await?
                .unwrap()
                .try_get_by_index::<i64>(0)?;
            let copy_limit = if copy_limit > 0 {
                copy_limit
            } else {
                total_num
            };
            println!(
                "Copying {} out of {} entries in antenna_note.",
                copy_limit, total_num
            );

            let stmt_base = Query::select()
                .column((AntennaNote::Table, AntennaNote::Id))
                .column(AntennaNote::AntennaId)
                .column(AntennaNote::NoteId)
                .from(AntennaNote::Table)
                .order_by((AntennaNote::Table, AntennaNote::Id), Order::Asc)
                .limit(read_limit)
                .to_owned();

            let mut stmt = stmt_base.clone();

            let client = redis::Client::open(cache_url).unwrap();
            let mut redis_conn = client.get_connection().unwrap();

            let mut remaining = total_num;
            let mut pagination: i64 = 0;

            loop {
                let res = db.query_all(bk.build(&stmt)).await?;
                if res.len() == 0 {
                    break;
                }
                let val: Vec<(String, String, String)> = res
                    .iter()
                    .filter_map(|q| q.try_get_many_by_index().ok())
                    .collect();

                remaining -= val.len() as i64;
                if remaining <= copy_limit {
                    let mut pipe = redis::pipe();
                    for v in &val {
                        pipe.xadd_maxlen(
                            format!("{}:antennaTimeline:{}", prefix, v.1),
                            StreamMaxlen::Approx(200),
                            "*",
                            &[("note", v.2.to_owned())],
                        )
                        .ignore();
                    }
                    pipe.query::<()>(&mut redis_conn).unwrap();
                }

                let copied = total_num - remaining;
                let copied = std::cmp::min(copied, total_num);
                pagination += 1;
                if pagination % 10 == 0 {
                    println!(
                        "Migrating antenna [{:.2}%]",
                        (copied as f64 / total_num as f64) * 100_f64,
                    );
                }

                if let Some((last_id, _, _)) = val.last() {
                    stmt = stmt_base
                        .clone()
                        .and_where(
                            Expr::col((AntennaNote::Table, AntennaNote::Id)).gt(last_id.to_owned()),
                        )
                        .to_owned();
                } else {
                    break;
                }
            }

            println!("Migrating antenna [100.00%]");
        }

        manager
            .drop_table(
                Table::drop()
                    .table(AntennaNote::Table)
                    .if_exists()
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(AntennaNote::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(AntennaNote::Id)
                            .string_len(32)
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(AntennaNote::NoteId)
                            .string_len(32)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(AntennaNote::AntennaId)
                            .string_len(32)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(AntennaNote::Read)
                            .boolean()
                            .default(false)
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await?;
        manager
            .create_index(
                Index::create()
                    .name("IDX_0d775946662d2575dfd2068a5f")
                    .table(AntennaNote::Table)
                    .col(AntennaNote::AntennaId)
                    .if_not_exists()
                    .to_owned(),
            )
            .await?;
        manager
            .create_index(
                Index::create()
                    .name("IDX_bd0397be22147e17210940e125")
                    .table(AntennaNote::Table)
                    .col(AntennaNote::NoteId)
                    .if_not_exists()
                    .to_owned(),
            )
            .await?;
        manager
            .create_index(
                Index::create()
                    .name("IDX_335a0bf3f904406f9ef3dd51c2")
                    .table(AntennaNote::Table)
                    .col(AntennaNote::NoteId)
                    .col(AntennaNote::AntennaId)
                    .unique()
                    .if_not_exists()
                    .to_owned(),
            )
            .await?;
        manager
            .create_index(
                Index::create()
                    .name("IDX_9937ea48d7ae97ffb4f3f063a4")
                    .table(AntennaNote::Table)
                    .col(AntennaNote::Read)
                    .if_not_exists()
                    .to_owned(),
            )
            .await?;
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("FK_0d775946662d2575dfd2068a5f5")
                    .from(AntennaNote::Table, AntennaNote::AntennaId)
                    .to(Antenna::Table, Antenna::Id)
                    .on_delete(ForeignKeyAction::Cascade)
                    .to_owned(),
            )
            .await?;
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("FK_bd0397be22147e17210940e125b")
                    .from(AntennaNote::Table, AntennaNote::NoteId)
                    .to(Note::Table, Note::Id)
                    .on_delete(ForeignKeyAction::Cascade)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
enum AntennaNote {
    Table,
    Id,
    #[iden = "noteId"]
    NoteId,
    #[iden = "antennaId"]
    AntennaId,
    Read,
}

#[derive(Iden)]
enum Antenna {
    Table,
    Id,
}

#[derive(Iden)]
enum Note {
    Table,
    Id,
}
