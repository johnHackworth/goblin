export class UniqueUserIds1710414776532 {
	constructor() {
		this.name = "UniqueUserIds1710414776532";
	}

	async up(queryRunner) {
		const repeats = await queryRunner.query(
			`select "tumblrUUID", username, uc from
      (select username, "tumblrUUID", count("username") as uc from "user" where username like '%tumblr_com' group by "username", "tumblrUUID" order by uc desc) as repeats
      where uc > 1;`,
		);
		for (let i = 0; i < repeats.length; i++) {
			console.log(repeats[i].tumblrUUID, repeats[i].username, repeats[i].uc);
			console.log("===================");
			const uniqueIds = await queryRunner.query(
				`select "id", "username", "updatedAt", "followersCount", "notesCount","tumblrUUID" from "user" WHERE "tumblrUUID" = '${repeats[i].tumblrUUID}' order by "followersCount" DESC`,
			);
			if (uniqueIds[0].followersCount) console.log(uniqueIds);

			for (let j = 1; j < uniqueIds.length; j++) {
				await queryRunner.query(
					`UPDATE "user" SET "tumblrUUID" = NULL, "username" = '${uniqueIds[j].username}_${uniqueIds[j].id}_at_tumblr_com', "isSuspended" = true WHERE id = '${uniqueIds[j].id}'`,
				);
			}
		}

		await queryRunner.query(
			`ALTER TABLE "user" ADD CONSTRAINT "UQ_tumblrUUID" UNIQUE ("tumblrUUID")`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ADD CONSTRAINT "UQ_username_host" UNIQUE ("username", "host")`,
		);
	}
	async down(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "user" DROP CONSTRAINT "UQ_tumblrUUID"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" DROP CONSTRAINT "UQ_username_host"`,
		);
	}
}
