const CATS=new Set(['episodic','semantic','procedural','social','project','self']);
export class AgentMind{
  constructor(store){this.store=store}
  remember(agentId,m){if(!CATS.has(m.category))throw new Error('invalid memory category');if(!Array.isArray(m.sourceEvidenceIds)||m.sourceEvidenceIds.length===0)throw new Error('memory provenance required');if(typeof m.confidence!=='number'||m.confidence<0||m.confidence>1)throw new Error('confidence 0-1 required');return this.store.addMemory(agentId,m)}
  retrieve(agentId,query,{limit=8}={}){const q=query.toLowerCase().split(/\W+/).filter(Boolean);return this.store.listMemories(agentId).map(r=>({...r,score:q.reduce((s,t)=>s+(r.content.toLowerCase().includes(t)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.confidence-a.confidence).slice(0,limit)}
  buildContext(agentId,query){const a=this.store.getAgent(agentId);if(!a)throw new Error('agent not found');const memories=this.retrieve(agentId,query);return [`Agent ${a.agent_id} ★${a.star}${a.career?` — ${a.career}`:''}`,`Mission: ${query}`,...memories.map(m=>`[${m.category}|confidence=${m.confidence}] ${m.content}`)].join('\n')}
}
