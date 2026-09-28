import http from 'node:http';import {readFileSync,existsSync} from 'node:fs';import {join,extname} from 'node:path';import {WorldProjector} from './world.js';import {MasterAuthority,reportFromLedger,whileAwayFromLedger} from './authority.js';
const send=(res,status,data,type='application/json')=>{res.writeHead(status,{'content-type':type,'cache-control':'no-store'});res.end(type==='application/json'?JSON.stringify(data):data)};
async function body(req){let s='';for await(const c of req)s+=c;return s?JSON.parse(s):{}}
export function createRuntimeHttpServer({store,webRoot=new URL('../apps/world-web/',import.meta.url).pathname}){
 const world=new WorldProjector(store),auth=new MasterAuthority(store);
 return http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://runtime.local');
   if(req.method==='GET'&&u.pathname==='/api/world')return send(res,200,world.snapshot());
   if(req.method==='GET'&&u.pathname==='/api/events')return send(res,200,store.listEvents());
   if(req.method==='GET'&&u.pathname==='/api/report')return send(res,200,reportFromLedger(store));
   if(req.method==='GET'&&u.pathname==='/api/away')return send(res,200,whileAwayFromLedger(store,Number(u.searchParams.get('afterId')??0)));
   if(req.method==='GET'&&u.pathname==='/api/atlas')return send(res,200,{nodes:store.db.prepare('SELECT * FROM atlas_nodes ORDER BY type,id').all(),edges:store.db.prepare('SELECT * FROM atlas_edges ORDER BY id').all()});
   if(req.method==='GET'&&u.pathname==='/api/agents')return send(res,200,store.listAgents());
   if(req.method==='GET'&&u.pathname==='/api/missions')return send(res,200,store.db.prepare('SELECT * FROM missions ORDER BY created_at DESC').all());
   if(req.method==='GET'&&u.pathname==='/api/parties')return send(res,200,store.db.prepare('SELECT * FROM parties ORDER BY created_at DESC').all());
   if(req.method==='GET'&&u.pathname==='/api/evidence')return send(res,200,store.listEvidence());
   if(req.method==='GET'&&u.pathname==='/api/authority')return send(res,200,{requests:store.db.prepare('SELECT * FROM authority_requests ORDER BY created_at DESC').all(),controls:store.db.prepare('SELECT * FROM controls ORDER BY key').all()});
   if(req.method==='POST'&&u.pathname==='/api/authority/decision'){const b=await body(req);return send(res,200,auth.decide(b.requestId,b.decision,b.reason??''));}
   if(req.method==='POST'&&u.pathname==='/api/control'){const b=await body(req);auth.setControl(b.key,b.value);return send(res,200,{ok:true});}
   let path=u.pathname==='/'?join(webRoot,'index.html'):join(webRoot,u.pathname.replace(/^\//,''));if(!path.startsWith(webRoot)||!existsSync(path))return send(res,404,{error:'not found'});const type=extname(path)==='.js'?'text/javascript':extname(path)==='.css'?'text/css':'text/html';return send(res,200,readFileSync(path),type);
 }catch(e){send(res,500,{error:e.message})}})
}
export async function listenEphemeral(server){await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok)});return `http://127.0.0.1:${server.address().port}`}
