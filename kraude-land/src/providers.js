export class ProviderRegistry{
  #providers=new Map();
  register(p){if(!p?.id||!p.type)throw new Error('provider id/type required');this.#providers.set(p.id,{...p});return this}
  get(id){const p=this.#providers.get(id);if(!p)throw new Error(`unknown provider ${id}`);return p}
  async health(id){const p=this.get(id);return p.health?await p.health():{ok:true}}
  async invoke(id,request,options={}){
    const p=this.get(id);
    if(request?.namespace==='REAL'&&/mock|simulat/i.test(p.type))throw new Error('REAL mode cannot use mock/simulated provider');
    if(!p.invoke)throw new Error(`provider ${id} is not invokable`);
    const h=await this.health(id);if(!h.ok)throw new Error(`provider ${id} unhealthy`);
    const started=Date.now();const timeoutMs=options.timeoutMs??30000;
    let timer;
    try{
      const out=await Promise.race([p.invoke(request),new Promise((_,rej)=>{timer=setTimeout(()=>rej(new Error(`provider timeout after ${timeoutMs}ms`)),timeoutMs)})]);
      return {...out,provenance:{providerId:p.id,type:p.type,endpoint:p.endpoint??null,model:p.model??null,durationMs:Date.now()-started}}
    } finally {if(timer)clearTimeout(timer)}
  }
  ids(){return [...this.#providers.keys()]}
}
