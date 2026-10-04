// Run with playwright-cli run-code --filename after root confirms the actual URL.
// Production-compatible activity-key snapshot; no source endpoint is requested.
// All media uses native Audio. Geometry is measured; mouse clicks never auto-scroll.
async (page) => {
  const tasks = {"en01-scene-hello":{"courseId":"en-01","kind":"scene","lexemeId":"en-01-word-01","promptText":"Hello!","acceptedChoiceIds":["en01-scene-hello-choice-1","en01-scene-hello-choice-3"]},"en01-scene-morning":{"courseId":"en-01","kind":"scene","lexemeId":"en-01-word-11","promptText":"Good morning, class!","acceptedChoiceIds":["en01-scene-morning-choice-1"]},"en01-scene-afternoon":{"courseId":"en-01","kind":"scene","lexemeId":"en-01-word-12","promptText":"Good afternoon!","acceptedChoiceIds":["en01-scene-afternoon-choice-1"]},"en01-scene-goodbye":{"courseId":"en-01","kind":"scene","lexemeId":"en-01-word-09","promptText":"Goodbye!","acceptedChoiceIds":["en01-scene-goodbye-choice-1","en01-scene-goodbye-choice-3"]},"en01-scene-self":{"courseId":"en-01","kind":"scene","lexemeId":"en-01-word-03","promptText":"I am Lin.","acceptedChoiceIds":["en01-scene-self-choice-1"]},"en01-scene-class":{"courseId":"en-01","kind":"scene","lexemeId":"en-01-word-08","promptText":"Hello, class!","acceptedChoiceIds":["en01-scene-class-choice-1","en01-scene-class-choice-3"]},"en02-scene-name":{"courseId":"en-02","kind":"scene","lexemeId":"en-02-word-04","promptText":"What's your name?","acceptedChoiceIds":["en02-scene-name-choice-1"]},"en02-scene-your":{"courseId":"en-02","kind":"scene","lexemeId":"en-02-word-03","promptText":"Hello! What's your name?","acceptedChoiceIds":["en02-scene-your-choice-1"]},"en02-scene-my":{"courseId":"en-02","kind":"scene","lexemeId":"en-02-word-05","promptText":"My name is Lin.","acceptedChoiceIds":["en02-scene-my-choice-1"]},"en02-scene-nice":{"courseId":"en-02","kind":"scene","lexemeId":"en-02-word-11","promptText":"Nice to meet you!","acceptedChoiceIds":["en02-scene-nice-choice-1"]},"en02-scene-mr":{"courseId":"en-02","kind":"scene","lexemeId":"en-02-word-10","promptText":"Good morning, class!","acceptedChoiceIds":["en02-scene-mr-choice-1"]},"en02-scene-girl":{"courseId":"en-02","kind":"scene","lexemeId":"en-02-word-09","promptText":"I am Lin. I am a boy.","acceptedChoiceIds":["en02-scene-girl-choice-1"]},"en01-listen-hello":{"courseId":"en-01","kind":"listening","lexemeId":"en-01-word-01","promptText":"Hello!","acceptedChoiceIds":["en01-listen-hello-choice-1"]},"en01-listen-goodbye":{"courseId":"en-01","kind":"listening","lexemeId":"en-01-word-09","promptText":"Goodbye!","acceptedChoiceIds":["en01-listen-goodbye-choice-1"]},"en01-listen-morning":{"courseId":"en-01","kind":"listening","lexemeId":"en-01-word-11","promptText":"Good morning!","acceptedChoiceIds":["en01-listen-morning-choice-1"]},"en01-listen-afternoon":{"courseId":"en-01","kind":"listening","lexemeId":"en-01-word-12","promptText":"Good afternoon!","acceptedChoiceIds":["en01-listen-afternoon-choice-1"]},"en01-listen-cat":{"courseId":"en-01","kind":"listening","lexemeId":"en-01-word-06","promptText":"A cat.","acceptedChoiceIds":["en01-listen-cat-choice-1"]},"en01-listen-i":{"courseId":"en-01","kind":"listening","lexemeId":"en-01-word-03","promptText":"I.","acceptedChoiceIds":["en01-listen-i-choice-1"]},"en02-listen-my":{"courseId":"en-02","kind":"listening","lexemeId":"en-02-word-05","promptText":"My.","acceptedChoiceIds":["en02-listen-my-choice-1"]},"en02-listen-your":{"courseId":"en-02","kind":"listening","lexemeId":"en-02-word-03","promptText":"Your.","acceptedChoiceIds":["en02-listen-your-choice-1"]},"en02-listen-boy":{"courseId":"en-02","kind":"listening","lexemeId":"en-02-word-07","promptText":"A boy.","acceptedChoiceIds":["en02-listen-boy-choice-1"]},"en02-listen-girl":{"courseId":"en-02","kind":"listening","lexemeId":"en-02-word-09","promptText":"A girl.","acceptedChoiceIds":["en02-listen-girl-choice-1"]},"en02-listen-mr":{"courseId":"en-02","kind":"listening","lexemeId":"en-02-word-10","promptText":"Mr Lin.","acceptedChoiceIds":["en02-listen-mr-choice-1"]},"en02-listen-name":{"courseId":"en-02","kind":"listening","lexemeId":"en-02-word-04","promptText":"Name.","acceptedChoiceIds":["en02-listen-name-choice-1"]}};
  const sizes = [{width:1024,height:768},{width:1180,height:820},{width:768,height:1024},{width:820,height:1180},{width:1024,height:650}];
  const baseline = sizes[0];
  const startingUrl = new URL(page.url()); startingUrl.hash = '';
  const base = startingUrl.href;
  const progressKey = 'fanfan-word-adventure:progress:v1';
  const preferencesKey = 'fanfan-word-adventure:preferences:v1';
  const original = await page.evaluate(({progressKey,preferencesKey}) => ({
    progress:localStorage.getItem(progressKey),preferences:localStorage.getItem(preferencesKey)
  }),{progressKey,preferencesKey});
  const checks=[]; const samples=[]; const errors=[]; const visited=new Set(); const choiceCounts=new Set();
  page.on('pageerror',error=>errors.push(error.message));
  const require=(condition,message)=>{if(!condition)throw new Error(message);};
  const section=()=>page.locator('.english-adventure[data-activity-id]');
  const promptButton=()=>section().locator('.ea-listen-button');
  const picks=()=>section().locator('.ea-pick');
  const pick=id=>section().locator('.ea-choice[data-choice-id="'+id+'"] .ea-pick');
  const next=()=>section().getByRole('button',{name:/^(去下一站|这次探险完成啦)$/});
  const progress=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{"version":1,"attempts":[]}'),progressKey);
  const go=async path=>{
    await page.goto(base+'#'+path);await page.locator('main').waitFor();
    const round=path.match(/^\/play\/(en-\d{2})\/(context|recall)$/);
    if(round){const prefix=round[1].replace('-','')+'-'+(round[2]==='context'?'scene':'listen')+'-';await page.locator('.english-adventure[data-activity-id^="'+prefix+'"]').waitFor();}
  };
  const current=async()=>{await section().waitFor();const id=await section().getAttribute('data-activity-id');require(!!tasks[id],'Unknown activity '+id);return{id,...tasks[id]};};
  const ids=()=>section().locator('.ea-choice[data-choice-id]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-choice-id')));
  const waitFocus=()=>page.waitForFunction(()=>document.querySelector('.app-shell')?.classList.contains('game-focus'));
  const waitEnabled=()=>page.waitForFunction(()=>{const buttons=[...document.querySelectorAll('.english-adventure .ea-pick')];return buttons.length>0&&buttons.every(button=>!button.disabled);});

  const measure=async(label,modal=false)=>{
    const result=await page.evaluate(({label,modal})=>{
      const viewport=window.visualViewport;
      const v={left:viewport?.offsetLeft||0,top:viewport?.offsetTop||0,width:viewport?.width||innerWidth,height:viewport?.height||innerHeight};
      v.right=v.left+v.width;v.bottom=v.top+v.height;
      const faults=[];const buttonSizes=[];const fonts=[];const boxes=[];
      const root=document.querySelector('.english-adventure');
      const teacherControls=!modal?document.querySelector('.teacher-game-focus .teacher-controls'):null;
      const dialog=document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]');
      const scope=modal?dialog:root;
      const visible=node=>{const r=node.getBoundingClientRect();const s=getComputedStyle(node);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
      const rect=node=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
      const name=node=>(node.getAttribute('aria-label')||node.textContent||node.className||node.tagName).toString().replace(/\s+/g,' ').trim().slice(0,75);
      const checkBox=node=>{
        const r=rect(node);boxes.push({name:name(node),...r});
        if(r.x<v.left-1||r.y<v.top-1||r.right>v.right+1||r.bottom>v.bottom+1)faults.push('Offscreen '+name(node)+' '+JSON.stringify(r));
      };
      if(!scope)faults.push('Missing '+(modal?'modal':'activity')+' scope');
      if(!document.querySelector('.app-shell.game-focus'))faults.push('Game focus class missing');
      const overflow={x:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,y:Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)-innerHeight};
      if(overflow.x>1||overflow.y>1||Math.abs(scrollX)>1||Math.abs(scrollY)>1)faults.push('Document requires scrolling '+JSON.stringify({overflow,scrollX,scrollY}));
      if(scope){
        if(modal)checkBox(scope);
        else{
          const dock=root.querySelector('[data-action-dock]');
          if(!dock)faults.push('Missing always-visible action dock');else checkBox(dock);
          for(const node of root.querySelectorAll('.ea-topbar,.ea-stage,.ea-choice'))if(visible(node))checkBox(node);
        }
        if(teacherControls)checkBox(teacherControls);
        const buttons=[...scope.querySelectorAll('button'),...teacherControls?.querySelectorAll('button,select')||[]].filter(visible);
        if(!buttons.length)faults.push('No visible interaction targets');
        for(const node of buttons){
          checkBox(node);const r=rect(node);buttonSizes.push(Math.min(r.width,r.height));
          if(r.width<43.5||r.height<43.5)faults.push('Target smaller than 44px '+name(node)+' '+JSON.stringify(r));
          if(teacherControls?.contains(node)){const font=parseFloat(getComputedStyle(node).fontSize);fonts.push(font);if(font<13.9)faults.push('Teacher control text too small '+name(node)+' '+font+'px');}
          const x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);
          if(!hit||!(hit===node||node.contains(hit)))faults.push('Target obscured '+name(node)+' hit '+(hit?.tagName||'null'));
        }
        const critical=[...scope.querySelectorAll('button,.ea-stage h1,.ea-heard-words,.ea-choice-words,.ea-stage-help,.ea-feedback h2,.ea-feedback-heading p,.ea-oral>p,.ea-model>p')].filter(visible);
        for(const node of critical){
          const style=getComputedStyle(node),font=parseFloat(style.fontSize);
          const minimum=node.matches('.ea-stage h1')?18:node.matches('.ea-heard-words,.ea-choice-words,.ea-model>p')?16:14;
          fonts.push(font);if(font<minimum-.1)faults.push('Critical text too small '+name(node)+' '+font+'px < '+minimum);
          checkBox(node);
          if((['hidden','clip'].includes(style.overflowY)&&node.scrollHeight>node.clientHeight+1)||(['hidden','clip'].includes(style.overflowX)&&node.scrollWidth>node.clientWidth+1))faults.push('Critical text clipped '+name(node));
          let parent=node.parentElement;const r=node.getBoundingClientRect();
          while(parent&&parent!==scope.parentElement){
            const ps=getComputedStyle(parent),pr=parent.getBoundingClientRect();
            if((['hidden','clip'].includes(ps.overflowY)&&(r.top<pr.top-1||r.bottom>pr.bottom+1))||(['hidden','clip'].includes(ps.overflowX)&&(r.left<pr.left-1||r.right>pr.right+1)))faults.push('Ancestor clips critical control/text '+name(node));
            parent=parent.parentElement;
          }
        }
        if(modal&&(scope.scrollHeight>scope.clientHeight+1||scope.scrollWidth>scope.clientWidth+1))faults.push('Modal content requires scrolling');
      }
      return{label,activityId:root?.getAttribute('data-activity-id'),width:innerWidth,height:innerHeight,modal,
        choices:root?.querySelectorAll('.ea-choice').length||0,overflow,minTarget:Math.min(...buttonSizes),minCriticalFont:Math.min(...fonts),faults,
        dock:!modal&&root?.querySelector('[data-action-dock]')?rect(root.querySelector('[data-action-dock]')):null};
    },{label,modal});
    require(result.faults.length===0,label+' @ '+result.width+'×'+result.height+'\n'+result.faults.join('\n'));
    samples.push(result);return result;
  };
  const measureSizes=async(label,stress=false,modal=false)=>{
    for(const size of stress?sizes:[baseline]){await page.setViewportSize(size);await measure(label,modal);}
    await page.setViewportSize(baseline);
  };
  const clickWithoutScroll=async locator=>{
    await locator.waitFor({state:'visible'});
    const point=await locator.evaluate(node=>{
      const r=node.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return{x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height,blocked:!hit||!(hit===node||node.contains(hit)),disabled:node.disabled,beforeX:scrollX,beforeY:scrollY};
    });
    require(!point.disabled&&!point.blocked&&point.width>=43.5&&point.height>=43.5,'Button cannot be tapped directly without scrolling');
    await page.mouse.click(point.x,point.y);
    const after=await page.evaluate(()=>({x:scrollX,y:scrollY}));
    require(after.x===point.beforeX&&after.y===point.beforeY,'Tapping the visible button scrolled the page');
  };
  const audioCount=()=>page.evaluate(()=>window.__qaIpadAudios.length);
  const listen=async()=>{
    const index=await audioCount();await clickWithoutScroll(promptButton());
    await page.waitForFunction(index=>{const audio=window.__qaIpadAudios[index];return audio&&Number.isFinite(audio.duration)&&audio.duration>0&&audio.__qaIpadEvents.includes('playing')&&!audio.paused;},index,{timeout:20000});
    await page.waitForFunction(index=>window.__qaIpadAudios[index]?.__qaIpadEvents.includes('ended'),index,{timeout:30000});
    await waitEnabled();
  };
  await page.addInitScript(()=>{
    const NativeAudio=window.Audio;window.__qaIpadAudios=[];
    function IpadTrackedAudio(src){const audio=src===undefined?new NativeAudio():new NativeAudio(src);audio.__qaIpadEvents=[];for(const type of ['playing','ended','error'])audio.addEventListener(type,()=>audio.__qaIpadEvents.push(type));window.__qaIpadAudios.push(audio);return audio;}
    IpadTrackedAudio.prototype=NativeAudio.prototype;Object.setPrototypeOf(IpadTrackedAudio,NativeAudio);window.Audio=IpadTrackedAudio;
  });
  try{
    await page.evaluate(({progressKey,preferencesKey})=>{localStorage.setItem(progressKey,JSON.stringify({version:1,attempts:[]}));localStorage.setItem(preferencesKey,JSON.stringify({courseId:'en-01',limit:6}));},{progressKey,preferencesKey});
    await page.reload();await page.setViewportSize(baseline);
    const wrongKinds=new Set();const priority=new Set(['en02-scene-girl','en02-scene-your','en01-scene-morning','en02-listen-my','en02-listen-your']);
    const modalKinds=new Set();
    for(const courseId of ['en-01','en-02'])for(const[mode,kind]of[['context','scene'],['recall','listening']]){
      await go('/play/'+courseId+'/'+mode);await waitFocus();
      for(let step=0;step<6;step++){
        const task=await current();require(task.courseId===courseId&&task.kind===kind&&!visited.has(task.id),'Wrong or repeated task');visited.add(task.id);
        const available=await ids();choiceCounts.add(available.length);
        const stress=step===1||step===2||priority.has(task.id);
        await measureSizes(task.id+' before audio',stress);
        require(await picks().evaluateAll(buttons=>buttons.every(button=>button.disabled)),'First answer should still be locked');
        await listen();await measureSizes(task.id+' ready to choose',stress);
        const right=available.find(id=>task.acceptedChoiceIds.includes(id)),wrong=available.find(id=>!task.acceptedChoiceIds.includes(id));require(!!right&&!!wrong,'Missing actual answer/distractor');
        if(step===2&&!wrongKinds.has(kind)){
          await clickWithoutScroll(pick(wrong));await section().locator('.ea-feedback').waitFor();
          await measureSizes(task.id+' wrong feedback',true);
          const recorded=(await progress()).attempts.length;
          await clickWithoutScroll(section().getByRole('button',{name:'再试一次',exact:true}));
          await measureSizes(task.id+' retry',true);
          await clickWithoutScroll(pick(wrong));await section().locator('.ea-feedback').waitFor();
          await measureSizes(task.id+' second wrong feedback',true);
          require((await progress()).attempts.length===recorded,'A second wrong retry must not add another learning record');
          await clickWithoutScroll(section().getByRole('button',{name:'再试一次',exact:true}));
          await clickWithoutScroll(pick(right));await section().locator('.ea-feedback').waitFor();
          require((await progress()).attempts.length===recorded,'Retry must not add another learning record');wrongKinds.add(kind);
        }else{await clickWithoutScroll(pick(right));await section().locator('.ea-feedback').waitFor();}
        await measureSizes(task.id+' correct feedback',stress);
        if(!modalKinds.has(kind)||priority.has(task.id)){
          const recorded=(await progress()).attempts.length;
          await clickWithoutScroll(section().getByRole('button',{name:'看看示范',exact:true}));
          const explanation=page.getByRole('dialog',{name:'小伙伴的示范',exact:true});await explanation.waitFor();
          await measureSizes(task.id+' explanation overlay',true,true);
          await clickWithoutScroll(explanation.getByRole('button',{name:'回到题目',exact:true}));
          require(await page.getByRole('dialog').count()===0||!await explanation.isVisible(),'Explanation overlay did not close');
          await clickWithoutScroll(section().getByRole('button',{name:'轮到你开口',exact:true}));
          const oral=page.getByRole('dialog',{name:'轮到你当小伙伴',exact:true});await oral.waitFor();
          await measureSizes(task.id+' oral overlay',true,true);
          await page.keyboard.press('Escape');await oral.waitFor({state:'hidden'});
          require((await progress()).attempts.length===recorded,'Explanation/oral overlays must not record a score');
          modalKinds.add(kind);await measureSizes(task.id+' closed overlays',stress);
        }
        if(task.id==='en02-scene-girl'||task.id==='en02-listen-my')for(const size of sizes){await page.setViewportSize(size);await page.screenshot({path:'output/playwright/audio/ipad-'+size.width+'x'+size.height+'-'+task.id+'-feedback.png',fullPage:false});}await page.setViewportSize(baseline);
        await clickWithoutScroll(next());
        await page.waitForFunction(id=>document.querySelector('.english-adventure[data-activity-id]')?.getAttribute('data-activity-id')!==id,task.id);
        if(step<5){require(await section().getAttribute('data-prompt-heard')==='false','Next question failed to reset first-listen gating');require(await section().locator('.ea-feedback').count()===0,'Next question kept prior feedback');}
      }
      await page.getByRole('heading',{name:'这一趟小探险，到站啦！',exact:true}).waitFor();
      checks.push(courseId+' '+kind+'：全部6题可直接点击，不滚动完成，换题正确重置');
    }
    require(visited.size===24&&choiceCounts.has(2)&&choiceCounts.has(3),'Full source or both choice layouts were not covered');
    checks.push('全部24个任务、两选项与三选项均实测；提示音频全部真实播放结束');
    checks.push('错答、重试、正确反馈、示范和口语弹层在5种iPad可用视口实测');

    const beforeTeacher=JSON.stringify(await progress());
    await go('/teacher');await page.locator('.teacher-controls select').first().selectOption('en-02');await page.locator('.teacher-controls select').nth(1).selectOption('context');
    await page.waitForFunction(()=>document.querySelector('.app-shell')?.classList.contains('teacher-game-focus'));
    for(let step=0;step<3;step++){
      const task=await current();await measureSizes('teacher before '+step,true);await listen();await measureSizes('teacher ready '+step,true);
      const available=await ids();await clickWithoutScroll(pick(available.find(id=>task.acceptedChoiceIds.includes(id))));await section().locator('.ea-feedback').waitFor();await measureSizes('teacher feedback '+step,true);
      if(step<2){await clickWithoutScroll(next());await page.waitForFunction(id=>document.querySelector('.english-adventure[data-activity-id]')?.getAttribute('data-activity-id')!==id,task.id);}
    }
    require(JSON.stringify(await progress())===beforeTeacher,'Teacher layout interactions wrote personal progress');checks.push('教师focus态与紧凑选课栏在5种视口实测，含三选项反馈，不写个人记录');
    await clickWithoutScroll(section().locator('.ea-exit'));
    await page.waitForFunction(()=>!document.querySelector('.app-shell')?.classList.contains('game-focus'));
    await page.evaluate(()=>scrollTo({top:200,behavior:'instant'}));require(await page.evaluate(()=>scrollY>0),'Course page did not regain normal document scrolling');await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    require(await page.locator('.sidebar').isVisible()&&await page.locator('.topbar').isVisible(),'Course page did not restore ordinary navigation');checks.push('离开教师关卡后课目页恢复导航与正常滚动');

    const reviewTask=Object.values(tasks).find(task=>task.courseId==='en-02'&&task.kind==='listening');
    await page.evaluate(({key,lexemeId})=>{const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);yesterday.setHours(12,0,0,0);const localDate=yesterday.getFullYear()+'-'+String(yesterday.getMonth()+1).padStart(2,'0')+'-'+String(yesterday.getDate()).padStart(2,'0');localStorage.setItem(key,JSON.stringify({version:1,attempts:[{id:'qa-ipad-listening-due',lexemeId,skill:'listening',correct:true,assisted:false,confirmedBy:'auto',timestamp:yesterday.toISOString(),localDate,mode:'listening',sourceEvidence:'qa-ipad:prompt-ended:first-choice'}]}));},{key:progressKey,lexemeId:reviewTask.lexemeId});
    await go('/review');await page.reload();await page.getByRole('button',{name:'开始复习',exact:true}).click();await waitFocus();const due=await current();
    require(due.kind==='listening'&&due.lexemeId===reviewTask.lexemeId,'Due review did not retain listening');await measureSizes('review before',true);await listen();await measureSizes('review ready',true);
    const reviewChoices=await ids();await clickWithoutScroll(pick(reviewChoices.find(id=>due.acceptedChoiceIds.includes(id))));await section().locator('.ea-feedback').waitFor();await measureSizes('review feedback',true);
    await clickWithoutScroll(section().locator('.ea-exit'));await page.waitForFunction(()=>!document.querySelector('.app-shell')?.classList.contains('game-focus'));
    require(await page.getByRole('heading',{name:'复习背包',exact:true}).count()>0,'Review exit did not restore backpack');checks.push('听力复习focus态在5种视口实测，退出清除focus并返回背包');
    await go('/parent');await page.waitForFunction(()=>!document.querySelector('.app-shell')?.classList.contains('game-focus'));
    await page.evaluate(()=>scrollTo({top:200,behavior:'instant'}));require(await page.evaluate(()=>scrollY>0),'Parent page did not regain normal scrolling');await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));require(await page.locator('.sidebar').isVisible()&&await page.locator('.topbar').isVisible(),'Parent page did not restore ordinary navigation');checks.push('家长页恢复普通导航与滚动，不遗留游戏focus CSS状态');
    require(errors.length===0,'Browser pageerrors: '+errors.join('; '));checks.push('所有布局、切题、教师、复习与弹层流程pageerror为0');
    return{base,checks,errors,activitiesCovered:visited.size,viewports:sizes,measuredStates:samples.length,
      minimumTargetPixels:Math.min(...samples.map(sample=>sample.minTarget)),minimumCriticalFontPixels:Math.min(...samples.map(sample=>sample.minCriticalFont)),
      maximumDocumentOverflowX:Math.max(...samples.map(sample=>sample.overflow.x)),maximumDocumentOverflowY:Math.max(...samples.map(sample=>sample.overflow.y)),
      viewportStateCounts:sizes.map(size=>({...size,states:samples.filter(sample=>sample.width===size.width&&sample.height===size.height).length}))};
  }finally{
    await page.evaluate(({progressKey,preferencesKey,original})=>{for(const[key,value]of[[progressKey,original.progress],[preferencesKey,original.preferences]]){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}},{progressKey,preferencesKey,original});await page.reload();await page.locator('main').waitFor();
  }
}
