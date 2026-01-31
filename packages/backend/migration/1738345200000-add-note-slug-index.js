export class addNoteSlugIndex1738345200000 {
	constructor() {
		this.name = "addNoteSlugIndex1738345200000";
	}
	async up(queryRunner) {
		await queryRunner.query(
			`CREATE INDEX "IDX_note_slug_userId" ON "note" ("slug", "userId")`,
		);
	}
	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "IDX_note_slug_userId"`);
	}
}
