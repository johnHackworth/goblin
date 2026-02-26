export class addRssFeeds1738348800000 {
	constructor() {
		this.name = "addRssFeeds1738348800000";
	}
	async up(queryRunner) {
		await queryRunner.query(`
      CREATE TABLE "rss_feed" (
        "id" character varying(32) NOT NULL,
        "url" character varying(2048) NOT NULL,
        "title" character varying(512) NOT NULL,
        "description" character varying(2048),
        "siteUrl" character varying(512),
        "botUserId" character varying(32) NOT NULL,
        "lastFetchedAt" TIMESTAMP WITH TIME ZONE,
        "lastItemPublishedAt" TIMESTAMP WITH TIME ZONE,
        "fetchInterval" integer NOT NULL DEFAULT 15,
        "isActive" boolean NOT NULL DEFAULT true,
        "isPermanentlyDisabled" boolean NOT NULL DEFAULT false,
        "disabledUntil" TIMESTAMP WITH TIME ZONE,
        "consecutiveErrorCount" integer NOT NULL DEFAULT 0,
        "lastError" character varying(1024),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_rss_feed_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_rss_feed_url" UNIQUE ("url")
      )
    `);
		await queryRunner.query(`
      CREATE INDEX "IDX_rss_feed_botUserId" ON "rss_feed" ("botUserId")
    `);

		await queryRunner.query(`
      CREATE TABLE "rss_feed_following" (
        "id" character varying(32) NOT NULL,
        "userId" character varying(32) NOT NULL,
        "rssFeedId" character varying(32) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_rss_feed_following_id" PRIMARY KEY ("id")
      )
    `);
		await queryRunner.query(`
      CREATE INDEX "IDX_rss_feed_following_userId" ON "rss_feed_following" ("userId")
    `);
		await queryRunner.query(`
      CREATE INDEX "IDX_rss_feed_following_rssFeedId" ON "rss_feed_following" ("rssFeedId")
    `);
		await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_rss_feed_following_userId_rssFeedId" ON "rss_feed_following" ("userId", "rssFeedId")
    `);

		await queryRunner.query(`
      CREATE TABLE "rss_feed_item" (
        "id" character varying(32) NOT NULL,
        "rssFeedId" character varying(32) NOT NULL,
        "url" character varying(2048) NOT NULL,
        "noteId" character varying(32) NOT NULL,
        "publishedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_rss_feed_item_id" PRIMARY KEY ("id")
      )
    `);
		await queryRunner.query(`
      CREATE INDEX "IDX_rss_feed_item_rssFeedId" ON "rss_feed_item" ("rssFeedId")
    `);
		await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_rss_feed_item_rssFeedId_url" ON "rss_feed_item" ("rssFeedId", "url")
    `);

		await queryRunner.query(`
      ALTER TABLE "rss_feed" ADD CONSTRAINT "FK_rss_feed_botUserId" 
      FOREIGN KEY ("botUserId") REFERENCES "user"("id") ON DELETE CASCADE
    `);
		await queryRunner.query(`
      ALTER TABLE "rss_feed_following" ADD CONSTRAINT "FK_rss_feed_following_userId" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
    `);
		await queryRunner.query(`
      ALTER TABLE "rss_feed_following" ADD CONSTRAINT "FK_rss_feed_following_rssFeedId" 
      FOREIGN KEY ("rssFeedId") REFERENCES "rss_feed"("id") ON DELETE CASCADE
    `);
		await queryRunner.query(`
      ALTER TABLE "rss_feed_item" ADD CONSTRAINT "FK_rss_feed_item_rssFeedId" 
      FOREIGN KEY ("rssFeedId") REFERENCES "rss_feed"("id") ON DELETE CASCADE
    `);
		await queryRunner.query(`
      ALTER TABLE "rss_feed_item" ADD CONSTRAINT "FK_rss_feed_item_noteId" 
      FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE
    `);
	}
	async down(queryRunner) {
		await queryRunner.query(
			`ALTER TABLE "rss_feed_item" DROP CONSTRAINT "FK_rss_feed_item_noteId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "rss_feed_item" DROP CONSTRAINT "FK_rss_feed_item_rssFeedId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "rss_feed_following" DROP CONSTRAINT "FK_rss_feed_following_rssFeedId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "rss_feed_following" DROP CONSTRAINT "FK_rss_feed_following_userId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "rss_feed" DROP CONSTRAINT "FK_rss_feed_botUserId"`,
		);
		await queryRunner.query(`DROP TABLE "rss_feed_item"`);
		await queryRunner.query(`DROP TABLE "rss_feed_following"`);
		await queryRunner.query(`DROP TABLE "rss_feed"`);
	}
}
