import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { createRuntimeStore } from '../src/store.js';
import { validateAgent, validateEvidence, validateWorldEvent } from '../src/contracts.js';
import { ProviderRegistry } from '../src/providers.js';
import { tempDir, cleanup } from './helpers.js';

test('authoritative state survives restart and event ledger is append-only', () => {
  const dir=tempDir(); const db=join(dir,'world.db');
  let s=createRuntimeStore(db); s.createAgent({agentId:'K-1',birthAt:'2026-01-01T00:00:00Z',star:1,status:'IDLE'}); s.appendEvent({namespace:'REAL',type:'WORLD_STARTED',actorId:'SYSTEM',payload:{}}); s.close();
  s=createRuntimeStore(db); assert.equal(s.getAgent('K-1').agent_id,'K-1'); assert.equal(s.listEvents().length,1);
  assert.throws(()=>s.db.exec("UPDATE events SET type='HACKED'"),/append-only/i);
  assert.throws(()=>s.db.exec("DELETE FROM events"),/append-only/i); s.close(); cleanup(dir);
});

test('DEMO cannot create REAL evidence or REAL events',()=>{
  const dir=tempDir(); const s=createRuntimeStore(join(dir,'w.db'));
  assert.throws(()=>s.createEvidence({namespace:'DEMO',missionId:'m',runId:'r',kind:'TEST',result:'PASS',real:true}),/DEMO/i);
  assert.throws(()=>s.appendEvent({namespace:'DEMO',type:'MISSION_CLEARED',actorId:'x',payload:{realEvidence:true}}),/DEMO/i);
  s.close(); cleanup(dir);
});

test('contracts enforce stars 1-7 and namespace truth',()=>{
  assert.equal(validateAgent({agentId:'a',birthAt:'x',star:7,status:'IDLE'}).star,7);
  assert.throws(()=>validateAgent({agentId:'a',birthAt:'x',star:8,status:'IDLE'}),/star/i);
  assert.throws(()=>validateEvidence({namespace:'BOGUS'}),/namespace/i);
  assert.equal(validateWorldEvent({namespace:'REAL',type:'X',actorId:'a',payload:{}}).namespace,'REAL');
});

test('provider configuration is swappable and health is not identity',async()=>{
  const reg=new ProviderRegistry();
  reg.register({id:'A',type:'bridge',endpoint:'file://a',model:'alpha',health:async()=>({ok:true})});
  reg.register({id:'B',type:'bridge',endpoint:'file://b',model:'beta',health:async()=>({ok:true})});
  assert.equal((await reg.health('A')).ok,true); assert.notEqual(reg.get('A').endpoint,reg.get('B').endpoint);
});

test('repo registration persists verification commands and allowed paths',()=>{
  const dir=tempDir(); const s=createRuntimeStore(join(dir,'w.db'));
  s.registerRepo({repoId:'R1',root:'/tmp/repo',branch:'main',head:'abc',allowedPaths:['src/**'],verificationCommands:['node --test']});
  const r=s.getRepo('R1'); assert.deepEqual(JSON.parse(r.allowed_paths),['src/**']); assert.deepEqual(JSON.parse(r.verification_commands),['node --test']); s.close(); cleanup(dir);
});
