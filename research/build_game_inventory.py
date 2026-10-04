"""Build reviewable game inventory from the two transcribed textbook tables.

Only inventory structure is automated. Meanings/readings are explicit editorial
additions in game_editorial.json, never inferred from a language model at runtime.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'data' / 'inventory.json'
CN = (ROOT / 'research/chinese/wordgame_chinese_inventory.md').read_text(encoding='utf-8')
EN = (ROOT / 'research/english/wordgame_english_inventory.md').read_text(encoding='utf-8')
EDITORIAL_PATH = ROOT / 'research/game_editorial.json'
editorial = json.loads(EDITORIAL_PATH.read_text(encoding='utf-8')) if EDITORIAL_PATH.exists() else {'chineseWords': {}, 'chineseCharacters': {}, 'english': {}}
courses, lexemes = [], []
CN_SOURCE = 'https://www.scribd.com/document/1067004050/'
EN_SOURCE = 'https://media.keben.app/a961ed698633abcbe0d51bc61d3f6a2671541b90d351c154c8405f877b00dba7.pdf'
cn_units = {1:1,2:1,3:1,4:2,5:2,6:2,7:2,8:3,9:3,10:3,11:4,12:4,13:4,14:5,15:5,16:6,17:6,18:6,19:6,20:7,21:7,22:7,23:8,24:8,25:8,26:8}
cn_scenes = ['校园里的发现','秋天的颜色','故事预测站','童话旅行屋','观察小花园','祖国风景馆','自然声音馆','人物故事营']

def table_rows(section):
    text = CN.split(f'## {section}.', 1)[1].split('\n## ', 1)[0]
    rows = []
    for line in text.splitlines():
        if not line.startswith('|'):
            continue
        cols = [c.strip() for c in line.strip('|').split('|')]
        if len(cols) == 3 and re.match(r'^\d+$|^园地\s*\d+$', cols[0]):
            rows.append((cols[0], cols[1], cols[2].split()))
    return rows

def cn_course_id(owner):
    if owner.startswith('园地'):
        return 'cn-garden-' + re.search(r'\d+',owner).group()
    return f'cn-{int(owner):02}'

for owner, title, _ in table_rows('A'):
    garden = owner.startswith('园地')
    number = int(re.search(r'\d+', owner).group())
    unit = number if garden else cn_units[number]
    courses.append(dict(id=cn_course_id(owner), subject='chinese', unitId=f'cn-u{unit}', unitNumber=unit,
        **({} if garden else {'lessonNumber':number}), title=f'语文园地{number}' if garden else title,
        subtitle='识字加油站' if garden else f'第{number}课 · 第{unit}单元',
        scene=cn_scenes[unit-1], kind='garden' if garden else 'lesson'))
for number in (1,2,6):
    courses.append(dict(id=f'cn-garden-{number}', subject='chinese', unitId=f'cn-u{number}', unitNumber=number,
        title=f'语文园地{number}', subtitle='活动内容待纸本复核；不补造必会字词',scene=cn_scenes[number-1],kind='garden'))
courses.sort(key=lambda c:(c['unitNumber'], c.get('lessonNumber', 99)))
cn_counts = {}
for section, kind, page in [('A','recognition_character','109—111'),('B','writing_character','112—113'),('C','textbook_word','114—116')]:
    count = 0
    for owner, _, words in table_rows(section):
        cid = cn_course_id(owner)
        for i, word in enumerate(words):
            key = f'{cid}:{word}'
            data = editorial.get('chineseWords' if kind == 'textbook_word' else 'chineseCharacters',{}).get(key, {})
            item = dict(id=f'{cid}-{kind}-{i+1:02}', courseId=cid, subject='chinese', kind=kind,text=word,
                aliases=[],meaning=data.get('meaning',''),verificationStatus='preview_verified',
                sourceRef=f'{CN_SOURCE} 印刷页{page}',sourcePage=page,
                sourceEdition='2025年6月第1版，同26课目录公开预览',sourcePrint='公开预览印次未明；用户2026年第2印待核对',
                meaningVerified=bool(data.get('meaning')), readingVerified=bool(data.get('pinyin')),
                audioStatus='practice_only' if data.get('pinyin') else 'unavailable',
                optional=False,writingRequirement='required' if kind == 'writing_character' else ('pending' if kind == 'textbook_word' else 'not_required'))
            if data:
                item.update({k:v for k,v in data.items() if k in ('pinyin','example','notes')})
                item['meaningSource']='本项目原创简明释义与例句；逐条编辑检查，不代表教材原句或纸本复核'
            if (cid, word) in [('cn-18','起来'),('cn-22','贞')]:
                item['notes']='公开预览确有此条；用户2026纸本再次核对前保留，暂不自动判题。'
                item['meaningVerified']=False
                item['readingVerified']=False
                item['verificationStatus']='pending_verification'
            lexemes.append(item)
            count += 1
    cn_counts[kind] = count

en_scenes=['校园入口','新同学登记站','身份侦探站','朋友介绍会','家庭小屋','家庭关系树','生日礼物店','家庭小帮手']
en_counts, en_star = [], 0
for number in range(1,9):
    section = re.search(rf'### Unit {number} (.*?)\n(.*?)(?=\n### Unit |\n## 多义词)',EN,re.S)
    title, body = section.groups()
    cid = f'en-{number:02}'
    courses.append(dict(id=cid,subject='english',unitId=f'en-u{number}',unitNumber=number,lessonNumber=number,
        title=title.strip(),subtitle=f'Unit {number} · Module {1 if number < 5 else 2}',scene=en_scenes[number-1],kind='unit'))
    entries=[]
    for line in body.splitlines():
        if line.startswith('|'):
            optional = '星号情境词' in line
            for match in re.finditer(r'`([^`]+)`（p(\d+)）',line):
                headword, page = match.groups()
                text = re.sub(r'\s*\(.*?\)', '', headword).strip()
                aliases=[]
                alt=re.search(r'\((?:AmE |pl\. )?([^)]*)\)',headword)
                if alt:
                    aliases=[alt.group(1)]
                data=editorial.get('english',{}).get(f'{cid}:{text}',{})
                item=dict(id=f'{cid}-word-{len(entries)+1:02}',courseId=cid,subject='english',
                    kind='english_phrase' if ' ' in text else 'english_word',text=text,sourceHeadword=headword,
                    aliases=aliases,meaning=data.get('meaning',''),verificationStatus='preview_verified',
                    sourceRef=f'{EN_SOURCE} 词表印刷页78—80，首次出现p{page}',sourcePage=page,
                    sourceEdition='2024年7月第1版，ISBN 978-7-5753-0037-7',sourcePrint='2025年第2次印刷；用户2026年第3印待核对',
                    meaningVerified=bool(data.get('meaning')),readingVerified=True,audioStatus='practice_only',
                    optional=optional,writingRequirement='optional')
                if data:
                    item.update({k:v for k,v in data.items() if k in ('example','notes')})
                    item['meaningSource']='原书词表p78—80逐项目视核对中文词义；例句为项目原创'
                entries.append(item)
                en_star+=int(optional)
    lexemes.extend(entries)
    en_counts.append(len(entries))

for number, units in [(1,range(1,5)),(2,range(5,9))]:
    courses.append(dict(id=f'en-project-{number}',subject='english',unitId=f'en-project-{number}',unitNumber=4 if number==1 else 8,
        title='Making friends' if number==1 else 'My family poster',subtitle=f'Project {number} · 已有词库综合活动',scene='朋友见面小剧场' if number==1 else '家人介绍小海报',
        kind='project',linkedCourseIds=[f'en-{u:02}' for u in units]))
courses.append(dict(id='en-alphabet',subject='english',unitId='en-alphabet',unitNumber=0,title='Alphabet · Aa—Zz',subtitle='26组字母 · 大小写配对',scene='字母邮局',kind='alphabet'))
for i, char in enumerate('ABCDEFGHIJKLMNOPQRSTUVWXYZ'):
    lexemes.append(dict(id=f'en-alphabet-{char.lower()}',courseId='en-alphabet',subject='english',kind='alphabet',text=char+char.lower(),
        aliases=[],meaning=f'{char}的大写与小写',verificationStatus='preview_verified',sourceRef=f'{EN_SOURCE} 印刷页83',sourcePage='83',
        sourceEdition='2024年7月第1版',sourcePrint='2025年第2次印刷；用户2026年第3印待核对',
        meaningVerified=True,readingVerified=True,audioStatus='practice_only',optional=False,writingRequirement='required'))

contractions = [
    dict(short="I'm", full='I am', courseId='en-01', sourcePage='10'),
    dict(short="what's", full='what is', courseId='en-02', sourcePage='18'),
    dict(short="you're", full='you are', courseId='en-03', sourcePage='28'),
    dict(short="he's", full='he is', courseId='en-04', sourcePage='34'),
    dict(short="she's", full='she is', courseId='en-04', sourcePage='37'),
    dict(short="it's", full='it is', courseId='en-04', sourcePage='37'),
    dict(short="who's", full='who is', courseId='en-05', sourcePage='44'),
]
proper_names = [{'text':name,'sourcePage':'82','writingRequirement':'not_required'} for name in [
    'Bobby','Sam','Mike Brown','Mr Green','Jake','John','Max','Willy','Tina','Tad',"New Year's Day"]]
letters_by_unit = [{'courseId':f'en-{i+1:02}','letters':group.split()} for i,group in enumerate([
    'Aa Bb Cc Dd','Ee Ff Gg','Hh Ii Jj Kk','Ll Mm Nn','Oo Pp Qq','Rr Ss Tt','Uu Vv Ww','Xx Yy Zz'])]
summary=dict(chineseRecognitionRecords=cn_counts['recognition_character'],chineseWritingRecords=cn_counts['writing_character'],chineseWordRecords=cn_counts['textbook_word'],
    englishUnitRecords=sum(en_counts),englishUnitCounts=en_counts,englishUniqueHeadwords=len(set(x['text'] for x in lexemes if x['subject']=='english' and x['kind']!='alphabet')),
    englishOptionalRecords=en_star,alphabetPairs=26,contractionPairs=len(contractions),properNameRecords=len(proper_names),chineseMeaningReady=sum(x['meaningVerified'] for x in lexemes if x['subject']=='chinese'),
    englishMeaningReady=sum(x['meaningVerified'] for x in lexemes if x['subject']=='english' and x['kind']!='alphabet'),
    generatedFrom='research/*/wordgame_*_inventory.md + research/game_editorial.json',paperPrintVerified=False)
assert (summary['chineseRecognitionRecords'],summary['chineseWritingRecords'],summary['chineseWordRecords']) == (276,250,250)
assert en_counts == [13,11,17,9,18,12,31,16]
assert summary['englishUnitRecords']==127 and summary['englishUniqueHeadwords']==123 and en_star==12
assert len(set(x['id'] for x in lexemes))==len(lexemes)
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_text(json.dumps(dict(courses=courses,lexemes=lexemes,summary=summary,contractions=contractions,properNames=proper_names,lettersByUnit=letters_by_unit),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False))
