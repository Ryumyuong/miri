// Offline synthetic regression suite. Firebase and SMS are replaced before loading application modules.
const fs=require('fs'), path=require('path'), vm=require('vm'), assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'), ts=require(path.join(root,'node_modules/typescript'));
const React=require(path.join(root,'node_modules/react')), SSR=require(path.join(root,'node_modules/react-dom/server'));
let data={}, writes=0, state=[], cursor=0;const cache={};
const voyage={id:'v',title:'합성 검증 일정',code:'TEST',departDate:'2099-01-01',arriveDate:'2099-01-08',capacity:30,offlineHold:0,shipName:'검증 선박'};
let fixtures=[3,3,3,3,2,2,2].map((n,i)=>({id:'r'+i,code:'TEST-'+i,voyageId:'v',name:'합성 대표 '+i,phone:'',room:'내측',headcount:n,contractPaid:false,createdAt:'2026-01-01',departDate:voyage.departDate,arriveDate:voyage.arriveDate,passengers:Array.from({length:n},(_,j)=>({id:`p${i}-${j}`,nameKo:`합성 승객 ${i}-${j}`,roomType:i===6?'발코니':'내측',rooming:['B','A',''][j],passportExpiry:'2100-01-01'}))}));
const firebase={doc:(_,c,id)=>id,runTransaction:async(_,fn)=>fn({get:async id=>({exists:()=>!!data[id],data:()=>structuredClone(data[id])}),update:(id,patch)=>{writes++;data[id]={...data[id],...structuredClone(patch)}}})};
const hooks={...React,useState:initial=>{const i=cursor++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return [state[i],v=>state[i]=typeof v==='function'?v(state[i]):v]},useEffect:()=>{},useRef:v=>({current:v})};
function load(file){file=path.resolve(root,file);if(cache[file])return cache[file].exports;const mod={exports:{}};cache[file]=mod;
const localRequire=id=>{
if(id==='firebase/firestore')return firebase;
if(id.endsWith('/firebase')||id==='./firebase')return {db:{}};
if(id.endsWith('/sms')||id==='./sms')return {sendContractSms:()=>{throw Error('SMS forbidden in test')},buildContractMessage:()=>''};
if(id==='react')return hooks;
if(id==='next/navigation')return {useParams:()=>({id:'v'}),useSearchParams:()=>new URLSearchParams()};
if(id==='next/link')return {__esModule:true,default:({children,...props})=>React.createElement('a',props,children)};
if(id==='@/lib/useVoyages')return {useVoyages:()=>({voyages:[voyage],loading:false})};
if(id==='@/lib/useShips')return {useShips:()=>({ships:[],loading:false})};
if(id==='@/components/ImageUploader'||id==='@/components/admin/Pagination')return {__esModule:true,default:()=>null};
if(id==='@/lib/useReservations')return {useReservations:()=>({reservations:fixtures.filter(r=>load('lib/reservation-state.ts').paxOf(r)>0),allReservations:fixtures,loading:false})};
if(id==='@/components/SmartInput')return {__esModule:true,default:()=>null,phoneMask:x=>x,genderFromRrn:()=>''};
if(id.startsWith('.')||id.startsWith('@/')){let p=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);if(!path.extname(p))p+=fs.existsSync(p+'.ts')?'.ts':'.tsx';return load(p)}
return require(require.resolve(id,{paths:[root]}));};
const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
vm.runInThisContext('(function(require,module,exports){'+js+'\n})',{filename:file})(localRequire,mod,mod.exports);return mod.exports;}
function nodes(x,out=[]){if(!x||typeof x!=='object')return out;if(Array.isArray(x)){x.forEach(n=>nodes(n,out));return out;}out.push(x);nodes(x.props?.children,out);return out;}
function text(x){return typeof x==='string'||typeof x==='number'?String(x):Array.isArray(x)?x.map(text).join(''):x?.props?text(x.props.children):'';}
function renderPage(){cursor=0;return load('app/admin/voyages/[id]/page.tsx').default()}
function click(tree,label){const b=nodes(tree).find(n=>n.type==='button'&&text(n).includes(label));assert.ok(b,'button '+label);return b.props.onClick();}
async function main(){const model=load('lib/reservation-state.ts'), api=load('lib/reservations.ts'), seats=load('lib/voyages.ts'), csv=load('lib/csv.ts');
let checks=0;function check(name,fn){fn();checks++;console.log('PASS '+name)}
check('7 teams / 18 active passengers / 12 remaining',()=>{const a=api.aggregateForVoyage(fixtures,'v');assert.equal(a.reservedCount,7);assert.equal(a.pax,18);assert.equal(seats.remainingSeats(voyage,a.pax),12)});
check('offline 5 gives total 23 and remaining 7; custom capacity closes',()=>{assert.equal(seats.remainingSeats({...voyage,offlineHold:5},18),7);assert.equal(seats.liveStatus({...voyage,capacity:23,offlineHold:5},18),'마감')});
check('legacy headcount / explicit empty array / zero',()=>{assert.equal(model.paxOf({...fixtures[0],passengers:undefined,headcount:4}),4);assert.equal(model.paxOf({...fixtures[0],passengers:[]}),0);assert.equal(model.paxOf({...fixtures[0],passengers:undefined,headcount:0}),0)});
data=Object.fromEntries(fixtures.map(r=>[r.id,structuredClone(r)]));await api.deleteReservation('r0');await api.deleteReservation('r0');
check('team soft cancel preserves data, timestamp, idempotent history',()=>{assert.equal(data.r0.status,'cancelled');assert.equal(data.r0.passengers.length,3);assert.equal(data.r0.cancellationHistory.length,1);assert.ok(data.r0.cancelledAt);assert.equal(writes,1);assert.equal(api.aggregateForVoyage(Object.values(data),'v').pax,15);assert.equal(api.aggregateForVoyage(Object.values(data),'v').reservedCount,6)});
await api.setReservationCancelled('r0',false);check('restore preserves cancellation event and restores count',()=>{assert.equal(data.r0.cancellationHistory.length,2);assert.equal(model.paxOf(data.r0),3)});
const original=structuredClone(data.r0);const changed=structuredClone(original.passengers);changed[0]={...changed[0],...model.cancellationPatch(changed[0],true,'2026-10-16T00:00:00Z')};await api.saveReservationPassengers(original,changed);
check('representative cancellation retains companions and excludes exports',()=>{assert.equal(model.paxOf(data.r0),2);assert.equal(api.aggregateForVoyage(Object.values(data),'v').pax,17);assert.ok(!csv.reservationsToCsv([data.r0]).includes(changed[0].nameKo));});
await assert.rejects(()=>api.saveReservationPassengers(original,original.passengers));checks++;console.log('PASS stale passenger update refused');
const second=structuredClone(data.r0);second.passengers[1]={...second.passengers[1],...model.cancellationPatch(second.passengers[1],true,'2026-10-16T00:01:00Z')};
check('companion cancellation and entire passenger cancellation',()=>{assert.equal(model.paxOf(second),1);const all={...second,passengers:second.passengers.map(p=>({...p,status:'cancelled'}))};assert.equal(api.aggregateForVoyage([all],'v').reservedCount,0);assert.equal(api.computePassportAlerts([all]).length,0)});
check('room type then team then A/B/unassigned; equal code IDs separate',()=>{const rows=fixtures.flatMap(r=>model.activeMembers(r).map(m=>({r,m}))).filter(x=>x.m.roomType==='내측').sort(model.compareRooming);assert.deepEqual(rows.slice(0,3).map(x=>x.m.rooming),['A','B','']);assert.deepEqual(rows.slice(0,6).map(x=>x.r.id),['r0','r0','r0','r1','r1','r1']);assert.notEqual(model.compareRooming({r:{...fixtures[0],code:'SAME'},m:changed[0]},{r:{...fixtures[1],code:'SAME'},m:changed[0]}),0)});
state=[];let tree=renderPage();check('detail actual component summary',()=>{assert.ok(text(tree).includes('명부 18명 (7팀)'));assert.ok(text(tree).includes('잔여 12명'))});
click(tree,'루밍리스트');tree=renderPage();const out=path.join(root,'verification');fs.mkdirSync(out,{recursive:true});
const css=(await require('postcss')([require('@tailwindcss/postcss')({base:root})]).process(fs.readFileSync(path.join(root,'app/globals.css'),'utf8'),{from:path.join(root,'app/globals.css')})).css;
const html=SSR.renderToStaticMarkup(tree);fs.writeFileSync(path.join(out,'rooming-screen.html'),'<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css+'</style><body>'+html+'</body></html>');
let printed='';global.window={open:()=>({document:{write:h=>printed=h,close:()=>{}},focus:()=>{},print:()=>{}})};
await click(tree,'인쇄');fs.writeFileSync(path.join(out,'rooming-print.html'),printed);
check('actual print handler contains 18 passenger rows and team boundary',()=>{assert.equal((printed.match(/<tr style=/g)||[]).length,18);assert.ok(printed.includes('서로 다른 팀의 A/B'));assert.ok(printed.includes('border-top:3px'));assert.ok(printed.indexOf('합성 승객 0-1')<printed.indexOf('합성 승객 0-0'))});
const smallFixtures=fixtures;
fixtures=Array.from({length:3},(_,group)=>smallFixtures.map(r=>({...structuredClone(r),id:r.id+'-group'+group,code:r.code+'-group'+group,passengers:r.passengers.map(p=>({...p,id:p.id+'-group'+group,nameKo:p.nameKo+'-'+group}))}))).flat();
state=[];tree=renderPage();click(tree,'루밍리스트');tree=renderPage();await click(tree,'인쇄');
fs.writeFileSync(path.join(out,'rooming-print-54.html'),printed);
check('large print uses one keep-together tbody for each team and repeats headers',()=>{assert.equal((printed.match(/<tbody class="team">/g)||[]).length,21);assert.equal((printed.match(/<tr style=/g)||[]).length,54);assert.ok(printed.includes('tbody.team{break-inside:avoid;}'));assert.ok(printed.includes('thead{display:table-header-group;}'))});
fixtures=smallFixtures;
fixtures=Object.values(data);state=[];tree=renderPage();click(tree,'취소자 목록');tree=renderPage();check('cancelled list actual component shows representative and timestamp',()=>{assert.ok(text(tree).includes('합성 승객 0-0'));assert.ok(text(tree).includes('취소일시'));assert.ok(text(tree).includes('명부 17명'))});
fs.writeFileSync(path.join(out,'cancelled-screen.html'),'<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css+'</style><body>'+SSR.renderToStaticMarkup(tree)+'</body></html>');
const editor=load('components/admin/PassengerEditor.tsx').default;
const editOriginal=structuredClone(fixtures[1]);let saved;
const renderEditor=()=>{cursor=0;return editor({reservation:editOriginal,onClose:()=>{},onSave:async ps=>{saved=ps}})};
state=[];let editorTree=renderEditor();await click(editorTree,'취소');editorTree=renderEditor();await click(editorTree,'저장');
check('actual passenger editor cancels representative without deleting fields',()=>{assert.equal(saved.length,3);assert.equal(saved[0].status,'cancelled');assert.equal(saved[0].nameKo,editOriginal.passengers[0].nameKo);assert.equal(saved[1].status,undefined)});
editorTree=renderEditor();await click(editorTree,'복구');editorTree=renderEditor();await click(editorTree,'저장');
check('actual editor restore retains both events',()=>{assert.equal(saved[0].status,'active');assert.equal(saved[0].cancellationHistory.length,2)});
state=[];editorTree=renderEditor();global.confirm=()=>true;
nodes(editorTree).find(n=>n.type==='input'&&n.props.onBlur).props.onChange({target:{value:'1'}});editorTree=renderEditor();nodes(editorTree).find(n=>n.type==='input'&&n.props.onBlur).props.onBlur();editorTree=renderEditor();await click(editorTree,'저장');
check('headcount reduction preserves cancelled companion records',()=>{assert.equal(saved.length,3);assert.equal(saved.filter(p=>p.status!=='cancelled').length,1);assert.equal(saved[2].nameKo,editOriginal.passengers[2].nameKo)});
fixtures=smallFixtures.slice(0,2).map(r=>({...structuredClone(r),passengers:r.passengers.slice(0,2)}));
voyage.offlineHold=28;voyage.capacity=30;voyage.reservedCount=32;
voyage.title='2026년 08월 28일(금) 서부지중해 8박 11일 MSC 씨뷰호+카타르항공(QR)';
voyage.departDate='2026-08-28';voyage.arriveDate='2026-09-07';voyage.shipName='MSC 씨뷰호';
const manager=load('components/admin/VoyageManager.tsx').default;
state=[];cursor=0;let managerTree=manager();
check('reported voyage list: 32 total = 4 manifest / 2 teams + 28 offline',()=>{assert.ok(text(managerTree).includes('32명 예약 (명부 4명 / 2팀 + 오프라인 28명)'));assert.ok(text(managerTree).includes('명부 4명 기준'));});
const managerMarkup=SSR.renderToStaticMarkup(managerTree);
await click(managerTree,'수정');cursor=0;managerTree=manager();
const form=nodes(managerTree).find(n=>typeof n.type==='function'&&n.type.name==='VoyageForm');assert.ok(form);
state=[];cursor=0;const formTree=form.type(form.props);
check('reported voyage edit agrees with list; 0 remaining / capacity30',()=>{assert.ok(text(formTree).includes('예약 신청 32명'));assert.ok(text(formTree).includes('명부 4명 / 2팀 + 오프라인 28명'));assert.ok(text(formTree).includes('잔여 0명'));});
const formMarkup=SSR.renderToStaticMarkup(formTree);
state=[];tree=renderPage();check('reported voyage detail: total32; passport4/4; no fabricated offline passengers',()=>{assert.ok(text(tree).includes('총 32명 예약'));assert.equal(api.aggregateForVoyage(fixtures,'v').passportDone,4);assert.equal(api.aggregateForVoyage(fixtures,'v').passportPending,0);assert.equal(model.activeMembers(fixtures[0]).length+model.activeMembers(fixtures[1]).length,4)});
const saveHtml=(name,markup)=>fs.writeFileSync(path.join(out,name),'<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css+'</style><body>'+markup+'</body></html>');
saveHtml('counts-list.html',managerMarkup);saveHtml('counts-edit.html',formMarkup);saveHtml('counts-detail.html',SSR.renderToStaticMarkup(tree));
check('no double-add of stale voyage count or duplicate document; distinct sources included once',()=>{const repeated=[...fixtures,fixtures[0]];assert.equal(api.aggregateForVoyage(repeated,'v').pax,4);assert.equal(api.bookedPaxFor(repeated,'v'),4);assert.equal(model.reservationTotals(voyage,api.aggregateForVoyage(repeated,'v').pax).total,32);const sameCode=fixtures.map(r=>({...r,code:'same'}));assert.equal(api.aggregateForVoyage(sameCode,'v').pax,4)});
check('cancel one passenger ->31; cancel one team ->30; offline untouched',()=>{const one=structuredClone(fixtures);one[0].passengers[0].status='cancelled';assert.equal(model.reservationTotals(voyage,api.aggregateForVoyage(one,'v').pax).total,31);one[0].status='cancelled';assert.equal(model.reservationTotals(voyage,api.aggregateForVoyage(one,'v').pax).total,30);assert.equal(voyage.offlineHold,28)});
voyage.departDate='2099-01-01';voyage.capacity=40;
state=[];cursor=0;const upcomingTree=load('components/admin/DashboardUpcoming.tsx').default();
check('upcoming dashboard uses total32, not 2 teams as people',()=>assert.ok(text(upcomingTree).includes('32명 예약 (명부 4명 / 2팀 + 오프라인 28명)')));
saveHtml('counts-upcoming.html',SSR.renderToStaticMarkup(upcomingTree));
console.log(checks+' checks passed; no network, DB or SMS calls.');}
main().catch(e=>{console.error(e);process.exitCode=1});

