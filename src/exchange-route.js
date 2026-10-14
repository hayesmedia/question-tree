export function correctExchange(flow){
 if(flow.questionCorrections?.exchange==='yes-unknown-v1')return false;
 const question=flow.nodes.find(n=>n.id==='Q027');if(!question)return false;
 flow.conditionSources={...flow.conditionSources,'property.addendums.has.section1031Exchange':'Q027'};
 for(const answer of question.answers)if(['Yes','No','Unknown'].includes(answer.value||answer.label)){answer.target=(answer.value||answer.label)==='No'?'Q028':'G017';answer.routing='auto';answer.color??='#168d88';answer.style??='solid';}
 for(const id of ['G017']){const node=flow.nodes.find(n=>n.id===id);if(!node)continue;
  const rule={conditions:[{fieldCode:'property.addendums.has.section1031Exchange',operator:'in',value:'Yes,Unknown'}],combinator:'AND'};
  const branches=[{ruleOrder:1,conditionJson:JSON.stringify(rule)}];
  node.details.branches=branches.map(b=>({...b,condition:structuredClone(rule)}));node.details.visibility={match:'ALL (AND)',conditions:[{field:'property.addendums.has.section1031Exchange',sourceQuestion:'Q027',operator:'in',values:['Yes','Unknown']}],groups:[]};
  for(const record of [node.sourceRecord,flow.sourcePackage?.questions?.find(q=>q.questionCode===id)])if(record)record.branches=structuredClone(branches);
 }
 for(const link of flow.referenceLinks||[])if(['G017'].includes(link.target)&&link.visibilityDependencies?.some(c=>c.fieldCode==='property.addendums.has.section1031Exchange')){
  for(const c of link.visibilityDependencies)if(c.fieldCode==='property.addendums.has.section1031Exchange'){c.operator='in';c.value='Yes,Unknown';}
  link.label=link.displayLabel='Yes / Unknown';if(link.sourceRule){link.sourceRule.condition={conditions:[{fieldCode:'property.addendums.has.section1031Exchange',operator:'in',value:'Yes,Unknown'}],combinator:'AND'};link.sourceRule.conditionJson=JSON.stringify(link.sourceRule.condition);}
 }
 flow.questionCorrections={...flow.questionCorrections,exchange:'yes-unknown-v1'};return true;
}
