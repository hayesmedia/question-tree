import {nodeWidth,nodeHeight,routeConnector,pointsPath} from './geometry.js';
export function groupRectangle(group,nodes){const members=nodes.filter(n=>group.members.includes(n.id));if(!members.length)return null;return {x:Math.min(...members.map(n=>n.x))-22,y:Math.min(...members.map(n=>n.y))-48,width:Math.max(...members.map(n=>n.x+nodeWidth(n)))-Math.min(...members.map(n=>n.x))+44,height:Math.max(...members.map(n=>n.y+nodeHeight(n)))-Math.min(...members.map(n=>n.y))+70};}
export function isMainGreen(link){if(link.style==='dashed'||(!link.style&&link.traced===false))return false;const color=link.color||(link.traced?'#168d88':'');if(!/^#[\da-f]{6}$/i.test(color))return false;const [r,g,b]=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));return g>r+20&&g>b*.75;}
export function routeBetweenGroups(source,target,link,nodes,groups){
 if(!isMainGreen(link)||link.points?.length)return null;
 const sg=groups.find(g=>g.members.includes(source.id))||{id:'node:'+source.id,members:[source.id]},tg=groups.find(g=>g.members.includes(target.id))||{id:'node:'+target.id,members:[target.id]};if(sg.id===tg.id)return null;const obstacles=[...groups,...nodes.filter(n=>!groups.some(g=>g.members.includes(n.id))).map(n=>({id:'node:'+n.id,members:[n.id]}))];
 const boxes=obstacles.map(g=>({...groupRectangle(g,nodes),id:g.id,answers:[],title:''})).filter(b=>b.width);
 const s=boxes.find(b=>b.id===sg.id),t=boxes.find(b=>b.id===tg.id),dx=t.x+t.width/2-s.x-s.width/2,dy=t.y+t.height/2-s.y-s.height/2;
 let start,end,sp,tp;
 // Prefer the clear corridor between group boundaries. Tall side-by-side
 // groups can have very different centers without being vertically stacked.
 const separatedX=s.x+s.width<=t.x||t.x+t.width<=s.x;
 const separatedY=s.y+s.height<=t.y||t.y+t.height<=s.y;
 const vertical=!separatedX&&(separatedY||Math.abs(dy)>Math.abs(dx));
 if(vertical){
  const down=dy>=0;start={x:source.x+nodeWidth(source)/2,y:source.y+(down?nodeHeight(source):0)};end={x:target.x+nodeWidth(target)/2,y:target.y+(down?0:nodeHeight(target))};sp={x:start.x,y:down?s.y+s.height+30:s.y-30};tp={x:end.x,y:down?t.y-30:t.y+t.height+30};
 }else{
  const right=dx>=0;start={x:source.x+(right?nodeWidth(source):0),y:source.y+nodeHeight(source)/2};end={x:target.x+(right?0:nodeWidth(target)),y:target.y+nodeHeight(target)/2};sp={x:right?s.x+s.width+30:s.x-30,y:start.y};tp={x:right?t.x-30:t.x+t.width+30,y:end.y};
 }
 const proxySource={x:sp.x-15,y:sp.y-39,width:1,height:78,answers:[]},proxyTarget={x:tp.x+14,y:tp.y-39,width:1,height:78,answers:[]};
 // Tiny endpoint proxies only specify portals; groups are the routing obstacles.
 const routed=routeConnector(proxySource,proxyTarget,boxes),points=[start,...routed.points.slice(1,-1),end];
 let longest=0,label={x:sp.x,y:sp.y};for(let i=2;i<points.length-1;i++){const a=points[i-1],b=points[i],length=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);if(length>longest){longest=length;label={x:(a.x+b.x)/2,y:(a.y+b.y)/2};}}
 return {points,d:pointsPath(points),x:label.x+6,y:label.y-8,fallback:routed.fallback};
}
