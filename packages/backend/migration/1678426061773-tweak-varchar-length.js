export class tweakVarcharLength1678426061773 {
	name = "tweakVarcharLength1678426061773";

	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "meta" ALTER COLUMN "smtpUser" TYPE character varying(1024)`,
			undefined,
		);
		await queryRunner.query(
			`ALTER TABLE "meta" ALTER COLUMN "smtpPass" TYPE character varying(1024)`,
			undefined,
		);
	}

	async down(queryRunner) {}
}
