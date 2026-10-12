import {nodeWidth,nodeHeight} from './geometry.js';
export function diagramBounds(nodes){
 if(!nodes.length)return null;
 const boxes=nodes.map(n=>{const w=nodeWidth(n),h=nodeHeight(n),angle=(n.rotation||0)*Math.PI/180,cx=n.x+w/2,cy=n.y+h/2,halfW=(Math.abs(w*Math.cos(angle))+Math.abs(h*Math.sin(angle)))/2,halfH=(Math.abs(w*Math.sin(angle))+Math.abs(h*Math.cos(angle)))/2;return {left:cx-halfW-24,right:cx+halfW+24,top:cy-halfH-48,bottom:cy+halfH+24};});
 return {left:Math.min(...boxes.map(b=>b.left)),right:Math.max(...boxes.map(b=>b.right)),top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom))};
}
export function centeredView(nodes,width,height,maxZoom=1){
 const bounds=diagramBounds(nodes);if(!bounds||width<=0||height<=0)return null;
 const zoom=Math.min(maxZoom,Math.max(1,width-80)/(bounds.right-bounds.left),Math.max(1,height-80)/(bounds.bottom-bounds.top));
 return {zoom,pan:{x:width/2-(bounds.left+bounds.right)/2*zoom,y:height/2-(bounds.top+bounds.bottom)/2*zoom}};
}
