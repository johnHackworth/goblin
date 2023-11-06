/* "FirefishRepoMove1671388343000" is a class that updates the "useStarForReactionFallback" column in
the "meta" table to TRUE */
export class FirefishRepoMove1671388343000 {
	name = "FirefishRepoMove1671388343000";

	async up(queryRunner) {
		await queryRunner.query(
			`UPDATE meta SET "repositoryUrl" = 'https://codeberg/firefish/firefish'`,
		);
		await queryRunner.query(
			`UPDATE meta SET "feedbackUrl" = 'https://codeberg/firefish/firefish/issues'`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(
			`UPDATE meta SET "repositoryUrl" = 'https://codeberg/firefish/firefish'`,
		);
		await queryRunner.query(
			`UPDATE meta SET "feedbackUrl" = 'https://codeberg/firefish/firefish/issues'`,
		);
	}
}
