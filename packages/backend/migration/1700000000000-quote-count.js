export class Goblin1700000000000 {
  name = "Goblin1700000000000";

  async up(queryRunner) {
      await queryRunner.query(`ALTER TABLE "note" ADD "quoteCount" smallint NULL default 0`);
  }

  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "quoteCount"`);
  }
}
