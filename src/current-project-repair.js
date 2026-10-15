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
