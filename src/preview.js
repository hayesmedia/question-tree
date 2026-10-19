export const inputType=n=>({CURRENCY:'number',PERCENTAGE:'number',NUMBER:'number',YEAR:'number',DATE:'date',TEXT:'text'})[n.details?.responseType]||'text';
export function checkResponse(n,value){
 const d=n.details||{};
 if(value===''||value===undefined||value===null)return d.isRequired?'This answer is required.':'';
 if(['CURRENCY','PERCENTAGE','NUMBER','YEAR'].includes(d.responseType)){
  const number=Number(value);if(!Number.isFinite(number))return 'Enter a valid number.';
  if(d.responseType==='YEAR'&&!Number.isInteger(number))return 'Enter a whole year.';
  if(d.minValue!==null&&d.minValue!==undefined&&number<d.minValue)return `Enter ${d.minValue} or more.`;
  if(d.maxValue!==null&&d.maxValue!==undefined&&number>d.maxValue)return `Enter ${d.maxValue} or less.`;
 }
 if(d.responseType==='DATE'&&!/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return 'Enter a valid date.';
 return '';
}
export function visibilityState(n,flow,responses,visited=new Set()){
 if(visited.has(n.id))return null;visited=new Set(visited);visited.add(n.id);
 if(flow.sourceConflicts?.some(c=>c.target===n.id&&c.field))return null;
 const rule=n.details?.visibility;if(!rule)return true;
 function evaluate(r){
  const states=(r.conditions||[]).map(c=>{
   const source=Object.hasOwn(responses,c.field)?c.field:c.sourceQuestion||flow.conditionSources?.[c.field];if(!source)return null;
   if(responses[source]===undefined||responses[source]===null){const parent=flow.nodes.find(p=>p.id===source);if(parent&&visibilityState(parent,flow,responses,visited)===false)return false;return null;}
   let actual=responses[source];if(c.field==='property.address.state')actual=actual==='Yes'?'TX':actual==='No'?'NON_TX':actual;
   const values=c.values||[c.value];if(['equals','eq'].includes(c.operator))return actual===values[0];
   if(['is one of','in'].includes(c.operator))return values.includes(actual);return null;
  });
  states.push(...(r.groups||[]).map(evaluate));if(!states.length)return true;
  const any=r.match==='ANY (OR)'||r.combinator==='OR';
  if(any){if(states.includes(true))return true;return states.includes(null)?null:false;}
  if(states.includes(false))return false;return states.includes(null)?null:true;
 }
 return evaluate(rule);
}
export function nextPreview(flow,currentId,responses,strategy='STAGE_5A',explicitTarget=''){
 const current=flow.nodes.find(n=>n.id===currentId);
 explicitTarget ||= current?.continueTarget||'';
 if(explicitTarget){const target=flow.nodes.find(n=>n.id===explicitTarget);if(target&&(target.type==='deal'||visibilityState(target,flow,responses)!==false))return target;const answer=current?.answers.find(a=>(a.value??a.label)===responses[currentId]&&a.target===explicitTarget);const fallback=flow.nodes.find(n=>n.id===answer?.fallbackTarget);if(fallback&&(fallback.type==='deal'||visibilityState(fallback,flow,responses)!==false))return fallback;}
 if(flow.navigationMode==='explicit-only')return null;
 const list=flow.nodes.filter(n=>n.type==='question'&&(!n.details?.stage?.startsWith('STAGE_5')||n.details.stage===strategy));
 const index=list.findIndex(n=>n.id===currentId);if(index<0)return null;
 return list.slice(index+1).find(n=>visibilityState(n,flow,responses)!==false)||null;
}
