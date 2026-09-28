export const FACILITIES=[
 {id:'rift',x:0,z:-10,role:'project/external-world transit gateway'},
 {id:'synthesis',x:-7,z:-7,role:'worker synthesis/removal facility'},
 {id:'workshop',x:-3,z:-5,role:'tools/build/artifact production'},
 {id:'armory',x:3,z:-5,role:'controlled tool/capability packages'},
 {id:'plaza',x:7,z:-3,role:'public/social/briefing hub'},
 {id:'alchemy',x:8,z:2,role:'research/transformation experiments'},
 {id:'dorm',x:-8,z:0,role:'waiting/rest/memory consolidation'},
 {id:'training',x:-6,z:6,role:'self-development'},
 {id:'airship',x:0,z:9,role:'deployment/transport visualization'}
];
const STATUS_TO_FACILITY={IDLE:'dorm',RESTING:'dorm',QUEUED:'plaza',WORKING:'workshop',BUILDING:'workshop',VERIFYING:'armory',REVIEWING:'armory',TRAINING:'training',SYNTHESIS_PENDING:'synthesis',DEPLOYING:'airship',CLEAR:'plaza',BLOCKED:'plaza'};
export class WorldProjector{
 constructor(store){this.store=store;for(const f of FACILITIES)this.store.db.prepare("INSERT INTO world_facilities(facility_id) VALUES(?) ON CONFLICT DO NOTHING").run(f.id)}
 facilityState(id){const row=this.store.db.prepare('SELECT * FROM world_facilities WHERE facility_id=?').get(id);if(!row)throw new Error('unknown facility');return row}
 agentState(agentId){const a=this.store.getAgent(agentId);if(!a)return null;const missions=this.store.db.prepare("SELECT * FROM missions WHERE assigned_agent_id=? ORDER BY created_at DESC LIMIT 1").get(agentId);const status=missions?.status??a.status;const facility=STATUS_TO_FACILITY[status]??'plaza';const f=FACILITIES.find(x=>x.id===facility);return {agentId:a.agent_id,star:a.star,status,missionId:missions?.mission_id??null,facility,x:f.x,z:f.z}}
 snapshot(){return {layout:'circular_enclosed_fortress',cameras:['MASTER','WALK','BUILDING'],facilities:FACILITIES.map(f=>({...f,...this.facilityState(f.id)})),agents:this.store.listAgents().map(a=>this.agentState(a.agent_id))}}
 recordDemand(facilityId,reason){const f=this.facilityState(facilityId);const next=f.demand_count+1;let tier=f.tier,construction=f.construction,expanded=false;if(next>=tier*3){tier++;construction='CYAN_HOLOGRAPHIC';expanded=true}this.store.db.prepare('UPDATE world_facilities SET demand_count=?,tier=?,construction=?,last_reason=? WHERE facility_id=?').run(next,tier,construction,reason,facilityId);this.store.appendEvent({namespace:'REAL',type:expanded?'WORLD_EXPANDED':'FACILITY_DEMAND_RECORDED',actorId:'SYSTEM',payload:{facilityId,reason,demandCount:next,tier,construction}});return {expanded,...this.facilityState(facilityId)}}
}
