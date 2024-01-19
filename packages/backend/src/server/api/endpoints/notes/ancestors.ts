import { Notes } from "@/models/index.js";
import define from "../../define.js";
import { getNote } from "../../common/getters.js";
import { ApiError } from "../../error.js";
import { generateVisibilityQuery } from "../../common/generate-visibility-query.js";
import { generateMutedUserQuery } from "../../common/generate-muted-user-query.js";
import { makePaginationQuery } from "../../common/make-pagination-query.js";
import { generateBlockedUserQuery } from "../../common/generate-block-query.js";
import { Users } from "@/models/index.js";

export const meta = {
  tags: ["notes"],

  requireCredential: false,
  requireCredentialPrivateMode: false,

  res: {
    type: "object",
    optional: false,
    nullable: true,
  },

  errors: {
    noSuchNote: {
      message: "No such note.",
      code: "NO_SUCH_NOTE",
      id: "12908022-2e21-46cd-ba6a-3edaf6093f46",
    },
  },
} as const;

export const paramDef = {
  type: "object",
  properties: {
    noteId: { type: "string", format: "misskey:id" },
  },
  required: ["noteId"],
} as const;

const getNoteWithAncestors = async (noteId, user) => {
  const note = await getNote(noteId, user);
  if(note) {
    if (note.replyId) {
      const ancestor = await getNoteWithAncestors(note.replyId, user);
      return { ...note, reply: ancestor } ;
    }
    return { ...note, user: await Users.pack(note.userId) };

  }

  return null;
}

export default define(meta, paramDef, async (ps, user) => {
  const note = await getNote(ps.noteId, user).catch((err) => {
    if (err.id === "9725d0ce-ba28-4dde-95a7-2cbb2c15de24")
      throw new ApiError(meta.errors.noSuchNote);
    throw err;
  });

  if(note.replyId) {
    return { ...note, reply: await getNoteWithAncestors(note.replyId, user) };
  }

  return note;
});
