# Test Scenarios

Use these scenarios to verify the project feels alive and not random.

## Scenario 1 — First boot

Given:

- fresh state
- OpenAI key missing

Expected:

- fallback director starts painting
- mind panel shows thoughts
- canvas changes visibly
- no crash or blank screen

## Scenario 2 — OpenAI enabled

Given:

- valid OpenAI API key

Expected:

- backend returns `source: openai`
- command matches schema
- thought appears
- action animates
- state updates after action completes

## Scenario 3 — API failure

Given:

- invalid API key or simulated OpenAI timeout

Expected:

- backend logs failure
- fallback command is returned
- artwork continues without visible interruption

## Scenario 4 — Dense center

Given:

- center region density > 0.85

Expected:

- artist often chooses erase, lighten, blur, scar, or interrupt
- thought references weight, pressure, certainty, damage, or overworking

## Scenario 5 — Ignored corner

Given:

- top_left has low density and has not been touched for a long time

Expected:

- artist may choose top_left
- action may be wash, stroke, texture, or lighten
- thought may reference quiet, neglected, empty, or breath

## Scenario 6 — Obsessive mood

Given:

- mood is obsessive
- center has high touch count

Expected:

- artist may revisit center repeatedly
- repeated behavior should feel intentional, not like a bug
- exact same thought should not repeat too often

## Scenario 7 — Pause behavior

Given:

- command action is `pause_and_observe`

Expected:

- thought appears
- canvas does not materially change
- pulse continues subtly
- next action eventually occurs

## Scenario 8 — Pi display mode

Given:

- app is running on Raspberry Pi
- Chromium is in kiosk mode

Expected:

- app opens fullscreen
- no browser chrome is visible
- artwork runs continuously
- reload recovers from crashes if possible

## Scenario 9 — Long run

Given:

- app runs for at least 2 hours

Expected:

- no memory leak severe enough to crash
- action history persists
- thoughts do not feel identical
- canvas does not become pure noise too quickly

## Scenario 10 — Presentation test

Given:

- another person watches for 2–3 minutes

Desired reaction:

- they understand the left side is thought and right side is action
- they notice the piece revises itself
- they ask whether it is making decisions
