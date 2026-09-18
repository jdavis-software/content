/** A local semantics probe, not a benchmark. No dependencies or global cache pruning. */
import {mkdtemp, copyFile, mkdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const source=path.dirname(fileURLToPath(import.meta.url));
const root=await mkdtemp(path.join(tmpdir(),'article-go-cache-'));
try {
  const work=path.join(root,'module');await mkdir(work);
  for(const file of ['go.mod','cache.go','cache_test.go'])await copyFile(path.join(source,file),path.join(work,file));
  const env={...process.env,GOCACHE:path.join(root,'build-cache'),GOMODCACHE:path.join(root,'module-cache'),GOENV:'off',GOFLAGS:'',GOTOOLCHAIN:'local',GOWORK:'off',GOPROXY:'off',GOSUMDB:'off',GOCACHEPROG:'',GODEBUG:''};
  const run=args=>{
    const p=spawnSync('go',args,{cwd:work,env,encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024});
    if(p.error)throw p.error;
    if(p.status!==0)throw new Error(p.stderr||p.stdout||`go exited ${p.status}`);
    return p.stdout;
  };
  const version=run(['version']).trim();
  const first=run(['test','-v','./...']);
  const second=run(['test','-v','./...']);
  const fresh=run(['test','-v','-count=1','./...']);
  assert.match(first,/PASS/);assert.doesNotMatch(first,/\(cached\)/);
  assert.match(second,/\(cached\)/);
  assert.match(fresh,/PASS/);assert.doesNotMatch(fresh,/\(cached\)/);
  console.log(JSON.stringify({version,checks:[{command:'go test -v ./...',result:'executed'},{command:'go test -v ./...',result:'cached'},{command:'go test -v -count=1 ./...',result:'executed'}],benchmark:false,network:'disabled for dependency/toolchain downloads',globalCachePruned:false},null,2));
} finally {await rm(root,{recursive:true,force:true});}
