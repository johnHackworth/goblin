export class CustomMOTD1658939464003 {
	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "meta" ADD "customMOTD" character varying(256) array NOT NULL DEFAULT '{}'::varchar[]`,
		);
	}
	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "customMOTD"`);
	}
}
