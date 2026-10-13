import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spaceGroupCards} from '../src/group-spacing.js';
test('spacing uses rendered heights, keeps horizontal positions and order, and leaves ungrouped cards alone',()=>{const f={nodes:[{id:'a',x:100,y:0},{id:'b',x:100,y:150},{id:'c',x:100,y:240},{id:'outside',x:100,y:20}],groups:[{members:['a','b','c']}]};const dimensions=new Map(['a','b','c'].map(id=>[id,{width:235,height:220}]));assert.deepEqual(spaceGroupCards(f,dimensions),['b','c']);assert.deepEqual(f.nodes.map(n=>n.y),[0,310,620,20]);assert.ok(f.nodes.every(n=>n.x===100));assert.deepEqual(spaceGroupCards(f,dimensions),[]);});
test('spacing preserves separate columns and already adequate gaps',()=>{const f={nodes:[{id:'a',x:0,y:0},{id:'b',x:900,y:0},{id:'c',x:0,y:1000}],groups:[{members:['a','b','c']}]};assert.deepEqual(spaceGroupCards(f),[]);});
