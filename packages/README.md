# 📦 Packages

This directory contains all of the packages Firefish uses.

- `backend`: Main backend code written in TypeScript for NodeJS
- `backend/native-utils`: Backend code written in Rust, bound to NodeJS by [NAPI-RS](https://napi.rs/)
- `client`: Web interface written in Vue3 and TypeScript
- `sw`: Web [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) written in TypeScript
- `firefish-js`: TypeScript SDK for both backend and client, also published on [NPM](https://www.npmjs.com/package/firefish-js) for public use
- `megalodon`: TypeScript library used for partial Mastodon API compatibility
