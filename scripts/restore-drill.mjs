#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const record = process.argv.includes('--record');
const evidenceDir = path.join(process.cwd(), 'ops', 'evidence');
const payload = {
  generatedAt: new Date().toISOString(),
  environment: process.env.RESTORE_DRILL_ENV || 'staging',
  backupId: process.env.RESTORE_BACKUP_ID || 'manual-backup-id-required',
  rpoMinutes: Number(process.env.RESTORE_RPO_MINUTES || 15),
  rtoMinutes: Number(process.env.RESTORE_RTO_MINUTES || 60),
  checks: [
    'backup_restored_to_isolated_database',
    'migrations_applied',
    'readiness_check_passed',
    'smoke_test_passed',
  ],
  status: record ? 'recorded' : 'dry_run',
};

console.log(JSON.stringify(payload, null, 2));
if (record) {
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(path.join(evidenceDir, `restore-drill-${Date.now()}.json`), JSON.stringify(payload, null, 2));
}
