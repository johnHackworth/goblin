type KaTeXMacro = {
	args: number;
	rule: (string | number)[];
};

function parseSingleKaTeXMacro(src: string): [string, KaTeXMacro] {
	const invalid: [string, KaTeXMacro] = ["", { args: 0, rule: [] }];

	const skipSpaces = (pos: number): number => {
		while (src[pos] === " ") ++pos;
		return pos;
	};

	if (!src.startsWith("\\newcommand") || src.slice(-1) !== "}") return invalid;

	// current index we are checking (= "\\newcommand".length)
	let currentPos = 11;
	currentPos = skipSpaces(currentPos);

	// parse {\name}, (\name), or [\name]
	let bracket: string;
	if (src[currentPos] === "{") bracket = "{}";
	else if (src[currentPos] === "(") bracket = "()";
	else if (src[currentPos] === "[") bracket = "[]";
	else return invalid;

	++currentPos;
	currentPos = skipSpaces(currentPos);

	if (src[currentPos] !== "\\") return invalid;

	const closeNameBracketPos: number = src.indexOf(bracket[1], currentPos);
	if (closeNameBracketPos === -1) return invalid;

	const name: string = src.slice(currentPos + 1, closeNameBracketPos).trim();
	if (!/^[a-zA-Z]+$/.test(name)) return invalid;

	currentPos = skipSpaces(closeNameBracketPos + 1);

	let macro: KaTeXMacro = { args: 0, rule: [] };

	// parse [number of arguments] (optional)
	if (src[currentPos] === "[") {
		const closeArgsBracketPos: number = src.indexOf("]", currentPos);
		macro.args = Number(src.slice(currentPos + 1, closeArgsBracketPos).trim());
		currentPos = closeArgsBracketPos + 1;

		if (Number.isNaN(macro.args) || macro.args < 0) return invalid;
	} else if (src[currentPos] === "{") {
		macro.args = 0;
	} else {
		return invalid;
	}

	currentPos = skipSpaces(currentPos);

	// parse {rule}
	if (src[currentPos] !== "{") return invalid;

	++currentPos;
	currentPos = skipSpaces(currentPos);

	while (currentPos < src.length - 1) {
		let numbersignPos = -1;
		let isEscaped = false;

		for (let i = currentPos; i < src.length - 1; ++i) {
			if (src[i] !== "\\" && src[i] !== "#") {
				isEscaped = false;
				continue;
			}
			if (src[i] === "\\") {
				isEscaped = !isEscaped;
				continue;
			}
			if (!isEscaped && src[i] === "#") {
				numbersignPos = i;
				break;
			}
		}
		if (numbersignPos === -1) {
			macro.rule.push(src.slice(currentPos, -1));
			break;
		}

		const argIndexEndPos =
			src.slice(numbersignPos + 1).search(/[^\d]/) + numbersignPos;
		const argIndex: number = Number(
			src.slice(numbersignPos + 1, argIndexEndPos + 1),
		);

		if (Number.isNaN(argIndex) || argIndex < 1 || macro.args < argIndex)
			return invalid;

		if (currentPos !== numbersignPos)
			macro.rule.push(src.slice(currentPos, numbersignPos));
		macro.rule.push(argIndex);

		currentPos = argIndexEndPos + 1;
	}

	if (macro.args === 0) return [name, macro];
	else return [name + bracket[0], macro];
}

export function parseKaTeXMacros(src: string): string {
	let result: { [name: string]: KaTeXMacro } = {};

	for (const s of src.split("\n")) {
		const [name, macro]: [string, KaTeXMacro] = parseSingleKaTeXMacro(s.trim());
		if (name !== "") result[name] = macro;
	}

	return JSON.stringify(result);
}

