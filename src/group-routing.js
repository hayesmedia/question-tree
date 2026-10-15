import {nodeWidth,nodeHeight,routeConnector,pointsPath,connectionPorts} from './geometry.js';
export function groupRectangle(group,nodes){const members=nodes.filter(n=>group.members.includes(n.id));if(!members.length)return null;return {x:Math.min(...members.map(n=>n.x))-22,y:Math.min(...members.map(n=>n.y))-48,width:Math.max(...members.map(n=>n.x+nodeWidth(n)))-Math.min(...members.map(n=>n.x))+44,height:Math.max(...members.map(n=>n.y+nodeHeight(n)))-Math.min(...members.map(n=>n.y))+70};}
export function isMainGreen(link){if(link.style==='dashed'||(!link.style&&link.traced===false))return false;const color=link.color||(link.traced?'#168d88':'');if(!/^#[\da-f]{6}$/i.test(color))return false;const [r,g,b]=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));return g>r+20&&g>b*.75;}
export function routeBetweenGroups(source,target,link,nodes,groups){
 if(!isMainGreen(link)||link.points?.length)return null;
 const sg=groups.find(g=>g.members.includes(source.id))||{id:'node:'+source.id,members:[source.id]},tg=groups.find(g=>g.members.includes(target.id))||{id:'node:'+target.id,members:[target.id]};if(sg.id===tg.id)return null;const obstacles=[...groups,...nodes.filter(n=>!groups.some(g=>g.members.includes(n.id))).map(n=>({id:'node:'+n.id,members:[n.id]}))];
 const boxes=obstacles.map(g=>({...groupRectangle(g,nodes),id:g.id,answers:[],title:''})).filter(b=>b.width);
 const s=boxes.find(b=>b.id===sg.id),t=boxes.find(b=>b.id===tg.id);if(!s||!t)return null;
 const separatedX=s.x+s.width<=t.x||t.x+t.width<=s.x;
 const nextColumn=separatedX&&target.y+nodeHeight(target)/2<source.y+nodeHeight(source)/2;
 const right=t.x>s.x;
 const {from,to}=connectionPorts(source,target,[],nextColumn?{sourceSide:right?'right':'left',targetSide:right?'left':'right'}:{});
 const start=from.edge,end=to.edge;
 const portal=(edge,side,box)=>side==='top'?{x:edge.x,y:box.y-30}:side==='bottom'?{x:edge.x,y:box.y+box.height+30}:side==='left'?{x:box.x-30,y:edge.y}:{x:box.x+box.width+30,y:edge.y};
 const sp=portal(start,from.side,s),tp=portal(end,to.side,t);
 const proxySource={x:sp.x-15,y:sp.y-39,width:1,height:78,answers:[]},proxyTarget={x:tp.x+14,y:tp.y-39,width:1,height:78,answers:[]};
 // Tiny endpoint proxies only specify portals; groups are the routing obstacles.
 const routed=routeConnector(proxySource,proxyTarget,boxes,[],{sourceSide:'right',targetSide:'left'}),points=[start,...routed.points.slice(1,-1),end];
 let longest=0,label={x:sp.x,y:sp.y};for(let i=2;i<points.length-1;i++){const a=points[i-1],b=points[i],length=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);if(length>longest){longest=length;label={x:(a.x+b.x)/2,y:(a.y+b.y)/2};}}
 return {points,d:pointsPath(points),x:label.x+6,y:label.y-8,fallback:routed.fallback};
}
