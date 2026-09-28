import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

export function tempDir(prefix='kraude-') { return mkdtempSync(join(tmpdir(), prefix)); }
export function cleanup(path) { rmSync(path, { recursive: true, force: true }); }
export function initGitRepo(root) {
  mkdirSync(root, {recursive:true});
  execFileSync('git',['init','-b','main'],{cwd:root,stdio:'ignore'});
  execFileSync('git',['config','user.email','test@example.com'],{cwd:root});
  execFileSync('git',['config','user.name','KRAUDE Test'],{cwd:root});
  writeFileSync(join(root,'package.json'), JSON.stringify({type:'module',scripts:{test:'node --test'}},null,2));
  mkdirSync(join(root,'test'),{recursive:true});
  writeFileSync(join(root,'math.js'),'export const add = (a,b) => a - b; // TODO fix\n');
  writeFileSync(join(root,'test','math.test.js'),"import test from 'node:test'; import assert from 'node:assert/strict'; import {add} from '../math.js'; test('add',()=>assert.equal(add(2,3),5));\n");
  execFileSync('git',['add','.'],{cwd:root});
  execFileSync('git',['commit','-m','fixture'],{cwd:root,stdio:'ignore'});
}
