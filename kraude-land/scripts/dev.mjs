import {resolve,join} from 'node:path';
import {mkdirSync} from 'node:fs';
import {createRuntimeStore} from '../src/store.js';
import {createRuntimeHttpServer} from '../src/http-server.js';
import {WorldProjector} from '../src/world.js';

const root=resolve(process.env.KRAUDE_DATA??'./data/dev');
mkdirSync(root,{recursive:true});
const store=createRuntimeStore(join(root,'world.db'));
if(store.listAgents().length===0){
  for(const a of [
    {agentId:'K-001',star:3,status:'WORKING'},
    {agentId:'K-002',star:2,status:'VERIFYING'},
    {agentId:'K-003',star:4,status:'TRAINING'},
    {agentId:'K-004',star:2,status:'IDLE'}
  ]) store.createAgent({birthAt:new Date().toISOString(),...a});
  store.createMission({missionId:'M-BUILD',namespace:'REAL',objective:'Build verified artifact',status:'WORKING',assignedAgentId:'K-001'});
  store.createMission({missionId:'M-VERIFY',namespace:'REAL',objective:'Verify change',status:'VERIFYING',assignedAgentId:'K-002'});
  const w=new WorldProjector(store);
  w.recordDemand('workshop','seed-use-1');w.recordDemand('workshop','seed-use-2');w.recordDemand('workshop','seed-use-3');
  store.appendEvent({namespace:'REAL',type:'WORLD_STARTED',actorId:'SYSTEM',payload:{mode:'dev-seed'}});
}
const server=createRuntimeHttpServer({store});
const port=Number(process.env.PORT??3300);
server.listen(port,'127.0.0.1',()=>console.log(`KRAUDE LAND runtime http://127.0.0.1:${port}`));
for(const sig of ['SIGINT','SIGTERM']) process.on(sig,()=>server.close(()=>{store.close();process.exit(0)}));
