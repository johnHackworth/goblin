export class EmojiSize1684494870830 {
	name = "EmojiSize1684494870830";

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "emoji" ADD "width" integer`);
		await queryRunner.query(
			`COMMENT ON COLUMN "emoji"."width" IS 'Image width'`,
		);
		await queryRunner.query(`ALTER TABLE "emoji" ADD "height" integer`);
		await queryRunner.query(
			`COMMENT ON COLUMN "emoji"."height" IS 'Image height'`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "emoji" DROP COLUMN "height"`);
		await queryRunner.query(`ALTER TABLE "emoji" DROP COLUMN "width"`);
	}
}
