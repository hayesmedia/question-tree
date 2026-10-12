// The JSON exports field conditions but no question-to-field mapping table.
// These unique prompt matches are diagram associations only: inferred edges
// never assign canonical values or become executable answer destinations.
const fieldPrompts={
 'property.address.state':/^Is the property in Texas\?$/i,
 'property.type':/^What type of property is it\?$/i,
 'property.hasHOA':/mandatory membership.*property owners association/i,
 'property.hasMud':/inside a municipal utility district/i,
 'property.waterRights':/^Are groundwater, water wells/i,
 'property.hasLease':/^Is the property currently rented under a residential lease/i,
 'property.occupied':/^Who occupies the property today/i,
 'property.addendums.has.section1031Exchange':/intend to complete a Section 1031 exchange/i,
 'property.addendums.has.thirdPartyFinancingAddendum':/^Will third-party financing be a condition/i,
 'property.addendums.has.backUpContract':/^Will this be a backup contract/i,
 'seller.maritalHomesteadStatus':/^Is the seller married/i,
 'mortgage.first.exists':/^Is there an existing mortgage or deed of trust/i,
 'mortgage.first.status':/^Is the loan current/i,
 'seller.openToSellerFinance':/seller consider receiving payments over time/i,
 'seller.openToSubjectTo':/seller consider leaving the existing loan in place/i,
 'seller.openToWrap':/new note to be created while an existing loan remains/i,
 'deal.refinanceAvailable':/^Is a refinance realistically available/i,
 'insurance.insurable':/^Can the property be insured at a cost/i,
 'creativeFinance.isWrap':/^Does the proposed new seller-financed note wrap/i,
 'contract.fullyExecuted':/^Has the contract been fully executed/i
};
export function addLongConnections(flow){
 const questions=flow.nodes.filter(n=>n.type==='question'),links=new Map(flow.referenceLinks.map(l=>[l.source+'|'+l.target,l]));
 const add=l=>{const key=l.source+'|'+l.target;if(!links.has(key)){flow.referenceLinks.push(l);links.set(key,l);}return links.get(key);};
 flow.diagramFieldAssociations={};
 function leaves(rule){return [...(rule.conditions||[]),...(rule.groups||[]).flatMap(leaves)];}
 for(const target of questions)for(const branch of target.details.branches){
  for(const condition of leaves(branch.condition)){
   const pattern=fieldPrompts[condition.fieldCode],candidates=pattern?questions.filter(n=>pattern.test(n.sourceRecord.prompt)):[];
   if(candidates.length!==1||candidates[0].id===target.id)continue;
   const source=candidates[0],label=`${condition.fieldCode} ${condition.operator} ${condition.value}`;
   flow.diagramFieldAssociations[condition.fieldCode]={question:source.id,evidence:'Unique match to question wording; mapping not exported'};
   const link=add({source:source.id,target:target.id,label,displayLabel:label,kind:'dependency',provenance:'json-inferred-dependency',inferred:true,executable:false,evidence:'Visibility condition is exported; source question inferred from its wording.',traced:false,style:'dashed',width:4,color:'#9575ed',routing:'orthogonal',sourceRule:structuredClone(branch)});
   link.visibilityDependencies??=[];link.visibilityDependencies.push({ruleOrder:branch.ruleOrder,...structuredClone(condition)});
  }
 }
 const stages=[...flow.sourcePackage.stages].sort((a,b)=>a.sortOrder-b.sortOrder);
 const inStage=s=>questions.filter(q=>q.details.stage===s.stageCode).sort((a,b)=>a.details.sortOrder-b.details.sortOrder);
 const core=stages.filter(s=>s.stageKind==='CORE'&&inStage(s).length),routes=stages.filter(s=>s.stageKind==='ROUTE_VALIDATION'&&inStage(s).length);
 const bridge=(source,target,label,inferred=false)=>add({source:source.id,target:target.id,label,displayLabel:label,kind:'stage-transition',provenance:inferred?'json-inferred-stage-navigation':'json-core-stage-order',inferred,executable:false,evidence:inferred?'Diagram navigation based on stage kind/order and explicitly selected preview route; entry conditions are not exported.':'Core-stage order from the exported sortOrder, not an answer destination.',traced:!inferred,style:inferred?'dashed':'solid',width:4,color:inferred?'#9575ed':'#168d88',routing:'orthogonal'});
 for(let i=0;i<core.length-1;i++){
  const from=core[i],to=core[i+1],between=routes.filter(s=>s.sortOrder>from.sortOrder&&s.sortOrder<to.sortOrder);
  if(between.length)for(const route of between){bridge(inStage(from).at(-1),inStage(route)[0],'Selected route: '+route.stageName,true);bridge(inStage(route).at(-1),inStage(to)[0],'Continue to '+to.stageName,true);}
  else bridge(inStage(from).at(-1),inStage(to)[0],'Continue to '+to.stageName);
 }
 return flow;
}
