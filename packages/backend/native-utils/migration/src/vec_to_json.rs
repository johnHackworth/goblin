use indicatif::{MultiProgress, ProgressBar, ProgressStyle};
use native_utils::model::entity::newtype::{I32Vec, StringVec};
use sea_orm_migration::{
    prelude::*,
    sea_orm::{Database, DbBackend, DbConn, Statement, TryGetable},
};
use serde_json::json;
use std::env;
use std::time::Duration;

pub async fn convert() {
    let uri = env::var("DATABASE_URL").expect("Environment variable 'DATABASE_URL' not set");

    let db = Database::connect(uri).await.expect("Unable to connect");
    let mp = MultiProgress::new();

    let handlers = vec![
        tokio::spawn(to_json::<AccessToken, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            AccessToken::Table,
            AccessToken::Id,
            AccessToken::Permission,
        )),
        tokio::spawn(to_json::<Antenna, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Antenna::Table,
            Antenna::Id,
            Antenna::Users,
        )),
        tokio::spawn(to_json::<App, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            App::Table,
            App::Id,
            App::Permission,
        )),
        tokio::spawn(to_json::<Emoji, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Emoji::Table,
            Emoji::Id,
            Emoji::Aliases,
        )),
        tokio::spawn(to_json::<GalleryPost, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            GalleryPost::Table,
            GalleryPost::Id,
            GalleryPost::FileIds,
        )),
        tokio::spawn(to_json::<GalleryPost, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            GalleryPost::Table,
            GalleryPost::Id,
            GalleryPost::Tags,
        )),
        tokio::spawn(to_json::<Hashtag, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Hashtag::Table,
            Hashtag::Id,
            Hashtag::MentionedUserIds,
        )),
        tokio::spawn(to_json::<Hashtag, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Hashtag::Table,
            Hashtag::Id,
            Hashtag::MentionedLocalUserIds,
        )),
        tokio::spawn(to_json::<Hashtag, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Hashtag::Table,
            Hashtag::Id,
            Hashtag::MentionedRemoteUserIds,
        )),
        tokio::spawn(to_json::<Hashtag, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Hashtag::Table,
            Hashtag::Id,
            Hashtag::AttachedUserIds,
        )),
        tokio::spawn(to_json::<Hashtag, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Hashtag::Table,
            Hashtag::Id,
            Hashtag::AttachedLocalUserIds,
        )),
        tokio::spawn(to_json::<Hashtag, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Hashtag::Table,
            Hashtag::Id,
            Hashtag::AttachedRemoteUserIds,
        )),
        tokio::spawn(to_json::<MessagingMessage, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            MessagingMessage::Table,
            MessagingMessage::Id,
            MessagingMessage::Reads,
        )),
        tokio::spawn(to_json::<Meta, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Meta::Table,
            Meta::Id,
            Meta::Langs,
        )),
        tokio::spawn(to_json::<Meta, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Meta::Table,
            Meta::Id,
            Meta::BlockedHosts,
        )),
        tokio::spawn(to_json::<Meta, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Meta::Table,
            Meta::Id,
            Meta::HiddenTags,
        )),
        tokio::spawn(to_json::<Meta, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Meta::Table,
            Meta::Id,
            Meta::PinnedUsers,
        )),
        tokio::spawn(to_json::<Meta, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Meta::Table,
            Meta::Id,
            Meta::PinnedPages,
        )),
        tokio::spawn(to_json::<Meta, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Meta::Table,
            Meta::Id,
            Meta::RecommendedInstances,
        )),
        tokio::spawn(to_json::<Meta, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Meta::Table,
            Meta::Id,
            Meta::SilencedHosts,
        )),
        tokio::spawn(to_json::<Note, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Note::Table,
            Note::Id,
            Note::FileIds,
        )),
        tokio::spawn(to_json::<Note, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Note::Table,
            Note::Id,
            Note::AttachedFileTypes,
        )),
        tokio::spawn(to_json::<Note, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Note::Table,
            Note::Id,
            Note::VisibleUserIds,
        )),
        tokio::spawn(to_json::<Note, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Note::Table,
            Note::Id,
            Note::Mentions,
        )),
        tokio::spawn(to_json::<Note, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Note::Table,
            Note::Id,
            Note::Emojis,
        )),
        tokio::spawn(to_json::<Note, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Note::Table,
            Note::Id,
            Note::Tags,
        )),
        tokio::spawn(to_json::<NoteEdit, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            NoteEdit::Table,
            NoteEdit::Id,
            NoteEdit::FileIds,
        )),
        tokio::spawn(to_json::<Page, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Page::Table,
            Page::Id,
            Page::VisibleUserIds,
        )),
        tokio::spawn(to_json::<RegistryItem, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            RegistryItem::Table,
            RegistryItem::Id,
            RegistryItem::Scope,
        )),
        tokio::spawn(to_json::<User, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            User::Table,
            User::Id,
            User::Tags,
        )),
        tokio::spawn(to_json::<User, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            User::Table,
            User::Id,
            User::Emojis,
        )),
        tokio::spawn(to_json::<Webhook, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Webhook::Table,
            Webhook::Id,
            Webhook::On,
        )),
        tokio::spawn(to_json::<Poll, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            Poll::Table,
            Poll::NoteId,
            Poll::Choices,
        )),
        tokio::spawn(to_json::<Poll, Vec<i32>, I32Vec>(
            db.clone(),
            mp.clone(),
            Poll::Table,
            Poll::NoteId,
            Poll::Votes,
        )),
        tokio::spawn(to_json::<UserProfile, Vec<String>, StringVec>(
            db.clone(),
            mp.clone(),
            UserProfile::Table,
            UserProfile::UserId,
            UserProfile::MutingNotificationTypes,
        )),
    ];

    futures::future::join_all(handlers).await;
}

