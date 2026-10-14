const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const clone=value=>value===undefined?undefined:structuredClone(value);
export function identity(value){
 if(value===null||typeof value!=='object')return 'scalar:'+typeof value+':'+String(value);
 for(const field of ['id','questionCode','stageCode','optionValue'])if(value[field]!==undefined)return field+':'+String(value[field]);
 if(value.source!==undefined&&value.target!==undefined)return 'link:'+value.source+'|'+value.target+'|'+(value.kind||'');
 for(const field of ['field','fieldCode','ruleOrder','value','label'])if(value[field]!==undefined&&typeof value[field]!=='object')return field+':'+String(value[field]);
 return null;
}
const pathName=path=>path.map(segment=>typeof segment==='string'?segment:segment.identity).join('.');
export function mergeProject(base,local,remote){
 const conflicts=[];
 const conflict=(path,b,l,r)=>{conflicts.push({path,pathName:pathName(path),base:clone(b),local:clone(l),remote:clone(r)});return clone(l);};
 function merge(b,l,r,path){
  if(equal(l,r))return clone(l);if(equal(l,b))return clone(r);if(equal(r,b))return clone(l);
  if(Array.isArray(b)&&Array.isArray(l)&&Array.isArray(r)){
   const keys=array=>array.map(identity),bk=keys(b),lk=keys(l),rk=keys(r);
   if([...bk,...lk,...rk].some(key=>key===null)||[bk,lk,rk].some(keys=>new Set(keys).size!==keys.length))return conflict(path,b,l,r);
   const bm=new Map(bk.map((key,i)=>[key,b[i]])),lm=new Map(lk.map((key,i)=>[key,l[i]])),rm=new Map(rk.map((key,i)=>[key,r[i]]));
   const shared=bk.filter(key=>lm.has(key)&&rm.has(key)),lo=lk.filter(key=>shared.includes(key)),ro=rk.filter(key=>shared.includes(key));
   if(!equal(lo,shared)&&!equal(ro,shared)&&!equal(lo,ro))return conflict(path,b,l,r);
   const order=!equal(lo,shared)?lk:rk;const all=[...new Set([...order,...lk,...rk,...bk])],result=[];
   for(const key of all){const value=merge(bm.get(key),lm.get(key),rm.get(key),[...path,{identity:key,index:Math.max(0,bk.indexOf(key))}]);if(value!==undefined)result.push(value);}return result;
  }
  if([b,l,r].every(value=>value&&typeof value==='object'&&!Array.isArray(value))){const result={};for(const key of new Set([...Object.keys(b),...Object.keys(l),...Object.keys(r)])){const value=merge(b[key],l[key],r[key],[...path,key]);if(value!==undefined)result[key]=value;}return result;}
  return conflict(path,b,l,r);
 }
 return {value:merge(base,local,remote,[]),conflicts};
}
export function resolveMerge(result,choices){let value=clone(result.value);for(const conflict of result.conflicts){const choice=choices[conflict.pathName];if(!['local','remote'].includes(choice))throw Error('Choose a version for each conflicting field.');const selected=clone(conflict[choice]);if(!conflict.path.length){value=selected;continue;}let current=value;for(const segment of conflict.path.slice(0,-1)){current=typeof segment==='string'?current[segment]:current.find(item=>identity(item)===segment.identity);if(current===undefined)throw Error('Conflicting deletion needs a project-level review.');}const last=conflict.path.at(-1);if(typeof last==='string'){if(selected===undefined)delete current[last];else current[last]=selected;}else{const index=current.findIndex(item=>identity(item)===last.identity);if(selected===undefined){if(index>=0)current.splice(index,1);}else if(index>=0)current[index]=selected;else current.splice(Math.min(last.index,current.length),0,selected);}}return value;}
