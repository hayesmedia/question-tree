export function routingAudit(flow){
 const nodes=new Map(flow.nodes.map(n=>[n.id,n])),unbound=[],visibility=[],defaults=[],conflicts=[];
 for(const link of flow.referenceLinks||[]){const source=nodes.get(link.source);if(!source)continue;
  if(link.executable&&source.continueTarget!==link.target)conflicts.push({source:source.id,target:link.target,label:link.displayLabel||link.label,missing:'Visible continuation differs from the saved routing destination.'});
  if(link.userCreated&&!link.inferred&&source.type==='question'&&!link.executable&&source.continueTarget!==link.target&&!source.answers.some(a=>a.target===link.target&&[a.label,a.value].includes(link.displayLabel||link.label)))unbound.push({source:source.id,target:link.target,label:link.displayLabel||link.label,missing:'Which answer should trigger this connection?'});
 }
 const walk=(node,rule)=>{for(const c of rule.conditions||[]){const mapped=c.sourceQuestion||flow.conditionSources?.[c.field];if(!mapped||!nodes.has(mapped))visibility.push({question:node.id,field:c.field,operator:c.operator,values:c.values||[c.value],missing:'Source question and any value conversion required to evaluate this field.'});}for(const group of rule.groups||[])walk(node,group);};
 for(const node of flow.nodes){if(node.continueTarget&&!nodes.has(node.continueTarget))conflicts.push({source:node.id,target:node.continueTarget,missing:'Continuation points to a missing question.'});if(node.details?.visibility)walk(node,node.details.visibility);if(node.type==='question')for(const answer of node.answers)if(!answer.target)defaults.push({question:node.id,answer:answer.label,continuation:node.continueTarget||null,missing:node.continueTarget?'Uses the question continuation.':'Uses question order; no explicit answer destination.'});}
 return {unboundConnections:unbound,continuationConflicts:conflicts,unresolvedVisibility:visibility,answersUsingDefaultOrder:defaults};
}
