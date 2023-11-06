#![cfg(not(feature = "napi"))]

mod model;

use chrono::Utc;
use native_utils::database;
use native_utils::model::entity;
use native_utils::model::entity::sea_orm_active_enums::AntennaSrcEnum;
use native_utils::util::{
    id::{create_id, init_id},
    random::gen_string,
};
use sea_orm::{
    sea_query::TableCreateStatement, ActiveModelTrait, ConnectionTrait, DbBackend, DbConn, DbErr,
    EntityTrait, IntoActiveModel, TransactionTrait,
};

/// Insert predefined entries in the database.
async fn prepare() {
    database::init_database("sqlite::memory:")
        .await
        .expect("Unable to initialize database connection");
    let db = database::get_database().expect("Unable to get database connection from pool");
    setup_schema(db).await;
    setup_model(db).await;
}

/// Setup schemas in the database.
async fn setup_schema(db: &DbConn) {
    let schema = sea_orm::Schema::new(DbBackend::Sqlite);
    let mut stmts: Vec<TableCreateStatement> = Vec::new();
    macro_rules! create_table_statement {
        ($a:tt) => {
            stmts.push(schema.create_table_from_entity(entity::$a::Entity).if_not_exists().to_owned());
        };
        ($a:tt, $($b:tt),+) => {
            create_table_statement!($a);
            create_table_statement!($($b),+);
        };
    }
    create_table_statement!(
        abuse_user_report,
        access_token,
        ad,
        announcement_read,
        announcement,
        antenna_note,
        antenna,
        app,
        attestation_challenge,
        auth_session,
        blocking,
        channel_following,
        channel_note_pining,
        channel,
        clip_note,
        clip,
        drive_file,
        drive_folder,
        emoji,
        following,
        follow_request,
        gallery_like,
        gallery_post,
        hashtag,
        instance,
        messaging_message,
        meta,
        migrations,
        moderation_log,
        muted_note,
        muting,
        note_edit,
        note_favorite,
        note_reaction,
        note,
        note_thread_muting,
        note_unread,
        note_watching,
        notification,
        page_like,
        page,
        password_reset_request,
        poll,
        poll_vote,
        promo_note,
        promo_read,
        registration_ticket,
        registry_item,
        relay,
        renote_muting,
        signin,
        sw_subscription,
        used_username,
        user_group_invitation,
        user_group_invite,
        user_group_joining,
        user_group,
        user_ip,
        user_keypair,
        user_list_joining,
        user_list,
        user_note_pining,
        user_pending,
        user_profile,
        user_publickey,
        user,
        user_security_key,
        webhook
    );
    db.transaction::<_, (), DbErr>(|txn| {
        Box::pin(async move {
            for stmt in stmts {
                txn.execute(txn.get_database_backend().build(&stmt)).await?;
            }
            Ok(())
        })
    })
    .await
    .expect("Unable to setup schemas");
}

/// Delete all entries in the database.
async fn cleanup() {
    let db = database::get_database().expect("Unable to get database connection from pool");
    db.transaction::<_, (), DbErr>(|txn| {
        Box::pin(async move {
            entity::user::Entity::delete_many().exec(txn).await.unwrap();
            entity::antenna::Entity::delete_many()
                .exec(txn)
                .await
                .unwrap();

            Ok(())
        })
    })
    .await
    .expect("Unable to delete predefined models");
}

async fn setup_model(db: &DbConn) {
    init_id(16, "");

    db.transaction::<_, (), DbErr>(|txn| {
        Box::pin(async move {
            let user_id = create_id(0).unwrap();
            let name = "Alice";
            let user_model = entity::user::Model {
                id: user_id.to_owned(),
                created_at: Utc::now().into(),
                username: name.to_lowercase(),
                username_lower: name.to_lowercase(),
                name: Some(name.to_string()),
                token: Some(gen_string(16)),
                is_admin: true,
                ..Default::default()
            };
            user_model
                .into_active_model()
                .reset_all()
                .insert(txn)
                .await?;
            let antenna_model = entity::antenna::Model {
                id: create_id(0).unwrap(),
                created_at: Utc::now().into(),
                user_id: user_id.to_owned(),
                name: "Alice Antenna".to_string(),
                src: AntennaSrcEnum::All,
                keywords: vec![
                    vec!["foo".to_string(), "bar".to_string()],
                    vec!["foobar".to_string()],
                ]
                .into(),
                exclude_keywords: vec![
                    vec!["abc".to_string()],
                    vec!["def".to_string(), "ghi".to_string()],
                ]
                .into(),
                notify: true,
                case_sensitive: true,
                ..Default::default()
            };
            antenna_model
                .into_active_model()
                .reset_all()
                .insert(txn)
                .await?;
            let note_model = entity::note::Model {
                id: create_id(0).unwrap(),
                created_at: Utc::now().into(),
                text: Some("Testing 123".to_string()),
                user_id: user_id.to_owned(),
                ..Default::default()
            };
            note_model
                .into_active_model()
                .reset_all()
                .insert(txn)
                .await?;

            Ok(())
        })
    })
    .await
    .expect("Unable to setup predefined models");
}

mod int_test {
    use super::{cleanup, prepare};

    #[tokio::test]
    async fn can_prepare_and_cleanup() {
        prepare().await;
        cleanup().await;
    }
}
