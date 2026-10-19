import {nodeWidth,nodeHeight} from './geometry.js';
export const questionsCanvasId='questions-only-oct19-2026';
export const defaultCanvases=[{id:'main',name:'Original canvas'},{id:questionsCanvasId,name:'Questions only · Oct 19'}];
export function validCanvasId(value){return typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value);}
export function storageKey(key,id='main'){return id==='main'||key==='question-tree-theme'?key:key+':canvas:'+id;}
export function canvasApi(path,id='main'){return id==='main'?path:path+'?canvas='+encodeURIComponent(id);}
export function emptyCanvas(title='New canvas'){return {version:1,title,start:'',nodes:[],groups:[],referenceLinks:[],canvasMode:'standalone',navigationMode:'explicit-only',conditionSources:{}};}
export function questionsOnly(original,title='Questions only · Oct 19'){
 const flow=emptyCanvas(title);flow.nodes=structuredClone(original.nodes.filter(n=>n.type==='question'));
 const columns=5,width=Math.max(235,...flow.nodes.map(nodeWidth))+100;let y=100;
 for(let i=0;i<flow.nodes.length;i+=columns){const row=flow.nodes.slice(i,i+columns);for(const [column,n] of row.entries()){
  n.x=100+column*width;n.y=y;n.answers=n.answers.map(a=>{const copy={...a,target:''};for(const key of ['fallbackTarget','connectionLabel','points','routing','color','style','arrow','width'])delete copy[key];return copy;});
  for(const key of ['continueTarget','sequenceTarget','responseSettings','sourceOwner','sourceStage'])delete n[key];
  if(n.details){delete n.details.visibility;n.details.branches=[];}
  if(n.sourceRecord){n.sourceRecord.prompt=n.title;n.sourceRecord.questionCode=n.questionCode||n.id;n.sourceRecord.branches=[];n.sourceRecord.responseType=n.details?.responseType||'SINGLE_SELECT';for(const key of ['unit','minValue','maxValue','placeholder'])if(Object.hasOwn(n.details||{},key))n.sourceRecord[key]=n.details[key];n.sourceRecord.options=n.answers.map((a,index)=>({optionValue:a.value??a.label,optionLabel:a.label,sortOrder:index+1,isUnknownOption:a.unknown||false,helpText:a.helpText||null}));}
 }y+=Math.max(...row.map(nodeHeight))+110;}
 flow.start=flow.nodes[0]?.id||'';return flow;
}