fn select_query<T: Iden + 'static>(table: T, id: T, col: T) -> String {
    Query::select()
        .column(id)
        .column(col)
        .from(table)
        .to_string(PostgresQueryBuilder)
}

async fn get_vec<T: TryGetable>(db: &DbConn, query: String) -> Result<Vec<(String, T)>, DbErr> {
    let res: Vec<(String, T)> = db
        .query_all(Statement::from_string(DbBackend::Postgres, query))
        .await?
        .iter()
        .filter_map(|r| r.try_get_many_by_index().ok())
        .collect();
    Ok(res)
}

async fn convert_col<T: Iden + Clone + 'static>(
    db: &DbConn,
    table: T,
    col: T,
) -> Result<(), DbErr> {
    let stmt = Table::alter()
        .table(table)
        .drop_column(col.to_owned())
        .add_column(
            ColumnDef::new(col.to_owned())
                .json_binary()
                .not_null()
                .default(json!([])),
        )
        .to_string(PostgresQueryBuilder);
    db.query_one(Statement::from_string(DbBackend::Postgres, stmt))
        .await?;
    Ok(())
}

async fn to_json<T, U, V>(
    db: DbConn,
    mp: MultiProgress,
    table: T,
    id: T,
    col: T,
) -> Result<(), DbErr>
where
    T: Iden + Clone + 'static,
    U: TryGetable + IntoIterator + Clone,
    V: From<U> + Into<SimpleExpr>,
{
    let query = select_query(table.clone(), id.clone(), col.clone());
    let loading = ProgressBar::new_spinner()
        .with_style(ProgressStyle::with_template("{prefix} {msg} {spinner}").unwrap())
        .with_prefix("[-]")
        .with_message(format!(
            "Loading data from {}.{}",
            table.to_string(),
            col.to_string()
        ));
    let loading = mp.add(loading);
    loading.enable_steady_tick(Duration::from_millis(100));
    let res = get_vec::<U>(&db, query).await?;
    let models: Vec<(String, V)> = res
        .iter()
        .filter(|(_, r)| r.clone().into_iter().count() > 0)
        .map(|(id, r)| (id.clone(), <V>::from(r.clone())))
        .collect();
    loading.finish_and_clear();
    convert_col(&db, table.clone(), col.clone()).await?;

    let progress = ProgressBar::new(models.len() as u64)
        .with_style(
            ProgressStyle::with_template("{prefix} {msg} {wide_bar} {pos}/{len}")
                .unwrap()
                .progress_chars("##-"),
        )
        .with_prefix("[*]")
        .with_message(format!("Copying {}.{}", table.to_string(), col.to_string()));
    let progress = mp.add(progress);

    for model in models {
        progress.inc(1);
        let q = Query::update()
            .table(table.clone())
            .values([(col.clone(), model.1.into())])
            .and_where(Expr::col(id.clone()).eq(model.0))
            .to_string(PostgresQueryBuilder);
        db.query_one(Statement::from_string(DbBackend::Postgres, q))
            .await?;
    }
    progress.finish_with_message(format!("Done {}.{}", table.to_string(), col.to_string()));

    Ok(())
}

