// Run using playwright-cli run-code --filename after confirming the actual server URL.
// Geometry and native media are checked without auto-scrolling or synthetic ended events.
async (page) => {
  const starting = new URL(page.url()); starting.hash = '';
  const base = starting.href;
  const sizes = [{width:1024,height:768},{width:1180,height:820},{width:768,height:1024},{width:820,height:1180},{width:1024,height:650}];
  const keys = {
    'cat-practice-1':'cat-ginger','cat-practice-2':'cat-grey','cat-check-1':'cat-ginger','cat-check-2':'cat-grey','cat-switch-1':'cat-black','cat-switch-2':'cat-black',
    'hello-practice':'hello-school','goodbye-practice':'goodbye-school','hello-check':'hello-park','goodbye-check':'goodbye-park','goodbye-switch':'goodbye-library','hello-switch':'hello-library',
    'my-practice':'name-lin','your-practice':'name-lan','my-check':'name-lan','your-check':'name-lin','your-switch':'name-lan','my-switch':'name-lan',
  };
  const samples = [], errors = [], checks = [];
  const assert = (value,message) => { if(!value)throw new Error(message);checks.push(message); };
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    if(window.__labLayoutAudio)return;
    const NativeAudio = window.Audio;
    window.__labLayoutAudio = [];
    window.Audio = function(src) {
      const audio = new NativeAudio(src);
      audio.__events = [];
      for(const type of ['playing','ended','error'])audio.addEventListener(type,()=>audio.__events.push(type));
      window.__labLayoutAudio.push(audio);
      return audio;
    };
    window.Audio.prototype = NativeAudio.prototype;
  });
  await page.reload();
  await page.locator('main').waitFor();
  const original = await page.evaluate(()=>localStorage.getItem('fanfan-word-adventure:progress:v1'));
  const go = async path => {
    await page.goto(base+'#'+path);
    await page.reload();
    await page.locator('.english-learning-lab').waitFor();
    await page.evaluate(()=>scrollTo(0,0));
  };
  const geometry = async label => {
    const result = await page.evaluate(() => {
      const root = document.querySelector('.english-learning-lab');
      const dialog = root.querySelector('dialog[open]');
      const scope = dialog || root;
      const faults = [], targets = [], fonts = [];
      const visible = node => !!node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden';
      const rect = node => { const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}; };
      const name = node => node.getAttribute('aria-label') || node.textContent?.trim().slice(0,55) || node.tagName;
      const checkRect = node => {const r=rect(node);if(r.x<-.5||r.y<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)faults.push(name(node)+' outside viewport '+JSON.stringify(r));};
      const doc = document.documentElement;
      if(doc.scrollWidth>innerWidth+1||doc.scrollHeight>innerHeight+1||Math.abs(scrollY)>1||Math.abs(scrollX)>1)faults.push('Document scroll '+JSON.stringify({width:doc.scrollWidth,height:doc.scrollHeight,innerWidth,innerHeight,scrollX,scrollY}));
      if(dialog)checkRect(dialog);
      else for(const node of root.querySelectorAll('.ell-header,.ell-dock,.ell-lesson-card,.ell-demo-scene,.ell-task-panel,.ell-option'))if(visible(node))checkRect(node);
      for(const node of scope.querySelectorAll('button,a'))if(visible(node)){
        checkRect(node);const r=rect(node);targets.push(Math.min(r.width,r.height));
        if(r.width<43.5||r.height<43.5)faults.push('Small target '+name(node)+' '+JSON.stringify(r));
        const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
        if(!hit||!(hit===node||node.contains(hit)))faults.push('Obscured target '+name(node));
      }
      for(const node of scope.querySelectorAll('button,h1,h2,p,.ell-phase-track>span,.ell-audio-status,.ell-eyebrow,.ell-open'))if(visible(node)){
        const font=parseFloat(getComputedStyle(node).fontSize);fonts.push(font);if(font<15.9)faults.push('Small text '+name(node)+' '+font+'px');
      }
      return {faults,minTarget:Math.min(...targets),minFont:Math.min(...fonts),viewport:{width:innerWidth,height:innerHeight},phase:root.dataset.phase,step:root.dataset.stepId};
    });
    samples.push({label,...result});
    assert(result.faults.length===0,label+': '+result.faults.join('; '));
  };
  const atAllSizes = async label => {
    for(const size of sizes){await page.setViewportSize(size);await geometry(label+' '+size.width+'x'+size.height);}
    await page.setViewportSize(sizes[0]);
  };
  const clickInPlace = async locator => {
    const box=await locator.boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=1024.5&&box.y+box.height<=768.5,'Clickable without scrolling');
    await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
    assert(await page.evaluate(()=>Math.abs(scrollY)<1),'Click does not scroll');
  };
  const listen = async action => {
    const index=await page.evaluate(()=>window.__labLayoutAudio.length);
    await clickInPlace(page.locator(`[data-action="${action}"]`));
    await page.waitForFunction(index=>window.__labLayoutAudio[index]?.__events.includes('ended'),index,{timeout:15000});
    const state=await page.evaluate(index=>{const a=window.__labLayoutAudio[index];return {events:a.__events,playbackRate:a.playbackRate};},index);
    assert(state.events.includes('playing')&&state.playbackRate===1,'Native speech plays naturally at approved tempo');
  };
  const screenshot = async name => {
    await page.screenshot({path:'output/english-learning-lab/'+name+'.png',fullPage:true});
  };
  try {
    await page.setViewportSize(sizes[0]);
    await go('/english-lab');await atAllSizes('menu');await screenshot('menu-landscape');
    await page.setViewportSize(sizes[2]);await screenshot('menu-portrait');await page.setViewportSize(sizes[0]);
    for(const lesson of ['cat','greetings','my-your']){
      await go('/english-lab/'+lesson+'/teacher');
      let count=0;
      while(await page.locator('.english-learning-lab').getAttribute('data-phase')!=='finished'){
        assert(++count<=12,lesson+' has a bounded short lesson');
        const id=await page.locator('.english-learning-lab').getAttribute('data-step-id');
        const phase=await page.locator('.english-learning-lab').getAttribute('data-phase');
        await atAllSizes(id+' before audio');
        if(['cat-learn-2','goodbye-learn','lin-your-learn','my-check','your-switch'].includes(id))await screenshot(id+'-landscape');
        if(id==='your-switch'){await page.setViewportSize(sizes[2]);await screenshot(id+'-portrait');await page.setViewportSize(sizes[0]);}
        if(count===1||id==='my-check'){
          await clickInPlace(page.getByRole('button',{name:'Help',exact:true}));
          await page.locator('dialog[open]').waitFor();await atAllSizes(id+' Help');
          await screenshot(id+'-help');await clickInPlace(page.getByRole('button',{name:'Close help'}));
        }
        if(phase==='learn'){
          await listen('listen-demo');
          await atAllSizes(id+' demo ended');
        }else{
          await listen('listen-prompt');
          await atAllSizes(id+' choices ready');
          if(id==='cat-check-1'){
            const wrong=page.locator(`article[data-option-id]:not([data-option-id="${keys[id]}"]) [data-action="choose"]`);
            await clickInPlace(wrong);await atAllSizes(id+' wrong feedback');
            await clickInPlace(page.getByRole('button',{name:'Try again',exact:true}));await atAllSizes(id+' retry');
          }
          await clickInPlace(page.locator(`article[data-option-id="${keys[id]}"] [data-action="choose"]`));
          await atAllSizes(id+' feedback');
        }
        await clickInPlace(page.getByRole('button',{name:'Next',exact:true}));
      }
      await atAllSizes(lesson+' finished');
    }
    await go('/english-lab/my-your/teacher');
    await clickInPlace(page.getByRole('button',{name:'Pause',exact:true}));await atAllSizes('paused');
    await page.emulateMedia({reducedMotion:'reduce'});await go('/english-lab');await geometry('reduced motion menu');
    const animations=await page.locator('.english-lab-scene .els-meeting-lin').evaluate(node=>getComputedStyle(node).animationName);
    assert(animations==='none','Reduced motion keeps a static understandable meeting scene');
    assert(errors.length===0,'No browser page errors');
    return {checkCount:checks.length,sampleCount:samples.length,sizes,minimumTarget:Math.min(...samples.map(sample=>sample.minTarget)),minimumFont:Math.min(...samples.map(sample=>sample.minFont)),errors,samples};
  }finally{
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.evaluate(value=>value===null?localStorage.removeItem('fanfan-word-adventure:progress:v1'):localStorage.setItem('fanfan-word-adventure:progress:v1',value),original);
  }
}
