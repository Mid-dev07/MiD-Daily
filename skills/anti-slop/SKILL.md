---
name: anti-slop
description: Use when writing or editing text, documentation, UI copy, slide copy, marketing copy, social posts, or code comments that should read as human-edited. Apply the Anti-AI-Slop standard from dharmawan-id/anti-ai-slop. The skill checks symbols, vocabulary, contrast framing, false agency, cadence, sycophancy, 2026 model tells, and Indonesian-specific tells, then rewrites rather than only flagging.
---

# Anti-slop skill for MiD Daily

Source: https://github.com/dharmawan-id/anti-ai-slop
Source skill: `skills/anti-slop/SKILL.md`
License: CC BY 4.0 for the written standard.

Use this skill for any user-facing or maintainer-facing text that we create or edit. The goal is natural, specific writing with a real editorial pass.

## Required behavior

1. Detect concrete slop patterns.
2. Rewrite the affected text instead of only reporting the problem.
3. Keep the original meaning and factual content.
4. Vary sentence and paragraph length.
5. Prefer direct wording over inflated vocabulary.
6. Read the result again and remove any replacement tells.

## Local MiD rule

This skill governs language and editorial style. It does not replace MiD's product, accessibility, UI, responsive, or Unreal visual standards.

For Indonesian text, apply the Indonesian-specific rules from `AGENTS.md` below. The full upstream English and Indonesian standards remain authoritative at the source repository linked above.

## Code and comments

Apply the same standard to comments, documentation strings, labels, empty states, errors, tooltips, onboarding, and accessibility copy. Comments should explain a non-obvious reason or constraint. Remove decorative comments that only restate the code.

## Detection-claims discipline

This is an editorial style standard, not an authorship detector. Never claim that a style check proves who wrote text, that content is "undetectable", or that it will bypass an AI detector.
