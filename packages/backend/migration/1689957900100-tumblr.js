export class Tumblr1689957900100 {
  name = "Tumblr1689957900100";

  async up(queryRunner) {
      await queryRunner.query(`ALTER TABLE "user" ADD "tumblrUUID" character varying(32) NULL`);
      await queryRunner.query(`ALTER TABLE "user" ADD "feedUpdatedAt" TIMESTAMP WITH TIME ZONE NULL`);
  }

  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "tumblrUUID"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "feedUpdatedAt"`);
  }
}
