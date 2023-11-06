import { db } from "@/db/postgre.js";
import { Antenna } from "@/models/entities/antenna.js";
import {
	NativeAntennaSchema,
	nativePackAntennaById,
} from "native-utils/built/index.js";

export const AntennaRepository = db.getRepository(Antenna).extend({
	async pack(src: Antenna["id"] | Antenna): Promise<NativeAntennaSchema> {
		const id = typeof src === "object" ? src.id : src;

		return await nativePackAntennaById(id);
	},
});
