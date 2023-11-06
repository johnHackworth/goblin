export class SpeakAsCat1680426269172 {
	name = "SpeakAsCat1680426269172";

	async up(queryRunner) {
		await queryRunner.query(`
            ALTER TABLE "user"
            ADD "speakAsCat" boolean NOT NULL DEFAULT true
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN "user"."speakAsCat"
						IS 'Whether to speak as a cat if isCat.'
        `);
	}

	async down(queryRunner) {
		await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "speakAsCat"
        `);
	}
}
