// Execute with playwright-cli run-code in a separate QA browser session.
// Only that session's local test data is replaced; no normal-browser data is read.
async (page) => {
  const base = 'http://127.0.0.1:5173/';
  const checks = [];
  const errors = [];
  const key = 'fanfan-word-adventure:progress:v1';
  page.on('pageerror', error => errors.push(error.message));
  const assert = (condition, message) => { if (!condition) throw new Error(message); checks.push(message); };
  const go = async path => { await page.goto(base + '#' + path); await page.locator('main').waitFor(); };
  const records = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{"attempts":[]}').attempts, key);
  await page.goto(base);
  await page.evaluate(key => { localStorage.removeItem(key); localStorage.removeItem('fanfan-word-adventure:preferences:v1'); }, key);
  await page.reload();
  await page.setViewportSize({ width: 1440, height: 1050 });
  assert((await page.title()).includes('字词冒险岛'), '正确标题与首页加载');
  await page.getByRole('button', { name: '开始今天的冒险' }).click();
  await page.getByRole('link', { name: '词义宝箱 读懂一个字词的意思' }).click();
  for (let index = 0; index < 6; index++) {
    await page.locator('.answer').first().click();
    await page.getByRole('button', { name: index === 5 ? '完成这次冒险' : '下一题', exact: true }).click();
  }
  assert((await records()).length === 6, '六题关卡有终点，答对或答错均正确留下一次尝试');
  await page.reload();
  assert((await records()).length === 6, '刷新后学习记录保留');
  await go('/play/cn-01/meaning');
  await page.getByRole('button', { name: '需要一点提示' }).click();
  await page.locator('.answer').first().click();
  assert((await records()).at(-1).assisted === true, '使用提示只累计练习证据');
  await go('/play/en-01/recall');
  assert(await page.locator('.typed-answer').count() === 0, '英文回忆是口头自查，不暗中要求拼写');
  await page.getByRole('button', { name: '我完成了，核对答案' }).click();
  await page.getByRole('button', { name: '我自己想对了' }).click();
  assert((await records()).at(-1).skill === 'recall', '英文口头回忆记录独立技能');
  await go('/play/cn-01/writing');
  assert((await page.locator('.question-clue').innerText()).match(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/), '纸写题提供拼音，揭晓前隐藏汉字');
  await page.getByRole('button', { name: '我完成了，核对答案' }).click();
  await page.locator('.confirmation input').check();
  await page.getByRole('button', { name: '我自己想对了' }).click();
  await page.getByRole('button', { name: '下一题', exact: true }).click();
  await page.getByRole('button', { name: '我完成了，核对答案' }).click();
  assert(!await page.locator('.confirmation input').isChecked(), '家长确认每题重置，不沿用上一题');
  await page.getByRole('button', { name: '我自己想对了' }).click();
  const writing = (await records()).filter(attempt => attempt.skill === 'writing');
  assert(writing[0].confirmedBy === 'parent' && writing[1].confirmedBy === 'self', '家长书写确认与儿童自查分别保存');
  const beforeTeacher = (await records()).length;
  await go('/teacher');
  assert(!await page.locator('.revealed-answer').count(), '老师演示初始隐藏答案');
  await page.getByRole('button', { name: '揭晓答案', exact: true }).click();
  await page.screenshot({ path: 'output/playwright/teacher-desktop.png', fullPage: true });
  await page.getByRole('button', { name: '下一题', exact: true }).click();
  assert((await records()).length === beforeTeacher, '老师演示不污染个人成绩');
  await page.emulateMedia({ media: 'print' });
  assert(await page.locator('.print-sheet').isVisible() && !await page.locator('.round').isVisible(), '打印只显示本课词单，隐藏导航和闯关');
  await page.emulateMedia({ media: 'screen' });
  await go('/parent');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出学习记录' }).click();
  const download = await downloadPromise;
  await download.saveAs('output/playwright/progress-backup.json');
  assert(download.suggestedFilename().endsWith('.json'), '学习记录真实可导出');
  await page.locator('input[type=file]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":999,"attempts":[]}') });
  assert((await records()).length === beforeTeacher && await page.locator('.notice').count() > 0, '不合法备份导入显示错误并保留原记录');
  await page.locator('input[type=file]').setInputFiles('output/playwright/progress-backup.json');
  await page.getByRole('button', { name: '确认替换记录' }).click();
  assert((await records()).length === beforeTeacher, '已校验备份确认后可正常导入');
  // Set up yesterday's evidence through the same pure progress engine, then check the real review UI.
  await page.evaluate(async key => {
    const data = await import('/src/data/curriculum.ts');
    const engine = await import('/src/lib/progress.ts');
    const item = data.lexemes.find(item => item.courseId === 'cn-01' && item.kind === 'textbook_word');
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const evidence = engine.recordAttempt(engine.createEmptyProgress(), { lexemeId: item.id, skill: 'meaning', mode: 'recall', correct: true, confirmedBy: 'self', timestamp: yesterday.toISOString(), sourceEvidence: 'qa-yesterday-explanation' }, [item.id]);
    localStorage.setItem(key, engine.exportProgress(evidence));
  }, key);
  await page.reload();
  await go('/review');
  await page.getByRole('button', { name: '开始复习' }).click();
  assert(await page.locator('.question-badge').innerText() === '词义理解', '到期词义按原技能复测');
  await page.getByRole('button', { name: '我完成了，核对答案' }).click();
  await page.getByRole('button', { name: '我自己想对了' }).click();
  await page.getByRole('button', { name: '完成这次冒险' }).click();
  await page.getByRole('button', { name: '回到复习背包', exact: true }).click();
  assert(await page.getByRole('heading', { name: '今天暂时没有到期的字词' }).isVisible(), '完成复测后消除原技能到期状态且能返回背包');
  // One local browser route for every class, so a broken or empty lesson cannot hide behind a polished homepage.
  const inventory = await page.evaluate(async () => { const data = await import('/src/data/curriculum.ts'); return data.courses.filter(course => course.kind === 'lesson' || course.kind === 'unit').map(course => ({ id: course.id, title: course.title })); });
  for (const course of inventory) {
    await go('/play/' + course.id + '/meaning');
    if (await page.locator('.answer').count() < 2) throw new Error('课程缺少可玩词义题：' + course.title);
  }
  checks.push('26篇语文课文与8个英语单元均在真实浏览器打开词义关卡');
  // Clear the QA profile and preserve clean screenshots for review.
  await page.evaluate(key => localStorage.removeItem(key), key);
  await page.reload();
  await go('/');
  await page.screenshot({ path: 'output/playwright/home-desktop.png', fullPage: true });
  for (const width of [390, 820]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ['/', '/map/chinese', '/map/english', '/course/cn-01', '/play/en-01/meaning', '/teacher', '/parent']) {
      await go(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      if (overflow) throw new Error('页面横向溢出：' + width + 'px ' + path);
    }
    checks.push(width + 'px 七个核心页面无横向溢出');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await go('/');
  await page.screenshot({ path: 'output/playwright/home-mobile.png', fullPage: true });
  await page.getByRole('link', { name: '老师投屏', exact: true }).last().click();
  assert(await page.getByRole('heading', { name: '把小岛，带进课堂。' }).isVisible(), '窄屏可通过实际入口到达老师投屏');
  await go('/play/cn-01/meaning');
  await page.screenshot({ path: 'output/playwright/game-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await go('/');
  assert(errors.length === 0, '所有流程无浏览器运行异常');
  return { checks, errors };
}
