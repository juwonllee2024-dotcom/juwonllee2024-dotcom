import { spawnSync } from 'node:child_process';import { createHash } from 'node:crypto';
const sha=x=>createHash('sha256').update(x??'').digest('hex');
export function runVerification({cwd,command}){const start=Date.now();const env={...process.env};delete env.NODE_TEST_CONTEXT;const r=spawnSync(command,{cwd,shell:true,encoding:'utf8',env});let exitCode=r.status??1;const output=(r.stdout??'')+(r.stderr??'');if(exitCode===0&&/# tests 0\b/.test(output))exitCode=1;return {command,cwd,exitCode,durationMs:Date.now()-start,stdoutHash:sha(r.stdout),stderrHash:sha(r.stderr),stdout:r.stdout,stderr:r.stderr,result:(exitCode===0?'PASS':'FAIL')} }
function match(path,pattern){if(pattern==='**'||pattern==='*')return true;if(pattern.endsWith('/**'))return path===pattern.slice(0,-3)||path.startsWith(pattern.slice(0,-2));return path===pattern}
export function verifyAllowedPaths(files,allowed){const violations=files.filter(f=>!allowed.some(p=>match(f,p)));return {ok:violations.length===0,violations}}
