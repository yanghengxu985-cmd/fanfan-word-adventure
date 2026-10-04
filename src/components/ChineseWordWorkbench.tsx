import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, Eye, EyeOff, Pause, Pencil, Volume2 } from 'lucide-react';
import { getLessonWords, lessonCourseById, type LessonCourse, type LessonWord, type WordCategory } from '../data/chineseLessons';
import { createChineseLessonAudioPlayer, getLessonAudioEntry } from '../lib/chineseLessonAudio';

export type ChineseWritingFocus = { character: string; pinyin: string; parts: string; attention: string; words: string[]; distinguish?: string };
export type ChineseRecognitionFocus = { character: string; pinyin: string; parts: string; attention: string; words: string[]; meaning: string };
export type ChineseVocabularyFocus = { text: string; pinyin: string; meaning: string; attention: string; example: string };
export type ChineseWordWorkbenchHandle = { stopAudio: () => void };
export type ChineseWordWorkbenchProps = {
  courseId: string;
  writingFocus: ChineseWritingFocus[];
  recognitionFocus: ChineseRecognitionFocus[];
  wordFocus?: ChineseVocabularyFocus[];
  initialCharacter?: string;
  onHiddenChange?: (hidden: boolean) => void;
};
const categories: WordCategory[] = ['recognition', 'writing', 'words'];
const categoryLabels: Record<WordCategory, string> = { recognition: '会认字', writing: '会写字', words: '课内词语' };

const ChineseWordWorkbench = forwardRef<ChineseWordWorkbenchHandle, ChineseWordWorkbenchProps>(function ChineseWordWorkbench(props, ref) {
  const course = lessonCourseById.get(props.courseId);
  if (!course) return <div className="kf-word-library"><h2>这一课的字词暂时没有找到</h2></div>;
  return <WorkbenchContent key={course.id} {...props} course={course} ref={ref} />;
});
export default ChineseWordWorkbench;

