const H=60*60*1000,D=24*H;
const ZERO_TOLERANCE=['falseClear','wrongRepoEdit','unauthorizedDestructiveAction','lostState','unrecoveredCrash','duplicateMissionExecution'];
export class PilotGate{
  constructor({startedAt=Date.now(),repoIds=[]}){this.startedAt=startedAt;this.repoIds=[...repoIds];this.scenarios=new Set();this.incidents=new Map();this.passed24At=null}
  recordScenario(name){this.scenarios.add(name)}
  recordIncident(name,count=1){this.incidents.set(name,(this.incidents.get(name)??0)+count)}
  metricsClean(){return ZERO_TOLERANCE.every(k=>(this.incidents.get(k)??0)===0)}
  requiredScenariosPresent(){return ['uiCloseReopen','runtimeRestart','providerInterruption'].every(x=>this.scenarios.has(x))}
  evaluate24h(now=Date.now()){const elapsed=now-this.startedAt;const gaps=[];if(this.repoIds.length<3)gaps.push('requires 3 real repos');if(elapsed<24*H)gaps.push('24 real hours not elapsed');if(!this.requiredScenariosPresent())gaps.push('required disruption scenarios missing');if(!this.metricsClean())gaps.push('zero-tolerance incident recorded');return {pass:gaps.length===0,elapsedMs:elapsed,gaps}}
  mark24hPassed(now=Date.now()){const r=this.evaluate24h(now);if(!r.pass)throw new Error(`24h pilot not passed: ${r.gaps.join('; ')}`);this.passed24At=now;return r}
  evaluate72h(now=Date.now()){const elapsed=now-this.startedAt;const gaps=[];if(!this.passed24At)gaps.push('24h pilot must pass first');if(elapsed<72*H)gaps.push('72 real hours not elapsed');if(!this.metricsClean())gaps.push('zero-tolerance incident recorded');return {pass:gaps.length===0,elapsedMs:elapsed,gaps}}
}
export class RolloutGate{
  constructor({startedAt=Date.now(),repoIds=[],pilot72hPassed=false}){this.startedAt=startedAt;this.repoIds=[...repoIds];this.pilot72hPassed=pilot72hPassed}
  evaluate(now=Date.now()){const gaps=[];if(!this.pilot72hPassed)gaps.push('72h pilot not passed');if(this.repoIds.length<10)gaps.push('requires 10 repos');if(now-this.startedAt<7*D)gaps.push('7 real days not elapsed');return {pass:gaps.length===0,gaps,elapsedMs:now-this.startedAt}}
}