#[derive(Iden, Clone)]
enum AccessToken {
    Table,
    Id,
    Permission,
}
#[derive(Iden, Clone)]
enum Antenna {
    Table,
    Id,
    Users,
}
#[derive(Iden, Clone)]
enum App {
    Table,
    Id,
    Permission,
}
#[derive(Iden, Clone)]
enum Emoji {
    Table,
    Id,
    Aliases,
}
#[derive(Iden, Clone)]
enum GalleryPost {
    Table,
    Id,
    #[iden = "fileIds"]
    FileIds,
    Tags,
}
#[derive(Iden, Clone)]
enum Hashtag {
    Table,
    Id,
    #[iden = "mentionedUserIds"]
    MentionedUserIds,
    #[iden = "mentionedLocalUserIds"]
    MentionedLocalUserIds,
    #[iden = "mentionedRemoteUserIds"]
    MentionedRemoteUserIds,
    #[iden = "attachedUserIds"]
    AttachedUserIds,
    #[iden = "attachedLocalUserIds"]
    AttachedLocalUserIds,
    #[iden = "attachedRemoteUserIds"]
    AttachedRemoteUserIds,
}
#[derive(Iden, Clone)]
enum MessagingMessage {
    Table,
    Id,
    Reads,
}
#[derive(Iden, Clone)]
enum Meta {
    Table,
    Id,
    Langs,
    #[iden = "hiddenTags"]
    HiddenTags,
    #[iden = "blockedHosts"]
    BlockedHosts,
    #[iden = "pinnedUsers"]
    PinnedUsers,
    #[iden = "pinnedPages"]
    PinnedPages,
    #[iden = "recommendedInstances"]
    RecommendedInstances,
    #[iden = "silencedHosts"]
    SilencedHosts,
}
#[derive(Iden, Clone)]
enum Note {
    Table,
    Id,
    #[iden = "fileIds"]
    FileIds,
    #[iden = "attachedFileTypes"]
    AttachedFileTypes,
    #[iden = "visibleUserIds"]
    VisibleUserIds,
    Mentions,
    Emojis,
    Tags,
}
#[derive(Iden, Clone)]
enum NoteEdit {
    Table,
    Id,
    #[iden = "fileIds"]
    FileIds,
}
#[derive(Iden, Clone)]
enum Page {
    Table,
    Id,
    #[iden = "visibleUserIds"]
    VisibleUserIds,
}
#[derive(Iden, Clone)]
enum Poll {
    Table,
    #[iden = "noteId"]
    NoteId,
    Choices,
    Votes, // I32Vec
}
#[derive(Iden, Clone)]
enum RegistryItem {
    Table,
    Id,
    Scope,
}
#[derive(Iden, Clone)]
enum User {
    Table,
    Id,
    Tags,
    Emojis,
}
#[derive(Iden, Clone)]
enum UserProfile {
    Table,
    #[iden = "userId"]
    UserId,
    #[iden = "mutingNotificationTypes"]
    MutingNotificationTypes,
}
#[derive(Iden, Clone)]
enum Webhook {
    Table,
    Id,
    On,
}
