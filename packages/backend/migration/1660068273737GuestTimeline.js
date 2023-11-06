export class GuestTimeline1660068273737 {
	name = "GuestTimeline1660068273737";
	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "meta" ADD "enableGuestTimeline" boolean NOT NULL DEFAULT false`,
		);
	}
	async down(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "meta" DROP COLUMN "enableGuestTimeline"`,
		);
	}
}
