export class PreventAiLearning1683682889948 {
	name = "PreventAiLearning1683682889948";

	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "user_profile" ADD "preventAiLearning" boolean NOT NULL DEFAULT true`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "user_profile" DROP COLUMN "preventAiLearning"`,
		);
	}
}
