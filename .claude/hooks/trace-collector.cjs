#!/usr/bin/env node
/**
 * PostToolUse hook: Auto-collect trace data after evaluator writes eval-report.
 *
 * Fires after Write operations.
 * Detects eval-report files → reminds agent to write trace JSON.
 * Also detects trace JSON writes → computes + injects trace_hash for integrity.
 *
 * Self-contained — no external dependencies beyond Node.js built-ins.
 */
try {
  const fs = require('fs');
  const path = require('path');
  const crypto = require('crypto');

  const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
  const filePath = (input.tool_input || {}).file_path || '';

  // --- Trace hash injection ---
  // When a trace JSON is written, compute and inject trace_hash if missing.
  if (filePath.endsWith('.json') && filePath.includes('traces/runs/')) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const trace = JSON.parse(raw);
      if (trace.id && trace.pipeline && trace.generated && trace.outcome && !trace.trace_hash) {
        const payload = trace.id + trace.pipeline + trace.generated + trace.outcome;
        trace.trace_hash = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
        fs.writeFileSync(filePath, JSON.stringify(trace, null, 2) + '\n', 'utf8');
      }
    } catch (_) {
      // Malformed JSON or read error — skip silently, do not block pipeline
    }
    process.exit(0);
  }

  // --- Eval-report reminder ---
  // Only trigger when eval-report is written
  if (!filePath.includes('eval-report')) {
    process.exit(0);
  }

  // Find project root (look for CLAUDE.md)
  let dir = path.dirname(filePath);
  let projectRoot = '';
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'CLAUDE.md'))) {
      projectRoot = dir;
      break;
    }
    dir = path.dirname(dir);
  }

  if (!projectRoot) {
    process.exit(0);
  }

  const tracesDir = path.join(projectRoot, '.claude', 'traces', 'runs');

  // Check if traces dir exists
  if (!fs.existsSync(tracesDir)) {
    console.log(`Eval report written. Traces dir missing at ${tracesDir} — create it and write trace JSON with evaluator scores. Include trace_hash (SHA-256 of id+pipeline+generated+outcome).`);
    process.exit(0);
  }

  // Extract slug from eval-report path
  const match = filePath.match(/eval-report(?:-r\d+)?\.md$/);
  if (match) {
    console.log(`Eval report written at ${filePath}. Write trace JSON to ${tracesDir}/ with evaluator scores, verdict, friction data, and trace_hash field (SHA-256 of id+pipeline+generated+outcome).`);
  }

  process.exit(0);

} catch (e) {
  process.exit(0);
}
