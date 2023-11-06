export class FirefishRepo1689739513827 {
	name = "FirefishRepo1689739513827";

	async up(queryRunner) {
		await queryRunner.query(
			`UPDATE meta SET "repositoryUrl" = 'https://codeberg.org/firefish/firefish'`,
		);
		await queryRunner.query(
			`UPDATE meta SET "feedbackUrl" = 'https://codeberg.org/firefish/firefish/issues'`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(
			`UPDATE meta SET "repositoryUrl" = 'https://codeberg.org/calckey/calckey'`,
		);
		await queryRunner.query(
			`UPDATE meta SET "feedbackUrl" = 'https://codeberg.org/calckey/calckey/firefish/firefish/issues'`,
		);
	}
}
