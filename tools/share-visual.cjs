// Mock-only fixed-head home/result acceptance. No HTTP connection or score send.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const engines=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
const raw=fs.readFileSync(path.join(root,'index.html'),'utf8'),html=raw.replace('installMobileGuards();','window.__shareTest={restoreResultSnapshot,buildGameShareText,buildResultShareText,state:()=>({lastResult,isPlaying,activePlay})};\ninstallMobileGuards();'),{source,catalogs}=JSON.parse(html.match(/<script id="localeData" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.notEqual(raw,html);
const origin='http://127.0.0.1:4199',publicUrl='https://chameleonjp.codeberg.page/emojihiroi/';
async function visible(page,selector){
 const e=page.locator(selector);assert.equal(await e.isVisible(),true);await e.scrollIntoViewIfNeeded();
 const a=await e.evaluate(el=>{
  const r=el.getBoundingClientRect(),epsilon=1;let opacity=1,unclipped=true;const ancestors=[];
  for(let n=el;n;n=n.parentElement){
   const style=getComputedStyle(n);opacity*=Number(style.opacity);
   if(n===el)continue;const p=n.getBoundingClientRect(),left=n===document.scrollingElement?0:p.left+n.clientLeft,top=n===document.scrollingElement?0:p.top+n.clientTop;ancestors.push({tag:n.tagName,id:n.id,overflowX:style.overflowX,overflowY:style.overflowY,left,top,w:n.clientWidth,h:n.clientHeight,scrollTop:n.scrollTop,scrolling:n===document.scrollingElement});
   if(/hidden|clip|scroll|auto/.test(style.overflowX))unclipped=unclipped&&r.left>=left-epsilon&&r.right<=left+n.clientWidth+epsilon;
   if(/hidden|clip|scroll|auto/.test(style.overflowY))unclipped=unclipped&&r.top>=top-epsilon&&r.bottom<=top+n.clientHeight+epsilon;
  }
  const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  return{rect:{x:r.x,y:r.y,w:r.width,h:r.height},ancestors,w:r.width,h:r.height,opacity,unclipped,viewport:r.left>=-epsilon&&r.top>=-epsilon&&r.right<=innerWidth+epsilon&&r.bottom<=innerHeight+epsilon,hit:hit===el||el.contains(hit),pointer:getComputedStyle(el).pointerEvents};
 });
 if(!a.unclipped||!a.viewport){console.error('VISIBILITY_DIAGNOSTIC',JSON.stringify({selector,metrics:a}));fs.mkdirSync(path.join(root,'test-artifacts'),{recursive:true});await page.screenshot({path:path.join(root,'test-artifacts','visibility-failure.png'),fullPage:true});}
 assert.ok(a.w>=44&&a.h>=44,selector+' target');assert.ok(a.opacity>0);assert.ok(a.viewport,selector+' full rect inside viewport');assert.ok(a.unclipped,selector+' full rect inside overflow ancestors');assert.notEqual(a.pointer,'none');assert.equal(a.hit,true);
}
async function main(){const engine=process.env.BROWSER_ENGINE||'chromium';assert.ok(['chromium','webkit'].includes(engine));const browser=await engines[engine].launch({headless:true}),context=await browser.newContext({viewport:{width:402,height:874},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();let scoreAttempts=0;const intents=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await context.routeWebSocket('**/*',socket=>socket.close());
 await context.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());if(u.origin===origin&&u.pathname==='/'&&['GET','HEAD'].includes(req.method()))return route.fulfill({contentType:'text/html; charset=utf-8',body:req.method()==='HEAD'?'':html});if(u.origin==='https://x.com'&&u.pathname==='/intent/post'&&req.method()==='GET'){intents.push(u.searchParams.get('text'));return route.fulfill({contentType:'text/html',body:'<title>Mock composer</title>'});}if(u.hostname.endsWith('.supabase.co')&&u.pathname.endsWith('/get_best_score_ranking')&&req.method()==='POST')return route.fulfill({json:[]});if(u.pathname.includes('submit')||u.pathname.includes('start')||u.pathname.includes('record_game_play'))scoreAttempts++;return route.abort();});
 await page.addInitScript(()=>{localStorage.setItem('emojihiroi:sound','off');localStorage.setItem('emojihiroi_player_name_v1','');});await page.goto(origin+'/');
 const home=page.locator('#share-game-button');await home.evaluate(e=>e.style.display='none');await assert.rejects(()=>visible(page,'#share-game-button'));await home.evaluate(e=>e.style.removeProperty('display'));await home.evaluate(e=>e.parentElement.style.opacity='0');await assert.rejects(()=>visible(page,'#share-game-button'));await home.evaluate(e=>e.parentElement.style.removeProperty('opacity'));
 await home.evaluate(e=>{const w=document.createElement('div');w.id='clip-negative';w.style.cssText='overflow:hidden;flex-shrink:0;height:'+(e.getBoundingClientRect().height-8)+'px';e.before(w);w.append(e);});await assert.rejects(()=>visible(page,'#share-game-button'));await home.evaluate(e=>e.parentElement.replaceWith(e));await visible(page,'#share-game-button');
 await home.evaluate(e=>e.style.cssText='position:fixed;top:-8px;left:20px;width:180px;z-index:9999');await assert.rejects(()=>visible(page,'#share-game-button'));await home.evaluate(e=>e.style.cssText='');await visible(page,'#share-game-button');
 for(const phase of ['home','clear','retire']){
  if(phase!=='home'){await page.evaluate(retired=>{localStorage.setItem('emojihiroi:last-result:v1',JSON.stringify({playerName:'',play:null,isRetired:retired,submitId:1,actualSeconds:12.34,wrongCount:1,wrongPenaltySeconds:5,hintUseCount:1,hintPenaltySeconds:45,finalSeconds:62.34,scoreForRanking:6234,submissionState:retired?'retired':'guest'}));if(!__shareTest.restoreResultSnapshot())throw Error('fixture restore failed')},phase==='retire');assert.equal(await page.locator('#result-screen').isVisible(),true);assert.equal(await page.evaluate(()=>__shareTest.state().lastResult.play),null);}
  const retry=phase==='home'?'#pending-retry-home':'#submission-retry';
  assert.equal(await page.locator(retry).evaluate(e=>e.hidden),true);assert.equal(await page.locator(retry).isVisible(),false);
  await page.locator(retry).evaluate(e=>e.hidden=false);assert.equal(await page.locator(retry).isVisible(),true);await page.locator(retry).evaluate(e=>e.hidden=true);
  const selector=phase==='home'?'#share-game-button':'#share-result-button';
  for(const [lang,catalog]of Object.entries(catalogs)){
   if(phase==='home')await page.selectOption('#languageSelect',lang);
   else await page.evaluate(lang=>{const select=document.getElementById('languageSelect');select.value=lang;select.dispatchEvent(new Event('change',{bubbles:true}));},lang);
   assert.equal(await page.evaluate(()=>gameLocale.language()),lang);
   const frozen=await page.evaluate(()=>__shareTest.state());
   for(const viewport of [{width:402,height:874},{width:874,height:402}]){
    await page.setViewportSize(viewport);await visible(page,selector);await visible(page,`#${phase==='home'?'home':'result'}-screen .common-ranking-link`);
    const link=page.locator(selector);assert.equal(await link.textContent(),catalog[source.indexOf('Xでシェア')]);assert.deepEqual(await link.evaluate(e=>({bg:getComputedStyle(e).backgroundColor,fg:getComputedStyle(e).color})),{bg:'rgb(0, 0, 0)',fg:'rgb(255, 255, 255)'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    const expected=await page.evaluate(result=>result?__shareTest.buildResultShareText():__shareTest.buildGameShareText(),phase!=='home');
    const before=intents.length,opened=context.waitForEvent('page');await link.tap();const popup=await opened;await popup.waitForURL('https://x.com/intent/post**');assert.equal(new URL(popup.url()).searchParams.get('text'),expected);assert.equal(intents.length,before+1);assert.equal(intents[before],expected);assert.ok(expected.includes(publicUrl));await popup.close();
    await page.evaluate(()=>{window.__shareOpen=window.open;window.open=()=>null;});await link.tap();assert.equal(await page.locator('#commonShareFallback').isVisible(),true);assert.equal(await page.locator('#commonShareText').inputValue(),expected);await page.click('#commonShareClose');await page.evaluate(()=>{window.open=window.__shareOpen;delete window.__shareOpen});assert.equal(intents.length,before+1);assert.equal(await page.locator('#commonShareCopy').isVisible(),false);
    assert.deepEqual(await page.evaluate(()=>__shareTest.state()),frozen);assert.equal(scoreAttempts,0);
    fs.mkdirSync(path.join(root,'test-artifacts'),{recursive:true});await page.screenshot({path:path.join(root,'test-artifacts',`${engine}-${phase}-${lang}-${viewport.width}x${viewport.height}.png`),fullPage:true});
   }
  }
 }
 assert.deepEqual(errors,[]);assert.equal(scoreAttempts,0);console.log(JSON.stringify({engine,languages:15,orientations:2,phases:3,freshIntentAndFallback:90,scoreAttempts,negativeVisibilityControls:true}));
}finally{await context.close();await browser.close();}}
main().catch(e=>{console.error(e);process.exitCode=1});
