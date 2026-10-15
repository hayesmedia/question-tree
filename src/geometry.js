import {MinQueue} from './priority-queue.js';
export const nodeWidth=n=>n.width||(n.shape==='diamond'?300:235);
export const nodeHeight=n=>{
 const font=n.fontSize||14,chars=Math.max(8,Math.floor((nodeWidth(n)-30)/(font*.6)));
 const lines=Math.max(1,Math.ceil(String(n.title||'').length/chars));
 const textHeight=lines*font*1.5+21,header=(n.section?25:0)+26;
 const answers=(n.answers||[]).reduce((sum,a)=>sum+Math.max(36,Math.ceil(String(a.label||'').length/Math.max(8,Math.floor((nodeWidth(n)-50)/7.2)))*18+18),0);
 return Math.max(n.height||0,n.shape==='diamond'?220:0,header+textHeight+answers+(n.sourceRecord&&n.details?.responseType!=='SINGLE_SELECT'?34:0),n.section?103:78);
};
function attachment(node,toward,side){
 const w=nodeWidth(node),h=nodeHeight(node),cx=node.x+w/2,cy=node.y+h/2,dx=toward.x-cx,dy=toward.y-cy;
 side ||= Math.abs(dx)/w>=Math.abs(dy)/h?(dx>=0?'right':'left'):(dy>=0?'bottom':'top');
 const normal={right:{x:1,y:0},left:{x:-1,y:0},bottom:{x:0,y:1},top:{x:0,y:-1}}[side];
 const edge={x:cx+normal.x*w/2,y:cy+normal.y*h/2};return {edge,portal:{x:edge.x+normal.x*14,y:edge.y+normal.y*14},side};
}
export function connectionPorts(source,target,points=[],ports={}){
 const center=n=>({x:n.x+nodeWidth(n)/2,y:n.y+nodeHeight(n)/2});
 const sc=center(source),tc=center(target);
 // For diagonally separated cards, a side exit and vertical arrival form
 // a natural elbow rather than reaching around for matching side ports.
 const diagonal=source.x+nodeWidth(source)+28<=target.x||target.x+nodeWidth(target)+28<=source.x;
 const verticalGap=source.y+nodeHeight(source)+28<=target.y||target.y+nodeHeight(target)+28<=source.y;
 const mixed=!points.length&&diagonal&&verticalGap;
 const from=attachment(source,points[0]||tc,ports.sourceSide||(mixed?(tc.x>=sc.x?'right':'left'):undefined)),to=attachment(target,points.at(-1)||sc,ports.targetSide||(mixed?(sc.y<tc.y?'top':'bottom'):undefined));
 return {from,to};
}
export function routeConnector(source,target,nodes,points=[],ports={}){
 const {from,to}=connectionPorts(source,target,points,ports);
 const start=from.portal,end=to.portal;if(points.length)return {points:[from.edge,...points,to.edge]};
const rects=nodes.map(n=>({x:n.x-8,y:n.y-8,right:n.x+nodeWidth(n)+8,bottom:n.y+nodeHeight(n)+8}));const xs=[...new Set([start.x,end.x,...rects.flatMap(r=>[r.x-6,r.right+6])])].sort((a,b)=>a-b),ys=[...new Set([start.y,end.y,...rects.flatMap(r=>[r.y-6,r.bottom+6])])].sort((a,b)=>a-b);const key=(x,y)=>x+','+y,blocked=(a,b)=>rects.some(r=>a.x===b.x?a.x>r.x&&a.x<r.right&&Math.max(a.y,b.y)>r.y&&Math.min(a.y,b.y)<r.bottom:a.y>r.y&&a.y<r.bottom&&Math.max(a.x,b.x)>r.x&&Math.min(a.x,b.x)<r.right);const initial={xi:xs.indexOf(start.x),yi:ys.indexOf(start.y),cost:0,score:0,dir:''};let queue=new MinQueue();queue.push(initial);let best=new Map(),parents=new Map(),finish;for(let count=0;queue.length&&count<12000;count++){const p=queue.pop(),pk=key(p.xi,p.yi)+'|'+p.dir;if(best.has(pk)&&best.get(pk)<p.cost)continue;if(xs[p.xi]===end.x&&ys[p.yi]===end.y){finish=pk;break;}for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xi=p.xi+dx,yi=p.yi+dy;if(xi<0||yi<0||xi>=xs.length||yi>=ys.length)continue;const a={x:xs[p.xi],y:ys[p.yi]},b={x:xs[xi],y:ys[yi]};if(blocked(a,b))continue;const dir=dx?'h':'v',cost=p.cost+Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+(p.dir&&p.dir!==dir?25:0),k=key(xi,yi)+'|'+dir;if(best.has(k)&&best.get(k)<=cost)continue;best.set(k,cost);parents.set(k,pk);queue.push({xi,yi,dir,cost,score:cost+Math.abs(b.x-end.x)+Math.abs(b.y-end.y)});}}
let route=[];if(finish){let k=finish;while(k){const [coords]=k.split('|'),[xi,yi]=coords.split(',').map(Number);route.push({x:xs[xi],y:ys[yi]});k=parents.get(k);}route.reverse();}else{const rail=Math.max(...rects.map(r=>r.right))+30;route=[start,{x:rail,y:start.y},{x:rail,y:end.y},end];}
const simplified=[];for(const p of route){if(simplified.length>1){const a=simplified.at(-2),b=simplified.at(-1);if(a.x===b.x&&b.x===p.x||a.y===b.y&&b.y===p.y)simplified.pop();}simplified.push(p);}return {points:[from.edge,...simplified,to.edge],fallback:!finish};}
export const pointsPath=points=>points.map((p,i)=>(i?'L':'M')+p.x+','+p.y).join(' ');
