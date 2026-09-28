import test from 'node:test';import assert from 'node:assert/strict';import {join} from 'node:path';import {createRuntimeStore} from '../src/store.js';import {createRuntimeHttpServer,listenEphemeral} from '../src/http-server.js';import {tempDir,cleanup} from './helpers.js';
test('runtime HTTP API serves persisted world truth independently from UI',async()=>{const d=tempDir();const s=createRuntimeStore(join(d,'w.db'));s.createAgent({agentId:'K',birthAt:'x',star:2,status:'WORKING'});s.createMission({missionId:'M',namespace:'REAL',objective:'x',status:'WORKING',assignedAgentId:'K'});const server=createRuntimeHttpServer({store:s});const base=await listenEphemeral(server);let world=await (await fetch(base+'/api/world')).json();assert.equal(world.agents[0].facility,'workshop');s.updateAgentStatus('K','VERIFYING');s.setMissionStatus('M','VERIFYING');world=await (await fetch(base+'/api/world')).json();assert.equal(world.agents[0].facility,'armory');const html=await (await fetch(base+'/')).text();for(const t of ['LAND','AGENTS','PROJECTS','MISSIONS','PARTIES','EVIDENCE','EVENTS','AUTHORITY','RESOURCES'])assert.match(html,new RegExp(`'${t}'|>${t}<`));await new Promise(r=>server.close(r));s.close();cleanup(d)});

test('PROJECTS API exposes canonical Atlas graph and while-away report is ledger-derived',async()=>{
  const d=tempDir();const s=createRuntimeStore(join(d,'atlas.db'));
  try{
    s.db.prepare("INSERT INTO atlas_nodes(id,type,name,metadata,provenance) VALUES(?,?,?,?,?)").run('P1','PROJECT','KRAUDE LAND','{}','master-package');
    s.db.prepare("INSERT INTO atlas_nodes(id,type,name,metadata,provenance) VALUES(?,?,?,?,?)").run('R1','REPOSITORY','runtime repo','{}','git-snapshot');
    s.db.prepare("INSERT INTO atlas_edges(from_id,to_id,type,metadata,provenance) VALUES(?,?,?,?,?)").run('R1','P1','PART_OF','{}','reconciled');
    s.appendEvent({namespace:'REAL',type:'WORLD_STARTED',actorId:'SYSTEM',payload:{}});
    const checkpoint=s.listEvents().at(-1).id;
    s.appendEvent({namespace:'REAL',type:'MISSION_CREATED',actorId:'SYSTEM',missionId:'M1',payload:{}});
    s.appendEvent({namespace:'REAL',type:'TEST_FINISHED',actorId:'K1',missionId:'M1',payload:{result:'PASS'}});
    const server=createRuntimeHttpServer({store:s});const base=await listenEphemeral(server);
    const atlas=await (await fetch(base+'/api/atlas')).json();
    assert.equal(atlas.nodes.length,2);assert.equal(atlas.edges.length,1);assert.equal(atlas.edges[0].type,'PART_OF');
    const away=await (await fetch(base+`/api/away?afterId=${checkpoint}`)).json();
    assert.equal(away.events.length,2);assert.equal(away.byType.MISSION_CREATED,1);assert.equal(away.byType.TEST_FINISHED,1);assert.equal(away.afterId,checkpoint);assert.equal(away.lastEventId,s.listEvents().at(-1).id);
    await new Promise(r=>server.close(r));
  } finally {s.close();cleanup(d)}
});
