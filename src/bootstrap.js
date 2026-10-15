// Keep the saved project recoverable if module loading or startup fails.
try{await import('./app.js');}
catch(error){
 const root=document.querySelector('#app');root.replaceChildren();
 const panel=document.createElement('main');panel.style.cssText='max-width:600px;margin:64px auto;padding:24px;font:16px system-ui;line-height:1.6';
 const heading=document.createElement('h1');heading.textContent='Question Tree could not finish loading';
 const message=document.createElement('p');message.textContent='Your saved project has not been cleared. Download a recovery copy, import a valid project JSON, or retry loading.';
 const detail=document.createElement('pre');detail.style.whiteSpace='pre-wrap';detail.textContent=error?.message||'Startup error';
 const retry=document.createElement('button');retry.textContent='Retry loading';retry.onclick=()=>location.reload();
 const download=document.createElement('button');download.textContent='Download recovery copy';download.style.marginLeft='12px';
 let data=null;try{data=localStorage.getItem('question-tree')||localStorage.getItem('question-tree-backup');}catch{}
 download.disabled=!data;download.onclick=()=>{const url=URL.createObjectURL(new Blob([data],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='question-tree-recovery.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const choose=document.createElement('button');choose.textContent='Import recovery JSON';choose.style.marginLeft='12px';
 const file=document.createElement('input');file.type='file';file.accept='.json';file.hidden=true;file.setAttribute('aria-label','Recovery project JSON');choose.onclick=()=>file.click();
 file.onchange=async()=>{if(!file.files[0])return;try{const {validate}=await import('./model.js'),raw=await file.files[0].text();validate(JSON.parse(raw));if(data)localStorage.setItem('question-tree-recovery-before-import',data);localStorage.setItem('question-tree',raw);location.reload();}catch(error){detail.textContent='Recovery import failed: '+error.message;}};
 panel.append(heading,message,detail,retry,download,choose,file);root.append(panel);
}
