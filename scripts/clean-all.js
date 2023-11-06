const fs = require("node:fs");
const execa = require("execa");
const { join } = require("node:path");

(async () => {
	fs.rmSync(join(__dirname, "/../packages/backend/built"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/backend/node_modules"), {
		recursive: true,
		force: true,
	});

	fs.rmSync(join(__dirname, "/../packages/backend/native-utils/built"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/backend/native-utils/node_modules"), {
		recursive: true,
		force: true,
	});

	fs.rmSync(join(__dirname, "/../packages/client/built"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/client/node_modules"), {
		recursive: true,
		force: true,
	});

	fs.rmSync(join(__dirname, "/../packages/sw/built"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/sw/node_modules"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/firefish-js/built"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/firefish-js/node_modules"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/megalodon/lib"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/megalodon/node_modules"), {
		recursive: true,
		force: true,
	});

	fs.rmSync(join(__dirname, "/../built"), { recursive: true, force: true });
	fs.rmSync(join(__dirname, "/../node_modules"), {
		recursive: true,
		force: true,
	});

	execa("pnpm", ["store", "prune"], {
		cwd: join(__dirname, "/../"),
		stdio: "inherit",
	});

	execa("cargo", ["clean"], {
		cwd: join(__dirname, "/../packages/backend/native-utils"),
		stdio: "inherit",
	});
})();
