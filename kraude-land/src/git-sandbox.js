import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
function git(cwd,args){return execFileSync('git',args,{cwd,encoding:'utf8'}).trim()}
export function createMissionWorktree({repoRoot,missionId,baseHead,parentDir}){const dirty=execFileSync('git',['status','--porcelain'],{cwd:repoRoot,encoding:'utf8'}).trim();if(dirty)throw new Error('dirty base repo: refusing mission worktree');mkdirSync(parentDir,{recursive:true});const path=join(parentDir,missionId);const branch=`kraude/${missionId}`;execFileSync('git',['worktree','add','-b',branch,path,baseHead],{cwd:repoRoot,stdio:'ignore'});return {path,branch,startHead:git(path,['rev-parse','HEAD'])}}
export function changedFiles(worktree){const out=execFileSync('git',['status','--porcelain'],{cwd:worktree,encoding:'utf8'});if(!out.trim())return [];return out.split(/\r?\n/).filter(Boolean).map(line=>line.slice(3).trim()).sort()}
export function diffText(worktree){return git(worktree,['diff','--no-ext-diff'])}
export function head(worktree){return git(worktree,['rev-parse','HEAD'])}
