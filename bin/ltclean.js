#!/usr/bin/env node
import { clean, STAGE_IDS } from 'llm-token-cleaner';
import { readFileSync } from 'fs';

const VERSION = '1.0.0';

const HELP = `
ltclean — strip LLM output noise, minimize token count

Usage:
  ltclean [options] [file]
  echo "text" | ltclean [options]
  pbpaste | ltclean | pbcopy

Options:
  --preset <name>   Pipeline preset: reprompt (default), human, codesafe
  --stats           Print token stats to stderr
  --diff            Print a simple before/after line-count diff to stderr
  --no-<stage>      Disable a specific stage (e.g. --no-emoji, --no-emph)
  --only-<stage>    Enable only one stage (e.g. --only-box)
  --version         Print version and exit
  --help            Print this help and exit

Stages (use with --no- or --only-):
  ${STAGE_IDS.join(', ')}

Examples:
  pbpaste | ltclean | pbcopy
  pbpaste | ltclean --preset human | pbcopy
  pbpaste | ltclean --stats
  ltclean input.txt > cleaned.txt
  ltclean --no-emoji --no-emph < input.txt

Presets:
  reprompt     All stages on. Maximum compression for LLM chaining.
  human        Keep markdown, strip only Unicode noise.
  codesafe     Keep code fences and inline backticks.
`.trim();

// ── Parse args ────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { preset: 'reprompt', stats: false, diff: false, file: null, stages: {} };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') { console.log(HELP); process.exit(0); }
    if (arg === '--version' || arg === '-v') { console.log(`ltclean v${VERSION}`); process.exit(0); }
    if (arg === '--stats' || arg === '-s') { args.stats = true; continue; }
    if (arg === '--diff' || arg === '-d') { args.diff = true; continue; }
    if (arg === '--preset' || arg === '-p') {
      const preset = argv[++i];
      if (!['reprompt', 'human', 'codesafe'].includes(preset)) {
        stderr(`Unknown preset "${preset}". Valid: reprompt, human, codesafe`);
        process.exit(1);
      }
      args.preset = preset;
      continue;
    }
    // --no-<stage>
    const noMatch = arg.match(/^--no-(.+)$/);
    if (noMatch) {
      const id = noMatch[1];
      if (!STAGE_IDS.includes(id)) { stderr(`Unknown stage "${id}". Run --help for stage list.`); process.exit(1); }
      args.stages[id] = false;
      continue;
    }
    // --only-<stage>
    const onlyMatch = arg.match(/^--only-(.+)$/);
    if (onlyMatch) {
      const id = onlyMatch[1];
      if (!STAGE_IDS.includes(id)) { stderr(`Unknown stage "${id}". Run --help for stage list.`); process.exit(1); }
      // disable all, enable only this one
      STAGE_IDS.forEach(s => { args.stages[s] = false; });
      args.stages[id] = true;
      continue;
    }
    // positional — file path
    if (!arg.startsWith('-')) { args.file = arg; continue; }
    stderr(`Unknown option: ${arg}. Run --help for usage.`);
    process.exit(1);
  }
  return args;
}

function stderr(msg) { process.stderr.write(msg + '\n'); }

// ── Read input ────────────────────────────────────────────────────────────────
async function readInput(file) {
  if (file) {
    try { return readFileSync(file, 'utf8'); }
    catch (e) { stderr(`Cannot read file: ${file}`); process.exit(1); }
  }
  // stdin
  if (process.stdin.isTTY) {
    stderr('No input. Pipe text or provide a file path.\nExample: pbpaste | ltclean | pbcopy');
    process.exit(1);
  }
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', c => chunks.push(c));
    process.stdin.on('end', () => resolve(chunks.join('')));
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
const args = parseArgs(process.argv.slice(2));
const input = await readInput(args.file);

const result = clean(input, {
  preset: args.preset,
  stages: Object.keys(args.stages).length > 0 ? args.stages : undefined,
});

// Write cleaned text to stdout
process.stdout.write(result.text);

// Optionally write stats/diff to stderr (so they don't pollute the pipe)
if (args.stats) {
  stderr('');
  stderr(`─── ltclean stats ───────────────────────`);
  stderr(`  preset:     ${args.preset}`);
  stderr(`  tokens in:  ${result.tokensIn.toLocaleString()}`);
  stderr(`  tokens out: ${result.tokensOut.toLocaleString()}`);
  stderr(`  saved:      ${result.saved.toLocaleString()} (${result.pct}%)`);
  if (result.stats.length > 0) {
    stderr(`  breakdown:`);
    result.stats.forEach(s => stderr(`    ${s.id.padEnd(16)} -${s.saved}`));
  }
  stderr(`─────────────────────────────────────────`);
}

if (args.diff) {
  const inLines  = input.split('\n').length;
  const outLines = result.text.split('\n').length;
  const inChars  = input.length;
  const outChars = result.text.length;
  stderr('');
  stderr(`─── ltclean diff ────────────────────────`);
  stderr(`  lines:  ${inLines} → ${outLines} (${inLines - outLines >= 0 ? '-' : '+'}${Math.abs(inLines - outLines)})`);
  stderr(`  chars:  ${inChars} → ${outChars} (${inChars - outChars >= 0 ? '-' : '+'}${Math.abs(inChars - outChars)})`);
  stderr(`  tokens: ${result.tokensIn} → ${result.tokensOut} (-${result.saved}, ${result.pct}%)`);
  stderr(`─────────────────────────────────────────`);
}
