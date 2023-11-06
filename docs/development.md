# 🌎 Firefish Developer Docs

## Nix Dev Environment
The Firefish repo comes with a Nix-based shell environment to help make development as easy as possible!

Please note, however, that this environment will not work on Windows outside of a WSL2 environment.

### Prerequisites

- Installed the [Nix Package Manager](https://nixos.org/download.html) (use the comman on their website)
- Installed [direnv](https://direnv.net/docs/installation.html) and added its hook to your shell. (package manager)

Once the repo is cloned to your computer, follow these next few steps inside the Firefish folder:

- Run `direnv allow`. This will build the environment and install all needed tools.
- Run `install-deps`, then `prepare-config`, to install the node dependencies and prepare the needed config files.
- In a second terminal,  run `devenv up`. This will spawn a **Redis** server, a **Postgres** server, and the **Firefish** server in dev mode.
- Once you see the Firefish banner printed in your second terminal, run `migrate` in the first.
- Once migrations finish, open http://localhost:3000 in your web browser.
- You should now see the admin user creation screen!

Note: When you want to restart a dev server, all you need to do is run `devenv up`, no other steps are necessary.

# Possible Troubles with the dev enviroment
(this doesn't have to be done under normal conditions, this is for future reference)

### direnv
If you have any trouble with `direnv allow`
Check that the contents of `.envrc` have the same version of nix-direnv that is specified here:
> nix-direnv under -> installation -> using direnv source url
> https://github.com/nix-community/nix-direnv#direnv-source_url

there should be no errors during `direnv allow`

### outdated nix packages
if `install-deps` or any subsequent command doesn't run due to versioning problems
`flake.nix` and `flake.lock` may be outdated

delete `flake.lock`, or better, run `nix flake update --extra-experimental-features flakes --extra-experimental-features nix-command`
after that, run `direnv rebuild`

if there are any errors, you might have to change `flake.nix`
(because the available options can change between versions - consider getting support in [the matrix channel](https://matrix.to/#/#firefish:matrix.fedibird.com))

### after changing a node version
in my case, i had to change the node version from 19, to 18

! before proceeding, make sure to delete all build artifacts! 
remove `node_modules` and `built` folders, and maybe `.devenv` and `.direnv` as well
manually, or run `npm cache clean --force` and `pnpm cleanall`

### Windows Subsystem for Linux
if `devenv up` terminates because of wrong folder permissions, 

create the file `/etc/wsl.conf` in your distro and add
```shell
[automount]
options = "metadata"
```

this allows `chmod` calls to actually have an effect.
the build scripts DO actually set the permissions, it just needs to work in wsl.

### devenv up
devenv up may take a looong time. (some say this is fake news, maybe it was bad luck in my case)

do not get spooked by this error:
```
> firefish@14.0.0-dev32 start /mnt/.../firefish
> pnpm --filter backend run start


> backend@ start /mnt/.../firefish/packages/backend
> pnpm node ./built/index.js

node:internal/modules/cjs/loader:1078
  throw err;
  ^

Error: Cannot find module '/mnt/.../firefish/packages/backend/built/index.js'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1075:15)
    at Module._load (node:internal/modules/cjs/loader:920:27)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:23:47 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v18.16.0
undefined
/mnt/.../firefish/packages/backend:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  backend@ start: `pnpm node ./built/index.js`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.
```

the script is designed to constantly try to start the server, while the build is still running.
this just means that the build isn't finished yet.

at some point you should see a banner that says "Firefish" in big letters -
then you're good to go and can run `migrate` (in another terminal)!

if you don't see the banner, 
and it's for some reason stuck on `Finished 'build' after 917 ms` for a view minutes,

just leave devenv running and open another terminal in the folder 
run `migrate` and then `pnpm --filter backend run start` by yourself
the server should start
