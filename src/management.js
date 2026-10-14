import {nodeHeight,nodeWidth} from './geometry.js';
export const managementPrompts={Q084:'What percentage of potential rental income will you allow for vacancy and unpaid rent?',Q090:'Will you be paying for any property management services?',Q093:'What minimum annual cash-on-cash return do you require on your invested cash?'};
const ids=['Q090A','Q090B','Q090C'];
const option=(value,order,unknown=false)=>({optionValue:value,optionLabel:value,isUnknownOption:unknown,helpText:null,sortOrder:order});
const branch=(field,value)=>[{ruleOrder:1,conditionJson:JSON.stringify({conditions:[{fieldCode:field,operator:'eq',value}],combinator:'AND'})}];
export function managementRecords(base){
 const first={...structuredClone(base),prompt:managementPrompts.Q090,responseType:'SINGLE_SELECT',placeholder:null,unit:null,minValue:null,maxValue:null,allowUnknown:false,options:[option('Yes',1),option('No',2)],beginnerHelp:'Choose Yes if you will pay for property management services.'};
 const extra=(id,prompt,type,order,branches,options=[],unit=null)=>({...structuredClone(first),questionCode:id,prompt,responseType:type,sortOrder:base.sortOrder+order,branches,options,unit,placeholder:type==='CURRENCY'?'Monthly dollar amount':type==='PERCENTAGE'?'Percent of monthly rent':null,minValue:type==='SINGLE_SELECT'?null:0,maxValue:type==='PERCENTAGE'?100:null,allowUnknown:type!=='SINGLE_SELECT',beginnerHelp:type==='CURRENCY'?'Enter the recurring monthly management fee, excluding separate leasing or setup charges.':type==='PERCENTAGE'?'Enter the percentage of monthly rent charged for management, excluding separate leasing or setup charges.':'Choose the recurring management fee structure. Unknown continues without a fee amount.'});
 return [first,extra('Q090A','Are they collecting a flat fee or percentage of monthly rent?','SINGLE_SELECT',1,branch('Q090','Yes'),[option('Flat fee',1),option('Percentage',2),option('Unknown',3,true)]),extra('Q090B','How much is the flat monthly property management fee?','CURRENCY',2,branch('Q090A','Flat fee'),[],'$'),extra('Q090C','What percentage of monthly rent will they charge for property management?','PERCENTAGE',3,branch('Q090A','Percentage'),[],'%')];
}
export function correctManagement(flow,{layout=true}={}){
 if(flow.questionCorrections?.management==='v1')return false;
 const original=flow.nodes.find(n=>n.id==='Q090');if(!original?.sourceRecord)return false;
 const records=managementRecords(original.sourceRecord),group=flow.groups.find(g=>g.members.includes(original.id));
 const continuation=original.answers.find(a=>a.target&&!ids.includes(a.target))?.target||flow.referenceLinks?.find(l=>l.source==='Q090'&&l.kind==='sequence'&&!ids.includes(l.target))?.target||(ids.includes(original.sequenceTarget)?'Q091':original.sequenceTarget)||'Q091';
 const to=flow.nodes.some(n=>n.id===continuation)?continuation:'Q091';
 const before=structuredClone(original),newNodes=[];
 for(const record of records){let node=flow.nodes.find(n=>n.id===record.questionCode);if(!node){node={...structuredClone(before),id:record.questionCode,questionCode:record.questionCode,x:before.x,y:before.y,answers:[]};newNodes.push(node);}
  node.title=record.prompt;node.sourceRecord=record;node.details={...node.details,responseType:record.responseType,beginnerHelp:record.beginnerHelp,placeholder:record.placeholder,unit:record.unit,minValue:record.minValue,maxValue:record.maxValue,allowUnknown:record.allowUnknown,sortOrder:record.sortOrder,branches:record.branches.map(b=>({...b,condition:JSON.parse(b.conditionJson)})),visibility:record.branches.length?{match:'ALL (AND)',conditions:JSON.parse(record.branches[0].conditionJson).conditions.map(c=>({field:c.fieldCode,sourceQuestion:c.fieldCode,operator:'eq',values:[c.value]})),groups:[]}:original.details.visibility};
  node.answers=record.options.map(o=>({value:o.optionValue,label:o.optionLabel,unknown:o.isUnknownOption,helpText:o.helpText,sortOrder:o.sortOrder,target:''}));
 }
 if(newNodes.length){const index=flow.nodes.indexOf(original);flow.nodes.splice(index+1,0,...newNodes);if(group)group.members.splice(group.members.indexOf(original.id)+1,0,...newNodes.map(n=>n.id));}
 const a=flow.nodes.find(n=>n.id==='Q090A'),b=flow.nodes.find(n=>n.id==='Q090B'),c=flow.nodes.find(n=>n.id==='Q090C');
 original.answers[0].target=a.id;original.answers[1].target=to;a.answers[0].target=b.id;a.answers[1].target=c.id;a.answers[2].target=to;
 original.sequenceTarget=to;a.sequenceTarget=to;b.sequenceTarget=to;c.sequenceTarget=to;b.continueTarget=to;c.continueTarget=to;
 if(layout&&newNodes.length){const bottom=before.y+nodeHeight(original)+90;a.x=before.x;a.y=bottom;b.x=before.x;b.y=a.y+nodeHeight(a)+90;c.x=before.x+nodeWidth(b)+110;c.y=b.y;const delta=Math.max(b.y+nodeHeight(b),c.y+nodeHeight(c))+90-before.y-nodeHeight(before)-90;if(group)for(const node of flow.nodes)if(group.members.includes(node.id)&&!['Q090',...ids].includes(node.id)&&node.y>before.y)node.y+=Math.max(0,delta);}
 flow.referenceLinks=(flow.referenceLinks||[]).filter(l=>!ids.includes(l.source)&&!ids.includes(l.target)&&!(l.source==='Q090'&&l.kind==='sequence'));
 for(const node of [b,c])flow.referenceLinks.push({source:node.id,target:to,label:'Continue',displayLabel:'Continue',traced:true,style:'solid',color:'#168d88',routing:'auto',userCreated:true,kind:'management-continuation'});
 flow.deletedReferenceLinks=[...new Set([...(flow.deletedReferenceLinks||[]),'Q090|'+to])];
 for(const [id,prompt] of Object.entries(managementPrompts)){const node=flow.nodes.find(n=>n.id===id);if(node){node.title=prompt;if(node.sourceRecord)node.sourceRecord.prompt=prompt;}}
 if(flow.sourcePackage){const list=flow.sourcePackage.questions;for(const record of records){const existing=list.findIndex(q=>q.questionCode===record.questionCode);if(existing>=0)list[existing]=structuredClone(record);else list.push(structuredClone(record));}for(const q of list)if(managementPrompts[q.questionCode])q.prompt=managementPrompts[q.questionCode];}
 flow.questionCorrections={...flow.questionCorrections,management:'v1'};return true;
}
