# CLAUDE.md — ltclean

## What this project is
A CLI tool that wraps `llm-token-cleaner` for terminal use. Reads stdin or a file, writes cleaned text to stdout, optionally writes stats to stderr.

## Commands

```bash
npm test              # run CLI smoke tests (vitest)
node bin/ltclean.js --help     # test locally without installing
npm link                       # symlink globally for local testing
npm publish --access public    # publish to npm (requires OTP or bypass token)
```

## Project structure

```
bin/
  ltclean.js    — single entry point, all CLI logic
test/
  ltclean.test.js  — smoke tests using spawnSync
vitest.config.js   — vitest config pointing to test/
```

## Key design decisions

- **stdout = cleaned text only** — stats, diff, errors always go to stderr. This keeps the tool pipe-safe: `pbpaste | ltclean | pbcopy` works correctly even with `--stats`.
- **TTY detection** — if stdin is a TTY (interactive terminal, no pipe), the tool prints a helpful message and exits 1 instead of hanging.
- **Dynamic stage flags** — `--no-<stage>` and `--only-<stage>` read from `STAGE_IDS` exported by `llm-token-cleaner`. New stages in the library are automatically supported without CLI changes.
- **No config file** — intentionally simple. All options are CLI flags. If users need persistent config, they use shell aliases.

## Testing approach

Tests use `spawnSync` to run the actual binary — not mocked, not unit tested. This tests the real CLI path including arg parsing, stdin reading, and exit codes. Each test provides stdin as a string and asserts on stdout, stderr, and exit code.

## Publishing

```bash
git add . && git commit -m "your message"
npm version patch
git push --follow-tags
npm publish --access public --otp=YOUR_CODE
# or use a granular access token with 2FA bypass
```

## Known issues

- No automated CI on this repo yet — tests must be run manually before publishing
- v1.0.0 had `"bin": { "ltclean": "./bin/ltclean.js" }` — the leading `./` was invalid. `npm pkg fix` in v1.0.2 corrected it to `"bin/ltclean.js"` (no `./` prefix). npm silently auto-corrected this on install, so end users were unaffected.
