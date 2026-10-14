export function connectHelpRoute(flow){
 if(flow.questionCorrections?.helpDecide==='v1')return false;
 const question=flow.nodes.find(n=>n.id==='Q004');if(!question||!flow.nodes.some(n=>n.id==='Q070'))return false;
 let answer=question.answers.find(a=>/^help me decide$/i.test(a.label.trim()))||question.answers.find(a=>a.value==='Open to best option'||a.label==='Open to best option');
 if(!answer){answer={label:'Help me decide',value:'Help me decide',target:'',sortOrder:question.answers.length+1};question.answers.push(answer);}
 if(answer.label==='Open to best option')answer.label='Help me decide';answer.target='Q070';answer.routing='auto';answer.color??='#168d88';answer.style??='solid';
 for(const record of [question.sourceRecord,flow.sourcePackage?.questions?.find(q=>q.questionCode==='Q004')])if(record){const option=record.options.find(o=>o.optionValue===answer.value||o.optionLabel==='Help me decide');if(option)option.optionLabel=answer.label;}
 flow.questionCorrections={...flow.questionCorrections,helpDecide:'v1'};return true;
}
