import { Notes } from "@/models/index.js";
import type { Note } from "@/models/entities/note";
import slugify from "slugify";

const slugOptions = {
	replacement: "-",
	lower: true,
	strict: true,
	trim: true,
};

export const getNoteSlug = async (note: Note) => {
	if (note.text) {
		const onlyText = note.text
			.replace(/(<([^>]+)>)/gi, "")
			.replace(/[^a-zA-Z\s]/g, "")
			.trim()
			.split(" ")
			.slice(0, 8)
			.join(" ")
			.substr(0, 96);
		const slug = slugify(onlyText, slugOptions);
		const foundNote = await Notes.findOneBy({
			slug: slug,
			userId: note.userId,
		});
		if (!foundNote) {
			return slug;
		} else {
			return slugify(
				`${onlyText} ${Math.floor(Math.random() * 100000)}`,
				slugOptions,
			);
		}
	}
	return slugify(
		`${ Date().split(' ').slice(0,4).join(' ') } ${Math.floor(Math.random() * 100000)}`,
		slugOptions
	);
};
