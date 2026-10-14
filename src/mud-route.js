export function correctMud(flow){
 if(flow.questionCorrections?.mud==='yes-unknown-v1')return false;
 const question=flow.nodes.find(n=>n.id==='QG-MUD');if(!question)return false;
 flow.conditionSources={...flow.conditionSources,'property.hasMud':'QG-MUD'};
 for(const answer of question.answers)if(['Yes','No','Unknown'].includes(answer.value||answer.label)){answer.target=(answer.value||answer.label)==='No'?'Q017':'G006';answer.routing='auto';answer.color??='#168d88';answer.style??='solid';}
 for(const id of ['G006','G007']){const node=flow.nodes.find(n=>n.id===id);if(!node)continue;
  const rule={conditions:[{fieldCode:'property.hasMud',operator:'in',value:'Yes,Unknown'}],combinator:'AND'};
  const branches=[{ruleOrder:1,conditionJson:JSON.stringify(rule)}];
  node.details.branches=branches.map(b=>({...b,condition:structuredClone(rule)}));node.details.visibility={match:'ALL (AND)',conditions:[{field:'property.hasMud',sourceQuestion:'QG-MUD',operator:'in',values:['Yes','Unknown']}],groups:[]};
  for(const record of [node.sourceRecord,flow.sourcePackage?.questions?.find(q=>q.questionCode===id)])if(record)record.branches=structuredClone(branches);
 }
 for(const link of flow.referenceLinks||[])if(['G006','G007'].includes(link.target)&&link.visibilityDependencies?.some(c=>c.fieldCode==='property.hasMud')){
  for(const c of link.visibilityDependencies)if(c.fieldCode==='property.hasMud'){c.operator='in';c.value='Yes,Unknown';}
  link.label=link.displayLabel='Yes / Unknown';if(link.sourceRule){link.sourceRule.condition={conditions:[{fieldCode:'property.hasMud',operator:'in',value:'Yes,Unknown'}],combinator:'AND'};link.sourceRule.conditionJson=JSON.stringify(link.sourceRule.condition);}
 }
 flow.questionCorrections={...flow.questionCorrections,mud:'yes-unknown-v1'};return true;
}
