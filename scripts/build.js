import {mkdir,rm,cp} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const output=new URL('_site/',root);
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
for(const name of ['index.html','src','flows'])await cp(new URL(name,root),new URL(name,output),{recursive:true});
console.log('Built _site with index.html, src and flows only.');
