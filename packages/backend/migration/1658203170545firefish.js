export class calckey1658203170545 {
	name = "calckey1658203170545";

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
