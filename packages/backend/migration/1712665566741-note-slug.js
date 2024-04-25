export class NoteSlug1712665566741 {
	name = "NoteSlug1712665566741";

	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "note" ADD "slug" character varying(128) NULL`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "slug"`);
	}
}
