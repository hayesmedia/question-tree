import {nodeWidth,nodeHeight} from './geometry.js';
// Preserve horizontal placement and existing order; only push cards apart.
export function spaceGroupCards(flow,dimensions=new Map(),gap=90){
 const before=new Map(flow.nodes.map(n=>[n.id,n.y]));
 const size=n=>dimensions.get(n.id)||{width:nodeWidth(n),height:nodeHeight(n)};
 const bounds=n=>{const {width,height}=size(n),angle=(n.rotation||0)*Math.PI/180;const w=Math.abs(width*Math.cos(angle))+Math.abs(height*Math.sin(angle)),h=Math.abs(width*Math.sin(angle))+Math.abs(height*Math.cos(angle));return {left:n.x+(width-w)/2,right:n.x+(width+w)/2,top:n.y+(height-h)/2,bottom:n.y+(height+h)/2};};
 for(const group of flow.groups){
  const members=flow.nodes.filter(n=>group.members.includes(n.id)).sort((a,b)=>a.y-b.y||a.x-b.x);
  const placed=[];
  for(const node of members){const b=bounds(node);let shift=0;for(const previous of placed)if(b.left<previous.right+gap&&b.right>previous.left-gap)shift=Math.max(shift,previous.bottom+gap-b.top);node.y+=shift;placed.push(bounds(node));}
 }
 return flow.nodes.filter(n=>n.y!==before.get(n.id)).map(n=>n.id);
}
