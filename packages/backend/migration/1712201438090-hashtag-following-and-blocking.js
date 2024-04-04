export class HashtagFollowingAndBlocking1712201438090 {
    name = 'HashtagFollowingAndBlocking1712201438090'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "followedHashtags" character varying(128) array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."followedHashtags" IS 'Hashtags that will appear in the User''s timeline.'`);
        await queryRunner.query(`ALTER TABLE "user" ADD "blockedHashtags" character varying(128) array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."blockedHashtags" IS 'Hashtags that will be blocked from the User''s timeline, taking precedence over follow.'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "blockedHashtags"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "followedHashtags"`);
    }
}
