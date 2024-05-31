export class externalPostId1717142049375 {
  constructor() {
    this.name = "externalPostId1717142049375";
  }
  async up(queryRunner) {
    await queryRunner.query(
      `ALTER TABLE "note" ADD "externalId" character varying(32) NULL`
    );
  }
  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "externalId"`);
  }
}
