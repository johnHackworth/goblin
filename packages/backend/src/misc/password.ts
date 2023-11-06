import bcrypt from "bcryptjs";
import * as argon2 from "argon2";

export async function hashPassword(password: string): Promise<string> {
	return argon2.hash(password);
}

export async function comparePassword(
	password: string,
	hash: string,
): Promise<boolean> {
	if (isOldAlgorithm(hash)) return bcrypt.compare(password, hash);

	return argon2.verify(hash, password);
}

export function isOldAlgorithm(hash: string): boolean {
	// bcrypt hashes start with $2[ab]$
	return hash.startsWith("$2");
}
