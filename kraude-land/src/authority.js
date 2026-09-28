export class MasterAuthority{
 constructor(store){this.store=store}
 setControl(key,value){this.store.db.prepare("INSERT INTO controls(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP").run(key,String(value));this.store.appendEvent({namespace:'REAL',type:'MASTER_CONTROL_CHANGED',actorId:'MASTER',payload:{key,value:String(value)}})}
 getControl(key){return this.store.db.prepare('SELECT * FROM controls WHERE key=?').get(key)??null}
 setPriority(subject,value){this.setControl(`priority:${subject}`,value)}
 pauseMission(missionId,paused){this.setControl(`missionPaused:${missionId}`,!!paused);if(paused)this.store.setMissionStatus(missionId,'PAUSED')}
 pauseWorld(paused){this.setControl('worldPaused',!!paused)}
 overrideAssignment(missionId,agentId){this.store.assignMission(missionId,agentId);this.store.appendEvent({namespace:'REAL',type:'ASSIGNMENT_OVERRIDDEN',actorId:'MASTER',missionId,payload:{agentId}})}
 protectAgent(agentId,protectedState){this.setControl(`synthesisProtected:${agentId}`,!!protectedState)}
 setBudget({maxConcurrency,dailyCost}){if(maxConcurrency!=null)this.setControl('budget:maxConcurrency',maxConcurrency);if(dailyCost!=null)this.setControl('budget:dailyCost',dailyCost)}
 request({requestId,action,subject,payload={}}){this.store.db.prepare('INSERT INTO authority_requests(request_id,action,subject,payload) VALUES(?,?,?,?)').run(requestId,action,subject,JSON.stringify(payload));this.store.appendEvent({namespace:'REAL',type:'AUTHORITY_REQUESTED',actorId:'SYSTEM',payload:{requestId,action,subject}});return this.getDecision(requestId)}
 decide(requestId,decision,reason=''){if(!['ALLOW','DENY'].includes(decision))throw new Error('decision must be ALLOW or DENY');this.store.db.prepare("UPDATE authority_requests SET status='DECIDED',decision=?,reason=?,decided_at=CURRENT_TIMESTAMP WHERE request_id=?").run(decision,reason,requestId);this.store.appendEvent({namespace:'REAL',type:'AUTHORITY_DECIDED',actorId:'MASTER',payload:{requestId,decision,reason}});return this.getDecision(requestId)}
 getDecision(id){return this.store.db.prepare('SELECT * FROM authority_requests WHERE request_id=?').get(id)??null}
}
export function reportFromLedger(store){const events=store.listEvents();const byType={};for(const e of events)byType[e.type]=(byType[e.type]??0)+1;return {events:events.length,byType,firstEventId:events[0]?.id??null,lastEventId:events.at(-1)?.id??null}}

export function whileAwayFromLedger(store,afterId=0){const n=Number(afterId);if(!Number.isInteger(n)||n<0)throw new Error('afterId must be a non-negative integer');const events=store.db.prepare('SELECT * FROM events WHERE id>? ORDER BY id').all(n);const byType={};for(const e of events)byType[e.type]=(byType[e.type]??0)+1;return {afterId:n,events,byType,lastEventId:store.listEvents().at(-1)?.id??n};}
