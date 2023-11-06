export class LibreTranslate1682777547198 {
	name = "LibreTranslate1682777547198";

	async up(queryRunner) {
		await queryRunner.query(`
				ALTER TABLE "meta"
				ADD "libreTranslateApiUrl" character varying(512)
		`);
		await queryRunner.query(`
				ALTER TABLE "meta"
				ADD "libreTranslateApiKey" character varying(128)
		`);
	}

	async down(queryRunner) {
		await queryRunner.query(`
				ALTER TABLE "meta" DROP COLUMN "libreTranslateApiKey"
		`);
		await queryRunner.query(`
				ALTER TABLE "meta" DROP COLUMN "libreTranslateApiUrl"
		`);
	}
}
