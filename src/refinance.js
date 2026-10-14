import {nodeHeight} from './geometry.js';
export function refinanceRecords(base){
 const value={...structuredClone(base),prompt:'What do you expect the property to be worth after renovations?',responseType:'CURRENCY',placeholder:'Estimated after-renovation value',unit:'$',minValue:0,maxValue:null,options:[],beginnerHelp:'Enter the estimated dollar value after renovations, not the renovation cost.'};
 return [value,{...structuredClone(value),questionCode:'Q096A',prompt:'What percentage of that value do you expect the lender to let you borrow when refinancing?',responseType:'PERCENTAGE',placeholder:'Refinance loan-to-value percentage',unit:'%',maxValue:100,sortOrder:base.sortOrder+1,beginnerHelp:'Use the refinance loan-to-value percentage quoted by your lender. For example, 75% of a $200,000 value means an estimated $150,000 loan.'}];
}
export function correctRefinance(flow,{layout=true}={}){
 if(flow.questionCorrections?.refinance==='v1')return false;
 const original=flow.nodes.find(n=>n.id==='Q096');if(!original?.sourceRecord)return false;
 const records=refinanceRecords(original.sourceRecord),group=flow.groups.find(g=>g.members.includes(original.id));let second=flow.nodes.find(n=>n.id==='Q096A');
 const continuation=flow.referenceLinks?.find(l=>l.source===original.id&&l.kind==='sequence'&&l.target!=='Q096A')?.target||(original.continueTarget&&original.continueTarget!=='Q096A'?original.continueTarget:null)||(original.sequenceTarget!=='Q096A'?original.sequenceTarget:second?.sequenceTarget)||'Q097';
 const added=!second;if(added){second=structuredClone(original);second.id=second.questionCode='Q096A';second.y=original.y+nodeHeight(original)+90;flow.nodes.splice(flow.nodes.indexOf(original)+1,0,second);if(group)group.members.splice(group.members.indexOf(original.id)+1,0,second.id);}
 for(const [index,node] of [original,second].entries()){const record=records[index];node.title=record.prompt;node.sourceRecord=record;node.answers=[];node.details={...node.details,responseType:record.responseType,placeholder:record.placeholder,unit:record.unit,minValue:record.minValue,maxValue:record.maxValue,sortOrder:record.sortOrder,beginnerHelp:record.beginnerHelp};}
 for(const node of [original,second])for(const condition of node.details.visibility?.conditions||[])if(condition.field==='deal.refinanceAvailable')condition.sourceQuestion='Q095';
 original.sequenceTarget=original.continueTarget=second.id;second.sequenceTarget=second.continueTarget=continuation;
 if(layout&&added){second.y=original.y+nodeHeight(original)+90;if(group)for(const node of flow.nodes)if(group.members.includes(node.id)&&node.id!==original.id&&node.id!==second.id&&node.y>original.y)node.y+=nodeHeight(second)+90;}
 const former=flow.referenceLinks?.find(l=>l.source===original.id&&l.kind==='sequence');flow.referenceLinks=(flow.referenceLinks||[]).filter(l=>!(l.source===original.id&&l.kind==='sequence')&&!(l.source===second.id&&l.kind==='sequence'));
 flow.referenceLinks.push({...former,source:original.id,target:second.id,label:'Next',displayLabel:'Next',kind:'sequence',provenance:'json-order',traced:true,style:former?.style||'solid',color:former?.color||'#168d88',routing:former?.routing||'auto'});
 flow.referenceLinks.push({source:second.id,target:continuation,label:'Next',displayLabel:'Next',kind:'sequence',provenance:'json-order',traced:true,style:'solid',color:'#168d88',routing:'auto'});
 flow.deletedReferenceLinks=[...new Set([...(flow.deletedReferenceLinks||[]),original.id+'|'+continuation])];
 if(flow.sourcePackage){const list=flow.sourcePackage.questions;for(const record of records){const index=list.findIndex(q=>q.questionCode===record.questionCode);if(index>=0)list[index]=structuredClone(record);else list.splice(list.findIndex(q=>q.questionCode==='Q096')+1,0,structuredClone(record));}}
 flow.questionCorrections={...flow.questionCorrections,refinance:'v1'};return true;
}
