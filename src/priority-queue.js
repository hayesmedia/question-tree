// Lowest score first; newest item wins equal scores, matching stable sort/pop.
export class MinQueue{
 constructor(){this.items=[];this.sequence=0;}
 get length(){return this.items.length;}
 before(a,b){return a.value.score<b.value.score||a.value.score===b.value.score&&a.order>b.order;}
 push(value){const entry={value,order:this.sequence++},a=this.items;let i=a.length;a.push(entry);while(i){const p=(i-1)>>1;if(!this.before(entry,a[p]))break;a[i]=a[p];i=p;}a[i]=entry;}
 pop(){const a=this.items;if(!a.length)return;const first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let child=i*2+1;if(child+1<a.length&&this.before(a[child+1],a[child]))child++;if(!this.before(a[child],last))break;a[i]=a[child];i=child;}a[i]=last;}return first.value;}
}
