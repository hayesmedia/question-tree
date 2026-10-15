import {nodeWidth,nodeHeight,connectionPorts,pointsPath} from './geometry.js';
export function align(nodes,axis,mode){if(nodes.length<2)return;const values=nodes.map(n=>n[axis]);const target=mode==='start'?Math.min(...values):mode==='end'?Math.max(...values):values.reduce((a,b)=>a+b,0)/values.length;for(const n of nodes)n[axis]=target;}
export function distribute(nodes,axis){if(nodes.length<3)return;const ordered=[...nodes].sort((a,b)=>a[axis]-b[axis]);const min=ordered[0][axis],max=ordered.at(-1)[axis];ordered.forEach((n,i)=>n[axis]=min+(max-min)*i/(ordered.length-1));}
export function duplicateSelection(flow,ids,includeGroups=true){const map=new Map([...ids].map(id=>[id,crypto.randomUUID()]));const copies=flow.nodes.filter(n=>ids.has(n.id)).map(n=>{const c=structuredClone(n);c.id=map.get(n.id);c.x+=40;c.y+=40;c.questionCode=(n.questionCode||n.id)+' (copy)';c.answers=c.answers.map(a=>({...a,target:map.get(a.target)||a.target}));if(c.continueTarget)c.continueTarget=map.get(c.continueTarget)||c.continueTarget;if(c.sequenceTarget)c.sequenceTarget=map.get(c.sequenceTarget)||c.sequenceTarget;return c;});const groups=(includeGroups?flow.groups:[]).filter(g=>g.members.length&&g.members.every(id=>ids.has(id))).map(g=>({...structuredClone(g),id:crypto.randomUUID(),title:g.title+' (copy)',members:g.members.map(id=>map.get(id))}));const links=(flow.referenceLinks||[]).filter(l=>ids.has(l.source)&&ids.has(l.target)).map(l=>({...structuredClone(l),source:map.get(l.source),target:map.get(l.target)}));flow.nodes.push(...copies);flow.groups.push(...groups);flow.referenceLinks??=[];flow.referenceLinks.push(...links);return new Set(copies.map(n=>n.id));}
export function pathFor(source,target,mode='orthogonal',lane=0){
 const {from,to}=connectionPorts(source,target),start=from.edge,end=to.edge;
 const label={x:(start.x+end.x)/2,y:(start.y+end.y)/2};
 if(mode==='straight')return {d:pointsPath([start,end]),...label};
 if(mode==='curved'){
  const distance=Math.max(65,Math.hypot(end.x-start.x,end.y-start.y)/2)+lane*15;
  const control=(port)=>({x:port.edge.x+(port.portal.x-port.edge.x)*distance/14,y:port.edge.y+(port.portal.y-port.edge.y)*distance/14});
  const a=control(from),b=control(to);return {d:`M${start.x},${start.y} C${a.x},${a.y} ${b.x},${b.y} ${end.x},${end.y}`,...label};
 }
 const a=from.portal,b=to.portal,horizontal=['left','right'].includes(from.side),targetHorizontal=['left','right'].includes(to.side);let middle;
 if(horizontal!==targetHorizontal)middle=[horizontal?{x:b.x,y:a.y}:{x:a.x,y:b.y}];
 else if(horizontal){const x=(a.x+b.x)/2+lane*24;middle=[{x,y:a.y},{x,y:b.y}];}
 else{const x=(a.x+b.x)/2+lane*24,y=(a.y+b.y)/2;middle=lane?[{x,y:a.y},{x,y:b.y}]:[{x:a.x,y},{x:b.x,y}];}
 const points=[start,a,...middle,b,end];return {d:pointsPath(points),points,x:middle[0].x+6,y:(a.y+b.y)/2};
}


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
