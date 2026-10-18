import * as assert from "assert";
import { readFileSync } from "fs";
import { join } from "path";
import { runInNewContext } from "vm";
import * as ts from "typescript";

describe("tooltip", () => {
	const source = ts.transpileModule(
		readFileSync(join(__dirname, "../src/directives/tooltip.ts"), "utf8"),
		{ compilerOptions: { module: ts.ModuleKind.CommonJS } },
	).outputText;

	for (const { attached, value } of [
		{ attached: false, value: "Tooltip" },
		{ attached: true, value: null },
		{ attached: true, value: "Tooltip" },
	]) {
		it(`unmounts safely with attached=${attached} and value=${value}`, () => {
			const exports = {} as { default: any };
			const tooltip = runInNewContext(`${source}\nexports.default;`, {
				exports,
				require: (id: string) => {
					if (id === "vue") return {};
					if (id === "@/scripts/touch")
						return { isTouchUsing: false };
					if (id === "@/os") return {};
					if (id === "@/router") return { mainRouter: { on() {} } };
					throw new Error(`Unexpected module: ${id}`);
				},
				document: { body: { contains: () => attached } },
				window: { clearInterval() {} },
			});
			const el = {
				setAttribute() {},
				addEventListener() {},
				_tooltipDirective_: undefined as any,
			};

			tooltip.mounted(el, { value, modifiers: {} });
			assert.doesNotThrow(() => tooltip.unmounted(el));

			if (attached && value != null) {
				let closed = false;
				el._tooltipDirective_._close = () => {
					closed = true;
				};
				tooltip.unmounted(el);
				assert.strictEqual(closed, true);
				assert.strictEqual(el._tooltipDirective_._close, null);
			}
		});
	}
});
