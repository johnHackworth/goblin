export class ExperimentalFeatures1683980686995 {
	name = "ExperimentalFeatures1683980686995";

	async up(queryRunner) {
		await queryRunner.query(`
				ALTER TABLE "meta"
				ADD "experimentalFeatures" jsonb NOT NULL DEFAULT '{}'
		`);
	}

	async down(queryRunner) {
		await queryRunner.query(`
				ALTER TABLE "meta" DROP COLUMN "experimentalFeatures"
		`);
	}
}
