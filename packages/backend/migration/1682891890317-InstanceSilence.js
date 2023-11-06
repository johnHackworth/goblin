export class InstanceSilence1682891890317 {
	name = "InstanceSilence1682891890317";

	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "meta" ADD "silencedHosts" character varying(256) array NOT NULL DEFAULT '{}'`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "silencedHosts"`);
	}
}
