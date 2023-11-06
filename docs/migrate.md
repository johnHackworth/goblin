# 🚚 Migrating from Misskey/FoundKey to Firefish

All the guides below assume you're starting in the root of the repo directory.

### Before proceeding

- **Ensure you have stopped all master and worker processes of Misskey.**
- **Ensure you have backups of the database before performing any commands.**

## Misskey v13 and above

Tested with Misskey v13.11.3.

If your Misskey v13 is older, we recommend updating your Misskey to v13.11.3.

```sh
wget -O mkv13.patch https://git.joinfirefish.org/firefish/firefish/-/raw/develop/docs/mkv13.patch
wget -O mkv13_restore.patch https://git.joinfirefish.org/firefish/firefish/-/raw/develop/docs/mkv13_restore.patch
git apply mkv13.patch mkv13_restore.patch

cd packages/backend

LINE_NUM="$(pnpm typeorm migration:show -d ormconfig.js | grep -n activeEmailValidation1657346559800 | cut -d ':' -f 1)"
NUM_MIGRATIONS="$(pnpm typeorm migration:show -d ormconfig.js | tail -n+"$LINE_NUM" | grep '\[X\]' | wc -l)"

for i in $(seq 1 $NUM_MIGRATIONS); do pnpm typeorm migration:revert -d ormconfig.js; done

cd ../../

git remote set-url origin https://git.joinfirefish.org/firefish/firefish.git
git fetch origin
git stash push
rm -rf fluent-emojis misskey-assets
git switch main # or beta or develop
git pull --ff
wget -O renote_muting.patch https://git.joinfirefish.org/firefish/firefish/-/raw/develop/docs/renote_muting.patch
git apply renote_muting.patch

pnpm install
NODE_ENV=production pnpm run build
pnpm run migrate
git stash push
```

Depending on the version you're migrating from, you may have to open Postgres with `psql -d your_database` and run the following commands:

```sql
ALTER TABLE "meta" ADD COLUMN "disableLocalTimeline" boolean DEFAULT false;
ALTER TABLE "meta" ADD COLUMN "disableGlobalTimeline" boolean DEFAULT false;
ALTER TABLE "meta" ADD COLUMN "localDriveCapacityMb" integer DEFAULT 512;
ALTER TABLE "meta" ADD COLUMN "remoteDriveCapacityMb" integer DEFAULT 128;
ALTER TABLE "user" ADD COLUMN "isSilenced" boolean DEFAULT false;
ALTER TABLE "user" ADD COLUMN "isAdmin" boolean DEFAULT false;
ALTER TABLE "user" ADD COLUMN "isModerator" boolean DEFAULT false;
ALTER TABLE "user" ADD COLUMN "remoteDriveCapacityMb" integer DEFAULT 128;
ALTER TABLE "user" ADD COLUMN "driveCapacityOverrideMb" integer DEFAULT 128;
ALTER TABLE "instance" ADD COLUMN "caughtAt" date;
ALTER TABLE "instance" ADD COLUMN "latestRequestSentAt" date;
ALTER TABLE "instance" ADD COLUMN "latestStatus" character varying(512);
ALTER TABLE "instance" ADD COLUMN "lastCommunicatedAt" date;
```

then quit with `\q`, and restart Firefish.

Note: Ignore errors of `column "xxx" of relation "xxx" already exists`.

If no other errors happened, your Firefish is ready to launch!

## Misskey v12.119 and before

```sh
git remote set-url origin https://git.joinfirefish.org/firefish/firefish.git
git fetch
git checkout main # or beta or develop
git pull --ff

NODE_ENV=production pnpm run migrate
# build using prefered method
```

## FoundKey

```sh
wget -O fk.patch https://git.joinfirefish.org/firefish/firefish/-/raw/develop/docs/fk.patch
git apply fk.patch
cd packages/backend

LINE_NUM="$(npx typeorm migration:show -d ormconfig.js | grep -n uniformThemecolor1652859567549 | cut -d ':' -f 1)"
NUM_MIGRATIONS="$(npx typeorm migration:show -d ormconfig.js | tail -n+"$LINE_NUM" | grep '\[X\]' | wc -l)"

for i in $(seq 1 $NUM_MIGRATIONS); do
    npx typeorm migration:revert -d ormconfig.js
done

git remote set-url origin https://git.joinfirefish.org/firefish/firefish.git
git fetch
git checkout main # or beta or develop
git pull --ff

NODE_ENV=production pnpm run migrate
# build using prefered method
```

## Reverse

You ***cannot*** migrate back to Misskey from Firefish due to re-hashing passwords on signin with argon2. You can migrate from Calckey to FoundKey, although this is not recommended due to FoundKey being end-of-life, and may have some problems with alt-text.
