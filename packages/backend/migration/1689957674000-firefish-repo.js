export class FirefishRepo1689957674000 {
	name = "FirefishRepo1689957674000";

	async up(queryRunner) {
		await queryRunner.query(
			`UPDATE meta SET "repositoryUrl" = 'https://git.joinfirefish.org/firefish/firefish'`,
		);
		await queryRunner.query(
			`UPDATE meta SET "feedbackUrl" = 'https://git.joinfirefish.org/firefish/firefish/issues'`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(
			`UPDATE meta SET "repositoryUrl" = 'https://codeberg.org/firefish/firefish'`,
		);
		await queryRunner.query(
			`UPDATE meta SET "feedbackUrl" = 'https://codeberg.org/firefish/firefish/issues'`,
		);
	}
}
