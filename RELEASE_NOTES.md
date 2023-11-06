# Firefish

Welcome to the new era of FIREFISH!

<img src="https://git.joinfirefish.org/firefish/firefish/-/raw/develop/animated.svg" height="320px"/>

# Changelog

## Major changes from last release candidate

- Firefish branding and [new repo](https://git.joinfirefish.org/firefish/firefish)!
- Far better Mastodon API support
- Edits are now non-experimental
- Support for secondary cache server
- Link verification with `rel=me`
- Store antennas in cache
- Post imports with media
- Sytle fixes
- More translations
- Performance upgrades
- Bug fixes
- Faster build
- [FoundKey](https://genau.qwertqwefsday.eu/notes/9h0lqlg05m) -> Firefish migration fixes

## Major changes from stable

All of the above, plus:

- Post editing
- Post imports
- New post design
- New header design
- Better accessibility
- Server silences
- Modmail
- New MFM effects
- Meilisearch search engine
- Channel search
- Improved system emails
- cuid2 IDs
- Emoji skin tones
- New 2FA flow
- Reduced visual clutter
- Deck view improvements

# Upgrading

## If upgrading from v13 (old stable)

**In addition to the rest of the steps after this**:

- Install the Rust toolchain (v1.68.0 or higher): <https://www.rust-lang.org/tools/install>

- (Optional) install Meilisearch to use as a search engine instead of Sonic: <https://www.meilisearch.com/>

- Replace your config file (`.config/default.yml`) with a blank version of the example (`.config/example.yml`) and re-enter the information. This will make things easier.

## Dependencies

- Upgrade to at least Node v20.3.1 (v20.4.0 recommended).

- (Optional, recommended) install DragonflyDB and configure under `cacheServer`: <https://www.dragonflydb.io/>

## Set new repo and pull

```sh
git remote set-url origin https://git.joinfirefish.org/firefish/firefish.git
git pull --ff
```

In case you get an error like:
```
error: The following untracked working tree files would be overwritten by merge:
	packages/backend/assets/LICENSE
Please move or remove them before you merge.
Aborting
```

Run:
```sh
rm ./packages/backend/assets/LICENSE
git reset --hard origin/develop
git pull --ff
```

## Upgrade packages

```sh
corepack enable
pnpm i
```

## Build

```sh
NODE_ENV=production pnpm run buld
```

## Migrate

There are 3 new envoriment variables for this upgrade only, because antennas have been moved from the database to the cache.

- `ANTENNA_MIGRATION_SKIP`: skips copying antennas to cache if `true`. Default is `false` (will clear all antennas if skipped).
- `ANTENNA_MIGRATION_COPY_LIMIT`: limits how many entries are copied to cache. Default is `0` (no limit).
- `ANTENNA_MIGRATION_READ_LIMIT`: limits how many entires are read from the database
in each iteration of migration. Large value may result in faster migration, but also may consume more memory. Default is `10000`.

With default options:

```sh
NODE_ENV=production pnpm run migrate
```

With custom options (feel free to only use some):

```sh
NODE_ENV=production ANTENNA_MIGRATION_SKIP=false ANTENNA_MIGRATION_COPY_LIMIT=0 ANTENNA_MIGRATION_READ_LIMIT=1000 pnpm run migrate
```

And then restart Calckey...uh... Firefish!
