# Architecture rules
- Keep individual payroll PDF presentation in the shared exportPayrollPdf module; payroll sheets pass identity and calculated totals so PDF styling never changes payroll calculations.
- Use the shared payrollDayCalc for individual payroll views; times and locations must reference the same actual events, never substitute assignments or synthetic clock-outs.
- Keep the admin Who's in/out panel read-only and organization-scoped; derive status from each person's latest event within today's Philippine-time bounds, without changing attendance or payroll shift logic.