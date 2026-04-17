#!/usr/bin/env node
/**
 * PostToolUse hook: Remind to run delivery-evaluator after implement phase completes.
 *
 * Fires after Write/Edit operations.
 * Tracks files written to output dirs (prd/, prototypes/, designs/, src/).
 * After significant writes, reminds agent to run evaluator before claiming SHIP.
 *
 * Self-contained — no external dependencies.
 */
try {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
  const toolName = input.tool_name || '';
  const filePath = (input.tool_input || {}).file_path || '';

  // Only track Write/Edit to output directories
  const outputDirs = ['prd/', 'prototypes/', 'designs/', 'src/'];
  const isOutputFile = outputDirs.some(d => filePath.includes(d));

  if (!isOutputFile) {
    process.exit(0);
  }

  // Track writes in session temp file
  const trackFile = path.join(os.tmpdir(), 'avengers-eval-track.json');
  let data = { writes: 0, lastDir: '', reminded: false, ts: Date.now() };

  try {
    if (fs.existsSync(trackFile)) {
      const existing = JSON.parse(fs.readFileSync(trackFile, 'utf8'));
      // Reset if older than 2 hours
      if (Date.now() - existing.ts < 2 * 60 * 60 * 1000) {
        data = existing;
      }
    }
  } catch (e) { /* ignore */ }

  data.writes++;
  data.lastDir = outputDirs.find(d => filePath.includes(d)) || '';
  data.ts = Date.now();

  // Remind after 3+ writes to output dirs (implement phase likely done)
  if (data.writes >= 3 && !data.reminded) {
    data.reminded = true;
    fs.writeFileSync(trackFile, JSON.stringify(data));

    const outputType = data.lastDir.replace('/', '');
    const profileMap = { prd: 'prd', prototypes: 'prototype', designs: 'design', src: 'full-app' };
    const profile = profileMap[outputType] || outputType;

    console.log(`Implement phase appears complete (${data.writes} files written to ${data.lastDir}). Remember to run delivery-evaluator with profile ${profile}.json before claiming SHIP.`);
    process.exit(0);
  }

  fs.writeFileSync(trackFile, JSON.stringify(data));
  process.exit(0);

} catch (e) {
  // Non-blocking — never fail the tool call
  process.exit(0);
}
