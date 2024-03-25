# Raspbian

These are the steps I followed to create a _local_, _non-federated_ dev server for goblin.

## Environment

* Raspbian 11 (bullseye) on a Raspberry Pi 4 (4gb memory)
* Node20.x (follow a guide like https://xavier.arnaus.net/blog/install-nodejs-20-into-a-raspberry-pi-4)
* Local redis (installed via apt)
* Local postgres (installed via apt)

## A note about shell commands

Each block of shell commands is meant to be stand-alone. If you want to just do everything as the `goblin` user (which we're going to create in a moment) you can omit the `sudo -u goblin bash` lines.

## Storage

You'll need several gigs of free storage to install everything goblin needs to get running.

You'll also hate yourself if, like me, you are dumb enough to do the install on SD media.

An external SSD and an enclosure for it costs less money than you'd spend buying combo meals for four at McDonald's. (Do not try to eat the SSD, no matter how much ketchup you put on it.)

## Dependencies

Here's a partial list of apt dependencies to get things up and running. It doesn't include dependencies that I already had installed thanks to other things running on the . (Ask me how much I want to spin up a completely new Raspbian install to verify this.)

```sh
sudo apt install gcc-core g++ libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb redis postgresql nginx
npm i -g pnpm
```

## Create user and clone repository

We're going to create a special `goblin` user to isolate the goblin install. If you're asked for its home directory, specify it as `/home/goblin`.

We are going to install the app into `/etc/goblin` to isolate it from the rest of the system. (It'll be served over nginx when you do things for real.)

```sh
sudo adduser goblin
sudo bash
cd /etc
sudo git clone https://github.com/johnHackworth/goblin.git
sudo chown -R goblin:goblin goblin
```

## Getting pnpm running

The first thing you'll need to do is get `corepack` up and running so that it can get `pnpm` up and running. We'll install `corepack` underneath `/etc/goblin`.

Note that `pnpm` also needs to do some `npm` stuff, and you'll need to be able to write to a `.npm` directory in $HOME, so let's get that out of the way first:

```sh
sudo -u goblin bash
cd /etc/goblin
corepack use pnpm@8
```

If you are trying to install to a directory that's on an SD card, go get several cups of coffee and a fun YouTube playlist. You'll be here a while waiting for `corepack use` to finish.

...and then you will find the install fails halfway through! Cypress thinks that you don't satisfy its system requirements. (The Cypress devs do not think people want to use it on a Pi, so their install script doesn't recognize the `armv7` architecture. Their install script defaults to assuming any architecture it doesn't recognize is ia32.) You must fool it. Go into `node_modules/cypress/lib/util.js` and edit the `getRealArch()` function:

```javascript
async getRealArch() {
    return 'arm64';
    // and then the rest of it
}
```

Cypress will download a binary that isn't compatible with your Pi, which means you won't be able to run any tests. But you'll at least have succeeded installing pnpm.

## Installing Rust

The `packages/backend/native-utils/` directory contains, well, some native code. It needs `cargo` to be installed. The `cargo` from Raspbian isn't a recent enough version to build with, so you're going to need to install it via the Rust website. We'll install it just for the `goblin` user rather than system-wide for the moment.

```sh
sudo -u goblin bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Building goblin

Time to build!

```sh
sudo -u goblin bash
cd /etc/goblin
source /home/goblin/.cargo/env
pnpm run build
```

## Databases

Now let's get the database set up. We're going to go with `goblin` for everything (database name, username, password).

**DO NOT DO THIS IN PRODUCTION**. Even if you _think_ you know your Postgres is nailed down to prevent outside connections. Hope you enjoy your Postgres install housing the metadata for North Korean hacking teams.

```sql
CREATE USER goblin WITH PASSWORD 'goblin';
CREATE DATABASE goblin WITH encoding = 'UTF8';
GRANT ALL ON DATABASE goblin TO goblin;
```

Now run the migrate step to create the tables (and there's a lot of them):

```sh
sudo -u goblin bash
cd /etc/goblin
pnpm run migrate
```

## Cleanup

There are a few cleanup steps you should undertake, but we'll skip past them for the moment:

1. Revoke unneeded privs on the `goblin` postgres user. Once you've created the schema, you should only need to update it again when doing migrations. Day-to-day you won't need to `CREATE TABLE`, `ALTER TABLE`, etc.
2. (...anything else?)

## And now the moment you've been waiting for...

```sh
sudo -u goblin bash
cd /etc/goblin
pnpm run dev
```

Now visit `http://localhost:3000/` and either:

1. Enjoy your new dev instance _or_
2. Cut a PR to correct this guide (please)