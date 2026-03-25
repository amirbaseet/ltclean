/**
 * ltclean CLI smoke tests
 * Uses Node's child_process to run the binary directly — tests the real CLI path
 */
import { execSync, spawnSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { describe, it, expect, afterEach } from 'vitest';

const BIN = new URL('../bin/ltclean.js', import.meta.url).pathname;

function run(args = '', stdin = '') {
  const result = spawnSync(
    'node', [BIN, ...args.split(' ').filter(Boolean)],
    { input: stdin, encoding: 'utf8', timeout: 5000 }
  );
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    code: result.status,
  };
}

describe('ltclean CLI', () => {

  // ── Basic functionality ──────────────────────────────────────────────────
  it('cleans stdin and writes to stdout', () => {
    const { stdout, code } = run('', '## Title\n**bold** text 🔥\n- item\n');
    expect(code).toBe(0);
    expect(stdout).toContain('Title');
    expect(stdout).not.toContain('##');
    expect(stdout).not.toContain('**');
    expect(stdout).not.toContain('🔥');
    expect(stdout).not.toContain('- ');
  });

  it('outputs nothing extra to stdout when --stats used', () => {
    const { stdout, stderr, code } = run('--stats', '**bold** 🔥');
    expect(code).toBe(0);
    expect(stdout).not.toContain('tokens');   // stats go to stderr, not stdout
    expect(stderr).toContain('tokens in');
    expect(stderr).toContain('tokens out');
    expect(stderr).toContain('saved');
  });

  it('--diff writes diff to stderr not stdout', () => {
    const { stdout, stderr, code } = run('--diff', '**bold** text\n');
    expect(code).toBe(0);
    expect(stderr).toContain('lines');
    expect(stderr).toContain('tokens');
    expect(stdout).not.toContain('lines');
  });

  // ── Presets ──────────────────────────────────────────────────────────────
  it('--preset reprompt strips everything', () => {
    const { stdout } = run('--preset reprompt', '## Title\n**bold** 🔥\n');
    expect(stdout).not.toContain('##');
    expect(stdout).not.toContain('**');
    expect(stdout).not.toContain('🔥');
  });

  it('--preset human keeps markdown', () => {
    const { stdout } = run('--preset human', '## Title\n**bold** text\n');
    expect(stdout).toContain('## Title');
    expect(stdout).toContain('**bold**');
  });

  it('--preset codesafe keeps code fences', () => {
    const { stdout } = run('--preset codesafe', '```py\ncode()\n```\n');
    expect(stdout).toContain('```');
    expect(stdout).toContain('code()');
  });

  it('unknown preset exits with code 1', () => {
    const { code, stderr } = run('--preset badname', 'text');
    expect(code).toBe(1);
    expect(stderr).toContain('Unknown preset');
  });

  // ── Stage flags ──────────────────────────────────────────────────────────
  it('--no-emoji keeps emoji', () => {
    const { stdout } = run('--no-emoji', 'hello 🔥 world\n');
    expect(stdout).toContain('🔥');
  });

  it('--only-emoji strips only emoji, keeps markdown', () => {
    const { stdout } = run('--only-emoji', 'hello 🔥 **bold**\n');
    expect(stdout).not.toContain('🔥');
    expect(stdout).toContain('**bold**');
  });

  it('unknown stage exits with code 1', () => {
    const { code, stderr } = run('--no-fakestage', 'text');
    expect(code).toBe(1);
    expect(stderr).toContain('Unknown stage');
  });

  // ── File input ───────────────────────────────────────────────────────────
  it('reads from file path argument', () => {
    const path = '/tmp/ltclean-test-input.txt';
    writeFileSync(path, '## Title\n**bold** 🔥\n');
    const { stdout, code } = run(path, '');
    expect(code).toBe(0);
    expect(stdout).not.toContain('##');
    expect(stdout).not.toContain('🔥');
    unlinkSync(path);
  });

  it('exits with code 1 on missing file', () => {
    const { code, stderr } = run('/tmp/does-not-exist-xyz.txt', '');
    expect(code).toBe(1);
    expect(stderr).toContain('Cannot read file');
  });

  // ── Help & version ───────────────────────────────────────────────────────
  it('--help exits 0 and prints usage', () => {
    const { stdout, code } = run('--help', '');
    expect(code).toBe(0);
    expect(stdout).toContain('ltclean');
    expect(stdout).toContain('--preset');
    expect(stdout).toContain('pbpaste');
  });

  it('--version exits 0 and prints version', () => {
    const { stdout, code } = run('--version', '');
    expect(code).toBe(0);
    expect(stdout).toMatch(/ltclean v\d+\.\d+\.\d+/);
  });

  it('unknown flag exits 1 with helpful message', () => {
    const { code, stderr } = run('--unknownflag', 'text');
    expect(code).toBe(1);
    expect(stderr).toContain('Unknown option');
  });

  // ── Pipe safety ──────────────────────────────────────────────────────────
  it('stats do not appear in stdout when piped with --stats', () => {
    const { stdout } = run('--stats', '## Title\n**bold**\n');
    // stdout should only contain cleaned text, no stats markers
    expect(stdout).not.toContain('───');
    expect(stdout).not.toContain('preset:');
    expect(stdout).not.toContain('tokens in:');
  });

  it('cleaned text is identical with and without --stats', () => {
    const input = '## Title\n**bold** 🔥\n- item\n';
    const { stdout: plain }     = run('', input);
    const { stdout: withStats } = run('--stats', input);
    expect(plain).toBe(withStats);
  });
});
