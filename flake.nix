{
	description = "Firefish development flake";

	inputs = {
		nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
		# Flake Parts framework(https://flake.parts)
		flake-parts.url = "github:hercules-ci/flake-parts";
		# Devenv for better devShells(https://devenv.sh)
		devenv.url = "github:cachix/devenv";
		# Fenix for rust development
		fenix.url = "github:nix-community/fenix";
		fenix.inputs.nixpkgs.follows = "nixpkgs";
	};
	outputs = inputs@{ flake-parts, ... }:
		flake-parts.lib.mkFlake { inherit inputs; } {
			imports = [
				inputs.devenv.flakeModule
			];

			# Define the systems that this works on. Only tested with x66_64-linux, add more if you test and it works.
			systems = [
				"x86_64-linux"
			];
			# Expose these attributes for every system defined above.
			perSystem = { config, pkgs, ... }: {
				# Devenv shells
				devenv = {
					shells = {
						# The default shell, used by nix-direnv
						default = {
							name = "firefish-dev-shell";
							# Add additional packages to our environment
							packages = [
								pkgs.nodePackages.pnpm

								pkgs.python3
							];
							# No need to warn on a new version, we'll update as needed.
							devenv.warnOnNewVersion = false;
							# Enable typescript support
							languages.typescript.enable = true;
							# Enable javascript for NPM and PNPM
							languages.javascript.enable = true;
							languages.javascript.package = pkgs.nodejs_18;
							# Enable stable Rust for the backend
							languages.rust.enable = true;
							languages.rust.version = "stable";
							processes = {
								dev-server.exec = "pnpm run dev";
							};
							scripts = {
								build.exec = "pnpm run build";
								clean.exec = "pnpm run clean";
								clear-state.exec = "rm -rf .devenv/state/redis .devenv/state/postgres";
								format.exec = "pnpm run format";
								install-deps.exec = "pnpm install";
								migrate.exec = "pnpm run migrate";
								prepare-config.exec = "cp .config/devenv.yml .config/default.yml";
							};
							services = {
								postgres = {
									enable = true;
									package = pkgs.postgresql_12;
									initialDatabases = [{
										name = "firefish";
									}];
									initialScript = ''
										CREATE USER firefish WITH PASSWORD 'firefish';
										ALTER USER firefish WITH SUPERUSER;
										GRANT ALL ON DATABASE firefish TO firefish;
									'';
									listen_addresses = "127.0.0.1";
									port = 5432;
								};
								redis = {
									enable = true;
									bind = "127.0.0.1";
									port = 6379;
								};
							};
						};
					};
				};
			};
		};
}
