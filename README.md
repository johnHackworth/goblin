This is very much a work in progress.


You need:
- Node (min 18.16)
- Redis
- Postgresql
- cargo
- node-typescript
- pnpm

How to get the ball rolling:
============================


- Create your database (ex: `CREATE DATABASE firefish WITH encoding = 'UTF8';`, make sure whatever user you are going to use have access to the new db)
- Clone this repo
- Copy /.config/devenv.yml as /.config/default.yml. Change whatever values you need to change to connect to your local redis server and database.
- pnpm install
- pnpm build
- pnpm run dev <- stats the development sever
- go to http://localhost:3000 and you are done