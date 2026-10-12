import {addLongConnections} from './connections.js';
import {validate,mergeSource} from './model.js';
import {nodeHeight} from './geometry.js';
import {convertLegacyPackage} from './legacy-source.js';
const clone=v=>v===undefined?undefined:structuredClone(v);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function conditions(rule){return [...(rule.conditions||[]),...(rule.groups||[]).flatMap(conditions)];}
function parseBranches(branches){return branches.map(b=>({...b,condition:JSON.parse(b.conditionJson)}));}
function visibilityRule(rule){return {match:rule.combinator==='OR'?'ANY (OR)':'ALL (AND)',conditions:(rule.conditions||[]).map(c=>({field:c.fieldCode,operator:c.operator,values:c.operator==='in'?String(c.value).split(','):[c.value]})),groups:(rule.groups||[]).map(visibilityRule)};}
function ruleLabel(rule){const terms=[...(rule.conditions||[]).map(c=>c.fieldCode+' '+c.operator+' '+c.value),...(rule.groups||[]).map(r=>'('+ruleLabel(r)+')')];return terms.join(' '+(rule.combinator||'AND')+' ');}
export function convertPackage(pkg){
 if(!pkg||typeof pkg.questionnaireName!=='string'||!Array.isArray(pkg.questions)||!Array.isArray(pkg.stages))throw Error('Invalid questionnaire package.');
 const orderedStages=[...pkg.stages].sort((a,b)=>a.sortOrder-b.sortOrder),stages=new Map(orderedStages.map(s=>[s.stageCode,s]));
 if(stages.size!==orderedStages.length)throw Error('Duplicate stage.');
 const result={version:1,title:pkg.questionnaireName,start:'',sourceModel:'json-linked-v2',sourceRevision:pkg.exportedAtUtc,sourcePackage:clone(pkg),nodes:[],groups:[],referenceLinks:[],conditionSources:{},sourceConflicts:[],sourceNotes:['Recreated exclusively from the uploaded JSON.','Order connectors reflect sortOrder; rule connectors reflect exported visibility conditions.','No screenshot routes or settings are included. Dashed long dependencies are inferred from unique question wording; route-navigation links show selected strategy sections.'],connectionReview:{status:'JSON only',missingRoutes:[],note:'Order and visibility connectors are generated from the JSON and are not answer destinations.'},uploadProgress:{questionDataComplete:true,source:'questionnaire-v3.json',questions:pkg.questions.length}};
 const ids=new Set();
 for(const q of pkg.questions){if(typeof q.questionCode!=='string'||ids.has(q.questionCode)||typeof q.prompt!=='string'||!stages.has(q.stageCode)||!Array.isArray(q.options)||!Array.isArray(q.branches))throw Error('Invalid or duplicate question.');ids.add(q.questionCode);}
 let cursor=100,rowTop=100,rowBottom=100;
 for(const [stageIndex,stage] of orderedStages.entries()){
  cursor=rowTop;const offsetX=(stageIndex%5)*1600;
  const group={id:stage.stageCode,title:stage.stageName,members:[],stage:clone(stage)};result.groups.push(group);
  const questions=pkg.questions.filter(q=>q.stageCode===stage.stageCode).sort((a,b)=>a.sortOrder-b.sortOrder);
  for(const [i,q] of questions.entries()){
   const branches=parseBranches(q.branches),n={id:q.questionCode,questionCode:q.questionCode,type:'question',title:q.prompt,section:stage.stageName,strategyTag:q.routeCode||null,x:850+offsetX,y:cursor,textIncomplete:false,sourceRecord:clone(q),sequenceTarget:questions[i+1]?.questionCode||'',details:{whyWeAsk:q.whyItMatters,beginnerHelp:q.beginnerHelp,stage:q.stageCode,responseType:q.responseType,persona:q.personaMode,routeTag:q.routeCode,sourceUrl:q.sourceUrl,placeholder:q.placeholder,unit:q.unit,minValue:q.minValue,maxValue:q.maxValue,isRequired:q.isRequired,allowUnknown:q.allowUnknown,sortOrder:q.sortOrder,branches,visibility:branches.length===1?visibilityRule(branches[0].condition):{match:'ANY (OR)',conditions:[],groups:branches.map(b=>visibilityRule(b.condition))}},answers:[...q.options].sort((a,b)=>a.sortOrder-b.sortOrder).map(o=>{if(typeof o.optionValue!=='string'||typeof o.optionLabel!=='string')throw Error('Invalid option.');return {value:o.optionValue,label:o.optionLabel,unknown:o.isUnknownOption,helpText:o.helpText,sortOrder:o.sortOrder,target:''};})};
   result.nodes.push(n);group.members.push(n.id);if(!result.start)result.start=n.id;
   if(i)result.referenceLinks.push({source:questions[i-1].questionCode,target:n.id,label:'Next in stage order',displayLabel:'Next',kind:'sequence',provenance:'json-order',traced:true,width:4,style:'solid',color:'#168d88'});
   let ruleCursor=cursor;
   for(const b of branches){const rule={id:'RULE:'+q.questionCode+':'+b.ruleOrder,type:'shape',shape:'note',title:ruleLabel(b.condition),section:'Visibility · '+(b.condition.combinator||'AND'),x:280+offsetX,y:ruleCursor,width:400,answers:[],sourceRule:clone(b),sourceOwner:n.id};if(ids.has(rule.id))throw Error('Reserved rule ID collision.');ids.add(rule.id);result.nodes.push(rule);group.members.push(rule.id);ruleCursor+=nodeHeight(rule)+30;result.referenceLinks.push({source:rule.id,target:n.id,label:rule.title,displayLabel:'Visible when '+(b.condition.combinator||'AND'),kind:'visibility',provenance:'json-visibility',routing:'straight',traced:true,width:4,color:'#6754d9',style:'solid',visibilityDependencies:conditions(b.condition).map(c=>({ruleOrder:b.ruleOrder,...clone(c)})),sourceRule:clone(b)});}
   cursor=Math.max(cursor+nodeHeight(n),ruleCursor)+90;
  }
  for(const b of parseBranches(stage.branches||[])){const rule={id:'STAGE-RULE:'+stage.stageCode+':'+b.ruleOrder,type:'shape',shape:'note',title:ruleLabel(b.condition),section:stage.stageName+' · stage condition',x:280+offsetX,y:cursor,width:400,answers:[],sourceRule:clone(b),sourceStage:clone(stage)};result.nodes.push(rule);group.members.push(rule.id);if(questions.length)result.referenceLinks.push({source:rule.id,target:questions[0].questionCode,label:rule.title,displayLabel:'Stage condition '+(b.condition.combinator||'AND'),kind:'visibility',provenance:'json-stage-visibility',routing:'straight',traced:true,width:4,color:'#6754d9',sourceRule:clone(b)});cursor+=nodeHeight(rule)+90;}
  rowBottom=Math.max(rowBottom,cursor);if(stageIndex%5===4)rowTop=rowBottom+250;
 }
 return validate(addLongConnections(result));
}
// Three-way source upgrade: only fields still equal to their screenshot source
// are replaced. Canvas geometry, groups and edited destinations are user-owned.
export function upgradeSource(current,source,baseline){
 if(current.sourceModel===source.sourceModel&&current.sourceRevision===source.sourceRevision&&same(current.sourcePackage,source.sourcePackage))return {flow:current,changed:false,preserved:[]};
 const screenshotGroups=baseline.groups;
 if(current.sourcePackage){baseline=['json-only-v1','json-linked-v2'].includes(current.sourceModel)?convertPackage(current.sourcePackage):convertLegacyPackage(current.sourcePackage,baseline);}
 const previous=clone(current),preserved=[];
 const oldLinks=new Map((baseline.referenceLinks||[]).map(l=>[l.source+'|'+l.target,l]));
 previous.referenceLinks=(previous.referenceLinks||[]).filter(l=>{const old=oldLinks.get(l.source+'|'+l.target);if(!old||l.userCreated||['json-only-v1','json-linked-v2'].includes(current.sourceModel))return true;return false;});
 const result=mergeSource(previous,source);
 for(const link of result.referenceLinks){const prior=current.referenceLinks?.find(l=>l.source===link.source&&l.target===link.target),old=oldLinks.get(link.source+'|'+link.target);if(!prior||!old)continue;for(const key of ['color','width','arrow','routing','points','style'])if(prior[key]!==undefined&&!same(prior[key],old[key]))link[key]=clone(prior[key]);}
 // Place new rule cards beside their current target, even if the user moved it.
 const originalIds=new Set(current.nodes.map(n=>n.id));
 for(const rule of result.nodes.filter(n=>(n.sourceOwner||n.sourceStage)&&!originalIds.has(n.id))){const owner=rule.sourceOwner||source.nodes.find(n=>n.details?.stage===rule.sourceStage.stageCode)?.id;const target=result.nodes.find(n=>n.id===owner);if(target){rule.x=target.x-570;rule.y=target.y;}}
 // Keep rules with the actual saved group of their target; never regroup existing cards.
 for(const rule of result.nodes.filter(n=>n.sourceOwner||n.sourceStage)){
  const owner=rule.sourceOwner||source.nodes.find(n=>n.details?.stage===rule.sourceStage.stageCode)?.id;
  const actual=current.groups.find(g=>g.members.includes(owner));if(!actual)continue;
  for(const g of result.groups)g.members=g.members.filter(id=>id!==rule.id);
  result.groups.find(g=>g.id===actual.id)?.members.push(rule.id);
 }
 result.groups=result.groups.filter(g=>g.members.length);
 for(const g of result.groups){const oldGroup=baseline.groups.find(b=>b.id===g.id),fresh=source.groups.find(s=>s.members.some(id=>g.members.includes(id)&&source.nodes.find(n=>n.id===id)?.type==='question'));if(oldGroup&&fresh&&(g.title===oldGroup.title||g.title===screenshotGroups.find(s=>s.id===g.id)?.title)){g.title=fresh.title;g.stage=clone(fresh.stage);}}

 const oldNodes=new Map(baseline.nodes.map(n=>[n.id,n]));
 const removed=new Set(baseline.nodes.filter(n=>!source.nodes.some(s=>s.id===n.id)&&n.id==='STOP-TX').map(n=>n.id));
 result.nodes=result.nodes.filter(n=>!removed.has(n.id)&&(!n.sourceOwner||result.nodes.some(t=>t.id===n.sourceOwner&&!removed.has(t.id))));const keptIds=new Set(result.nodes.map(n=>n.id));for(const g of result.groups)g.members=g.members.filter(id=>keptIds.has(id));result.groups=result.groups.filter(g=>g.members.length);
 for(const n of result.nodes)for(const a of n.answers)if(removed.has(a.target))a.target='';
 result.referenceLinks=result.referenceLinks.filter(l=>keptIds.has(l.source)&&keptIds.has(l.target));
 function mergeValue(currentValue,oldValue,newValue,path){
  if(same(currentValue,oldValue)||currentValue===undefined)return clone(newValue);
  if(newValue&&currentValue&&typeof newValue==='object'&&!Array.isArray(newValue)&&!Array.isArray(currentValue)){
   const value=clone(currentValue);for(const key of Object.keys(oldValue||{}))if(!(key in newValue)&&same(currentValue[key],oldValue[key]))delete value[key];for(const key of Object.keys(newValue))value[key]=mergeValue(currentValue[key],oldValue?.[key],newValue[key],path+'.'+key);return value;
  }
  if(!same(currentValue,newValue))preserved.push(path);return clone(currentValue);
 }
 for(const n of result.nodes){const incoming=source.nodes.find(s=>s.id===n.id),old=oldNodes.get(n.id);if(!incoming||!old||n.type!=='question')continue;
  for(const key of ['title','questionCode','section','strategyTag','textIncomplete','notes','details'])n[key]=mergeValue(n[key],old[key],incoming[key],n.id+'.'+key);
  const oldAnswers=old.answers,existing=n.answers;
  if(same(existing,oldAnswers))n.answers=clone(incoming.answers);
  else{
   const match=(a,b)=>(a.value!==undefined&&a.value===b.value)||a.label===b.label;
   n.answers=existing.map(a=>{const previous=oldAnswers.find(b=>match(a,b)),fresh=incoming.answers.find(b=>match(a,b));return previous&&fresh?mergeValue(a,previous,fresh,n.id+'.answers.'+(a.value||a.label)):clone(a);});
   for(const a of incoming.answers)if(!oldAnswers.some(b=>match(a,b))&&!existing.some(b=>match(a,b)))n.answers.push(clone(a));
   if(!same(n.answers,incoming.answers))preserved.push(n.id+'.answers');
  }
  n.sourceRecord=clone(incoming.sourceRecord);n.sequenceTarget=incoming.sequenceTarget;
 }
 for(const incoming of source.referenceLinks||[]){const l=result.referenceLinks.find(l=>l.source===incoming.source&&l.target===incoming.target);const old=baseline.referenceLinks?.find(l=>l.source===incoming.source&&l.target===incoming.target);if(!l)continue;for(const key of ['visibilityDependencies','visibilityLabel','sourceWarning','executable','evidence'])if(incoming[key]!==undefined)l[key]=clone(incoming[key]);if(old&&incoming.sourceWarning){for(const key of ['color','style'])if(l[key]===undefined||same(l[key],old[key]))l[key]=incoming[key];}}
 for(const l of result.referenceLinks)l.width=Math.max(4,l.width||4);for(const n of result.nodes)for(const a of n.answers)if(a.target)a.width=Math.max(4,a.width||4);
 result.diagramFieldAssociations=clone(source.diagramFieldAssociations);result.sourceModel=source.sourceModel;result.sourceRevision=source.sourceRevision;result.sourcePackage=clone(source.sourcePackage);result.conditionSources=clone(source.conditionSources);result.sourceConflicts=clone(source.sourceConflicts);result.connectionReview=clone(source.connectionReview);result.uploadProgress=clone(source.uploadProgress);for(const key of ['retiredReferenceLinks','pendingSourceDetails'])delete result[key];result.sourceNotes=clone(source.sourceNotes);result.sourceUpgrade={revision:source.sourceRevision,preservedFields:[...new Set(preserved)]};
 return {flow:validate(result),changed:true,preserved:result.sourceUpgrade.preservedFields};
}

// Manually imported packages remain authoritative until the user explicitly
// reviews deployed source data. A deployment must not roll them back on reload.
export function upgradeForDeployment(current,source,baseline){
 if((current.sourceImport==='manual'&&current.sourceModel===source.sourceModel)||(current.sourceRevision&&Date.parse(current.sourceRevision)>Date.parse(source.sourceRevision)))return {flow:current,changed:false,preserved:[]};
 return upgradeSource(current,source,baseline);
}
