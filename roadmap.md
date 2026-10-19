## Payroll clock and location correction
- [x] Use overnight-aware employee payroll and align displayed times with actual event locations across all three views.
- [x] Four payroll regression tests passed; verified all three saved payroll views while signed in, including next-day out and actual saved locations. Missing recorded events/places remain blank rather than guessed.

## Payroll PDF update
- [x] Add centered title, identity details and fire-orange report styling for all three payroll downloads.
- [x] Download and visually inspect reports; verify existing totals remain unchanged. Corrected employee report spacing and missing worker ID forwarding.

## Live attendance panel
- [x] Add reference-style Who's in/out panel with employee, site officer and worker status, search, scrolling and live updates.
- [x] Move panel to the top right and limit its events to today in Philippine time.
- [ ] Verify authenticated dashboard tabs and search against saved attendance — blocked: preview is signed out and the requesting user has no matching account for automatic test sign-in.