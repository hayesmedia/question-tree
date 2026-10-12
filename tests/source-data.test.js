import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {convertPackage,upgradeSource,conditions} from '../src/source-data.js';
import {validate,removeNodes,issues} from '../src/model.js';
import {csv,report} from '../src/export.js';
import {visibilityState,nextPreview,checkResponse} from '../src/preview.js';
const load=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url)));
const [pkg,baseline,source]=await Promise.all(['data/questionnaire-v3.json','flows/questionnaire-screenshot-baseline.json','flows/texas-questionnaire.json'].map(load));
test('all 149 records, stage definitions and every exported field survive conversion losslessly',()=>{
 assert.deepEqual(convertPackage(pkg,baseline),source);
 assert.deepEqual(source.sourcePackage,pkg);
 assert.equal(source.nodes.filter(n=>n.type==='question').length,149);
 for(const q of pkg.questions){const n=source.nodes.find(n=>n.id===q.questionCode);assert.equal(n.title,q.prompt);assert.equal(n.textIncomplete,false);assert.deepEqual(n.sourceRecord,q);assert.equal(n.details.beginnerHelp,q.beginnerHelp);assert.equal(n.details.responseType,q.responseType);assert.equal(n.answers.length,q.options.length);for(const o of q.options){const a=n.answers.find(a=>a.value===o.optionValue);assert.equal(a.label,o.optionLabel);assert.equal(a.helpText,o.helpText);assert.equal(a.unknown,o.isUnknownOption);}assert.deepEqual(n.details.branches.map(({condition,...b})=>b),q.branches);}
 assert.equal(issues(source).length,0);
});
test('every visibility condition is preserved and represented by a source dependency',()=>{
 let count=0;for(const n of source.nodes)for(const b of n.details?.branches||[]){count++;for(const c of conditions(b.condition)){const from=source.conditionSources[c.fieldCode];assert.ok(from,c.fieldCode);const l=source.referenceLinks.find(l=>l.source===from&&l.target===n.id);assert.ok(l);assert.ok(l.visibilityDependencies.some(d=>d.fieldCode===c.fieldCode&&d.value===c.value&&d.operator===c.operator));}}
 assert.equal(count,39);assert.ok(source.sourceConflicts.some(c=>c.target==='Q191'));
 for(const [from,to] of [['Q043','Q053'],['Q049','Q058'],['Q099','Q150'],['Q010','Q011']]){const l=source.referenceLinks.find(l=>l.source===from&&l.target===to);assert.ok(l.sourceWarning);assert.equal(l.executable,false);}
});
test('safe upgrade fills unchanged fragments while preserving geometry, grouping, routes and custom fields',()=>{
 const saved=structuredClone(baseline);const n=saved.nodes.find(n=>n.id==='Q088');n.x=9000;n.y=8000;n.width=400;n.rotation=15;
 const custom=saved.nodes.find(n=>n.id==='Q004');custom.title='My custom prompt';custom.details.whyWeAsk='My own explanation';custom.answers[0].target='Q043';custom.answers.splice(1,1);
 saved.groups=[{id:'custom-group',title:'My group',members:saved.nodes.map(n=>n.id)}];
 const link=saved.referenceLinks.find(l=>l.source==='Q099'&&l.target==='Q150');link.label='My route';link.color='#abcdef';link.points=[{x:99,y:88}];
 removeNodes(saved,new Set(['Q090']));
 const upgraded=upgradeSource(saved,source,baseline);validate(upgraded.flow);
 const updated=upgraded.flow.nodes.find(n=>n.id==='Q088');assert.equal(updated.title,pkg.questions.find(q=>q.questionCode==='Q088').prompt);for(const key of ['x','y','width','rotation'])assert.equal(updated[key],n[key]);
 const retained=upgraded.flow.nodes.find(n=>n.id==='Q004');assert.equal(retained.title,custom.title);assert.equal(retained.details.whyWeAsk,custom.details.whyWeAsk);assert.equal(retained.answers[0].target,'Q043');assert.ok(!retained.answers.some(a=>a.value==='Resale profit'));assert.equal(retained.details.beginnerHelp,pkg.questions.find(q=>q.questionCode==='Q004').beginnerHelp);
 assert.deepEqual(upgraded.flow.groups,saved.groups);assert.ok(!upgraded.flow.nodes.some(n=>n.id==='Q090'));
 const retainedLink=upgraded.flow.referenceLinks.find(l=>l.source==='Q099'&&l.target==='Q150');assert.equal(retainedLink.label,'My route');assert.equal(retainedLink.color,'#abcdef');assert.deepEqual(retainedLink.points,link.points);assert.ok(retainedLink.sourceWarning);
 assert.ok(upgraded.preserved.includes('Q004.title'));assert.equal(upgradeSource(upgraded.flow,source,baseline).changed,false);
});
test('new settings are filled when a saved card has a partial custom details object',()=>{
 const saved=structuredClone(baseline);saved.nodes.find(n=>n.id==='Q088').details={whyWeAsk:'My explanation'};
 const n=upgradeSource(saved,source,baseline).flow.nodes.find(n=>n.id==='Q088');assert.equal(n.details.whyWeAsk,'My explanation');assert.equal(n.details.responseType,'CURRENCY');
});
test('project CSV/PDF include all source prompts and complete configuration, metadata and conflicts',()=>{
 const c=csv(source),r=report(source);for(const q of pkg.questions){assert.ok(c.includes(q.prompt.replaceAll('"','""')),q.questionCode);const safe=q.prompt.replaceAll('&','&amp;').replaceAll("'",'&#39;');assert.ok(r.includes(safe),q.questionCode);}
 for(const field of ['Beginner help','Placeholder','Required','Allow unknown','Stage definition','Original question record'])assert.ok(c.includes(field));
 assert.ok(r.includes('Q099 being a currency input'));assert.ok(r.includes('No answer options are defined for this input.'));assert.ok(r.includes('blockedHeadline'));
});
test('preview uses typed values, skips false visibility and retains unresolved source conditions for review',()=>{
 const find=id=>source.nodes.find(n=>n.id===id);
 assert.equal(visibilityState(find('Q044'),source,{Q043:'No'}),false);
 assert.equal(visibilityState(find('Q044'),source,{}),null);
 assert.equal(visibilityState(find('Q058'),source,{Q043:'No',Q051:'Maybe',Q052:'No',Q053:'No'}),true);
 assert.equal(visibilityState(find('Q011'),source,{Q010:'New home construction'}),null);
 assert.equal(nextPreview(source,'Q043',{Q043:'No'}).id,'Q050');
 assert.equal(nextPreview(source,'Q099',{},'STAGE_5C').id,'Q110');
 assert.equal(nextPreview(source,'Q119',{},'STAGE_5C').id,'Q150');
 assert.equal(checkResponse({...find('Q088'),details:{responseType:'CURRENCY',minValue:10,maxValue:20}},'8'),'Enter 10 or more.');
 assert.equal(checkResponse(find('Q013'),'2020.5'),'Enter a whole year.');
 assert.equal(checkResponse(find('Q088'),'2500'),'');
});
test('later JSON uploads upgrade unchanged source fields without overwriting intervening edits',()=>{
 const saved=structuredClone(source);saved.nodes.find(n=>n.id==='Q088').details.whyWeAsk='Custom reserve explanation';
 const nextPackage=structuredClone(pkg);nextPackage.questions.find(q=>q.questionCode==='Q088').prompt='New complete reserve prompt';nextPackage.questions.find(q=>q.questionCode==='Q088').unit='USD';
 // Some exports retain their timestamp when the document is edited manually.
 const next=convertPackage(nextPackage,baseline),upgraded=upgradeSource(saved,next,baseline);
 assert.equal(upgraded.changed,true);const n=upgraded.flow.nodes.find(n=>n.id==='Q088');assert.equal(n.title,'New complete reserve prompt');assert.equal(n.details.unit,'USD');assert.equal(n.details.whyWeAsk,'Custom reserve explanation');assert.equal(n.x,saved.nodes.find(n=>n.id==='Q088').x);
});
test('deployments do not revert a manually imported package or a newer source version',async()=>{
 const {upgradeForDeployment}=await import('../src/source-data.js');const manual=structuredClone(source);manual.sourceImport='manual';manual.sourcePackage.questions[0].prompt='My imported prompt';
 assert.equal(upgradeForDeployment(manual,source,baseline).changed,false);
 const newer=structuredClone(source);newer.sourceRevision='2027-01-01T00:00:00Z';assert.equal(upgradeForDeployment(newer,source,baseline).changed,false);
});
