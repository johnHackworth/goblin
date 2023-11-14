export class Goblin1689957800000 {
  name = "Goblin1689957800000";

  async up(queryRunner) {
      await queryRunner.query(`ALTER TABLE "note" ADD "reblogtrail" json NULL default '{}'::json`);
  }

  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "reblogtrail"`);
  }
}
