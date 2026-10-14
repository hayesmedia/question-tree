export const q075Currency={prompt:'How much extra money will you set aside for unexpected rehab costs?',responseType:'CURRENCY',placeholder:'Dollar amount',unit:'$',minValue:0,maxValue:null,beginnerHelp:'Enter the dollar amount reserved for unexpected rehab costs, separate from the planned rehab budget.'};
export function correctQ075(flow){
 if(flow.questionCorrections?.Q075==='currency-v1')return false;
 const node=flow.nodes.find(n=>n.id==='Q075');
 const record=flow.sourcePackage?.questions?.find(q=>q.questionCode==='Q075');
 if(!node&&!record)return false;
 if(node){node.title=q075Currency.prompt;node.details??={};Object.assign(node.details,{responseType:q075Currency.responseType,placeholder:q075Currency.placeholder,unit:q075Currency.unit,minValue:0,maxValue:null,beginnerHelp:q075Currency.beginnerHelp});if(node.sourceRecord)Object.assign(node.sourceRecord,q075Currency);}
 if(record)Object.assign(record,q075Currency);
 flow.questionCorrections={...flow.questionCorrections,Q075:'currency-v1'};return true;
}
