export function correctMortgage(flow){
 if(flow.questionCorrections?.mortgage==='exists-v1')return false;
 const question=flow.nodes.find(n=>n.id==='Q043');if(!question)return false;
 flow.conditionSources={...flow.conditionSources,'mortgage.first.exists':'Q043'};
 for(const answer of question.answers)if(['Yes','No'].includes(answer.value??answer.label)){answer.target=(answer.value??answer.label)==='Yes'?'Q044':'Q050';answer.routing='auto';answer.color??='#168d88';answer.style??='solid';}
 const bind=rule=>{for(const c of rule?.conditions||[])if(c.field==='mortgage.first.exists')c.sourceQuestion='Q043';for(const g of rule?.groups||[])bind(g);};
 for(const node of flow.nodes)bind(node.details?.visibility);
 // The answer routes replace this unconditional visual order connector.
 flow.referenceLinks=(flow.referenceLinks||[]).filter(l=>!(l.source==='Q043'&&l.kind==='sequence'));
 flow.deletedReferenceLinks=[...new Set([...(flow.deletedReferenceLinks||[]),'Q043|Q044'])];
 if(flow.sourcePackage)flow.sourcePackage.conditionSources={...flow.sourcePackage.conditionSources,'mortgage.first.exists':'Q043'};
 flow.questionCorrections={...flow.questionCorrections,mortgage:'exists-v1'};return true;
}
