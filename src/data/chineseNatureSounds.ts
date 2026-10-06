export type NatureRecording = {
  source: string;
  label: string;
  title: string;
  author: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  description: string;
  changes: string;
};

// These are local, licensed field recordings, independent of the lesson narration.
export const autumnNatureRecordings: Record<'leaves' | 'cricket' | 'geese', NatureRecording> = {
  leaves: {
    source: 'audio/nature/autumn-leaves.mp3',
    label: '树叶与秋风',
    title: 'Autumn leaves falling on forest floor (close, loopable)',
    author: 'Mjeno',
    sourceUrl: 'https://freesound.org/people/Mjeno/sounds/405136/',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    description: '德国森林秋天落叶的近距离实录，作为沙沙叶声的参考。',
    changes: '公开试听版转为单声道 MP3，调整音量并做短淡入淡出；保留原有声源与节奏。',
  },
  cricket: {
    source: 'audio/nature/field-cricket.mp3',
    label: '蟋蟀',
    title: 'Cricket Ambience — Random Sounds Samples',
    author: 'Augmentality (Brandon Morris)',
    sourceUrl: 'https://opengameart.org/content/random-sounds-samples',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    description: '作者用麦克风录制的蟋蟀环境声；不代表课文指定的物种或地点。',
    changes: '原 OGG 转为单声道 MP3，调整音量并做短淡入淡出；保留真实虫鸣节奏，选用作者提供的 CC0 许可。',
  },
  geese: {
    source: 'audio/nature/greylag-flight-calls.mp3',
    label: '远行的大雁',
    title: 'Anser anser — Greylag Goose XC518305',
    author: 'Jens Loose',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Anser_anser_-_Greylag_Goose_XC518305.mp3',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    description: '灰雁夜间飞行鸣叫实录，作为雁鸣参考；不是普通小鸟的啁啾，也不是“叮咛”的人声朗读。',
    changes: '原 MP3 转为单声道 MP3，调整音量并做短淡入淡出；保留飞行呼叫与自然间隔。改编录音沿用 CC BY-SA 4.0。',
  },
};

export function getLessonNatureRecordings(courseId: string): NatureRecording[] {
  return courseId === 'cn-07' ? Object.values(autumnNatureRecordings) : [];
}
