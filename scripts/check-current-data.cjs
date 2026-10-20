// Regression: newly authored data must survive every current-data download and canvas import.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[],records=new Map(),catalog=[];
 p.on('pageerror',e=>errors.push(e.message));
 const fixture={version:1,title:'Live original',canvasMode:'standalone',navigationMode:'explicit-only',start:'existing',nodes:[{id:'existing',questionCode:'Q001',type:'question',title:'Original wording',x:100,y:100,answers:[{label:'Yes',value:'Yes',target:''},{label:'No',value:'No',target:''}]}],groups:[],referenceLinks:[]};
 await p.addInitScript(f=>{if(!localStorage.getItem('question-tree'))localStorage.setItem('question-tree',JSON.stringify(f));},fixture);
 await p.route('**/api/project*',async route=>{const req=route.request(),url=new URL(req.url()),id=url.searchParams.get('canvas')||'main';if(url.pathname.endsWith('/live'))return route.abort();const saved=records.get(id)||{revision:0,flow:null};if(req.method()==='PUT'){const data=req.postDataJSON();if(data.revision!==saved.revision)return route.fulfill({status:409,json:saved});records.set(id,{revision:saved.revision+1,flow:data.flow});return route.fulfill({json:{revision:saved.revision+1}});}return route.fulfill({json:saved});});
 await p.route('**/api/canvases',async route=>{if(route.request().method()==='POST'){const item=route.request().postDataJSON();catalog.push(item);return route.fulfill({status:201,json:item});}return route.fulfill({json:{canvases:catalog}});});
 const read=()=>p.evaluate(()=>JSON.parse(localStorage.getItem(new URL(location.href).searchParams.has('canvas')?'question-tree:canvas:'+new URL(location.href).searchParams.get('canvas'):'question-tree')));
 const downloaded=async selector=>{const pending=p.waitForEvent('download');await p.locator(selector).click();return JSON.parse(fs.readFileSync(await(await pending).path()));};
 await p.goto('http://localhost:3000');await p.locator('[data-find="existing"]').waitFor();await p.waitForTimeout(900);
 await p.locator('#add-question').click();const custom=(await read()).nodes.at(-1).id;
 await p.locator('#question-code').fill('Q777');await p.locator('#question-code').press('Tab');
 await p.locator('#node-title').fill('Newly created question'); // no blur: must already be saved
 assert.equal((await read()).nodes.find(n=>n.id===custom).title,'Newly created question');
 await p.locator('[data-target="0"]').selectOption('existing');
 await p.locator('#tool-fill').evaluate(e=>{e.value='#123456';e.dispatchEvent(new Event('change',{bubbles:true}));});
 await p.locator('[data-label="0"]').fill('Definitely yes');
 assert.equal((await read()).nodes.find(n=>n.id===custom).answers[0].label,'Definitely yes');
 const exported=await downloaded('#export');assert.equal(exported.nodes.length,2);const authored=exported.nodes.find(n=>n.id===custom);assert.equal(authored.questionCode,'Q777');assert.equal(authored.answers[0].target,'existing');assert.equal(authored.fill,'#123456');
 await p.locator('[data-find="existing"]').click();await p.locator('#node-title').fill('Rephrased existing question');
 await p.locator('#source-data').click();const current=await downloaded('#download-source');assert.equal(current.nodes.length,2);assert.equal(current.nodes[0].title,'Rephrased existing question');assert.deepEqual(current.nodes[1],authored);
 await p.locator('#close').click();await p.reload();await p.locator('[data-find="'+custom+'"]').waitFor();assert.equal((await read()).nodes[0].title,'Rephrased existing question');
 // Import as a new canvas, then automatically open it. The original remains intact.
 await p.locator('#canvases').click();const chooser=p.waitForEvent('filechooser');await p.locator('#canvas-import').click();await(await chooser).setFiles({name:'latest.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(current))});
 await p.waitForURL(url=>url.searchParams.has('canvas'));await p.locator('[data-find="'+custom+'"]').waitFor();assert.deepEqual((await read()).nodes,current.nodes);
 await p.reload();await p.locator('[data-find="'+custom+'"]').waitFor();assert.deepEqual((await read()).nodes,current.nodes);
 assert.deepEqual((await downloaded('#export')).nodes,current.nodes);
 // Replacing the active canvas through the main Import also preserves all authored data.
 const replace=p.waitForEvent('filechooser');await p.locator('#import').click();await(await replace).setFiles({name:'latest.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(current))});await p.waitForTimeout(900);assert.deepEqual((await read()).nodes,current.nodes);
 await p.locator('[data-find="'+custom+'"]').click();await p.locator('#question-response-type').selectOption('CURRENCY');await p.locator('#question-continue').selectOption('existing');await p.locator('#node-title').fill('Edited on second canvas');
 const second=await downloaded('#export'),secondNode=second.nodes.find(n=>n.id===custom);assert.equal(secondNode.details.responseType,'CURRENCY');assert.equal(secondNode.continueTarget,'existing');assert.equal(secondNode.title,'Edited on second canvas');
 await p.locator('#node-title').fill('Saved before leaving field');await p.reload();await p.locator('[data-find="'+custom+'"]').waitFor();assert.equal((await read()).nodes.find(n=>n.id===custom).title,'Saved before leaving field');
 const original=await p.evaluate(()=>JSON.parse(localStorage.getItem('question-tree')));assert.deepEqual(original.nodes,current.nodes);assert.deepEqual(errors,[]);
 console.log('Current JSON downloads, immediate text persistence, new questions/answers/routes/colors, new-canvas import, active-canvas replacement, reload, type/continuation export, and original preservation passed.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
