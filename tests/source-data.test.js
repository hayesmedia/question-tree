import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {convertPackage,upgradeSource,conditions} from '../src/source-data.js';
import {validate,removeNodes,issues} from '../src/model.js';
import {csv,report} from '../src/export.js';
import {visibilityState,nextPreview,checkResponse} from '../src/preview.js';
const load=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url)));
const [pkg,baseline,source]=await Promise.all(['data/questionnaire-v3.json','flows/questionnaire-screenshot-baseline.json','flows/texas-questionnaire.json'].map(load));
test('all questionnaire records, stage definitions and every exported field survive conversion losslessly',()=>{
 assert.deepEqual(convertPackage(pkg,baseline),source);
 assert.deepEqual(source.sourcePackage,pkg);
 assert.equal(source.nodes.filter(n=>n.type==='question').length,pkg.questions.length);
 for(const q of pkg.questions){const n=source.nodes.find(n=>n.id===q.questionCode);assert.equal(n.title,q.prompt);assert.equal(n.textIncomplete,false);assert.deepEqual(n.sourceRecord,q);assert.equal(n.details.beginnerHelp,q.beginnerHelp);assert.equal(n.details.responseType,q.responseType);assert.equal(n.answers.length,q.options.length);for(const o of q.options){const a=n.answers.find(a=>a.value===o.optionValue);assert.equal(a.label,o.optionLabel);assert.equal(a.helpText,o.helpText);assert.equal(a.unknown,o.isUnknownOption);}assert.deepEqual(n.details.branches.map(({condition,...b})=>b),q.branches);}
 assert.equal(issues(source).length,0);
});
test('all conditions remain in Properties and connector records without generated note cards',()=>{assert.equal(source.nodes.length,pkg.questions.length);assert.ok(source.nodes.every(n=>n.type==='question'));let count=0;for(const n of source.nodes)for(const b of n.details.branches){count++;if(['Q090A','Q090B','Q090C'].includes(n.id))continue;for(const c of conditions(b.condition)){const edges=source.referenceLinks.filter(l=>l.target===n.id&&l.visibilityDependencies?.some(d=>d.fieldCode===c.fieldCode&&d.value===c.value));assert.ok(edges.length,n.id+':'+c.fieldCode);assert.ok(edges.every(l=>!l.displayLabel.includes(c.fieldCode)));}}assert.equal(count,42);assert.deepEqual(source.conditionSources,{});});
test('safe upgrade fills unchanged fragments while preserving geometry, grouping, routes and custom fields',()=>{
 const saved=structuredClone(baseline);const n=saved.nodes.find(n=>n.id==='Q088');n.x=9000;n.y=8000;n.width=400;n.rotation=15;
 const custom=saved.nodes.find(n=>n.id==='Q004');custom.title='My custom prompt';custom.details.whyWeAsk='My own explanation';custom.answers[0].target='Q043';custom.answers.splice(1,1);
 saved.groups=[{id:'custom-group',title:'My group',members:saved.nodes.map(n=>n.id)}];
 const link=saved.referenceLinks.find(l=>l.source==='Q099'&&l.target==='Q150');link.label='My route';link.color='#abcdef';link.points=[{x:99,y:88}];
 removeNodes(saved,new Set(['Q090']));
 const upgraded=upgradeSource(saved,source,baseline);validate(upgraded.flow);
 const updated=upgraded.flow.nodes.find(n=>n.id==='Q088');assert.equal(updated.title,pkg.questions.find(q=>q.questionCode==='Q088').prompt);for(const key of ['x','y','width','rotation'])assert.equal(updated[key],n[key]);
 const retained=upgraded.flow.nodes.find(n=>n.id==='Q004');assert.equal(retained.title,custom.title);assert.equal(retained.details.whyWeAsk,custom.details.whyWeAsk);assert.equal(retained.answers[0].target,'Q043');assert.ok(!retained.answers.some(a=>a.value==='Resale profit'));assert.equal(retained.details.beginnerHelp,pkg.questions.find(q=>q.questionCode==='Q004').beginnerHelp);
 assert.equal(upgraded.flow.groups.find(g=>g.id==='custom-group').title,'My group');assert.ok(upgraded.flow.groups.find(g=>g.id==='custom-group').members.includes('Q004'));assert.ok(!upgraded.flow.nodes.some(n=>n.id==='Q090'));
 const retainedLink=upgraded.flow.referenceLinks.find(l=>l.source==='Q099'&&l.target==='Q150');assert.equal(retainedLink,undefined);assert.ok(!upgraded.flow.nodes.some(n=>n.id==='STOP-TX'));
 assert.ok(upgraded.preserved.includes('Q004.title'));assert.equal(upgradeSource(upgraded.flow,source,baseline).changed,false);
});
test('new settings are filled when a saved card has a partial custom details object',()=>{
 const saved=structuredClone(baseline);saved.nodes.find(n=>n.id==='Q088').details={whyWeAsk:'My explanation'};
 const n=upgradeSource(saved,source,baseline).flow.nodes.find(n=>n.id==='Q088');assert.equal(n.details.whyWeAsk,'My explanation');assert.equal(n.details.responseType,'CURRENCY');
});
test('project CSV/PDF include all source prompts and complete configuration, metadata and conflicts',()=>{
 const c=csv(source),r=report(source);for(const q of pkg.questions){assert.ok(c.includes(q.prompt.replaceAll('"','""')),q.questionCode);const safe=q.prompt.replaceAll('&','&amp;').replaceAll("'",'&#39;');assert.ok(r.includes(safe),q.questionCode);}
 for(const field of ['Beginner help','Placeholder','Required','Allow unknown','Stage definition','Original question record'])assert.ok(c.includes(field));
 assert.ok(!r.includes('Earlier No connector'));assert.ok(r.includes('stroke-width="4"'));assert.ok(r.includes('No answer options are defined for this input.'));assert.ok(r.includes('blockedHeadline'));
});
test('preview uses typed values, skips false visibility and retains unresolved source conditions for review',()=>{
 const find=id=>source.nodes.find(n=>n.id===id);
 assert.equal(visibilityState(find('Q044'),source,{'mortgage.first.exists':'No'}),false);
 assert.equal(visibilityState(find('Q044'),source,{}),null);
 assert.equal(visibilityState(find('Q058'),source,{'mortgage.first.exists':'No','seller.openToSellerFinance':'Maybe','seller.openToSubjectTo':'No','seller.openToWrap':'No'}),true);
 assert.equal(visibilityState(find('Q011'),source,{'property.type':'New home construction'}),false);
 assert.equal(nextPreview(source,'Q043',{'mortgage.first.exists':'No'}).id,'G008');
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
test('JSON-only conversion is independent of every screenshot detail and group',()=>{
 const poison={nodes:[{id:'Q001',title:'WRONG',answers:[{label:'Bogus',target:'fake'}],details:{canonicalMappings:['WRONG']}}],groups:[{title:'WRONG',members:['fake']}],referenceLinks:[{source:'Q043',target:'Q053',label:'No'}]};assert.deepEqual(convertPackage(pkg,poison),source);
 assert.equal(source.nodes.filter(n=>n.sourceRule).length,0);assert.equal(source.groups.length,10);
 for(const stage of pkg.stages){const group=source.groups.find(g=>g.id===stage.stageCode);assert.equal(group.title,stage.stageName);assert.deepEqual(group.stage,stage);const ids=group.members.filter(id=>source.nodes.find(n=>n.id===id).type==='question');assert.deepEqual(ids,pkg.questions.filter(q=>q.stageCode===stage.stageCode).sort((a,b)=>a.sortOrder-b.sortOrder).map(q=>q.questionCode));}
});
test('legacy JSON migration removes screenshot routes/settings, preserves custom work and stays idempotent',async()=>{
 const {convertLegacyPackage}=await import('../src/legacy-source.js');const saved=convertLegacyPackage(pkg,baseline);saved.nodes.find(n=>n.id==='Q088').x=5000;saved.nodes.find(n=>n.id==='Q088').y=6000;saved.nodes.find(n=>n.id==='Q004').title='Custom objective';saved.referenceLinks.push({source:'Q001',target:'Q140',label:'Custom link',userCreated:true,width:1});
 const upgraded=upgradeSource(saved,source,baseline).flow;assert.equal(upgraded.nodes.find(n=>n.id==='Q088').x,5000);assert.equal(upgraded.nodes.find(n=>n.id==='Q004').title,'Custom objective');assert.equal(upgraded.nodes.find(n=>n.id==='Q001').details.canonicalMappings,undefined);assert.equal(upgraded.nodes.find(n=>n.id==='Q001').details.rememberChoice,undefined);
 assert.ok(!upgraded.referenceLinks.some(l=>l.source==='Q099'&&l.target==='Q150'));assert.ok(upgraded.referenceLinks.find(l=>l.label==='Custom link').width>=4);assert.ok(!upgraded.nodes.some(n=>n.id==='STOP-TX'));assert.equal(upgraded.groups.length,10);assert.equal(upgradeSource(upgraded,source,baseline).changed,false);
});
test('long dependencies and stage bridges connect the JSON flow without screenshot routes',()=>{
 const edge=(a,b)=>source.referenceLinks.find(l=>l.source===a&&l.target===b);
 assert.ok(edge('Q007','Q010'));assert.ok(edge('Q191','Q070'));
 for(const [a,b,field,value] of [['Q043','Q053','mortgage.first.exists','Yes'],['Q012','Q118','property.occupied','Tenant'],['Q095','Q156','deal.refinanceAvailable','Yes']]){const l=edge(a,b);assert.ok(l);assert.equal(l.inferred,true);assert.equal(l.executable,false);assert.ok(l.visibilityDependencies.some(c=>c.fieldCode===field&&c.value===value));}
 for(const [first,last] of [['Q130','QG-WHOLESALE-CONDUCT'],['Q140','Q146'],['Q150','Q157'],['Q160','Q169']]){assert.ok(edge('Q119',first));assert.ok(edge(last,'Q180'));}
 assert.ok(!edge('Q099','Q150'));assert.ok(!edge('Q049','Q058'));assert.equal(edge('Q043','Q053').label.includes('No'),false);
 assert.deepEqual(source.conditionSources,{});assert.ok(source.referenceLinks.filter(l=>l.inferred).every(l=>l.style==='dashed'&&l.width===4));
});
test('v1 migration restores long connections while preserving existing positions, group names and custom arrows',()=>{
 const old=structuredClone(source);old.sourceModel='json-only-v1';old.referenceLinks=old.referenceLinks.filter(l=>!['dependency','stage-transition'].includes(l.kind));const q=old.nodes.find(n=>n.id==='Q118');q.x=-4200;q.y=7800;old.groups[0].title='My custom setup';old.referenceLinks.push({source:'Q001',target:'Q150',userCreated:true,label:'My custom connector'});
 const upgraded=upgradeSource(old,source,baseline).flow;assert.ok(upgraded.referenceLinks.find(l=>l.source==='Q012'&&l.target==='Q118'));assert.equal(upgraded.nodes.find(n=>n.id==='Q118').x,-4200);assert.equal(upgraded.nodes.find(n=>n.id==='Q118').y,7800);assert.equal(upgraded.groups[0].title,'My custom setup');assert.ok(upgraded.referenceLinks.find(l=>l.label==='My custom connector'));assert.equal(upgradeSource(upgraded,source,baseline).changed,false);
});
test('simple labels use the values and preserve full conditions on the arrows',()=>{const edge=(a,b)=>source.referenceLinks.find(l=>l.source===a&&l.target===b);assert.equal(edge('Q043','Q053').displayLabel,'Yes');assert.equal(edge('Q043','Q054').displayLabel,'No');assert.equal(edge('Q051','Q058').displayLabel,'Yes / Maybe');assert.equal(edge('Q012','Q118').displayLabel,'Tenant');assert.equal(edge('Q001','Q002').displayLabel,'TX');assert.ok(edge('Q051','Q058').sourceRule.condition.groups);});
test('existing generated notes are removed while real questions and user notes stay untouched',()=>{const saved=structuredClone(source);saved.sourceModel='json-linked-v2';saved.nodes.push({id:'RULE:Q053:1',type:'shape',shape:'note',title:'mortgage.first.exists eq Yes',x:10,y:20,answers:[],sourceRule:{ruleOrder:1},sourceOwner:'Q053'},{id:'my-note',type:'shape',shape:'note',title:'My notes',x:90,y:60,answers:[]});saved.groups[0].members.push('RULE:Q053:1','my-note');saved.referenceLinks.push({source:'RULE:Q053:1',target:'Q053',label:'Visible when AND'});saved.nodes.find(n=>n.id==='Q053').x=1234;
 const upgraded=upgradeSource(saved,source,baseline).flow;validate(upgraded);assert.ok(!upgraded.nodes.some(n=>n.id==='RULE:Q053:1'));assert.deepEqual(upgraded.nodes.find(n=>n.id==='my-note'),saved.nodes.find(n=>n.id==='my-note'));assert.equal(upgraded.nodes.find(n=>n.id==='Q053').x,1234);assert.ok(upgraded.referenceLinks.find(l=>l.source==='Q043'&&l.target==='Q053'));assert.ok(upgraded.groups.every(g=>!g.members.includes('RULE:Q053:1')));
});
