export function correctFinancing(flow){
 if(flow.questionCorrections?.financing==='yes-no-v1')return false;

 const question=flow.nodes.find(n=>n.id==='Q031');if(!question)return false;
 question.details.allowUnknown=false;for(const record of [question.sourceRecord,flow.sourcePackage?.questions?.find(q=>q.questionCode==='Q031')])if(record)record.allowUnknown=false;
 flow.conditionSources={...flow.conditionSources,'property.addendums.has.thirdPartyFinancingAddendum':'Q031'};
 for(const answer of question.answers)if(['Yes','No'].includes(answer.value||answer.label)){answer.target=(answer.value||answer.label)==='No'?'Q033':'Q032';answer.routing='auto';answer.color??='#168d88';answer.style??='solid';}
 for(const id of ['Q032']){const node=flow.nodes.find(n=>n.id===id);if(!node)continue;
  const rule={conditions:[{fieldCode:'property.addendums.has.thirdPartyFinancingAddendum',operator:'eq',value:'Yes'}],combinator:'AND'};
  const branches=[{ruleOrder:1,conditionJson:JSON.stringify(rule)}];
  node.details.branches=branches.map(b=>({...b,condition:structuredClone(rule)}));node.details.visibility={match:'ALL (AND)',conditions:[{field:'property.addendums.has.thirdPartyFinancingAddendum',sourceQuestion:'Q031',operator:'eq',values:['Yes']}],groups:[]};
  for(const record of [node.sourceRecord,flow.sourcePackage?.questions?.find(q=>q.questionCode===id)])if(record)record.branches=structuredClone(branches);
 }
 for(const link of flow.referenceLinks||[])if(['Q032'].includes(link.target)&&link.visibilityDependencies?.some(c=>c.fieldCode==='property.addendums.has.thirdPartyFinancingAddendum')){
  for(const c of link.visibilityDependencies)if(c.fieldCode==='property.addendums.has.thirdPartyFinancingAddendum'){c.operator='eq';c.value='Yes';}
  link.label=link.displayLabel='Yes';if(link.sourceRule){link.sourceRule.condition={conditions:[{fieldCode:'property.addendums.has.thirdPartyFinancingAddendum',operator:'eq',value:'Yes'}],combinator:'AND'};link.sourceRule.conditionJson=JSON.stringify(link.sourceRule.condition);}
 }
 flow.questionCorrections={...flow.questionCorrections,financing:'yes-no-v1'};return true;
}
