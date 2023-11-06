<div align="center">
<a href="https://joinfirefish.org/">
	<img src="./title.svg" alt="Firefish logo" style="border-radius:50%" width="400"/>
</a>

**🌎 **[Firefish](https://joinfirefish.org/)** is an open source, decentralized social media platform that's free forever! 🚀**

[![no github badge](https://nogithub.codeberg.page/badge.svg)](https://nogithub.codeberg.page/)
<!-- [![status badge](https://ci.codeberg.org/api/badges/firefish/firefish/status.svg)](https://ci.codeberg.org/firefish/firefish) -->
[![opencollective badge](https://opencollective.com/firefish/tiers/badge.svg)](https://opencollective.com/Firefish)
[![liberapay badge](https://img.shields.io/liberapay/receives/ThatOneCalculator?logo=liberapay)](https://liberapay.com/ThatOneCalculator)
[![translate-badge](https://hosted.weblate.org/widgets/firefish/-/svg-badge.svg)](https://hosted.weblate.org/engage/firefish/)
<!-- [![docker badge](https://img.shields.io/docker/pulls/thatonecalculator/firefish?logo=docker)](https://hub.docker.com/r/thatonecalculator/firefish) -->
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](./CODE_OF_CONDUCT.md)

</div>

<div>

<img src="./animated.svg" align="right" height="320px"/>

# ✨ About Firefish

- Firefish is based off of Misskey, a powerful microblogging server on ActivityPub with features such as emoji reactions, a customizable web UI, rich chatting, and much more!
- Firefish adds many quality of life changes and bug fixes for users and server admins alike.
- Read **[this document](./FIREFISH.md)** all for current and future differences.
- Notable differences:
  - Improved UI/UX (especially on mobile)
  - Post editing
  - Content importing
  - Improved notifications
  - Improved server security
  - Improved accessibility
  - Improved threads
  - Recommended Servers timeline
  - OCR image captioning
  - New and improved Groups
  - Better intro tutorial
  - Compatibility with Mastodon clients/apps
  - Backfill user information
  - Advanced search
  - Many more user and admin settings
  - [So much more!](./FIREFISH.md)

</div>

<div style="clear: both;"></div>

# 🥂 Links

### Want to get involved? Great!

- If you have the means to, [donations](https://opencollective.com/Firefish) are a great way to keep us going.
- If you know how to program in TypeScript, Vue, or Rust, read the [contributing](./CONTRIBUTING.md) document.
- If you know a non-English language, translating Firefish on [Weblate](https://hosted.weblate.org/engage/firefish/) help bring Firefish to more people. No technical experience needed!
- Want to write/report about us, have any professional inquiries, or just have questions to ask? Contact us [here!](https://joinfirefish.org/contact/)

### All links

- 🌐 Homepage: <https://joinfirefish.org>
- 💸 Donations:
  - OpenCollective: <https://opencollective.com/Firefish>
  - Liberapay: <https://liberapay.com/ThatOneCalculator>
  - Donate publicly to get your name on the Patron list!
- 🚢 Flagship server: <https://firefish.social>
- 💁 Matrix support room: <https://matrix.to/#/#firefish:matrix.fedibird.com>
- 📣 Official account: <https://i.firefish.cloud/@firefish>
- 📜 Server list: <https://joinfirefish.org/join>
- ✍️ Weblate: <https://hosted.weblate.org/engage/firefish/>
- ️️📬 Contact: <https://joinfirefish.org/contact/>

# 🌠 Getting started

Want to just join a Firefish server? View the list here, pick one, and join:

### https://joinfirefish.org/join

---

Want to make your own? Keep reading!

This guide will work for both **starting from scratch** and **migrating from Misskey**.

## 🔰 Easy installers

If you have access to a server that supports one of the sources below, I recommend you use it! Note that these methods *won't* allow you to migrate from Misskey without manual intervention.

<!-- [![Install on the Arch User Repository](https://pool.jortage.com/voringme/misskey/ba2a5c07-f078-43f1-8483-2e01acca9c40.png)](https://aur.archlinux.org/packages/firefish)　　 -->

[![Install on Ubuntu](https://pool.jortage.com/voringme/misskey/3b62a443-1b44-45cf-8f9e-f1c588f803ed.png)](https://gitlab.prometheus.systems/firefish/ubuntu-bash-install)　　[![Install Firefish with YunoHost](https://install-app.yunohost.org/install-with-yunohost.svg)](https://install-app.yunohost.org/?app=firefish)

## 🛳️ Containerization

- [🐳 How to run Firefish with Docker](https://git.joinfirefish.org/firefish/firefish/-/blob/develop/docs/docker.md)
- [🛞 How to run Firefish with Kubernetes/Helm](https://git.joinfirefish.org/firefish/firefish/-/blob/develop/docs/kubernetes.md)

## 🧑‍💻 Dependencies

- 🐢 At least [NodeJS](https://nodejs.org/en/) v18.16.0 (v20 recommended)
- 🐘 At least [PostgreSQL](https://www.postgresql.org/) v12 (v14 recommended)
- 🍱 At least [Redis](https://redis.io/) v6 (v7 recommended)
- Web Proxy (one of the following)
  - 🍀 Nginx (recommended)
  - 🦦 Caddy
  - 🪶 Apache
- ⚡ [libvips](https://www.libvips.org/)

### 😗 Optional dependencies

- [FFmpeg](https://ffmpeg.org/) for video transcoding
- Full text search (one of the following)
  - 🦔 [Sonic](https://crates.io/crates/sonic-server)
  - [MeiliSearch](https://www.meilisearch.com/)
  - [ElasticSearch](https://www.elastic.co/elasticsearch/)
- Caching server (one of the following)
  - 🐲 [DragonflyDB](https://www.dragonflydb.io/) (recommended)
  - 👻 [KeyDB](https://keydb.dev/)
  - 🍱 Another [Redis](https://redis.io/) server

### 🏗️ Build dependencies

- 🦀 At least [Rust](https://www.rust-lang.org/) v1.68.0
- 🦬 C/C++ compiler & build tools
  - `build-essential` on Debian/Ubuntu Linux
  - `base-devel` on Arch Linux
- 🐍 [Python 3](https://www.python.org/)

## 👀 Get folder ready

```sh
git clone https://git.joinfirefish.org/firefish/firefish.git
cd firefish/
```

> **Note**
> By default, you're on the develop branch. Run `git checkout main` or `git checkout beta` to switch to the Main/Beta branches.

## 📩 Install dependencies

```sh
# nvm install 19 && nvm use 19
corepack enable
corepack prepare pnpm@latest --activate
# To build without TensorFlow, append --no-optional
pnpm i # --no-optional
```

### pm2

To install pm2 run:

```
npm i -g pm2
pm2 install pm2-logrotate
```

> **Note**
> [`pm2-logrotate`](https://github.com/keymetrics/pm2-logrotate/blob/master/README.md) ensures that log files don't infinitely gather size, as Firefish produces a lot of logs.

## 🐘 Create database

In PostgreSQL (`psql`), run the following command:

```sql
CREATE DATABASE firefish WITH encoding = 'UTF8';
```

or run the following from the command line:

```sh
psql postgres -c "create database firefish with encoding = 'UTF8';"
```

In Firefish's directory, fill out the `db` section of `.config/default.yml` with the correct information, where the `db` key is `firefish`.

## 💰 Caching server

If you experience a lot of traffic, it's a good idea to set up another Redis-compatible caching server. If you don't set one one up, it'll fall back to the mandatory Redis server. DragonflyDB is the recommended option due to its unrivaled performance and ease of use.

## 🔎 Set up search

### 🦔 Sonic

Sonic is better suited for self hosters with smaller deployments. It uses almost no resources, barely any any disk space, and is relatively fast.

Follow sonic's [installation guide](https://github.com/valeriansaliou/sonic#installation)

> **Note**
> If you use IPv4: in Sonic's directory, edit the `config.cfg` file to change `inet` to `"0.0.0.0:1491"`.

In Firefish's directory, fill out the `sonic` section of `.config/default.yml` with the correct information.

### Meilisearch

Meilisearch is better suited for larger deployments. It's faster but uses far more resources and disk space.

Follow Meilisearch's [quick start guide](https://www.meilisearch.com/docs/learn/getting_started/quick_start)

In Firefish's directory, fill out the `meilisearch` section of `.config/default.yml` with the correct information.

### ElasticSearch

Please don't use ElasticSearch unless you already have an ElasticSearch setup and want to continue using it for Firefish. ElasticSearch is slow, heavy, and offers very few benefits over Sonic/Meilisearch.

## 💅 Customize

- To add custom CSS for all users, edit `./custom/assets/instance.css`.
- To add static assets (such as images for the splash screen), place them in the `./custom/assets/` directory. They'll then be available on `https://yourserver.tld/static-assets/filename.ext`.
- To add custom locales, place them in the `./custom/locales/` directory. If you name your custom locale the same as an existing locale, it will overwrite it. If you give it a unique name, it will be added to the list. Also make sure that the first part of the filename matches the locale you're basing it on. (Example: `en-FOO.yml`)
- To add custom error images, place them in the `./custom/assets/badges` directory, replacing the files already there.
- To add custom sounds, place only mp3 files in the `./custom/assets/sounds` directory.
- To update custom assets without rebuilding, just run `pnpm run gulp`.

## 🧑‍🔬 Configuring a new server

- Run `cp .config/example.yml .config/default.yml`
- Edit `.config/default.yml`, making sure to fill out required fields.
- Also copy and edit `.config/docker_example.env` to `.config/docker.env` if you're using Docker.

## 🚚 Migrating from Misskey/FoundKey to Firefish

For migrating from Misskey v13, Misskey v12, and FoundKey, read [this document](https://git.joinfirefish.org/firefish/firefish/-/blob/develop/docs/migrate.md).

## 🌐 Web proxy

### 🍀 Nginx (recommended)

- Run `sudo cp ./firefish.nginx.conf /etc/nginx/sites-available/ && cd /etc/nginx/sites-available/`
- Edit `firefish.nginx.conf` to reflect your server properly
- Run `sudo ln -s ./firefish.nginx.conf ../sites-enabled/firefish.nginx.conf`
- Run `sudo nginx -t` to validate that the config is valid, then restart the NGINX service.

### 🦦 Caddy

- Add the following block to your `Caddyfile`, replacing `example.tld` with your own domain:
```caddy
example.tld {
    reverse_proxy http://127.0.0.1:3000
}
```
- Reload your caddy configuration

### 🪶 Apache

> **Warning**
> Apache has some known problems with Firefish. Only use it if you have to.

- Run `sudo cp ./firefish.apache.conf /etc/apache2/sites-available/ && cd /etc/apache2/sites-available/`
- Edit `firefish.apache.conf` to reflect your server properly
- Run `sudo a2ensite firefish.apache` to enable the site
- Run `sudo service apache2 restart` to reload apache2 configuration
## 🚀 Build and launch!

### 🐢 NodeJS + pm2

#### `git pull` and run these steps to update Firefish in the future!

```sh
# git pull
pnpm install
NODE_ENV=production pnpm run build && pnpm run migrate
pm2 start "NODE_ENV=production pnpm run start" --name Firefish
```

## 😉 Tips & Tricks

- When editing the config file, please don't fill out the settings at the bottom. They're designed *only* for managed hosting, not self hosting. Those settings are much better off being set in Firefish's control panel.
- Port 3000 (used in the default config) might be already used on your server for something else. To find an open port for Firefish, run `for p in {3000..4000}; do ss -tlnH | tr -s ' ' | cut -d" " -sf4 | grep -q "${p}$" || echo "${p}"; done | head -n 1`. Replace 3000 with the minimum port and 4000 with the maximum port if you need it.
- I'd recommend you use a S3 Bucket/CDN for Object Storage, especially if you use Docker.
- I'd ***strongly*** recommend against using CloudFlare, but if you do, make sure to turn code minification off.
- For push notifications, run `npx web-push generate-vapid-keys`, then put the public and private keys into Control Panel > General > ServiceWorker.
- For translations, make a [DeepL](https://deepl.com) account and generate an API key, then put it into Control Panel > General > DeepL Translation.
- To add another admin account:
  - Go to the user's page > 3 Dots > About > Moderation > turn on "Moderator"
  - Go back to Overview > click the clipboard icon next to the ID
  - Run `psql -d firefish` (or whatever the database name is)
  - Run `UPDATE "user" SET "isAdmin" = true WHERE id='999999';` (replace `999999` with the copied ID)
  - Restart your Firefish server
