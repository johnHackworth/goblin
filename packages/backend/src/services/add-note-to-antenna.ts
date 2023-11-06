import type { Antenna } from "@/models/entities/antenna.js";
import type { Note } from "@/models/entities/note.js";
import { genId } from "@/misc/gen-id.js";
import { redisClient } from "@/db/redis.js";
import { publishAntennaStream } from "@/services/stream.js";
import type { User } from "@/models/entities/user.js";

export async function addNoteToAntenna(
	antenna: Antenna,
	note: Note,
	_noteUser: { id: User["id"] },
) {
	redisClient.xadd(
		`antennaTimeline:${antenna.id}`,
		"MAXLEN",
		"~",
		"200",
		"*",
		"note",
		note.id,
	);

	publishAntennaStream(antenna.id, "note", note);
}
