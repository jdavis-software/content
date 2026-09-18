/** Deterministic public fixture only: no model, credentials, files or network required. */
import assert from 'node:assert/strict';
import {makePacket,inspectPacket} from '../../site/context-model.js';
const checks=[
 ['Focused evidence',inspectPacket(makePacket()).ready,true],
 ['Extra context can still satisfy requirements',inspectPacket(makePacket('all')).ready,true],
 ['Stale contract detected',inspectPacket(makePacket('stale')).stale,1],
 ['Missing test detected',inspectPacket(makePacket('missing')).missing,1],
 ['New requirement invalidates old packet',inspectPacket(makePacket(),{expected:'r3'}).ready,false],
 ['Refreshed packet matches new requirement',inspectPacket(makePacket('focused','r3'),{expected:'r3'}).ready,true],
 ['Access withdrawal blocks reuse',inspectPacket(makePacket(),{contractAllowed:false}).ready,false]
];
for(const [name,actual,expected] of checks){assert.equal(actual,expected);console.log('PASS',name);}
console.log('Seven fixture checks. No AI-quality or performance measurement.');
