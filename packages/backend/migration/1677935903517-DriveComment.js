export class DriveComment1677935903517 {
	name = "DriveComment1677935903517";

	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "drive_file" ALTER "comment" TYPE character varying(8192)`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "drive_file" ALTER "comment" TYPE character varying(512)`,
		);
	}
}
