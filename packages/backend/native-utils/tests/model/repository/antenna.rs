mod int_test {
    use native_utils::{database, model, util};

    use model::{
        entity::{antenna, antenna_note, note, user},
        repository::Repository,
        schema,
    };
    use pretty_assertions::assert_eq;
    use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, IntoActiveModel, QueryFilter};

    use crate::{cleanup, prepare};

    #[tokio::test]
    async fn can_pack() {
        prepare().await;
        let db = database::get_database().unwrap();

        let alice_antenna = user::Entity::find()
            .filter(user::Column::Username.eq("alice"))
            .find_also_related(antenna::Entity)
            .one(db)
            .await
            .unwrap()
            .expect("alice not found")
            .1
            .expect("alice's antenna not found");

        let packed = alice_antenna
            .to_owned()
            .pack()
            .await
            .expect("Unable to pack");

        let packed_by_id = antenna::Model::pack_by_id(alice_antenna.id.to_owned())
            .await
            .expect("Unable to pack");

        let result = schema::Antenna {
            id: alice_antenna.id,
            created_at: alice_antenna.created_at.into(),
            name: "Alice Antenna".to_string(),
            keywords: vec![
                vec!["foo".to_string(), "bar".to_string()],
                vec!["foobar".to_string()],
            ],
            exclude_keywords: vec![
                vec!["abc".to_string()],
                vec!["def".to_string(), "ghi".to_string()],
            ],
            src: schema::AntennaSrc::All,
            user_list_id: None,
            user_group_id: None,
            users: vec![],
            instances: vec![],
            case_sensitive: true,
            notify: true,
            with_replies: false,
            with_file: false,
            has_unread_note: false,
        };

        assert_eq!(packed, result);
        assert_eq!(packed_by_id, result);

        cleanup().await;
    }

    #[tokio::test]
    async fn unread_note() {
        prepare().await;
        let db = database::get_database().unwrap();

        let (alice, alice_antenna) = user::Entity::find()
            .filter(user::Column::Username.eq("alice"))
            .find_also_related(antenna::Entity)
            .one(db)
            .await
            .unwrap()
            .expect("alice not found");
        let alice_antenna = alice_antenna.expect("alice's antenna not found");
        let packed = alice_antenna
            .to_owned()
            .pack()
            .await
            .expect("Unable to pack");
        assert_eq!(packed.has_unread_note, false);

        let note_model = note::Entity::find()
            .filter(note::Column::UserId.eq(alice.id))
            .one(db)
            .await
            .unwrap()
            .expect("note not found");
        let antenna_note = antenna_note::Model {
            id: util::id::create_id(0).unwrap(),
            antenna_id: alice_antenna.id.to_owned(),
            note_id: note_model.id.to_owned(),
            read: false,
        };
        antenna_note
            .into_active_model()
            .reset_all()
            .insert(db)
            .await
            .unwrap();
        let packed = alice_antenna
            .to_owned()
            .pack()
            .await
            .expect("Unable to pack");
        assert_eq!(packed.has_unread_note, true);

        cleanup().await;
    }
}
