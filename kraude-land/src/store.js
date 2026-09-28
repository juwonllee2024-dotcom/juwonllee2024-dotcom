import { DatabaseSync } from 'node:sqlite';
import { validateAgent, validateEvidence, validateWorldEvent } from './contracts.js';

const j = x => JSON.stringify(x ?? {});
const parse = x => { try { return JSON.parse(x); } catch { return x; } };
export function createRuntimeStore(path=':memory:'){
  const db=new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
  CREATE TABLE IF NOT EXISTS agents(
    agent_id TEXT PRIMARY KEY,birth_at TEXT NOT NULL,star INTEGER NOT NULL CHECK(star BETWEEN 1 AND 7),status TEXT NOT NULL,
    career TEXT,traits TEXT NOT NULL DEFAULT '{}',relationships TEXT NOT NULL DEFAULT '{}',primary_provider TEXT,
    self_model TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS synthesized_agents(agent_id TEXT PRIMARY KEY,synthesized_at TEXT NOT NULL,reason TEXT);
  CREATE TABLE IF NOT EXISTS memories(
    id INTEGER PRIMARY KEY AUTOINCREMENT,agent_id TEXT NOT NULL,category TEXT NOT NULL,content TEXT NOT NULL,
    source_evidence_ids TEXT NOT NULL,confidence REAL NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS providers(id TEXT PRIMARY KEY,type TEXT NOT NULL,endpoint TEXT,model TEXT,config TEXT NOT NULL DEFAULT '{}');
  CREATE TABLE IF NOT EXISTS repos(
    repo_id TEXT PRIMARY KEY,root TEXT NOT NULL,branch TEXT NOT NULL,head TEXT NOT NULL,allowed_paths TEXT NOT NULL,verification_commands TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'REGISTERED'
  );
  CREATE TABLE IF NOT EXISTS missions(
    mission_id TEXT PRIMARY KEY,namespace TEXT NOT NULL,repo_id TEXT,objective TEXT NOT NULL,status TEXT NOT NULL,allowed_paths TEXT NOT NULL DEFAULT '[]',success_criteria TEXT NOT NULL DEFAULT '[]',required_evidence TEXT NOT NULL DEFAULT '[]',assigned_agent_id TEXT,party_id TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS runs(
    run_id TEXT PRIMARY KEY,mission_id TEXT NOT NULL,agent_id TEXT,provider_id TEXT,status TEXT NOT NULL,start_head TEXT,end_head TEXT,worktree_path TEXT,started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,finished_at TEXT
  );
  CREATE TABLE IF NOT EXISTS evidence(
    evidence_id TEXT PRIMARY KEY,namespace TEXT NOT NULL,mission_id TEXT,run_id TEXT,kind TEXT NOT NULL,result TEXT NOT NULL,real INTEGER NOT NULL DEFAULT 0,payload TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS events(
    id INTEGER PRIMARY KEY AUTOINCREMENT,ts TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,namespace TEXT NOT NULL,type TEXT NOT NULL,actor_id TEXT NOT NULL,project_id TEXT,mission_id TEXT,run_id TEXT,payload TEXT NOT NULL DEFAULT '{}',evidence_refs TEXT NOT NULL DEFAULT '[]',correlation_id TEXT,causation_id TEXT
  );
  CREATE TRIGGER IF NOT EXISTS events_no_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'events append-only'); END;
  CREATE TRIGGER IF NOT EXISTS events_no_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'events append-only'); END;
  CREATE TRIGGER IF NOT EXISTS evidence_no_update BEFORE UPDATE ON evidence BEGIN SELECT RAISE(ABORT,'evidence append-only'); END;
  CREATE TRIGGER IF NOT EXISTS evidence_no_delete BEFORE DELETE ON evidence BEGIN SELECT RAISE(ABORT,'evidence append-only'); END;
  CREATE TABLE IF NOT EXISTS jobs(
    job_id TEXT PRIMARY KEY,namespace TEXT NOT NULL,kind TEXT NOT NULL,idempotency_key TEXT NOT NULL UNIQUE,status TEXT NOT NULL,payload TEXT NOT NULL DEFAULT '{}',lease_owner TEXT,lease_expires_at INTEGER,attempts INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS failures(id INTEGER PRIMARY KEY AUTOINCREMENT,agent_id TEXT NOT NULL,attribution TEXT NOT NULL,kind TEXT NOT NULL,weight REAL NOT NULL,evidence_ids TEXT NOT NULL DEFAULT '[]',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS skills(id INTEGER PRIMARY KEY AUTOINCREMENT,agent_id TEXT NOT NULL,skill TEXT NOT NULL,evidence_ids TEXT NOT NULL,verified INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS promotions(id INTEGER PRIMARY KEY AUTOINCREMENT,agent_id TEXT NOT NULL,from_star INTEGER NOT NULL,to_star INTEGER NOT NULL,evidence_ids TEXT NOT NULL,world_contribution INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS world_lessons(id INTEGER PRIMARY KEY AUTOINCREMENT,lesson TEXT NOT NULL,evidence_ids TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS parties(party_id TEXT PRIMARY KEY,mission_id TEXT NOT NULL,members TEXT NOT NULL,roles TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY AUTOINCREMENT,mission_id TEXT NOT NULL,builder_agent_id TEXT NOT NULL,reviewer_agent_id TEXT NOT NULL,verdict TEXT NOT NULL,evidence_ids TEXT NOT NULL DEFAULT '[]',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS world_facilities(facility_id TEXT PRIMARY KEY,tier INTEGER NOT NULL DEFAULT 1,demand_count INTEGER NOT NULL DEFAULT 0,construction TEXT NOT NULL DEFAULT 'STABLE',last_reason TEXT);
  CREATE TABLE IF NOT EXISTS controls(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS authority_requests(request_id TEXT PRIMARY KEY,action TEXT NOT NULL,subject TEXT,payload TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'PENDING',decision TEXT,reason TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,decided_at TEXT);
  CREATE TABLE IF NOT EXISTS atlas_nodes(id TEXT PRIMARY KEY,type TEXT NOT NULL,name TEXT NOT NULL,metadata TEXT NOT NULL DEFAULT '{}',provenance TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS atlas_edges(id INTEGER PRIMARY KEY AUTOINCREMENT,from_id TEXT NOT NULL,to_id TEXT NOT NULL,type TEXT NOT NULL,metadata TEXT NOT NULL DEFAULT '{}',provenance TEXT NOT NULL,UNIQUE(from_id,to_id,type));
  `);
  const api={db,
    close(){db.close()},
    createAgent(a){a=validateAgent(a); const dead=db.prepare('SELECT 1 FROM synthesized_agents WHERE agent_id=?').get(a.agentId); if(dead) throw new Error('synthesized agent identity cannot be resurrected'); db.prepare(`INSERT INTO agents(agent_id,birth_at,star,status,career,traits,relationships,self_model) VALUES(?,?,?,?,?,?,?,?)`).run(a.agentId,a.birthAt,a.star,a.status,a.career??null,j(a.traits),j(a.relationships),j(a.selfModel)); return api.getAgent(a.agentId)},
    getAgent(id){return db.prepare('SELECT * FROM agents WHERE agent_id=?').get(id)??null},
    listAgents(){return db.prepare('SELECT * FROM agents ORDER BY agent_id').all()},
    updateAgentStatus(id,status){db.prepare('UPDATE agents SET status=? WHERE agent_id=?').run(status,id)},
    deleteAgent(id){db.prepare('DELETE FROM agents WHERE agent_id=?').run(id)},
    setAgentProvider(id,p){db.prepare('UPDATE agents SET primary_provider=? WHERE agent_id=?').run(p,id)},
    getAgentProvider(id){return db.prepare('SELECT primary_provider FROM agents WHERE agent_id=?').get(id)?.primary_provider??null},
    updateAgentStar(id,star){if(!Number.isInteger(star)||star<1||star>7) throw new Error('star must be 1-7'); db.prepare('UPDATE agents SET star=? WHERE agent_id=?').run(star,id)},
    appendEvent(e){e=validateWorldEvent(e); if(e.namespace==='DEMO' && e.payload?.realEvidence) throw new Error('DEMO cannot emit REAL evidence/events'); const r=db.prepare(`INSERT INTO events(namespace,type,actor_id,project_id,mission_id,run_id,payload,evidence_refs,correlation_id,causation_id) VALUES(?,?,?,?,?,?,?,?,?,?)`).run(e.namespace,e.type,e.actorId,e.projectId??null,e.missionId??null,e.runId??null,j(e.payload),j(e.evidenceRefs??[]),e.correlationId??null,e.causationId??null); return Number(r.lastInsertRowid)},
    listEvents(){return db.prepare('SELECT * FROM events ORDER BY id').all()},
    createEvidence(e){e=validateEvidence(e); if(e.namespace==='DEMO'&&e.real) throw new Error('DEMO cannot create REAL evidence'); if(e.real&&e.namespace!=='REAL') throw new Error('REAL evidence must be REAL namespace'); const id=e.evidenceId??crypto.randomUUID(); db.prepare(`INSERT INTO evidence(evidence_id,namespace,mission_id,run_id,kind,result,real,payload) VALUES(?,?,?,?,?,?,?,?)`).run(id,e.namespace,e.missionId??null,e.runId??null,e.kind??'GENERIC',e.result??'UNKNOWN',e.real?1:0,j(e.payload)); return id},
    getEvidence(id){return db.prepare('SELECT * FROM evidence WHERE evidence_id=?').get(id)??null},
    listEvidence(missionId){return missionId?db.prepare('SELECT * FROM evidence WHERE mission_id=? ORDER BY created_at').all(missionId):db.prepare('SELECT * FROM evidence ORDER BY created_at').all()},
    registerRepo(r){db.prepare(`INSERT INTO repos(repo_id,root,branch,head,allowed_paths,verification_commands) VALUES(?,?,?,?,?,?) ON CONFLICT(repo_id) DO UPDATE SET root=excluded.root,branch=excluded.branch,head=excluded.head,allowed_paths=excluded.allowed_paths,verification_commands=excluded.verification_commands`).run(r.repoId,r.root,r.branch,r.head,j(r.allowedPaths),j(r.verificationCommands))},
    getRepo(id){return db.prepare('SELECT * FROM repos WHERE repo_id=?').get(id)??null},
    createMission(m){db.prepare(`INSERT INTO missions(mission_id,namespace,repo_id,objective,status,allowed_paths,success_criteria,required_evidence,assigned_agent_id,party_id) VALUES(?,?,?,?,?,?,?,?,?,?)`).run(m.missionId,m.namespace??'REAL',m.repoId??null,m.objective,m.status??'QUEUED',j(m.allowedPaths??[]),j(m.successCriteria??[]),j(m.requiredEvidence??[]),m.assignedAgentId??null,m.partyId??null); return api.getMission(m.missionId)},
    getMission(id){return db.prepare('SELECT * FROM missions WHERE mission_id=?').get(id)??null},
    setMissionStatus(id,status){db.prepare('UPDATE missions SET status=? WHERE mission_id=?').run(status,id)},
    assignMission(id,agentId){db.prepare('UPDATE missions SET assigned_agent_id=? WHERE mission_id=?').run(agentId,id)},
    createRun(r){db.prepare(`INSERT INTO runs(run_id,mission_id,agent_id,provider_id,status,start_head,worktree_path) VALUES(?,?,?,?,?,?,?)`).run(r.runId,r.missionId,r.agentId??null,r.providerId??null,r.status??'RUNNING',r.startHead??null,r.worktreePath??null)},
    finishRun(id,{status,endHead}){db.prepare("UPDATE runs SET status=?,end_head=?,finished_at=CURRENT_TIMESTAMP WHERE run_id=?").run(status,endHead??null,id)},
    getRun(id){return db.prepare('SELECT * FROM runs WHERE run_id=?').get(id)??null},
    addMemory(agentId,m){const r=db.prepare(`INSERT INTO memories(agent_id,category,content,source_evidence_ids,confidence) VALUES(?,?,?,?,?)`).run(agentId,m.category,m.content,j(m.sourceEvidenceIds),m.confidence); return Number(r.lastInsertRowid)},
    listMemories(agentId){return db.prepare('SELECT * FROM memories WHERE agent_id=? ORDER BY id').all(agentId)},
    addFailure(agentId,f,w){db.prepare('INSERT INTO failures(agent_id,attribution,kind,weight,evidence_ids) VALUES(?,?,?,?,?)').run(agentId,f.attribution,f.kind,w,j(f.evidenceIds??[]))},
    listFailures(agentId){return db.prepare('SELECT * FROM failures WHERE agent_id=? ORDER BY id').all(agentId)},
    addSkillEvidence(agentId,s){db.prepare('INSERT INTO skills(agent_id,skill,evidence_ids,verified) VALUES(?,?,?,?)').run(agentId,s.skill,j(s.evidenceIds),s.verified?1:0)},
    listSkillEvidence(agentId,skill){return db.prepare('SELECT * FROM skills WHERE agent_id=? AND skill=? AND verified=1 ORDER BY id').all(agentId,skill)},
    addPromotion(agentId,p){db.prepare('INSERT INTO promotions(agent_id,from_star,to_star,evidence_ids,world_contribution) VALUES(?,?,?,?,?)').run(agentId,p.fromStar,p.toStar,j(p.evidenceIds),p.worldContribution?1:0)},
    addWorldLesson(lesson,evidenceIds){db.prepare('INSERT INTO world_lessons(lesson,evidence_ids) VALUES(?,?)').run(lesson,j(evidenceIds))},
    listWorldLessons(){return db.prepare('SELECT * FROM world_lessons ORDER BY id').all()},
    markSynthesized(agentId,reason){db.prepare('INSERT INTO synthesized_agents(agent_id,synthesized_at,reason) VALUES(?,CURRENT_TIMESTAMP,?)').run(agentId,reason)},
    createParty(p){db.prepare('INSERT INTO parties(party_id,mission_id,members,roles) VALUES(?,?,?,?)').run(p.partyId,p.missionId,j(p.members),j(p.roles))},
    getParty(id){return db.prepare('SELECT * FROM parties WHERE party_id=?').get(id)??null},
    addReview(r){db.prepare('INSERT INTO reviews(mission_id,builder_agent_id,reviewer_agent_id,verdict,evidence_ids) VALUES(?,?,?,?,?)').run(r.missionId,r.builderAgentId,r.reviewerAgentId,r.verdict,j(r.evidenceIds??[]))},
    listReviews(mid){return db.prepare('SELECT * FROM reviews WHERE mission_id=? ORDER BY id').all(mid)},
  };
  return api;
}
