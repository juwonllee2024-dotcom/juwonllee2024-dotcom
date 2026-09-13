const NS = new Set(['REAL', 'DEMO']);
const STAR = new Set([1,2,3,4,5,6,7]);
const iso = (v, n) => { if (typeof v !== 'string' || Number.isNaN(Date.parse(v))) throw new TypeError(`${n} must be an ISO timestamp`); return v; };
const str = (v, n) => { if (typeof v !== 'string' || !v.trim()) throw new TypeError(`${n} must be a non-empty string`); return v; };
const arr = (v, n) => { if (!Array.isArray(v)) throw new TypeError(`${n} must be an array`); return v; };
const en = (v, n, values) => { if (!values.includes(v)) throw new TypeError(`${n} must be one of ${values.join(', ')}`); return v; };
const obj = (v, n) => { if (!v || typeof v !== 'object' || Array.isArray(v)) throw new TypeError(`${n} must be an object`); return v; };

export function validateNamespace(v) { if (!NS.has(v)) throw new TypeError('namespace must be REAL or DEMO'); return v; }
export function validateAgent(v) {
  obj(v, 'Agent'); str(v.id,'id'); str(v.name,'name'); if (!STAR.has(v.starRank)) throw new TypeError('starRank must be 1 through 7');
  en(v.lifecycle,'lifecycle',['ACTIVE','RESTING','SYNTHESIZED']); str(v.cognitionProfileId,'cognitionProfileId'); iso(v.createdAt,'createdAt');
  if ('modelName' in v || 'providerId' in v) throw new TypeError('Agent identity must not contain provider/model identity'); return Object.freeze({...v});
}
export function validateProject(v) { obj(v,'Project'); str(v.id,'id'); str(v.name,'name'); en(v.status,'status',['ACTIVE','PAUSED','ARCHIVED']); iso(v.createdAt,'createdAt'); return Object.freeze({...v}); }
export function validateRepo(v) { obj(v,'Repo'); str(v.id,'id'); str(v.projectId,'projectId'); str(v.name,'name'); str(v.canonicalPath,'canonicalPath'); str(v.baseHead,'baseHead'); str(v.defaultBranch,'defaultBranch'); iso(v.createdAt,'createdAt'); return Object.freeze({...v}); }
export function validateMission(v) { obj(v,'Mission'); str(v.id,'id'); str(v.projectId,'projectId'); str(v.repoId,'repoId'); str(v.title,'title'); en(v.status,'status',['QUEUED','ASSIGNED','RUNNING','VERIFYING','CLEAR','FAILED','CANCELLED']); arr(v.requiredEvidenceKinds,'requiredEvidenceKinds').forEach((x,i)=>str(x,`requiredEvidenceKinds[${i}]`)); iso(v.createdAt,'createdAt'); return Object.freeze({...v}); }
export function validateParty(v) { obj(v,'Party'); str(v.id,'id'); str(v.missionId,'missionId'); const ids=arr(v.agentIds,'agentIds'); if(ids.length<1||ids.length>5) throw new TypeError('agentIds must contain 1 through 5 agents'); ids.forEach((x,i)=>str(x,`agentIds[${i}]`)); en(v.status,'status',['FORMED','ACTIVE','DISBANDED']); iso(v.createdAt,'createdAt'); return Object.freeze({...v}); }
export function validateRun(v) { obj(v,'Run'); str(v.id,'id'); str(v.missionId,'missionId'); validateNamespace(v.namespace); en(v.status,'status',['CREATED','RUNNING','VERIFYING','SUCCEEDED','FAILED','CANCELLED']); iso(v.createdAt,'createdAt'); return Object.freeze({...v}); }
export function validateEvidence(v) { obj(v,'Evidence'); str(v.id,'id'); validateNamespace(v.namespace); str(v.runId,'runId'); str(v.kind,'kind'); if(typeof v.passed!=='boolean') throw new TypeError('passed must be boolean'); str(v.command,'command'); if(!Number.isInteger(v.exitCode)) throw new TypeError('exitCode must be integer'); str(v.artifactPath,'artifactPath'); iso(v.createdAt,'createdAt'); return Object.freeze({...v}); }
export function validateAuthorityDecision(v) { obj(v,'AuthorityDecision'); str(v.id,'id'); str(v.action,'action'); en(v.decision,'decision',['ALLOW','DENY','REQUIRES_APPROVAL']); str(v.reason,'reason'); iso(v.createdAt,'createdAt'); return Object.freeze({...v}); }
export function validateWorldEvent(v) { obj(v,'WorldEvent'); str(v.id,'id'); validateNamespace(v.namespace); str(v.type,'type'); iso(v.occurredAt,'occurredAt'); obj(v.payload,'payload'); return Object.freeze({...v}); }
