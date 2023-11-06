export class Page1668828368510 {
	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "page" ADD "isPublic" boolean NOT NULL DEFAULT true`,
		);
	}
	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "page" DROP COLUMN "isPublic"`);
	}
}
