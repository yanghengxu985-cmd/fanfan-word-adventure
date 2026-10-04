import { readFileSync, writeFileSync } from 'node:fs';

// Embed local, audited source data in the CLI functions. Published Pages sites
// do not serve /src, so browser checks must never fetch development endpoints.
const source = new URL('../src/data/englishActivities.json', import.meta.url);
const activities = JSON.parse(readFileSync(source, 'utf8'));
const clips = JSON.parse(readFileSync(new URL('../src/data/englishActivityClips.json', import.meta.url), 'utf8'));
for (const filename of ['browser-check-activities.js', 'browser-check-ipad-layout.js']) {
  const path = new URL(filename, import.meta.url);
  let script = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const tasks = Object.fromEntries(activities.map(item => [item.id, filename === 'browser-check-activities.js' ? {
    courseId: item.courseId, kind: item.kind, lexemeId: item.lexemeId,
    promptText: item.promptText, promptAudioId: item.promptAudioId,
    modelText: item.modelText, modelAudioId: item.modelAudioId, dialogueAudioId: item.dialogueAudioId,
    acceptedChoiceIds: item.acceptedChoiceIds,
    choices: item.choices.map(({ id, picture, text, audioId }) => ({ id, picture, text, audioId })),
  } : {
    courseId: item.courseId, kind: item.kind, lexemeId: item.lexemeId, acceptedChoiceIds: item.acceptedChoiceIds,
    layoutTextLength: item.scene.length + item.promptText.length + item.modelText.length + item.explanation.length + item.oralCue.length,
  }]));
  if (!/^  const tasks = .*;$/m.test(script)) throw new Error(`Missing snapshot marker: ${filename}`);
  script = script.replace(/^  const tasks = .*;$/m, `  const tasks = ${JSON.stringify(tasks)};`);
  if (filename === 'browser-check-activities.js') {
    const line = `  const clipSourceSnapshot = ${JSON.stringify(clips)};`;
    script = /^  const clipSourceSnapshot = .*;$/m.test(script)
      ? script.replace(/^  const clipSourceSnapshot = .*;$/m, line)
      : script.replace(/^  const tasks = .*;$/m, match => `${match}\n${line}`);
  }
  writeFileSync(path, script, 'utf8');
}
console.log(`Embedded ${activities.length} activities and ${Object.keys(clips).length} clip scripts in production-compatible QA.`);
