export function adoptSpouseName(flow){
 if(flow.nodes.some(n=>n.id==='G001B'))return false;
 const node=flow.nodes.find(n=>n.type==='question'&&n.details?.responseType==='TEXT'&&/spouse/i.test(n.title)&&/legal name/i.test(n.title));if(!node)return false;
 const old=node.id;node.id=node.questionCode='G001B';
 for(const group of flow.groups)group.members=group.members.map(id=>id===old?'G001B':id);
 for(const n of flow.nodes){for(const a of n.answers||[])if(a.target===old)a.target='G001B';for(const key of ['continueTarget','sequenceTarget'])if(n[key]===old)n[key]='G001B';}
 for(const link of flow.referenceLinks||[])for(const key of ['source','target'])if(link[key]===old)link[key]='G001B';
 return true;
}
export function correctMonthlyDebt(flow){
 if(flow.questionCorrections?.monthlyDebt==='monthly-v1')return false;
 const node=flow.nodes.find(n=>n.id==='Q091');if(!node)return false;
 const prompt='What will your total monthly loan payments be for this rental property, including principal and interest?';
 node.title=prompt;node.details={...node.details,responseType:'CURRENCY',unit:'$',measurementPeriod:'MONTHLY',annualizationMultiplier:12,whyWeAsk:'Monthly principal and interest payments are multiplied by 12 to determine annual debt service for DSCR.',beginnerHelp:'Enter the total monthly principal and interest on all loans for this property. Exclude taxes and insurance counted as operating expenses.'};
 for(const record of [node.sourceRecord,flow.sourcePackage?.questions?.find(q=>q.questionCode==='Q091')])if(record)Object.assign(record,{prompt,responseType:'CURRENCY',unit:'$',measurementPeriod:'MONTHLY',annualizationMultiplier:12,whyItMatters:node.details.whyWeAsk,beginnerHelp:node.details.beginnerHelp});
 flow.questionCorrections={...flow.questionCorrections,monthlyDebt:'monthly-v1'};return true;
}
export function correctConfirmedRoutes(flow){
 if(flow.questionCorrections?.confirmedRoutes==='oct14-v1')return false;
 for(const [id,target] of [['Q060','Q110'],['Q010','Q012'],['Q014','Q016'],['Q027','Q028'],['Q040','G001']]){
  const node=flow.nodes.find(n=>n.id===id);if(!node||!flow.nodes.some(n=>n.id===target))continue;
  for(const a of node.answers){a.target=target;a.routing='auto';}
  node.sequenceTarget=target;
  flow.referenceLinks=(flow.referenceLinks||[]).filter(l=>l.source!==id||(!['sequence','bypass','stage-transition','continuation'].includes(l.kind)&&!l.executable));
  if(!node.answers.length){node.continueTarget=target;flow.referenceLinks.push({source:id,target,kind:'continuation',executable:true,provenance:'json-confirmed',label:'Continue',displayLabel:'Continue',width:4,color:'#168d88',style:'solid',routing:'auto'});}
 }
 flow.questionCorrections={...flow.questionCorrections,confirmedRoutes:'oct14-v1'};return true;
}
export function correctSellerAuthority(flow){
 if(flow.questionCorrections?.sellerAuthority==='homestead-to-authority-v1')return false;
 const home=flow.nodes.find(n=>n.id==='G001A'),authority=flow.nodes.find(n=>n.id==='Q041');if(!home||!authority||!flow.nodes.some(n=>n.id==='Q042'))return false;
 for(const answer of home.answers){answer.target='Q041';delete answer.fallbackTarget;delete answer.connectionLabel;answer.routing='auto';}
 home.sequenceTarget='Q041';if(home.continueTarget)home.continueTarget='Q041';
 const owner=flow.nodes.find(n=>n.id==='Q040');if(owner){owner.sequenceTarget=owner.continueTarget='G001';flow.referenceLinks=(flow.referenceLinks||[]).filter(l=>!(l.source==='Q040'&&['sequence','bypass','continuation'].includes(l.kind)));flow.referenceLinks.push({source:'Q040',target:'G001',kind:'continuation',executable:true,provenance:'json-confirmed',label:'Continue',displayLabel:'Continue',width:4,color:'#168d88',style:'solid',routing:'auto'});}
 authority.sequenceTarget=authority.continueTarget='Q042';
 flow.referenceLinks=(flow.referenceLinks||[]).filter(l=>!(l.source==='G001A'&&['sequence','bypass','continuation'].includes(l.kind))&&!(l.source==='Q041'&&(['sequence','bypass','continuation'].includes(l.kind)||l.executable)));
 flow.referenceLinks.push({source:'Q041',target:'Q042',kind:'continuation',executable:true,provenance:'json-confirmed',label:'Continue',displayLabel:'Continue',width:4,color:'#168d88',style:'solid',routing:'auto'});
 flow.deletedReferenceLinks=[...new Set([...(flow.deletedReferenceLinks||[]),'G001A|Q042','Q041|G001','Q040|Q041'])];
 if(flow.sourcePackage)flow.sourcePackage.sellerAuthorityAfterHomestead=true;
 flow.questionCorrections={...flow.questionCorrections,sellerAuthority:'homestead-to-authority-v1'};return true;
}
