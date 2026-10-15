import {nodeWidth,nodeHeight,routeConnector,pointsPath} from './geometry.js';
import {routeBetweenGroups} from './group-routing.js';
import {pathFor} from './editing.js';
// Canvas, drag previews and exports share endpoint and label geometry.
export function connectorGeometry(source,target,link,nodes,groups,{preview=false,lane=0}={}){
 const answerIndex=source.answers?.indexOf(link)??-1,labelOffset=answerIndex<0?0:source.answers.slice(0,answerIndex).filter(a=>a.target===link.target).length*16;
 const finish=geometry=>({...geometry,y:geometry.y+labelOffset});
 const grouped=['straight','curved'].includes(link.routing)?null:routeBetweenGroups(source,target,link,nodes,groups);if(grouped)return finish(grouped);
 if(link.routing==='auto'||link.points?.length){const r=routeConnector(source,target,preview?[source,target]:nodes,link.points),middle=r.points[Math.floor(r.points.length/2)];return finish({...r,d:pointsPath(r.points),x:middle.x+6,y:middle.y-6});}
 if(link.routing&&link.routing!=='original'){const r=pathFor(source,target,link.routing,lane);return finish({...r,y:r.y-8});}
 const sy=source.y+nodeHeight(source),ty=target.y,rail=Math.min(source.x,target.x)-45-lane*24;
 const points=link.kind==='bypass'?[{x:source.x+nodeWidth(source)/2,y:sy},{x:rail,y:sy+20},{x:rail,y:ty-20},{x:target.x+nodeWidth(target)/2,y:ty}]:[{x:source.x+nodeWidth(source)/2,y:sy},{x:target.x+nodeWidth(target)/2,y:ty}];
 return finish({points,d:pointsPath(points),x:link.kind==='bypass'?rail+6:source.x+nodeWidth(source)/2+6,y:sy+18});
}
