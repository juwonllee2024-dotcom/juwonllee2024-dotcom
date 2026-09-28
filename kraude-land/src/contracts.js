const NS = new Set(['REAL','DEMO','TEST']);
export function assertNamespace(namespace){ if(!NS.has(namespace)) throw new Error(`invalid namespace: ${namespace}`); return namespace; }
export function validateAgent(a){
  if(!a?.agentId) throw new Error('agentId required');
  if(!Number.isInteger(a.star)||a.star<1||a.star>7) throw new Error('star must be integer 1-7');
  if(!a.birthAt) throw new Error('birthAt required');
  return {...a};
}
export function validateEvidence(e){ assertNamespace(e?.namespace); return {...e}; }
export function validateWorldEvent(e){ assertNamespace(e?.namespace); if(!e.type) throw new Error('event type required'); if(!e.actorId) throw new Error('actorId required'); return {...e}; }
