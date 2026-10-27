const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('Scripts.html','utf8');
const start=source.indexOf('function applyCoachIQTheme(settings){'),end=source.indexOf('\nfunction getCoachIQPointLabels()',start);
const theme=source.slice(start,end);
function render(url,text=theme){
 const logo={hidden:false,src:'',closest:()=>null};
 const ctx=vm.createContext({CoachIQ:{},document:{documentElement:{style:{setProperty(){}}},getElementById:id=>id==='programLogo'?logo:null},validThemeColor:()=>false,shadeThemeColor:()=>'',readableThemeText:()=>'',updatePointTerminology(){},applyCoachIQWorkspace_(){}});
 vm.runInContext(text,ctx);ctx.applyCoachIQTheme({logoUrl:url});return logo;
}
test('logo check retains HTTPS-only behavior without a literal slash pair',()=>{
 for(const url of ['https://example.org/logo.png','HTTPS://example.org/logo.png']){const result=render(url);assert.equal(result.hidden,false);assert.equal(result.src,url);}
 for(const url of ['http://example.org/logo.png','javascript:alert(1)','https:example.org/logo.png','','//example.org/logo.png'])assert.equal(render(url).hidden,true,url);
 const line=theme.split('\n').find(x=>x.includes('const logoUrl ='));assert.ok(!line.includes('//'));
});
test('logo initializer survives the observed line-comment truncation',()=>{
 // The captured delivered script lost everything from the slash pair to the end of its line.
 const simulated=theme.split('\n').map(line=>line.includes('const logoUrl =')?line.replace(/\/\/.*$/,''):line).join('\n');
 assert.equal(render('https://example.org/logo.png',simulated).hidden,false);
 const old=theme.replace('"https:" + String.fromCharCode(47, 47)','"https://"');
 const damaged=old.split('\n').map(line=>line.includes('const logoUrl =')?line.replace(/\/\/.*$/,''):line).join('\n');
 assert.throws(()=>new vm.Script(damaged),SyntaxError);
});
