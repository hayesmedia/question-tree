export const wholesalePrompt='Is assigning this deal to another buyer for a fee your primary plan? (Wholesale)';
export function correctWholesaleIntent(flow){
 if(flow.questionCorrections?.wholesaleIntent==='v1')return false;
 const node=flow.nodes.find(n=>n.id==='Q130');if(!node)return false;
 const labels=['Yes','No','No, but I want the option to assign'];
 const why='Distinguishes a primary wholesale strategy from purchasing while keeping assignment available as an alternative.';
 const help='No signed agreement is required to answer this planning question. Assignment eligibility must be checked in the proposed agreement.';
 node.title=wholesalePrompt;node.answers=labels.map((label,i)=>({...node.answers.find(a=>a.value===label||a.label===label),label,value:label,sortOrder:i+1,unknown:false,target:node.answers.find(a=>a.value===label||a.label===label)?.target||''}));
 node.details={...node.details,responseType:'SINGLE_SELECT',whyWeAsk:why,beginnerHelp:help};
 for(const record of [node.sourceRecord,flow.sourcePackage?.questions?.find(q=>q.questionCode==='Q130')])if(record){record.prompt=wholesalePrompt;record.responseType='SINGLE_SELECT';record.whyItMatters=why;record.beginnerHelp=help;record.options=labels.map((label,i)=>({optionValue:label,optionLabel:label,isUnknownOption:false,helpText:null,sortOrder:i+1}));}
 flow.questionCorrections={...flow.questionCorrections,wholesaleIntent:'v1'};return true;
}
