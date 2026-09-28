import test from 'node:test'; import assert from 'node:assert/strict'; import {join} from 'node:path';
import { createRuntimeStore } from '../src/store.js'; import { AgentMind } from '../src/agent-mind.js'; import { ProviderRegistry } from '../src/providers.js'; import { tempDir, cleanup } from './helpers.js';

test('same agent survives provider A to B swap and restart', async()=>{
  const dir=tempDir(); const db=join(dir,'w.db');
  let s=createRuntimeStore(db); s.createAgent({agentId:'K-TEST',birthAt:'2026-01-01T00:00:00Z',star:3,status:'IDLE',career:'JS specialist',traits:{careful:true},relationships:{K2:'trusted'}});
  const mind=new AgentMind(s); mind.remember('K-TEST',{category:'project',content:'math.js exports add and tests live in test/',sourceEvidenceIds:['e1'],confidence:0.9});
  s.setAgentProvider('K-TEST','A'); s.close();
  s=createRuntimeStore(db); s.setAgentProvider('K-TEST','B'); const a=s.getAgent('K-TEST'); assert.equal(a.agent_id,'K-TEST'); assert.equal(a.star,3); assert.equal(a.career,'JS specialist');
  const ctx=new AgentMind(s).buildContext('K-TEST','Fix add in math.js'); assert.match(ctx,/math\.js exports add/); assert.equal(s.getAgentProvider('K-TEST'),'B'); s.close(); cleanup(dir);
});

test('provider swap changes cognition infrastructure but not identity', async()=>{
  const reg=new ProviderRegistry(); const seen=[];
  reg.register({id:'A',type:'bridge',endpoint:'file://a',model:'a',health:async()=>({ok:true}),invoke:async req=>{seen.push(['A',req]);return {text:'okA',usage:{}}}});
  reg.register({id:'B',type:'bridge',endpoint:'file://b',model:'b',health:async()=>({ok:true}),invoke:async req=>{seen.push(['B',req]);return {text:'okB',usage:{}}}});
  await reg.invoke('A',{agentId:'K',context:'old'}); await reg.invoke('B',{agentId:'K',context:'old memory'});
  assert.deepEqual(seen.map(x=>x[0]),['A','B']); assert.equal(seen[1][1].agentId,'K'); assert.match(seen[1][1].context,/old memory/);
});

test('memory without evidence provenance is rejected',()=>{
 const dir=tempDir(); const s=createRuntimeStore(join(dir,'w.db')); s.createAgent({agentId:'K',birthAt:'x',star:1,status:'IDLE'}); const m=new AgentMind(s); assert.throws(()=>m.remember('K',{category:'semantic',content:'I am perfect',sourceEvidenceIds:[],confidence:1}),/provenance/i); s.close(); cleanup(dir);
});
