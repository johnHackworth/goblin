const execa = require("execa");

(async () => {
	await execa("pnpm", ["clean"], {
		cwd: __dirname + "/../",
		stdout: process.stdout,
		stderr: process.stderr,
	});


	await execa("pnpm", ["build"], {
		cwd: __dirname + "/../",
		stdout: process.stdout,
		stderr: process.stderr,
	});

	execa("pnpm", ["dlx", "gulp", "watch"], {
		cwd: __dirname + "/../",
		stdout: process.stdout,
		stderr: process.stderr,
	});

	setTimeout(async ()=>{
		execa("pnpm", ["--filter", "backend", "watch"], {
		cwd: __dirname + "/../",
		stdout: process.stdout,
		stderr: process.stderr,
	}) }, 5);

	setTimeout(()=>{ execa("pnpm", ["--filter", "client", "watch"], {
		cwd: __dirname + "/../",
		stdout: process.stdout,
		stderr: process.stderr,
	}); }, 1);

	setTimeout(()=>{ execa("pnpm", ["--filter", "sw", "watch"], {
		cwd: __dirname + "/../",
		stdout: process.stdout,
		stderr: process.stderr,
	})}, 1);


	execa("pnpm", ["--filter", "goblin-js", "watch"], {
		cwd: __dirname + "/../",
		stdout: process.stdout,
		stderr: process.stderr,
	});

	const start = async () => {
		console.log('*******************************************************************');
		console.log('*                                                                 *');
		console.log('*                                                                 *');
		console.log('*                                                                 *');
		console.log('*                                                                 *');
		console.log('*                    starting the server                          *');
		console.log('*                                                                 *');
		console.log('*                                                                 *');
		console.log('*                                                                 *');
		console.log('*                                                                 *');
		console.log('*******************************************************************');
		try {


			await execa("pnpm", ["start"], {
				cwd: __dirname + "/../",
				stdout: process.stdout,
				stderr: process.stderr,
			});
					console.log('*******************************************************************');
		console.log('*                        server started!!!                          *');
		console.log('*******************************************************************');
		} catch (e) {
		console.log('*******************************************************************');
		console.log('*                        server crash!!!                          *');
		console.log('*******************************************************************');
			setTimeout(start, 3000);;
		}
	};

	setTimeout(start, 20000);
})();
