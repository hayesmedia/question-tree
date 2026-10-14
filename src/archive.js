import {removeNodes} from './model.js';
export function archiveQ011(flow,fallback=null){
 if(flow.questionCorrections?.archiveQ011)return false;
 const active=flow.nodes.find(n=>n.id==='Q011'),node=active||fallback?.node;
 if(!node)return false;
 flow.archivedQuestions??=[];
 if(!flow.archivedQuestions.some(entry=>entry.id==='Q011'))flow.archivedQuestions.push({id:'Q011',node:structuredClone(node),groups:active?flow.groups.filter(g=>g.members.includes('Q011')).map(g=>({id:g.id,title:g.title,index:g.members.indexOf('Q011')})):structuredClone(fallback?.groups||[]),connections:active?structuredClone((flow.referenceLinks||[]).filter(l=>l.source==='Q011'||l.target==='Q011')):structuredClone(fallback?.connections||[]),reason:'Saved for later use; bypassed by Q010 → Q012.'});
 const existing=flow.referenceLinks?.find(l=>l.source==='Q010'&&l.target==='Q011'&&l.kind==='sequence');const source=flow.nodes.find(n=>n.id==='Q010');const bypassAnswers=source?.answers.filter(a=>a.target==='Q011')||[];const bypassContinuation=source?.continueTarget==='Q011';
 removeNodes(flow,new Set(['Q011']));
 if(source&&flow.nodes.some(n=>n.id==='Q012')){source.sequenceTarget='Q012';for(const answer of bypassAnswers)answer.target='Q012';if(bypassContinuation)source.continueTarget='Q012';if(!flow.referenceLinks.some(l=>l.source==='Q010'&&l.target==='Q012'))flow.referenceLinks.push({source:'Q010',target:'Q012',label:'Next',displayLabel:'Next',kind:'sequence',provenance:'json-order',traced:true,style:existing?.style||'solid',color:existing?.color||'#168d88',routing:'auto'});}
 flow.questionCorrections={...flow.questionCorrections,archiveQ011:'archived'};return true;
}
export function restoreArchived(flow,id){
 const entry=flow.archivedQuestions?.find(entry=>entry.id===id);if(!entry||flow.nodes.some(n=>n.id===id))return false;
 const node=structuredClone(entry.node),next=flow.nodes.findIndex(n=>n.id===node.sequenceTarget);flow.nodes.splice(next<0?flow.nodes.length:next,0,node);
 for(const saved of entry.groups){let group=flow.groups.find(g=>g.id===saved.id);if(!group){group={id:saved.id,title:saved.title,members:[]};flow.groups.push(group);}group.members.splice(Math.min(saved.index,group.members.length),0,id);}
 for(const link of entry.connections)if(flow.nodes.some(n=>n.id===link.source)&&flow.nodes.some(n=>n.id===link.target)&&!flow.referenceLinks.some(l=>l.source===link.source&&l.target===link.target))flow.referenceLinks.push(structuredClone(link));
 if(id==='Q011'){const source=flow.nodes.find(n=>n.id==='Q010');if(source?.sequenceTarget==='Q012')source.sequenceTarget=id;flow.referenceLinks=flow.referenceLinks.filter(l=>!(l.source==='Q010'&&l.target==='Q012'&&l.kind==='sequence'));flow.questionCorrections.archiveQ011='restored';}
 flow.deletedSourceIds=(flow.deletedSourceIds||[]).filter(value=>value!==id);flow.archivedQuestions=flow.archivedQuestions.filter(value=>value.id!==id);return true;
}
