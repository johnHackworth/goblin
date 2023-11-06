export class noteRepliesFunction1658656633972 {
	name = "noteRepliesFunction1658656633972";

	async up(queryRunner) {
		await queryRunner.query(`
			CREATE OR REPLACE FUNCTION note_replies(start_id varchar, max_depth integer, max_breadth integer) RETURNS TABLE (id VARCHAR) AS
			$$
				SELECT DISTINCT id FROM (
					WITH RECURSIVE tree (id, ancestors, depth) AS (
						SELECT start_id, '{}'::VARCHAR[], 0
					UNION
						SELECT
							note.id,
							CASE
								WHEN note."replyId" = tree.id THEN tree.ancestors || note."replyId"
								ELSE tree.ancestors || note."renoteId"
							END,
							depth + 1
						FROM note, tree
						WHERE (
							note."replyId" = tree.id
							OR
							(
								-- get renotes but not pure renotes
								note."renoteId" = tree.id
								AND
								(
									note.text IS NOT NULL
									OR
									CARDINALITY(note."fileIds") != 0
									OR
									note."hasPoll" = TRUE
								)
							)
						) AND depth < max_depth
					)
					SELECT
						id,
						-- apply the limit per node
						row_number() OVER (PARTITION BY ancestors[array_upper(ancestors, 1)]) AS nth_child
					FROM tree
					WHERE depth > 0
				) AS recursive WHERE nth_child < max_breadth
			$$
			LANGUAGE SQL
		`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP FUNCTION note_replies`);
	}
}
