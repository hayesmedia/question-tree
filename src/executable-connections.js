export function createExecutableConnection(flow,sourceId,targetId,answerIndex=null){
 const source=flow.nodes.find(n=>n.id===sourceId),target=flow.nodes.find(n=>n.id===targetId);if(!source||!target)throw Error('Connection endpoint not found.');if(source.type==='question'&&target.type==='shape')throw Error('A questionnaire route must end at a question or outcome.');
 const style={routing:'auto',style:'solid',color:'#168d88',width:5,arrow:'end'};
 if(source.type==='question'&&answerIndex!==null){const answer=source.answers[answerIndex];if(!answer)throw Error('Choose an answer.');Object.assign(answer,style,{target:targetId});return 'a:'+flow.nodes.indexOf(source)+':'+answerIndex;}
 flow.referenceLinks??=[];
 if(source.type==='question'){
  const oldTarget=source.continueTarget;
  const existing=flow.referenceLinks.find(l=>l.source===sourceId&&l.executable&&l.target===oldTarget)||flow.referenceLinks.find(l=>l.source===sourceId&&l.kind==='continuation'&&l.executable)||flow.referenceLinks.find(l=>l.source===sourceId&&l.kind==='sequence'&&!l.inferred);
  source.continueTarget=targetId;
  const link={...style,source:sourceId,target:targetId,label:'Continue',displayLabel:'Continue',traced:true,userCreated:true,kind:'continuation',executable:true};
  if(existing){if(!existing.userCreated)flow.deletedReferenceLinks=[...new Set([...(flow.deletedReferenceLinks||[]),existing.source+'|'+existing.target])];for(const key of ['visibilityDependencies','sourceRule','stageRules','evidence','inferred','sourceWarning'])delete existing[key];Object.assign(existing,link);return 'r:'+flow.referenceLinks.indexOf(existing);}
  flow.referenceLinks.push(link);return 'r:'+(flow.referenceLinks.length-1);
 }
 flow.referenceLinks.push({...style,source:sourceId,target:targetId,label:'Connection',displayLabel:'Connection',traced:true,userCreated:true,kind:'annotation',executable:false});return 'r:'+(flow.referenceLinks.length-1);
}
export function upgradeManualConnections(flow){
 if(flow.connectionRoutingVersion===1)return false;let changed=false;
 const remove=new Set();for(const link of flow.referenceLinks||[]){const source=flow.nodes.find(n=>n.id===link.source);if(source?.type!=='question'||link.inferred||!link.target)continue;if(source.continueTarget===link.target){if(!link.executable){link.executable=true;changed=true;}continue;}if(!link.userCreated||link.executable)continue;
 const label=(link.displayLabel||link.label||'').trim().toLowerCase();const matches=source.answers.filter(a=>[a.label,a.value].some(value=>typeof value==='string'&&value.trim().toLowerCase()===label));
 if(matches.length===1){const answer=matches[0];if(!answer.target||answer.target===link.target){for(const key of ['color','width','arrow','style','routing','points'])if(link[key]!==undefined)answer[key]=structuredClone(link[key]);answer.target=link.target;remove.add(link);changed=true;}}
 else if(source.details?.responseType&&source.details.responseType!=='SINGLE_SELECT'&&!source.continueTarget&&(flow.referenceLinks||[]).filter(l=>l.userCreated&&!l.inferred&&l.source===source.id).length===1){source.continueTarget=link.target;link.kind='continuation';link.executable=true;changed=true;}
 }
 flow.referenceLinks=(flow.referenceLinks||[]).filter(l=>!remove.has(l));flow.connectionRoutingVersion=1;return true;
}
