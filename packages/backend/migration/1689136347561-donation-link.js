export class DonationLink1689136347561 {
	name = "DonationLink1689136347561";

	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "meta" ADD "donationLink" character varying(256)`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "meta" DROP COLUMN "DonationLink1689136347561"`,
		);
	}
}
