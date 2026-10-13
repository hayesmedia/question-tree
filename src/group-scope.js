export const ownerGroup=(flow,id)=>flow.groups.find(g=>g.members.includes(id));
export function groupMembers(flow,groupId){return new Set(flow.groups.find(g=>g.id===groupId)?.members||[]);}
export function allowedNode(flow,groupId,id){return !groupId||groupMembers(flow,groupId).has(id);}
export function allowedLink(flow,groupId,source,target){return allowedNode(flow,groupId,source)&&allowedNode(flow,groupId,target);}
