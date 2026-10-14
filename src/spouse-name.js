import {removeNodes} from './model.js';
import {nodeHeight} from './geometry.js';
export function spouseNameRecord(base){return {...structuredClone(base),questionCode:'G001B',prompt:'What is the seller’s spouse’s full legal name?',responseType:'TEXT',sortOrder:base.sortOrder+0.5,isRequired:true,allowUnknown:false,placeholder:'Full legal name as shown on identification',unit:null,minValue:null,maxValue:null,sourceUrl:null,whyItMatters:'Include the spouse as an additional seller in the contract.',beginnerHelp:'Enter the spouse’s full legal name. This person is to be added as a seller in the contract.',options:[],branches:[{ruleOrder:1,conditionJson:JSON.stringify({conditions:[{fieldCode:'seller.isMarried',operator:'eq',value:'Yes'}],combinator:'AND'})}],contractMapping:{field:'seller.spouseLegalName',role:'SELLER',includeAsSeller:true}};}
export function correctSpouseName(flow,{layout=true}={}){
 if(flow.questionCorrections?.spouseName==='legal-name-v1')return false;
 const married=flow.nodes.find(n=>n.id==='G001');if(!married?.sourceRecord||!flow.nodes.some(n=>n.id==='G001A'))return false;
 const record=spouseNameRecord(married.sourceRecord),group=flow.groups.find(g=>g.members.includes(married.id));let name=flow.nodes.find(n=>n.id==='G001B');const added=!name;
 if(added){name=structuredClone(married);name.id=name.questionCode='G001B';flow.nodes.splice(flow.nodes.indexOf(married)+1,0,name);if(group)group.members.splice(group.members.indexOf(married.id)+1,0,name.id);}
 name.title=record.prompt;name.sourceRecord=structuredClone(record);name.answers=[];name.sequenceTarget=name.continueTarget='G001A';name.details={...name.details,responseType:record.responseType,sortOrder:record.sortOrder,isRequired:true,allowUnknown:false,placeholder:record.placeholder,unit:null,minValue:null,maxValue:null,sourceUrl:null,whyWeAsk:record.whyItMatters,beginnerHelp:record.beginnerHelp,contractMapping:structuredClone(record.contractMapping),branches:record.branches.map(b=>({...b,condition:JSON.parse(b.conditionJson)})),visibility:{match:'ALL (AND)',conditions:[{field:'seller.isMarried',sourceQuestion:'G001',operator:'eq',values:['Yes']}],groups:[]}};
 for(const answer of married.answers)if(answer.value==='Yes')answer.target=name.id;
 if(layout&&added){name.y=married.y+nodeHeight(married)+90;for(const node of flow.nodes)if(group?.members.includes(node.id)&&![married.id,name.id].includes(node.id)&&node.y>married.y)node.y+=nodeHeight(name)+90;}
 flow.conditionSources={...flow.conditionSources,'seller.spouseLegalName':name.id};
 flow.referenceLinks=(flow.referenceLinks||[]).filter(l=>!(l.source==='G001'&&l.target==='G001B')&&!(l.source==='G001B'&&l.kind==='sequence'));
 if(!flow.referenceLinks.some(l=>l.source===name.id&&l.target==='G001A'&&l.kind==='continuation'))flow.referenceLinks.push({source:name.id,target:'G001A',kind:'continuation',provenance:'json-requested',executable:true,label:'Continue',displayLabel:'Continue',routing:'auto',width:4,color:'#168d88',style:'solid'});
 if(flow.sourcePackage){const list=flow.sourcePackage.questions,index=list.findIndex(q=>q.questionCode===name.id);if(index>=0)list[index]=structuredClone(record);else list.splice(list.findIndex(q=>q.questionCode==='G001')+1,0,structuredClone(record));}
 flow.questionCorrections={...flow.questionCorrections,spouseName:'legal-name-v1'};return true;
}

export function automaticSpouseSigning(flow){
 if(flow.questionCorrections?.spouseSigning==='automatic-v1')return false;
 const spouse=flow.nodes.find(n=>n.id==='G002');if(!spouse&&!flow.sourcePackage?.questions?.some(q=>q.questionCode==='G002'))return false;
 const incoming=[];for(const node of flow.nodes){for(const answer of node.answers||[])if(answer.target==='G002')incoming.push(answer);if(node.continueTarget==='G002')node.continueTarget='Q042';if(node.sequenceTarget==='G002')node.sequenceTarget='Q042';}
 removeNodes(flow,new Set(['G002']));for(const answer of incoming){answer.target='Q042';delete answer.fallbackTarget;delete answer.connectionLabel;}
 const home=flow.nodes.find(n=>n.id==='G001A');if(home)home.sequenceTarget='Q042';
 flow.contractDefaults={...flow.contractDefaults,spouseSignsDeedAndClosingDocuments:true};if(flow.sourcePackage)flow.sourcePackage.contractDefaults=structuredClone(flow.contractDefaults);
 for(const record of flow.sourcePackage?.questions||[])if(record.questionCode==='G002')record.archived=true;
 flow.questionCorrections={...flow.questionCorrections,spouseSigning:'automatic-v1'};return true;
}
