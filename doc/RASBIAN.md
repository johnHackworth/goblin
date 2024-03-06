# Raspbian

These are the steps I followed to create a _local_, _non-federated_ dev server for goblin.

## Environment

* Raspbian 11 (bullseye) on a Raspberry Pi 4 (4gb memory)
* Node20.x installed via blah blah insert URL of the guide I followed
* Local redis (installed via apt)
* Local postgres (installed via apt)

## Storage

You'll need several gigs of free storage to install everything goblin needs to get running.

You'll also hate yourself if, like me, you are dumb enough to do the install on SD media.

An external SSD and an enclosure for it costs less money than you'd spend buying combo meals for four at McDonald's. (Do not try to eat the SSD, no matter how much ketchup you put on it.)

## Dependencies

Here's the list of dependencies that I _think_ are necessary to get things up and running. It probably doesn't include dependencies that I already had installed from other stuff I've been doing on my system. (Ask me how much I want to spin up a completely new Raspbian install to verify this.)

```sh
sudo apt install gcc-core g++ libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb redis postgresql
npm i -g pnpm
```

## Create user and clone repository

We're going to create a special `goblin` user to isolate the goblin install. When you're asked for its home directory, specify it as `/etc/goblin`.

```sh
cd /etc
sudo git clone https://github.com/johnHackworth/goblin.git
sudo chown -R www-data:www-data goblin
```

In a future version of this guide, we will put everything under this `goblin` user, but for the moment we'll actually use `www-data` as the user that runs the server. (I'm lazy.) Let's get that set up now anyway so that we're ready for later:

```sh
sudo adduser goblin
```

## Getting pnpm running

The first thing you'll need to do is get `corepack` up and running so that it can get `pnpm` up and running. We'll install `corepack` underneath `/etc/goblin`.

Note that `pnpm` also needs to do some `npm` stuff, and you'll need to be able to write to a `.npm` directory in $HOME, so let's get that out of the way first:

```sh
sudo mkdir /var/www/.npm
sudo chown www-data:www-data /var/www/.npm
```

Now let's get pnpm installed:

```sh
corepack use pnpm@8
npm i pnpm
```

If you are trying to install to a directory that's on an SD card, go get several cups of coffee and a fun YouTube playlist. You'll be here a while waiting for `corepack use` to finish.

And then you will find it fails halfway through! Cypress thinks that you don't satisfy its system requirements. (The Cypress devs do not think people want to use it on a Pi, so their install script doesn't recognize the `armv7` architecture. Their install script defaults to assuming any architecture it doesn't recognize is IA32.) You must fool it. Go into `node_modules/cypress/lib/util.js` and edit the `getRealArch()` function:

```javascript
async getRealArch() {
    return 'arm64';
    // and then the rest of it
}
```

Cypress downloads a binary that isn't compatible with your Pi, which means you won't be able to run any tests.

## Getting native-utils to build

The `packages/backend/native-utils/` directory contains, well, some native code. It needs `cargo` to be installed.

The `cargo` from Raspbian is out of base, so you're going to need to install it via the Rust website. We'll create a few directories that the install script expects to be able to write stuff in. (Remember that by default `/var/www` is owned by root, so the `www-data` user can't create the directories itself.)

```sh
sudo mkdir /var/www/.cargo
sudo chown www-data:www-data /var/www/.cargo
sudo mkdir /var/www/.rustup
sudo chown www-data:www-data /var/www/.rustup
sudo -u www-data bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Databases

Let's get the database set up. We're going to go with `goblin` for everything (database name, username, password).

**DO NOT DO THIS IN PRODUCTION**. Even if you think you know your Postgres is nailed down to prevent outside connections. Hope you enjoy your Postgres install housing the metadata for North Korean hacking teams.

```sql
CREATE USER goblin WITH PASSWORD 'goblin';
CREATE DATABASE goblin WITH encoding = 'UTF8';
GRANT ALL ON DATABASE goblin TO goblin;
```

Now run the migrate step to create the tables (and there's a lot of them):

```sh
pnpm run migrate
```

Now that these tables have been created, the `goblin` user has no more need to CREATE.

```sql
REVOKE CREATE ON DATABASE goblin FROM goblin;
```

(This will probably break something when we update and need to do a new migration, but that's a problem for Future Homer.)