// returns [expanded text, whether something is expanded, how many times we can expand more]
// the boolean value is used for multi-pass expansions (macros can expand to other macros)
function expandKaTeXMacroOnce(
	src: string,
	macros: { [name: string]: KaTeXMacro },
	maxNumberOfExpansions: number,
): [string, boolean, number] {
	const bracketKinds = 3;
	const openBracketId: { [bracket: string]: number } = {
		"(": 0,
		"{": 1,
		"[": 2,
	};
	const closeBracketId: { [bracket: string]: number } = {
		")": 0,
		"}": 1,
		"]": 2,
	};
	const openBracketFromId = ["(", "{", "["];
	const closeBracketFromId = [")", "}", "]"];

	// mappings from open brackets to their corresponding close brackets
	type BracketMapping = { [openBracketPos: number]: number };

	const bracketMapping = ((): BracketMapping => {
		let result: BracketMapping = {};
		const n = src.length;

		let depths = new Array<number>(bracketKinds).fill(0); // current bracket depth for "()", "{}", and "[]"
		let buffer = Array.from(Array<number[]>(bracketKinds), () =>
			Array<number>(n),
		);

		let isEscaped = false;

		for (let i = 0; i < n; ++i) {
			if (
				!isEscaped &&
				src[i] === "\\" &&
				i + 1 < n &&
				["{", "}", "\\"].includes(src[i + 1])
			) {
				isEscaped = true;
				continue;
			}
			if (
				isEscaped ||
				(src[i] !== "\\" &&
					!openBracketFromId.includes(src[i]) &&
					!closeBracketFromId.includes(src[i]))
			) {
				isEscaped = false;
				continue;
			}
			isEscaped = false;

			if (openBracketFromId.includes(src[i])) {
				const id: number = openBracketId[src[i]];
				buffer[id][depths[id]] = i;
				++depths[id];
			} else if (closeBracketFromId.includes(src[i])) {
				const id: number = closeBracketId[src[i]];
				if (depths[id] > 0) {
					--depths[id];
					result[buffer[id][depths[id]]] = i;
				}
			}
		}

		return result;
	})();

	function expandSingleKaTeXMacro(
		expandedArgs: string[],
		macroName: string,
	): string {
		let result = "";
		for (const block of macros[macroName].rule) {
			if (typeof block === "string") result += block;
			else result += expandedArgs[block - 1];
		}
		return result;
	}

	// only expand src.slice(beginPos, endPos)
	function expandKaTeXMacroImpl(
		beginPos: number,
		endPos: number,
	): [string, boolean] {
		if (endPos <= beginPos) return ["", false];

		const raw: string = src.slice(beginPos, endPos);
		const fallback: string = raw; // returned for invalid inputs or too many expansions

		if (maxNumberOfExpansions <= 0) return [fallback, false];
		--maxNumberOfExpansions;

		// search for a custom macro
		let checkedPos = beginPos - 1;
		let macroName = "";
		let macroBackslashPos = 0;

		// for macros w/o args: unused
		//            w/  args: the first open bracket ("(", "{", or "[") after cmd name
		let macroArgBeginPos = 0;

		// for macros w/o args: the end of cmd name
		//            w/  args: the closing bracket of the last arg
		let macroArgEndPos = 0;

		while (checkedPos < endPos) {
			checkedPos = src.indexOf("\\", checkedPos + 1);

			// there is no macro to expand
			if (checkedPos === -1) return [raw, false];

			// is it a custom macro?
			let nonAlphaPos =
				src.slice(checkedPos + 1).search(/[^A-Za-z]/) + checkedPos + 1;

			if (nonAlphaPos === checkedPos) nonAlphaPos = endPos;

			let macroNameCandidate = src.slice(checkedPos + 1, nonAlphaPos);
			if (macros.hasOwnProperty(macroNameCandidate)) {
				// this is a custom macro without args
				macroBackslashPos = checkedPos;
				macroArgEndPos = nonAlphaPos - 1;
				macroName = macroNameCandidate;
				break;
			}

			let nextOpenBracketPos = endPos;
			for (let i = 0; i < bracketKinds; ++i) {
				const pos = src.indexOf(openBracketFromId[i], checkedPos + 1);
				if (pos !== -1 && pos < nextOpenBracketPos) nextOpenBracketPos = pos;
			}

			if (nextOpenBracketPos === endPos) continue; // there is no open bracket

			macroNameCandidate += src[nextOpenBracketPos];

			if (macros.hasOwnProperty(macroNameCandidate)) {
				macroBackslashPos = checkedPos;
				macroArgBeginPos = nextOpenBracketPos;
				macroArgEndPos = nextOpenBracketPos; // to search the first arg from here
				macroName = macroNameCandidate;
				break;
			}
		}

		if (!macros.hasOwnProperty(macroName)) return [fallback, false];

		const numArgs: number = macros[macroName].args;
		const openBracket: string = macroName.slice(-1);

		let expandedArgs = new Array<string>(numArgs);

		for (let i = 0; i < numArgs; ++i) {
			// find the first open bracket after what we've searched
			const nextOpenBracketPos = src.indexOf(openBracket, macroArgEndPos);
			if (nextOpenBracketPos === -1) return [fallback, false]; // not enough arguments are provided
			if (!bracketMapping[nextOpenBracketPos]) return [fallback, false]; // found open bracket doesn't correspond to any close bracket

			macroArgEndPos = bracketMapping[nextOpenBracketPos];
			expandedArgs[i] = expandKaTeXMacroImpl(
				nextOpenBracketPos + 1,
				macroArgEndPos,
			)[0];
		}

		return [
			src.slice(beginPos, macroBackslashPos) +
				expandSingleKaTeXMacro(expandedArgs, macroName) +
				expandKaTeXMacroImpl(macroArgEndPos + 1, endPos)[0],
			true,
		];
	}

	const [expandedText, expandedFlag]: [string, boolean] = expandKaTeXMacroImpl(
		0,
		src.length,
	);
	return [expandedText, expandedFlag, maxNumberOfExpansions];
}

export function expandKaTeXMacro(
	src: string,
	macrosAsJSONString: string,
	maxNumberOfExpansions: number,
): string {
	const macros = JSON.parse(macrosAsJSONString);

	let expandMore = true;

	while (expandMore && 0 < maxNumberOfExpansions)
		[src, expandMore, maxNumberOfExpansions] = expandKaTeXMacroOnce(
			src,
			macros,
			maxNumberOfExpansions,
		);

	return src;
}
