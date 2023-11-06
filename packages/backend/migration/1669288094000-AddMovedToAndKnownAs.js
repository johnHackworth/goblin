export class addMovedToAndKnownAs1669288094000 {
	name = "addMovedToAndKnownAs1669288094000";

	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "user" ADD "movedToUri" character varying(512)`,
		);
		await queryRunner.query(`ALTER TABLE "user" ADD "alsoKnownAs" TEXT`);
		await queryRunner.query(
			`COMMENT ON COLUMN "user"."movedToUri" IS 'The URI of the new account of the User'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "user"."alsoKnownAs" IS 'URIs the user is known as too'`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "movedToUri"`);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "alsoKnownAs"`);
	}
}
