export class CustomSplashIcons1658941974648 {
	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "meta" ADD "customSplashIcons" character varying(256) array NOT NULL DEFAULT '{}'::varchar[]`,
		);
	}
	async down(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "meta" DROP COLUMN "customSplashIcons"`,
		);
	}
}
