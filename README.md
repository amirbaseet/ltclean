# ltclean

CLI to strip LLM output noise and minimize token count before re-prompting.

Powered by [llm-token-cleaner](https://www.npmjs.com/package/llm-token-cleaner).

## Install

```bash
npm install -g ltclean
```

## Usage

```bash
# Clean clipboard → paste cleaned (macOS)
pbpaste | ltclean | pbcopy

# With stats
pbpaste | ltclean --stats | pbcopy

# Specific preset
pbpaste | ltclean --preset human | pbcopy

# Clean a file
ltclean input.txt > cleaned.txt

# Disable specific stages
pbpaste | ltclean --no-emoji --no-emph | pbcopy
```

## Options

| Flag | Description |
|---|---|
| `--preset <name>` | `reprompt` (default), `human`, `codesafe` |
| `--stats` | Print token counts to stderr |
| `--diff` | Print line/char/token diff to stderr |
| `--no-<stage>` | Disable a stage (e.g. `--no-emoji`) |
| `--only-<stage>` | Run only one stage (e.g. `--only-box`) |
| `--help` | Show help |
| `--version` | Show version |

## Presets

| Preset | What it does |
|---|---|
| `reprompt` | All stages on — maximum compression for LLM chaining |
| `human` | Keep markdown, strip only Unicode noise |
| `codesafe` | Keep code fences and inline backticks |

## Recommended alias

Add to `~/.zshrc`:

```bash
alias clean="pbpaste | ltclean | pbcopy"
alias cleanv="pbpaste | ltclean --stats | pbcopy"
```

Then just type `clean` after copying any LLM output.

## Stages

`box` `emoji` `geo` `zero` `hdr` `emph` `fences` `icode` `links` `tables` `lists` `html` `ents` `fnref` `cit` `ell` `isp` `seps` `blk` `trail`

See [llm-token-cleaner](https://www.npmjs.com/package/llm-token-cleaner) for full stage documentation.

## License

MIT
