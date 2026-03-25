# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-03-25

### Fixed
- Corrected `bin` field in `package.json` via `npm pkg fix` — the bin script name was invalid in the initial publish, causing npm to auto-correct it silently on install

### Notes
- Tag v1.0.1 exists in git but was never published — accidental empty version bump

---

## [1.0.0] - 2026-03-25

### Added
- `ltclean` CLI binary — reads from stdin or file path, writes cleaned text to stdout
- `--preset reprompt|human|codesafe` flag (default: reprompt)
- `--stats` flag — prints token counts and per-stage breakdown to stderr (pipe-safe)
- `--diff` flag — prints line/char/token diff to stderr
- `--no-<stage>` flag — disable any specific stage (e.g. `--no-emoji`)
- `--only-<stage>` flag — run only one stage (e.g. `--only-box`)
- `--version` and `--help` flags
- TTY detection — prints helpful message when run with no input instead of hanging
- Powered by `llm-token-cleaner` — all 20 pipeline stages available

### Usage
```bash
pbpaste | ltclean | pbcopy
pbpaste | ltclean --stats | pbcopy
pbpaste | ltclean --preset human | pbcopy
ltclean input.txt > cleaned.txt
```
