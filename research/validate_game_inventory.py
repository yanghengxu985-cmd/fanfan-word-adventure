"""Content checks that prevent false semester coverage or unsafe grading data."""
import json
import re
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
DATA=json.loads((ROOT/'src/data/inventory.json').read_text(encoding='utf-8'))
COURSES=DATA['courses']
LEXEMES=DATA['lexemes']
course_ids={c['id'] for c in COURSES}
assert len(course_ids)==len(COURSES)==44
assert len({x['id'] for x in LEXEMES})==len(LEXEMES)==929
assert all(x['courseId'] in course_ids for x in LEXEMES)
assert all(target in course_ids for c in COURSES for target in c.get('linkedCourseIds',[]))
counts=Counter(x['kind'] for x in LEXEMES)
assert counts['recognition_character']==276
assert counts['writing_character']==250
assert counts['textbook_word']==250
assert counts['english_word']+counts['english_phrase']==127
assert counts['alphabet']==26
english=[x for x in LEXEMES if x['subject']=='english' and x['kind']!='alphabet']
assert len(set(x['text'] for x in english))==123
assert len(set(v for x in english for v in [x['text'],*x['aliases']]))==128
assert sum(x['optional'] for x in english)==12
assert sum(x['meaningVerified'] for x in english)==127
assert all(x['writingRequirement']=='optional' for x in english)
assert len(DATA['contractions'])==7 and len(DATA['properNames'])==11
assert ''.join(x['text'][0] for x in LEXEMES if x['kind']=='alphabet')=='ABCDEFGHIJKLMNOPQRSTUVWXYZ'
assert all(x['verificationStatus']!='paper_verified' for x in LEXEMES)
assert all(not x['readingVerified'] or (x['subject']=='english' or bool(x.get('pinyin'))) for x in LEXEMES)
assert all(not x['meaningVerified'] or bool(x['meaning']) for x in LEXEMES)
assert all(not x['meaningVerified'] and not x['readingVerified'] for x in LEXEMES if x['verificationStatus']=='pending_verification')
assert {x['text'] for x in LEXEMES if x['kind']=='writing_character' and x['courseId'] in ['cn-03','cn-07','cn-09','cn-10','cn-13','cn-19','cn-26']}==set()
assert not any(c['id']=='cn-garden-5' for c in COURSES)
report=['# 本地游戏教材与出题内容覆盖检查', '', '检查来源：完整导入两科底稿；逐项显式编写并检查释义和原创例句。下列“可练词义”指开发素材已经过逐条编辑检查，不表示老师或用户纸本已复核。', '',
    '| 课程 | 库存记录 | 可练词义 | 带上下文例句 | 说明 |','| --- | ---: | ---: | ---: | --- |']
for c in COURSES:
    items=[x for x in LEXEMES if x['courseId']==c['id']]
    if c.get('linkedCourseIds'):
        items=[x for x in LEXEMES if x['courseId'] in c['linkedCourseIds']]
    ready=[x for x in items if x['meaningVerified']]
    contextual=[x for x in ready if x.get('example') and x['text'] in x['example']]
    if c['kind'] in ['lesson','unit']:
        assert len(ready)>=6, c['id']
    note='独立库存' if items else '无本次书后表项目，园地活动需补拍正文核对；不补造必会字词'
    if c.get('linkedCourseIds'):
        note='重用相关单元词库；不重复计算词条'
    report.append(f"| {c['id']} · {c['title']} | {len(items)} | {len(ready)} | {len(contextual)} | {note} |")
report.extend(['', '固定计数：语文识字表276个展示记录（274个不同字形，教材新生字250个另计），写字250，词语250；英语127单元记录（123个不同表面词头、12个星号选学、128个展开后的词形），字母26组、缩略形式7组、专名11个另计。', '',
    '语文“起来”和“贞”保留待纸本核对，多音字未确定本课义音时不给自动判题。词语释义就绪249/250；字符字形库存全部保留，其中148个教学记录补充了可练的释义；未补充的字符仅做词卡清单。', '',
    '英语所有127条词义按公开原书78—80页义项目视核对并作原创简释；例句是本项目原创，不是原书完整对话。机器合成语音仅跟读、自查，没有教材原音校对或自动口语评分。', '',
    '2026纸本末尾字词表尚未核对，所有源词条均不是paper_verified。写字表的250个字与词语表250个词的书写要求分别处理，不用“组成词的字都会写”推断“这个词必须默写”。'])
out=ROOT/'research/game_inventory_coverage.md'
out.write_text('\n'.join(report)+'\n',encoding='utf-8')
print(f'Content checks passed: {len(COURSES)} courses, {len(LEXEMES)} inventory records. Report: {out}')
