export const responseTypes=[['SINGLE_SELECT','Multiple choice (single answer)'],['NUMBER','Number'],['TEXT','Text'],['CURRENCY','Dollar amount'],['PERCENTAGE','Percentage'],['YEAR','Year'],['DATE','Date']];
export const isTypedQuestion=n=>n.type==='question'&&responseTypes.some(([type])=>type!=='SINGLE_SELECT'&&type===n.details?.responseType);
export function questionCode(flow,node,value){let code=value.trim().toUpperCase();if(/^\d+$/.test(code))code='Q'+code.padStart(3,'0');if(!/^[A-Z][A-Z0-9_-]*$/.test(code))throw Error('Enter a question number such as Q131 or G001.');if(flow.nodes.some(n=>n!==node&&n.type==='question'&&(n.questionCode||n.id).toUpperCase()===code))throw Error('That question number is already used by an active question.');return code;}
export function setQuestionCode(flow,node,value){node.questionCode=questionCode(flow,node,value);if(node.sourceRecord)node.sourceRecord.questionCode=node.questionCode;}
function syncRecord(node){if(!node.sourceRecord)return;Object.assign(node.sourceRecord,{questionCode:node.questionCode||node.id,responseType:node.details.responseType,unit:node.details.unit,minValue:node.details.minValue,maxValue:node.details.maxValue,placeholder:node.details.placeholder,options:node.answers.map((a,i)=>({optionValue:a.value??a.label,optionLabel:a.label,isUnknownOption:a.unknown||false,helpText:a.helpText||null,sortOrder:i+1}))});}
export function setResponseType(node,type){
 if(!responseTypes.some(([value])=>value===type))throw Error('Choose a supported answer type.');
 const old=node.details?.responseType||'SINGLE_SELECT';if(old===type)return;
 node.responseSettings??={};node.responseSettings[old]={answers:structuredClone(node.answers),continueTarget:node.continueTarget||'',unit:node.details?.unit??null,minValue:node.details?.minValue??null,maxValue:node.details?.maxValue??null,placeholder:node.details?.placeholder??null};
 const targets=[...new Set(node.answers.map(a=>a.target).filter(Boolean))],saved=node.responseSettings[type];
 node.details={...node.details,responseType:type,unit:saved?.unit??(type==='CURRENCY'?'$':type==='PERCENTAGE'?'%':null),minValue:saved?.minValue??null,maxValue:saved?.maxValue??null,placeholder:saved?.placeholder??null};
 node.answers=type==='SINGLE_SELECT'?structuredClone(saved?.answers||[{label:'Yes',value:'Yes',target:'',sortOrder:1},{label:'No',value:'No',target:'',sortOrder:2}]):[];
 const next=saved?saved.continueTarget:node.continueTarget||(targets.length===1?targets[0]:'');if(next)node.continueTarget=next;else delete node.continueTarget;
 syncRecord(node);
}
export function changeResponseType(flow,node,type){
 const old=node.details?.responseType||'SINGLE_SELECT';if(old===type)return;
 const navigation=(flow.referenceLinks||[]).filter(l=>l.source===node.id&&(l.executable||l.kind==='sequence'));
 let restored=node.responseSettings?.[type]?.navigationLinks;const previousTarget=node.continueTarget;
 setResponseType(node,type);
 if(old!=='SINGLE_SELECT'&&type!=='SINGLE_SELECT'){restored=navigation;if(previousTarget)node.continueTarget=previousTarget;else delete node.continueTarget;}node.responseSettings[old].navigationLinks=structuredClone(navigation);
 flow.referenceLinks=(flow.referenceLinks||[]).filter(l=>!navigation.includes(l));
 if(restored)flow.referenceLinks.push(...structuredClone(restored));
 else if(node.continueTarget)flow.referenceLinks.push({source:node.id,target:node.continueTarget,kind:'continuation',executable:true,userCreated:true,label:'Continue',displayLabel:'Continue',routing:'auto',style:'solid',color:'#168d88',width:5,arrow:'end'});
}
