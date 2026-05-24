# Validation Suite

This document defines how to validate the calculator model with both:

- reference-backed checks (equations and direction rules), and
- characterization checks (stable behavior snapshots for edge scenarios).

## Reference Basis

The suite anchors to standard belt-drive relationships:

1. Net circumferential force drives torque:
   - `T = (T_tight - T_slack) * r`
2. Belt power relation:
   - `P = (T_tight - T_slack) * v`
3. No-slip kinematic ratio and sign conventions:
   - Open belt: same angular direction
   - Crossed belt: opposite angular direction

References:

- [Engineering LibreTexts - Belt- and Gear-Driven Systems](https://eng.libretexts.org/Bookshelves/Mechanical_Engineering/Mechanics_Map_(Moore_2nd_Edition)/12%3A_Rigid_Body_Kinematics/12.04%3A_Belt-_and_Gear-Driven_Systems)
- [Engineers Edge - Flat Belt Drive Design Equations](https://engineersedge.com/calculators/flat_belt_drive_design_16157.htm)
- [Wikipedia - Belt (mechanical)](https://en.m.wikipedia.org/wiki/Belt_(mechanical))

## Automated Validation Categories

The automated suite in `src/physics/validationSuite.test.ts` is grouped into:

1. **Reference equation checks**
   - Driven torque magnitude follows:
     - `|T_driven| = eta * |T_driver| * (r_driven / r_driver)`
   - Direction follows belt mode:
     - open: same sign
     - crossed: opposite sign

2. **Constraint and warning checks**
   - Open-belt geometry bound:
     - `C > |r_driver - r_driven|`
   - Crossed-belt geometry bound:
     - `C > r_driver + r_driven`
   - Efficiency warning for `eta <= 0` or `eta > 1`

3. **Characterization checks (model behavior snapshots)**
   - Scenario matrix that captures current computed bearing-direction outcomes when switching
     belt configuration for:
     - `r_driver=1, r_driven=2, C=5`
     - `r_driver=2, r_driven=1, C=5`
   - These are intentionally marked as characterization checks because they are geometry-model
     outcomes, not direct closed-form textbook claims for bearing resultant direction.

## Manual Validation Script

For each release:

1. Run:
   - `npm run test`
   - `npm run build`
2. Spot-check URLs (open and crossed) for at least:
   - positive torque
   - negative torque
   - unequal radii both ways
   - low preload near slack-limit
3. Confirm:
   - driven torque value and direction labels
   - geometry warnings for invalid center distance
   - URL round-trip reproduces same state

## Future Upgrade Path

If you want this to be design-grade rather than educational-grade, add externally curated
benchmark cases (from standards/textbook worked examples) with published numeric targets for
tensions and pulley/bearing reactions.
