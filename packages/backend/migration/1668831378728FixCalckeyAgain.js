export class FixFirefishAgain1668831378728 {
	name = "FixFirefishAgain1668831378728";

	async up(queryRunner) {
		await queryRunner.query(
			`UPDATE "meta" SET "useStarForReactionFallback" = TRUE`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(
			`UPDATE "meta" SET "useStarForReactionFallback" = FALSE`,
		);
	}
}
