// Run via playwright-cli run-code --filename after opening the real local or
// deployed site URL. The development server must already be running for local QA.
// This checks the 49 teacher routes and leaves personal storage unchanged.
async (page) => {
  const base=page.url().split('#')[0];
  if(!/^https?:/.test(base))throw Error('Open the website before running this check.');
  const companionIds=['book-u1-speaking','book-u1-writing','book-u1-garden','book-u2-writing','book-u2-garden','book-u3-speaking','book-u3-writing','book-u3-garden','book-u4-writing','book-u4-garden','book-u4-reading','book-u5-writing','book-u5-example-dog','book-u5-example-bayberry','book-u6-writing','book-u6-garden','book-u7-speaking','book-u7-writing','book-u7-garden','book-u8-speaking','book-u8-writing','book-u8-garden','book-final-review'];
  const routes=[...Array.from({length:26},(_,i)=>`/chinese-lesson/cn-${String(i+1).padStart(2,'0')}/teacher`),...companionIds.map(id=>`/chinese-companion/${id}/teacher`)];
  const errors=[],rows=[];
  page.on('pageerror',err=>errors.push(String(err)));
  const saved=await page.evaluate(()=>JSON.stringify({...localStorage}));
  await page.setViewportSize({width:1024,height:700});
  const hit=async l=>l.evaluate(el=>{const b=el.getBoundingClientRect(),c=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return b.width>0&&b.height>0&&b.x>=0&&b.y>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1&&(el===c||el.contains(c));});
  for(const route of routes){
    const row={route,failures:[]};
    try{
      await page.goto(`${base}#${route}`);
      await page.locator('.kf-lesson,.cnbc-viewer').waitFor();
      row.title=await page.locator('h1').first().innerText();
      if(!row.title||/没有找到|暂时没有/.test(row.title))throw Error('Missing course title');
      await page.locator('img').evaluateAll(async imgs=>Promise.all(imgs.map(img=>img.decode())));
      const images=await page.locator('img').evaluateAll(imgs=>imgs.map(img=>({url:img.src,loaded:img.complete&&img.naturalWidth>0})));
      if(images.some(i=>!i.loaded))throw Error('Image did not load');
      row.images=images.length;
      const tabs=page.locator('.cnl-tab,.cnbc-tabs button,.kf-tabs button');
      row.tabs=await tabs.count();
      for(let i=0;i<row.tabs;i++){
        await tabs.nth(i).click();
        const action=page.locator('.cnl-primary,.cnbc-primary');
        if(await action.count()&&await action.first().isVisible()&&!await hit(action.first()))throw Error('Main action clipped or covered');
      }
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1))throw Error('Outer page overflow');
      if(await page.evaluate(()=>JSON.stringify({...localStorage}))!==saved)throw Error('Teacher page changed personal storage');
    }catch(err){row.failures.push(String(err));}
    rows.push(row);
  }
  await page.goto(`${base}#/chinese-book`);
  const plan=await page.request.get(`${base}plans/chinese-precision-master-plan.md`);
  const release=await page.request.get(`${base}plans/chinese-precision-release.md`);
  return {total:rows.length,failed:rows.filter(r=>r.failures.length).length,errors,planStatus:plan.status(),planMarkdown:(await plan.text()).startsWith('# 三年级'),releaseStatus:release.status(),releaseMarkdown:(await release.text()).startsWith('# 语文全册'),rows};
}
