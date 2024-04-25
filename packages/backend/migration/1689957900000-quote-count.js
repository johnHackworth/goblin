export class Quote1689957900000 {
	name = "Quote1689957900000";

	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "note" ADD "quoteCount" smallint NULL default 0`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "quoteCount"`);
	}
}