const WorkbenchContent = forwardRef<ChineseWordWorkbenchHandle, ChineseWordWorkbenchProps & { course: LessonCourse }>(function WorkbenchContent({ course, writingFocus, recognitionFocus, wordFocus = [], initialCharacter, onHiddenChange }, ref) {
  const bank = useMemo(() => ({ recognition: getLessonWords(course, 'recognition'), writing: getLessonWords(course, 'writing'), words: getLessonWords(course, 'words') }), [course]);
  const initial = bank.writing.find(item => item.text === initialCharacter) || bank.writing[0] || bank.recognition[0] || bank.words[0];
  const initialCategory: WordCategory = bank.writing.includes(initial) ? 'writing' : bank.recognition.includes(initial) ? 'recognition' : 'words';
  const [selected, setSelected] = useState<{ category: WordCategory; id: string }>({ category: initialCategory, id: initial.id });
  const [focusedCharacter, setFocusedCharacter] = useState([...initial.text][0]);
  const [hidden, setHidden] = useState(false);
  const [review, setReview] = useState(false);
  const [audioStatus, setAudioStatus] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const player = useRef<ReturnType<typeof createChineseLessonAudioPlayer> | null>(null);
  const word = bank[selected.category].find(item => item.id === selected.id)!;
  const writing = writingFocus.find(item => item.character === focusedCharacter);
  const recognition = recognitionFocus.find(item => item.character === focusedCharacter);
  const vocabulary = wordFocus.find(item => item.text === word.text);
  const writingAllowed = selected.category !== 'recognition';
  const availableAudio = !!getLessonAudioEntry(word.id, word.text);
  const pinyin = word.pinyin || (selected.category === 'recognition' ? recognition?.pinyin : writing?.pinyin) || vocabulary?.pinyin;

  function stopAudio() { player.current?.stop(); setAudioPlaying(false); setAudioStatus(''); }
  useImperativeHandle(ref, () => ({ stopAudio }));
  function selectWord(item: LessonWord, category: WordCategory) {
    stopAudio(); setSelected({ category, id: item.id });
    setFocusedCharacter([...item.text].find(character => writingFocus.some(focus => focus.character === character)) || [...item.text][0]);
    setHidden(false); setReview(false);
  }
  function playWord() {
    if (audioPlaying) { stopAudio(); return; }
    if (!availableAudio) return;
    player.current ??= createChineseLessonAudioPlayer({ baseUrl: import.meta.env.BASE_URL, onStatus: setAudioStatus, onEvent: () => setAudioPlaying(false) });
    setAudioPlaying(true); player.current.play(word.id, word.text);
  }
  function reveal(check: boolean) { stopAudio(); setHidden(false); setReview(check && writingAllowed); }
  useEffect(() => { onHiddenChange?.(hidden); }, [hidden, onHiddenChange]);
  useEffect(() => {
    const suspend = () => { if (document.hidden) stopAudio(); };
    const onRoute = () => stopAudio();
    document.addEventListener('visibilitychange', suspend);
    window.addEventListener('hashchange', onRoute);
    window.addEventListener('pagehide', onRoute);
    return () => {
      player.current?.stop();
      document.removeEventListener('visibilitychange', suspend);
      window.removeEventListener('hashchange', onRoute);
      window.removeEventListener('pagehide', onRoute);
      onHiddenChange?.(false);
    };
  }, [onHiddenChange]);

  return <>
    <div className="kf-word-library">
      {!hidden ? <>
        <div className="kf-section-heading"><span className="kf-eyebrow">本课完整字词清单</span><h2>点一个，仔细练</h2></div>
        {categories.map(category => <div className={`kf-word-group kf-word-group-${category}`} key={category}>
          <div className="kf-word-group-label"><h3>{categoryLabels[category]}</h3><span>{bank[category].length}{category === 'words' ? '个' : '字'}</span></div>
          <div className="kf-word-chips" role="group" aria-label={`选择${categoryLabels[category]}`}>
            {bank[category].map(item => <button key={item.id} className={selected.id === item.id && selected.category === category ? 'is-active' : ''} aria-pressed={selected.id === item.id && selected.category === category} onClick={() => selectWord(item, category)}>{item.text}</button>)}
          </div>
        </div>)}
        <p className="kf-library-note">会认，放进词语读；会写，还要在纸上独立写。</p>
      </> : <div className="kf-covered-library"><EyeOff size={33} /><span className="kf-eyebrow">字词卡已合上</span><h2>先自己试一试</h2><p>回想刚才选中的字或词。{availableAudio ? '需要提示时，可以听读音。' : '想不起来时，可以返回看字。'}试过以后，再展开核对。</p><button className="kf-text-button" onClick={() => reveal(false)}><Eye size={18} />返回看字</button></div>}
    </div>
    <div className={`kf-word-workbench ${selected.category === 'words' ? 'is-vocabulary' : ''}`}>
      <div className="kf-word-workbench-top"><span className="kf-eyebrow">{categoryLabels[selected.category]} · {selected.category === 'words' ? '自选练写' : writingAllowed ? hidden ? '凭记忆，在纸上写' : '看清字形，再自己写' : hidden ? '合上字卡，自己读' : '放进词语，读准字音'}</span>{availableAudio && <button className="kf-audio-button" onClick={playWord}>{audioPlaying ? <Pause size={18} /> : <Volume2 size={18} />}{audioPlaying ? '停止' : '听读音'}</button>}</div>
      <div className={`kf-word-display ${word.text.length > 2 ? 'is-long' : ''} ${word.text.length > 3 ? 'is-four-character' : ''} ${hidden ? 'is-hidden' : ''}`}>
        <span className="kf-word-pinyin">{pinyin || (hidden ? '想一想刚才看到的字' : '读音请对照课本')}</span><strong aria-label={hidden ? '字形已遮住' : word.text}>{hidden ? [...word.text].map(() => '□').join(' ') : word.text}</strong>
      </div>
      {word.text.length > 1 && !hidden && <div className="kf-focus-characters" role="group" aria-label="选择词语中要留意的字"><span>留意这个字</span>{[...word.text].map((character, index) => <button key={`${character}-${index}`} aria-pressed={focusedCharacter === character} className={focusedCharacter === character ? 'is-active' : ''} onClick={() => { stopAudio(); setFocusedCharacter(character); setReview(false); }}>{character}</button>)}</div>}
      <div className="kf-writing-guidance" aria-live="polite">
        {hidden ? <div className="kf-hidden-writing"><Pencil size={31} /><h3>{selected.category === 'words' ? '自选：在纸上写出这个词语' : writingAllowed ? '在纸上写出刚才的字' : '合上字卡，自己读一读'}</h3><p>{writingAllowed ? '写好以后，展开字形，逐处对照。' : '想想它在哪个词语里，再展开核对。'}</p></div>
          : selected.category === 'recognition' && recognition ? <>
            <div className="kf-character-structure"><span>认字线索</span><strong>{recognition.parts}</strong></div>
            <div className="kf-writing-attention"><Volume2 size={20} /><p>{recognition.attention}</p></div>
            <p className="kf-distinguish">{recognition.meaning}</p>
            <div className="kf-example-words"><span>放进词语读</span><strong>{recognition.words.join(' · ')}</strong></div>
          </> : selected.category === 'words' && vocabulary ? <>
            <div className="kf-character-structure"><span>词语意思</span><strong>{vocabulary.meaning}</strong></div>
            <div className="kf-writing-attention"><BookOpen size={20} /><p>{vocabulary.attention}</p></div>
            <p className="kf-vocabulary-context"><span>放在句子里</span>{vocabulary.example}</p>
            {writing && <p className="kf-vocabulary-writing-note"><strong>“{writing.character}”要留意</strong>{writing.attention}</p>}
          </> : writing ? <>
            <div className="kf-character-structure"><span>字形拆开看</span><strong>{writing.parts}</strong></div>
            <div className="kf-writing-attention"><Pencil size={20} /><p>{writing.attention}</p></div>
            {writing.distinguish && <p className="kf-distinguish">{writing.distinguish}</p>}
            <div className="kf-example-words"><span>放进词语读</span><strong>{writing.words.join(' · ')}</strong></div>
          </> : <>
            <div className="kf-character-structure"><span>放回课文读一读</span><strong>{word.text}</strong></div>
            <div className="kf-writing-attention"><BookOpen size={20} /><p>{word.meaning || '把这个字词放回课文读，遇到不确定的字音，对照课本或听老师示范。'}</p></div>
            {word.context && <p className="kf-distinguish">{word.context}</p>}
            {word.examples.length > 0 && <div className="kf-example-words"><span>放进词语读</span><strong>{word.examples.map(item => item.text).join(' · ')}</strong></div>}
          </>}
      </div>
      {review && <div className="kf-paper-review" role="status"><Check size={20} /><p>请看自己的纸稿：{writing?.attention || '字形写全了吗？有没有漏掉笔画？'}<span>发现不一样的地方，在旁边改写一次。</span></p></div>}
      <div className="kf-paper-actions"><p>{hidden ? '先自己想，再核对。' : selected.category === 'words' ? '可自选在纸上写这个词语。' : writingAllowed ? '准备纸和笔，遮住以后独立写。' : '遮住字卡，在词语里读一次。'}</p><button className="kf-primary" onClick={() => { if (hidden) reveal(true); else { stopAudio(); setHidden(true); setReview(false); } }}>{hidden ? <><Eye size={18} />{writingAllowed ? '展开，核对纸稿' : '展开字卡，核对'}</> : <><EyeOff size={18} />遮住，自己试</>}</button></div>
      <p className="kf-audio-status" role="status">{audioStatus || (hidden ? availableAudio ? '可按需听读音，再自己尝试。' : '先独立尝试，再展开核对。' : availableAudio ? '合成朗读示范 · 听一遍，再自己读。' : selected.category === 'words' ? '读准字音，说清意思；也可自选纸笔练写。' : writingAllowed ? '和课本对照，读准字音，再独立写。' : '和课本对照，把字放进词语里读。')}</p>
    </div>
  </>;
});
