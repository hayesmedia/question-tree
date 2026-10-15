// Run the local server, then set PLAYWRIGHT_MODULE_PATH and optionally pass a project JSON.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(process.argv[2])await page.addInitScript(f=>{if(!localStorage.getItem('question-tree'))localStorage.setItem('question-tree',JSON.stringify(f));},JSON.parse(fs.readFileSync(process.argv[2])));
  await page.route('**/src/app.js',async route=>{const response=await route.fetch();let code=await response.text();code+='\nwindow.performanceAudit={};'+['render','save','wireEdges','updateDrag'].map(name=>`{const original=${name};${name}=function(...args){const t=performance.now();try{return original(...args)}finally{(window.performanceAudit['${name}']??=[]).push(performance.now()-t)}}}`).join('');await route.fulfill({response,body:code});});
  await page.goto(process.env.TEST_ORIGIN||'http://localhost:3000');await page.locator('[data-find="Q040"]').click();
  const card=page.locator('.node[data-id="Q040"]'),rect=await card.boundingBox(),x=rect.x+35,y=rect.y+35;
  await page.mouse.dblclick(x,y,{delay:80});assert.equal(await page.locator('.canvas').evaluate(e=>e.classList.contains('isolated')),true);
  const original=await page.evaluate(()=>localStorage.getItem('question-tree')),transform=await page.locator('.world').evaluate(e=>e.style.transform);
  const before=await page.evaluate(()=>({renders:window.performanceAudit.render.length,saves:window.performanceAudit.save.length}));
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+100,y+60,{steps:10});
  const during=await page.evaluate(()=>({renders:window.performanceAudit.render.length,saves:window.performanceAudit.save.length}));
  assert.deepEqual(during,before,'movement must not rebuild or save the project');
  assert.equal(await page.evaluate(()=>localStorage.getItem('question-tree')),original,'no intermediate project snapshots during drag');
  await page.mouse.up();const saved=JSON.parse(await page.evaluate(()=>localStorage.getItem('question-tree'))),previous=JSON.parse(original);
  for(const node of saved.nodes){const old=previous.nodes.find(n=>n.id===node.id);if(node.id==='Q040'){assert.notEqual(node.x,old.x);assert.notEqual(node.y,old.y);}else{assert.equal(node.x,old.x,node.id);assert.equal(node.y,old.y,node.id);}}
  assert.equal(await page.locator('.world').evaluate(e=>e.style.transform),transform,'drag must not recenter');
  console.log(JSON.stringify(await page.evaluate(()=>Object.fromEntries(Object.entries(window.performanceAudit).map(([name,values])=>[name,{calls:values.length,totalMs:Math.round(values.reduce((a,b)=>a+b,0)),maxMs:Math.round(Math.max(...values))}]))),null,2));
  await page.reload();await page.locator('[data-find="Q040"]').waitFor();const reloaded=JSON.parse(await page.evaluate(()=>localStorage.getItem('question-tree')));assert.equal(reloaded.nodes.find(n=>n.id==='Q040').x,saved.nodes.find(n=>n.id==='Q040').x);assert.deepEqual(errors,[]);
  console.log('Drag previews, committed saving, unchanged other cards, viewport, and reload checks passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
