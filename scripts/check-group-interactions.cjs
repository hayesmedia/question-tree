// Run against the local server with Playwright installed outside the repository:
// PLAYWRIGHT_MODULE_PATH=/path/to/playwright node scripts/check-group-interactions.cjs [project.json]
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(process.argv[2])await page.addInitScript(f=>localStorage.setItem('question-tree',JSON.stringify(f)),JSON.parse(fs.readFileSync(process.argv[2])));
  await page.goto(process.env.TEST_ORIGIN||'http://localhost:3000');await page.locator('[data-find="Q040"]').click();
  const node=page.locator('.node[data-id="Q040"]'),rect=await node.boundingBox(),x=rect.x+35,y=rect.y+30;
  const transform=await page.locator('.world').evaluate(e=>e.style.transform),saved=await page.evaluate(()=>localStorage.getItem('question-tree'));
  await page.evaluate(()=>{window.originalWorldCard=document.querySelector('.node[data-id="Q040"]');window.worldRebuilds=0;new MutationObserver(()=>window.worldRebuilds++).observe(document.querySelector('.world'),{childList:true});});
  await page.mouse.dblclick(x,y,{delay:80});
  assert.equal(await page.locator('.canvas').evaluate(e=>e.classList.contains('isolated')),true,'double-click must enter group');
  assert.equal(await page.evaluate(()=>window.worldRebuilds),1,'only entering the group should rebuild the diagram');
  assert.equal(await page.locator('.world').evaluate(e=>e.style.transform),transform,'entering must preserve viewport');
  await page.locator('#exit-group').click();
  assert.equal(await page.locator('.canvas').evaluate(e=>e.classList.contains('isolated')),false);
  assert.equal(await page.locator('.world').evaluate(e=>e.style.transform),transform,'exiting must preserve viewport');
  assert.equal(await page.evaluate(()=>localStorage.getItem('question-tree')),saved,'selection must not alter saved project');
  assert.deepEqual(errors,[]);console.log('Group double-click, viewport, selection-only rendering, and saved-data checks passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
