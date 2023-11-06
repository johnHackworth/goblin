export class RecommendedTimeline1659042130648 {
	name = "RecommendedTimeline1659042130648";
	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "meta" ADD "disableRecommendedTimeline" boolean NOT NULL DEFAULT true`,
		);
		await queryRunner.query(
			`ALTER TABLE "meta" ADD "recommendedInstances" character varying(256) array NOT NULL DEFAULT '{}'::varchar[]`,
		);
	}
	async down(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "meta" DROP COLUMN "disableRecommendedTimeline"`,
		);
		await queryRunner.query(
			`ALTER TABLE "meta" DROP COLUMN "recommendedInstances"`,
		);
	}
}
