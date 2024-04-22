import { Notes } from "@/models/index.js";
import define from "../../define.js";
import { getNote } from "../../common/getters.js";
import { ApiError } from "../../error.js";
import { generateVisibilityQuery } from "../../common/generate-visibility-query.js";
import { generateMutedUserQuery } from "../../common/generate-muted-user-query.js";
import { makePaginationQuery } from "../../common/make-pagination-query.js";
import { generateBlockedUserQuery } from "../../common/generate-block-query.js";
import { Users } from "@/models/index.js";
import { getNoteWithAncestors } from "@/misc/note/ancestors.js"

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

export default define(meta, paramDef, async (ps, user) => {
  const note = await getNoteWithAncestors(ps.noteId, user);
  if( !note ) {
    throw new ApiError(meta.errors.noSuchNote);
  }
  return note;
});
