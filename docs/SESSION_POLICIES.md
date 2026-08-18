# Configurable session policies

Head Coaches and settings managers configure session types from **Settings →
Session types**. A policy controls whether the session tracks attendance,
evaluations, rewards, and player notes, as well as the point consequence for an
unexcused absence and the attendance-percentage treatment of an excused absence.

Existing installations receive safe in-memory defaults until policies are saved:

- Practice tracks attendance and evaluations, permits rewards and notes, and
  applies a -1 unexcused-absence point adjustment.
- Breakfast Club tracks attendance without evaluations or rewards, permits
  notes, and applies a -1 unexcused-absence point adjustment.

Attendance supports Present, Excused, Unexcused, and Not Marked. CoachIQ keeps
the legacy Boolean Attendance value synchronized for existing reports. An
unexcused selection creates or updates one deterministic Culture Points ledger
entry for that player and session. Correcting the status removes that entry.

## Sheet compatibility

On the first multi-state attendance change, CoachIQ adds an `Attendance Status`
header to the end of `Practice Evaluations` if it is not already present. The
`Culture Points` sheet must contain `Player ID` and `Session ID` headers.

Before enabling this feature in production, create a protected backup and test
each configured session type with a non-production session.
