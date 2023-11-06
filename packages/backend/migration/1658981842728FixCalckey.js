export class FixFirefish1658981842728 {
	name = "FixFirefish1658981842728";

	async up(queryRunner) {
		await queryRunner.query(
			`UPDATE "meta" SET "useStarForReactionFallback" = TRUE;`,
		);
		await queryRunner.query(
			`UPDATE "meta" SET "repositoryUrl" = 'https://codeberg/firefish/firefish'`,
		);
		await queryRunner.query(
			`UPDATE "meta" SET "feedbackUrl" = 'https://codeberg/firefish/firefish/issues'`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(
			`UPDATE "meta" SET "useStarForReactionFallback" = FALSE;`,
		);
		await queryRunner.query(
			`UPDATE "meta" SET "repositoryUrl" = 'https://codeberg/firefish/firefish'`,
		);
		await queryRunner.query(
			`UPDATE "meta" SET "feedbackUrl" = 'https://codeberg/firefish/firefish/issues'`,
		);
	}
}
