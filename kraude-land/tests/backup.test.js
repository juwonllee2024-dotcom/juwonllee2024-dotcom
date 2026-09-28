import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRuntimeStore } from '../src/store.js';
import { backupRuntimeStore, restoreRuntimeStore } from '../src/backup.js';

test('backup/restore preserves authoritative agents, missions, evidence and append-only ledger', () => {
  const root = mkdtempSync(join(tmpdir(), 'kraude-backup-'));
  const sourcePath = join(root, 'source.db');
  const backupPath = join(root, 'backup.db');
  const restoredPath = join(root, 'restored.db');
  try {
    const store = createRuntimeStore(sourcePath);
    store.createAgent({agentId:'K-BACKUP', birthAt:'2026-01-01T00:00:00Z', star:3, status:'WORKING'});
    store.createMission({missionId:'M-BACKUP', namespace:'REAL', objective:'prove backup restore', status:'VERIFYING', assignedAgentId:'K-BACKUP'});
    const eid = store.createEvidence({evidenceId:'E-BACKUP', namespace:'REAL', missionId:'M-BACKUP', kind:'TEST', result:'PASS', real:true, payload:{command:'node --test'}});
    store.appendEvent({namespace:'REAL', type:'BACKUP_REHEARSAL_SOURCE', actorId:'SYSTEM', missionId:'M-BACKUP', evidenceRefs:[eid], payload:{authoritative:true}});
    backupRuntimeStore(store, backupPath);
    store.setMissionStatus('M-BACKUP', 'CLEAR');
    store.close();

    restoreRuntimeStore(backupPath, restoredPath);
    const restored = createRuntimeStore(restoredPath);
    assert.equal(restored.getAgent('K-BACKUP').star, 3);
    assert.equal(restored.getMission('M-BACKUP').status, 'VERIFYING');
    assert.equal(restored.getEvidence('E-BACKUP').result, 'PASS');
    assert.equal(restored.listEvents().at(-1).type, 'BACKUP_REHEARSAL_SOURCE');
    assert.throws(() => restored.db.prepare("UPDATE events SET type='TAMPER' WHERE id=1").run(), /append-only/);
    assert.throws(() => restored.db.prepare("UPDATE evidence SET result='FAIL' WHERE evidence_id='E-BACKUP'").run(), /append-only/);
    restored.close();
  } finally {
    rmSync(root,{recursive:true,force:true});
  }
});
