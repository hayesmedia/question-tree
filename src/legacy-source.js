import {validate,mergeSource} from './model.js';
import {nodeHeight} from './geometry.js';

// Associations identify the questions mentioned by visibility rules. They are
// not exported canonical mappings (the supplied package contains no mappings).
export const conditionSources={
 'property.address.state':'Q001','property.type':'Q010','property.hasHOA':'Q014',
 'property.hasMud':'QG-MUD','property.waterRights':'Q017','property.hasLease':'Q022',
 'property.occupied':'Q012','property.addendums.has.section1031Exchange':'Q027',
 'property.addendums.has.thirdPartyFinancingAddendum':'Q031',
 'property.addendums.has.backUpContract':'Q026','seller.maritalHomesteadStatus':'G001',
 'mortgage.first.exists':'Q043','mortgage.first.status':'Q045',
 'seller.openToSellerFinance':'Q051','seller.openToSubjectTo':'Q052',
 'seller.openToWrap':'Q053','deal.refinanceAvailable':'Q095',
 'insurance.insurable':'Q117','creativeFinance.isWrap':'Q166',
 'contract.fullyExecuted':'Q182'
};
const clone=v=>v===undefined?undefined:structuredClone(v);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function conditions(rule){return [...(rule.conditions||[]),...(rule.groups||[]).flatMap(conditions)];}
function parseBranches(branches){return branches.map(b=>({...b,condition:JSON.parse(b.conditionJson)}));}
function visibilityRule(rule){return {match:rule.combinator==='OR'?'ANY (OR)':'ALL (AND)',conditions:(rule.conditions||[]).map(c=>({sourceQuestion:conditionSources[c.fieldCode]||null,field:c.fieldCode,operator:c.operator==='in'?'is one of':c.operator==='eq'?'equals':c.operator,values:c.operator==='in'?String(c.value).split(','):[c.value]})),groups:(rule.groups||[]).map(visibilityRule)};}
export function convertLegacyPackage(pkg,baseline){
 if(!pkg||!Array.isArray(pkg.questions)||!Array.isArray(pkg.stages))throw Error('Invalid questionnaire package.');
 const ids=new Set(),stages=new Map(pkg.stages.map(s=>[s.stageCode,s]));
 const result=clone(baseline);result.title=pkg.questionnaireName;
 result.sourceRevision=pkg.exportedAtUtc;result.sourcePackage=clone(pkg);
 result.conditionSources=clone(conditionSources);result.sourceNotes=['Question wording, options, settings and visibility from questionnaire-v3.json.','Original package retained losslessly. Canonical mappings and remember-choice settings were not exported; screenshot settings are retained.','Visibility connectors show dependencies, not answer jumps. Question order follows stage sortOrder then question sortOrder.'];
 const ordered=[...pkg.questions].sort((a,b)=>(stages.get(a.stageCode)?.sortOrder??0)-(stages.get(b.stageCode)?.sortOrder??0)||a.sortOrder-b.sortOrder);
 const oldNodes=new Map(baseline.nodes.map(n=>[n.id,n]));
 result.nodes=ordered.map((q,i)=>{
  if(typeof q.questionCode!=='string'||ids.has(q.questionCode)||typeof q.prompt!=='string'||!stages.has(q.stageCode)||!Array.isArray(q.options)||!Array.isArray(q.branches))throw Error('Invalid or duplicate question.');
  ids.add(q.questionCode);const old=oldNodes.get(q.questionCode),stage=stages.get(q.stageCode),branches=parseBranches(q.branches);
  const answers=[...q.options].sort((a,b)=>a.sortOrder-b.sortOrder).map(o=>{if(typeof o.optionValue!=='string'||typeof o.optionLabel!=='string')throw Error('Invalid option.');const prior=old?.answers.find(a=>a.value===o.optionValue||a.label===o.optionLabel);return {value:o.optionValue,label:o.optionLabel,unknown:o.isUnknownOption,helpText:o.helpText,sortOrder:o.sortOrder,target:prior?.target||''};});
  return {...clone(old||{x:80+(i%5)*340,y:100+Math.floor(i/5)*260}),id:q.questionCode,questionCode:q.questionCode,type:'question',title:q.prompt,section:stage.stageName.toUpperCase(),strategyTag:q.routeCode||null,textIncomplete:false,sourceRecord:clone(q),sequenceTarget:ordered[i+1]?.questionCode||'',details:{...clone(old?.details||{}),whyWeAsk:q.whyItMatters,beginnerHelp:q.beginnerHelp,stage:q.stageCode,responseType:q.responseType,persona:q.personaMode,routeTag:q.routeCode||'Core (no route tag)',sourceUrl:q.sourceUrl,placeholder:q.placeholder,unit:q.unit,minValue:q.minValue,maxValue:q.maxValue,isRequired:q.isRequired,allowUnknown:q.allowUnknown,sortOrder:q.sortOrder,branches,visibility:branches.length===1?visibilityRule(branches[0].condition):{match:'ANY (OR)',conditions:[],groups:branches.map(b=>visibilityRule(b.condition))}},answers,notes:'Complete question data from uploaded questionnaire-v3.json. Canonical mappings and remember choice are retained only where supplied previously.'};
 });
 result.nodes.push(...baseline.nodes.filter(n=>n.type!=='question').map(clone));
 result.groups=baseline.groups.map((g,i)=>({...g,title:pkg.stages[i]?.stageName.toUpperCase()||g.title,stage:clone(pkg.stages[i])}));
 result.start=ordered[0]?.questionCode||'';
 result.referenceLinks=clone(baseline.referenceLinks||[]);
 const links=new Map(result.referenceLinks.map(l=>[l.source+'|'+l.target,l]));
 for(const n of result.nodes.filter(n=>n.sourceRecord)){
  for(const branch of n.details.branches)for(const c of conditions(branch.condition)){
   const source=conditionSources[c.fieldCode];if(!source||source===n.id)continue;
   const key=source+'|'+n.id,existing=links.get(key),label=c.fieldCode+' '+c.operator+' '+c.value;
   if(existing){existing.visibilityDependencies??=[];existing.visibilityDependencies.push({ruleOrder:branch.ruleOrder,...clone(c)});existing.visibilityLabel=existing.visibilityDependencies.map(d=>d.fieldCode+' '+d.operator+' '+d.value).join(' · ');}
   else{const link={source,target:n.id,label,displayLabel:label,kind:'visibility',traced:true,evidence:'JSON visibility rule; source question associated by field meaning',visibilityDependencies:[{ruleOrder:branch.ruleOrder,...clone(c)}]};links.set(key,link);result.referenceLinks.push(link);}
  }
 }
 result.sourceConflicts=detectConflicts(result);
 for(const conflict of result.sourceConflicts)if(conflict.source&&conflict.target){const link=links.get(conflict.source+'|'+conflict.target);if(link){link.sourceWarning=conflict.message;link.style='dashed';link.color='#d97706';link.executable=false;}}
 result.connectionReview={status:'JSON visibility imported; screenshot conflicts flagged',missingRoutes:['The export has visibility rules but no explicit answer destinations or canonical mapping catalog. Strategy entry conditions are not exported.'],note:'Visibility dependencies are not executable answer jumps. Screenshot references remain available.',conflicts:clone(result.sourceConflicts)};
 result.pendingSourceDetails=[];result.uploadProgress={questionDataComplete:true,source:'questionnaire-v3.json',questions:ordered.length};
 // Fresh projects get room for full wording and options. Upgrades never copy these coordinates.
 let cursor=100;
 for(const group of result.groups){
  for(const id of group.members){const n=result.nodes.find(n=>n.id===id);if(!n||n.type!=='question')continue;n.y=cursor;cursor+=nodeHeight(n)+90;}
  cursor+=150;
 }
 const stop=result.nodes.find(n=>n.id==='STOP-TX');if(stop)stop.y=result.nodes.find(n=>n.id==='Q001')?.y||100;
 return validate(result);
}
export function detectConflicts(flow){
 const conflicts=[],node=id=>flow.nodes.find(n=>n.id===id);
 for(const [source,target,message] of [
  ['Q043','Q053','Earlier No connector conflicts with Q053 visibility requiring mortgage.first.exists = Yes.'],
  ['Q049','Q058','Earlier Yes/Maybe label does not match the exported Q049 options; Q058 has its own OR visibility rule.'],
  ['Q099','Q150','Earlier Yes connector conflicts with Q099 being a currency input.']
 ])if(node(source)&&node(target))conflicts.push({source,target,message});
 for(const n of flow.nodes)for(const b of n.details?.branches||[])for(const c of conditions(b.condition)){
  const source=conditionSources[c.fieldCode],parent=node(source);if(!parent)continue;
  const values=c.operator==='in'?String(c.value).split(','):[c.value];
  if(parent.answers.length&&values.some(v=>!parent.answers.some(a=>a.value===v)))conflicts.push({source,target:n.id,field:c.fieldCode,message:`${n.id} visibility uses ${values.join(', ')}, which does not match all exported option values on ${source}.`});
 }
 for(const n of flow.nodes)if(n.sourceRecord&&n.title.trim()==='New question')conflicts.push({target:n.id,message:'The uploaded source still names this card "New question"; a final prompt was not supplied.'});
 return conflicts;
}

