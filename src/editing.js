import {nodeWidth,nodeHeight} from './geometry.js';
export function align(nodes,axis,mode){if(nodes.length<2)return;const values=nodes.map(n=>n[axis]);const target=mode==='start'?Math.min(...values):mode==='end'?Math.max(...values):values.reduce((a,b)=>a+b,0)/values.length;for(const n of nodes)n[axis]=target;}
export function distribute(nodes,axis){if(nodes.length<3)return;const ordered=[...nodes].sort((a,b)=>a[axis]-b[axis]);const min=ordered[0][axis],max=ordered.at(-1)[axis];ordered.forEach((n,i)=>n[axis]=min+(max-min)*i/(ordered.length-1));}
export function duplicateSelection(flow,ids,includeGroups=true){const map=new Map([...ids].map(id=>[id,crypto.randomUUID()]));const copies=flow.nodes.filter(n=>ids.has(n.id)).map(n=>{const c=structuredClone(n);c.id=map.get(n.id);c.x+=40;c.y+=40;c.questionCode=(n.questionCode||n.id)+' (copy)';c.answers=c.answers.map(a=>({...a,target:map.get(a.target)||a.target}));if(c.continueTarget)c.continueTarget=map.get(c.continueTarget)||c.continueTarget;if(c.sequenceTarget)c.sequenceTarget=map.get(c.sequenceTarget)||c.sequenceTarget;return c;});const groups=(includeGroups?flow.groups:[]).filter(g=>g.members.length&&g.members.every(id=>ids.has(id))).map(g=>({...structuredClone(g),id:crypto.randomUUID(),title:g.title+' (copy)',members:g.members.map(id=>map.get(id))}));const links=(flow.referenceLinks||[]).filter(l=>ids.has(l.source)&&ids.has(l.target)).map(l=>({...structuredClone(l),source:map.get(l.source),target:map.get(l.target)}));flow.nodes.push(...copies);flow.groups.push(...groups);flow.referenceLinks??=[];flow.referenceLinks.push(...links);return new Set(copies.map(n=>n.id));}
export function pathFor(source,target,mode='orthogonal',lane=0){const start={x:source.x+nodeWidth(source),y:source.y+nodeHeight(source)/2},end={x:target.x,y:target.y+nodeHeight(target)/2};if(mode==='straight')return {d:`M${start.x},${start.y} L${end.x},${end.y}`,x:(start.x+end.x)/2,y:(start.y+end.y)/2};if(mode==='curved'){const c=Math.max(65,Math.abs(end.x-start.x)/2)+lane*15;return {d:`M${start.x},${start.y} C${start.x+c},${start.y} ${end.x-c},${end.y} ${end.x},${end.y}`,x:(start.x+end.x)/2,y:(start.y+end.y)/2};}const rail=Math.max(start.x,end.x)+40+lane*24;return {d:`M${start.x},${start.y} H${rail} V${end.y} H${end.x}`,x:rail+6,y:(start.y+end.y)/2};}

export function reorderAnswer(node,from,to){
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=node.answers.length||to>=node.answers.length||from===to)return false;
 const [answer]=node.answers.splice(from,1);node.answers.splice(to,0,answer);
 node.answers.forEach((a,i)=>a.sortOrder=i+1);return true;
}

export function rewireConnection(flow,key,sourceId,targetId){
 const sourceIndex=flow.nodes.findIndex(n=>n.id===sourceId),target=flow.nodes.find(n=>n.id===targetId);
 if(sourceIndex<0||!target)throw Error('Choose existing connection endpoints.');
 const [type,a,b]=key.split(':');
 if(type==='r'){
  const link=flow.referenceLinks[+a];if(!link)throw Error('Connection not found.');
  if(link.executable&&(flow.nodes[sourceIndex].type!=='question'||target.type==='shape'))throw Error('A working route must connect a question to a question or outcome.');if(link.source===sourceId&&link.target===targetId)return key;
  if(!link.userCreated){flow.deletedReferenceLinks=[...new Set([...(flow.deletedReferenceLinks||[]),link.source+'|'+link.target])];}
  if(link.executable){const previous=flow.nodes.find(n=>n.id===link.source);if(previous?.continueTarget===link.target)delete previous.continueTarget;flow.nodes[sourceIndex].continueTarget=targetId;}link.source=sourceId;link.target=targetId;link.userCreated=true;link.endpointEdited=true;return key;
 }
 const previous=flow.nodes[+a],answer=previous?.answers[+b];if(!answer)throw Error('Connection not found.');
 if(target.type==='shape')throw Error('An answer must lead to a question or outcome.');if(flow.nodes[sourceIndex].type!=='question')throw Error('An answer connection must start at a question.');
 answer.target=targetId;
 if(previous.id===sourceId)return key;
 previous.answers.splice(+b,1);const next=flow.nodes[sourceIndex];next.answers.push(answer);
 for(const node of [previous,next])node.answers.forEach((option,i)=>option.sortOrder=i+1);
 return 'a:'+sourceIndex+':'+(next.answers.length-1);
}
