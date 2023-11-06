export class CleanCharts1680375641101 {
	constructor() {
		this.name = "CleanCharts1680375641101";
	}
	async up(queryRunner) {
		await queryRunner.query(
			`delete from __chart__hashtag where ___local_users = 0 and ___remote_users = 0;`,
		);
		await queryRunner.query(
			`delete from __chart_day__hashtag where ___local_users = 0 and ___remote_users = 0;`,
		);
		await queryRunner.query(`COMMIT;`);
		await queryRunner.query(`vacuum __chart__hashtag;`);
		await queryRunner.query(`vacuum __chart_day__hashtag;`);
		await queryRunner.query(`COMMIT;`);
	}
	async down(queryRunner) {
		await queryRunner.query(
			`delete from __chart__hashtag where ___local_users = 0 and ___remote_users = 0;`,
		);
		await queryRunner.query(
			`delete from __chart_day__hashtag where ___local_users = 0 and ___remote_users = 0;`,
		);
	}
}
