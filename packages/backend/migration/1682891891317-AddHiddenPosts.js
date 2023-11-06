export class AddHiddenPosts1682891891317 {
	name = "AddHiddenPosts1682891891317";

	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TYPE note_visibility_enum ADD VALUE IF NOT EXISTS 'hidden'`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(
			`ALTER TYPE note_visibility_enum REMOVE VALUE IF EXISTS 'hidden'`,
		);
	}
}
