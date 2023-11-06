export class AntennaInstances1676093997212 {
	name = "AntennaInstances1676093997212";

	async up(queryRunner) {
		await queryRunner.query(
			`ALTER TYPE "antenna_src_enum" ADD VALUE 'instances'`,
		);
		await queryRunner.query(
			`ALTER TABLE "antenna" ADD "instances" jsonb NOT NULL DEFAULT '[]'`,
		);
	}

	async down(queryRunner) {
		await queryRunner.query(`DELETE FROM "antenna" WHERE "src" = 'instances'`);
		await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "instances"`);
		await queryRunner.query(
			`CREATE TYPE "public"."antenna_src_enum_old" AS ENUM('home', 'all', 'users', 'list', 'group')`,
		);
		await queryRunner.query(
			`ALTER TABLE "antenna" ALTER COLUMN "src" TYPE "public"."antenna_src_enum_old" USING "src"::"text"::"public"."antenna_src_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."antenna_src_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."antenna_src_enum_old" RENAME TO "antenna_src_enum"`,
		);
	}
}
