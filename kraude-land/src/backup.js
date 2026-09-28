import { existsSync, mkdirSync, copyFileSync, constants } from 'node:fs';
import { dirname, resolve } from 'node:path';

function sqlString(value){ return `'${String(value).replaceAll("'", "''")}'`; }
function requireFreshDestination(path){
  const full=resolve(path);
  if(existsSync(full)) throw new Error(`destination already exists: ${full}`);
  mkdirSync(dirname(full),{recursive:true});
  return full;
}

export function backupRuntimeStore(store,destination){
  if(!store?.db) throw new Error('open runtime store required');
  const target=requireFreshDestination(destination);
  store.db.exec('PRAGMA wal_checkpoint(FULL)');
  store.db.exec(`VACUUM INTO ${sqlString(target)}`);
  return target;
}

export function restoreRuntimeStore(backupPath,destination){
  const source=resolve(backupPath);
  if(!existsSync(source)) throw new Error(`backup does not exist: ${source}`);
  const target=requireFreshDestination(destination);
  copyFileSync(source,target,constants.COPYFILE_EXCL);
  return target;
}
