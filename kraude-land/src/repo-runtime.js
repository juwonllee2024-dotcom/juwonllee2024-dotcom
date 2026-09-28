import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const git=(root,args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
export function snapshotRepo(root){return {root,branch:git(root,['branch','--show-current']),head:git(root,['rev-parse','HEAD']),status:git(root,['status','--porcelain'])}}
export function detectNeeds(root){const out=[];function walk(dir){for(const name of readdirSync(dir)){if(name==='.git'||name==='node_modules')continue;const p=join(dir,name);const st=statSync(p);if(st.isDirectory())walk(p);else if(st.size<1024*1024){let text='';try{text=readFileSync(p,'utf8')}catch{continue}const lines=text.split(/\r?\n/);lines.forEach((line,i)=>{if(/\bTODO\b/.test(line))out.push({kind:'TODO',path:relative(root,p).replaceAll('\\','/'),line:i+1,text:line.trim()});if(/\bFIXME\b/.test(line))out.push({kind:'FIXME',path:relative(root,p).replaceAll('\\','/'),line:i+1,text:line.trim()})})}}}walk(root);return out.sort((a,b)=>a.path.localeCompare(b.path)||a.line-b.line)}
