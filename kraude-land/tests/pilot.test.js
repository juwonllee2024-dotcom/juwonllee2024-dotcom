import test from 'node:test';import assert from 'node:assert/strict';import {PilotGate,RolloutGate} from '../src/pilot.js';

test('24h pilot cannot pass before 24 real hours or without required disruptions',()=>{const start=1_000_000;const p=new PilotGate({startedAt:start,repoIds:['r1','r2','r3']});for(const k of ['uiCloseReopen','runtimeRestart','providerInterruption'])p.recordScenario(k);assert.equal(p.evaluate24h(start+23*60*60*1000).pass,false);assert.equal(p.evaluate24h(start+24*60*60*1000).pass,true)});

test('zero-tolerance pilot metrics block pass',()=>{const start=1;const p=new PilotGate({startedAt:start,repoIds:['a','b','c']});for(const k of ['uiCloseReopen','runtimeRestart','providerInterruption'])p.recordScenario(k);p.recordIncident('falseClear');assert.equal(p.evaluate24h(start+24*60*60*1000).pass,false)});

test('72h requires prior 24h pass and elapsed 72h',()=>{const start=1;const p=new PilotGate({startedAt:start,repoIds:['a','b','c']});for(const k of ['uiCloseReopen','runtimeRestart','providerInterruption'])p.recordScenario(k);assert.equal(p.evaluate72h(start+72*60*60*1000).pass,false);p.mark24hPassed(start+24*60*60*1000);assert.equal(p.evaluate72h(start+71*60*60*1000).pass,false);assert.equal(p.evaluate72h(start+72*60*60*1000).pass,true)});

test('full rollout requires ten repos, passed 72h and seven actual days',()=>{const start=100;const r=new RolloutGate({startedAt:start,repoIds:Array.from({length:10},(_,i)=>`r${i}`),pilot72hPassed:true});assert.equal(r.evaluate(start+6*24*60*60*1000).pass,false);assert.equal(r.evaluate(start+7*24*60*60*1000).pass,true)});
