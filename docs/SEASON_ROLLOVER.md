# CoachIQ season rollover

CoachIQ preserves historical program records and prepares a new current-season
view instead of deleting the prior season. The workflow requires a read-only
preview before its protected final action.

## Preview behavior

Staff with **Manage settings** can open **Settings → Season rollover preview** and
enter the proposed new season. The preview reports:

- current and proposed seasons;
- schema version 1 to version 2 preparation;
- row counts that will be preserved;
- sheets requiring a `Season` column and backfill;
- active players, proposed promotions, proposed archives, and unchanged players;
- backup and System Health blockers.

Building a preview performs no writes. It does not create a backup, add a column,
change Current Season, update a player, reset points, clear a sheet, create a
trigger, or run a migration.

## Player options

- **Promote grades 9–11** proposes `9 → 10`, `10 → 11`, and `11 → 12`.
- **Archive Grade 12 players** proposes changing their status to `Archived`.
- Non-numeric grade values remain unchanged.
- Both options are explicit and may be turned off before previewing.

## Schema version 2 plan

Schema version 2 will add and backfill `Season` ownership for:

- Sessions;
- Practice Evaluations;
- Culture Points;
- Player Season Stats; and
- Games.

The protected migration is idempotent, permission-protected, locked against
concurrent writes, preceded by a successful safety backup, audited, and blocked
when System Health reports an error. It adds a missing `Season` column and fills
only blank season values with Current Season. Existing populated season values are
never overwritten.

The schema migration does not change Current Season, apply grade promotions,
archive players, reset totals, or delete operational rows.

## Protected final rollover

After schema version 2 is ready, the preview exposes **Start new season**. The
server verifies settings permission, the preview's Current Season, schema health,
required `Season` columns, and daily backup protection again. It then acquires a
script lock and creates a safety backup before making any roster change.

The final action applies only the previewed grade/status rules, changes Current
Season, clears short-lived server snapshots, and writes an audit entry. Sessions,
evaluations, points, games, and season-stat history are never deleted or reset.
Submitting the same request again is rejected because its expected Current Season
no longer matches.

## Current-season isolation

After schema version 2, normal operational views use Current Season records by
default. This includes Dashboard metrics, Panther Points and Leaderboard,
attendance, player evaluation history and trends, session lists and the active
session, Program Intelligence, and Live Game plans/reports/trends. Player Season
Stats are also read and updated within Current Season.

Schema-1 workbooks without a `Season` column remain readable until migration. In a
migrated workbook, a blank or different Season value is not treated as current.
Historical records remain stored for a future explicit season-history selector.

## Read-only season history

Staff with **Manage settings** can use **Settings → Season history** to select any
season found in season-owned records. The viewer reports preserved row counts for
sessions, evaluations, culture points, player season stats, and games. It returns
summaries rather than record rows and provides no edit, delete, or restore action.
