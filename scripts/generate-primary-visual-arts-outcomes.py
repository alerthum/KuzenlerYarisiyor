#!/usr/bin/env python3
from __future__ import annotations
import json,re,pathlib,subprocess,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1]
PDF=ROOT/'docs/sources/GORSEL_SANATLAR_1_8_TYMM.pdf'
TXT=ROOT/'.tmp-curriculum-text/gorsel-sanatlar-1-8.txt'
OUT=ROOT/'js/curriculum/outcomes'
TXT.parent.mkdir(exist_ok=True)
subprocess.run(['pdftotext','-layout',str(PDF),str(TXT)],check=True)
lines=TXT.read_text(encoding='utf-8',errors='ignore').splitlines()
code_re=re.compile(r'GS\.[1-3]\.[0-9]+\.[0-9]+')
component_re=re.compile(r'^\s*[a-zçğıöşü]\)\s',re.I)
stop_re=re.compile(r'^\s*(İÇERİK ÇERÇEVESİ|ÖĞRENME KANITLARI|ÖĞRENME-ÖĞRETME|FARKLILAŞTIRMA|Temel Kabuller|Ön Değerlendirme|Köprü Kurma)')
def clean(v):
 v=v.replace('\u2002',' ').replace('\u00ad','').replace('\t',' ')
 v=re.sub(r'\s+',' ',v).strip(' .:\u200b')
 return unicodedata.normalize('NFC',v)
def join(parts):
 out=''
 for part in parts:
  part=part.strip()
  if not part:continue
  if out.endswith('-') and part and part[0].islower():out=out[:-1]+part
  else:out=(out+' '+part).strip()
 return clean(out)
def slug(v):
 v=v.lower().replace('ı','i');v=''.join(c for c in unicodedata.normalize('NFD',v) if unicodedata.category(c)!='Mn')
 return re.sub(r'[^a-z0-9]+','-',v).strip('-')
def heading(index,fallback):
 for j in range(index,max(-1,index-320),-1):
  line=clean(lines[j]);m=re.search(r'\b([1-9][0-9]*)\.\s*TEMA\s*:\s*(.+)',line,re.I)
  if m:
   title=re.sub(r'\s+(Ders Saati|Alan Becerileri|Kavramsal Beceriler).*','',clean(m.group(2)),flags=re.I)
   if 3<=len(title)<=120:return int(m.group(1)),title
 return fallback,f'Tema {fallback}'
candidates={}
for i,line in enumerate(lines):
 for m in code_re.finditer(line):
  parts=[line[m.end():]]
  for j in range(i+1,min(i+8,len(lines))):
   nxt=lines[j]
   if code_re.search(nxt) or component_re.match(nxt) or stop_re.match(nxt):break
   if not nxt.strip():
    if any(p.strip() for p in parts):break
    continue
   parts.append(nxt)
  text=join(parts)
  if len(text)<10:continue
  score=(100 if re.search(r'(bilme|yabilme|edebilme|oluşturabilme|inceleyebilme|uygulayabilme|yansıtabilme|tasarlayabilme|sınıflandırabilme)$',text,re.I) else 0)+(30 if len(text)<=220 else 0)+(20 if len(text)<=150 else 0)-(80 if re.search(r'\b[a-dç]\)',text,re.I) else 0)
  candidates.setdefault(m.group(),[]).append((score,-len(text),-i,text))
chosen={code:max(rows) for code,rows in candidates.items()}
summary=[]
for grade in [1,2,3]:
 rows=[]
 for code,(score,neglen,negidx,text) in sorted(chosen.items(),key=lambda kv:[int(x) if x.isdigit() else x for x in kv[0].split('.')]):
  if int(code.split('.')[1])!=grade:continue
  idx=-negidx;fallback=int(code.split('.')[2]);unit_num,unit_name=heading(idx,fallback)
  rows.append({'id':f'tr-tymm-g{grade}-gorsel-sanatlar-{slug(code)}','country':'TR','schoolYear':'2026-2027','programFamily':'TYMM','programVersion':'TYMM_GORSEL_SANATLAR_TEMEL_EGITIM_2024','grade':grade,'courseId':'gorsel-sanatlar','courseName':'Görsel Sanatlar','unitId':f'unit-{unit_num}','unitName':unit_name,'topicId':slug(code),'topicName':text,'officialOutcomeCode':code,'officialOutcomeText':text,'sourceId':'meb-tymm-visual-arts-1-8-2024','sourceLocator':f'Görsel Sanatlar {grade}. sınıf / {code} / extracted text line {idx+1}','assessmentEvidenceTypes':['performance-task','portfolio','visual-analysis','observation-rubric'],'disciplinarySkill':'VISUAL_ARTS_LITERACY'})
 if len(rows)!=11:raise SystemExit(f'g{grade} expected 11 got {len(rows)}')
 source={'id':'meb-tymm-visual-arts-1-8-2024','authority':'MEB_TTKB','title':'Görsel Sanatlar Dersi Öğretim Programı (1-8), TYMM','status':f'AUTHORITATIVE_ACTIVE_FOR_GRADE_{grade}_2026_2027','localDocument':'docs/sources/GORSEL_SANATLAR_1_8_TYMM.pdf','url':'https://tymm.meb.gov.tr/upload/program/gorsel-sanatlar-ogretim-programi-temel-egitim.pdf'}
 const=f'GRADE{grade}_VISUAL_ARTS_OUTCOMES_TYMM_2024'; lookup=f'grade{grade}VisualArtsOutcomeByCode'
 body='const SOURCE=Object.freeze('+json.dumps(source,ensure_ascii=False,separators=(',',':'))+');\nconst RAW='+json.dumps(rows,ensure_ascii=False,indent=2)+';\n'
 body+=f'export const {const}=Object.freeze(RAW.map(row=>Object.freeze({{...row,assessmentEvidenceTypes:Object.freeze([...row.assessmentEvidenceTypes]),source:SOURCE}})));\nexport function {lookup}(code){{return {const}.find(row=>row.officialOutcomeCode===String(code||"").trim())||null;}}\n'
 file=OUT/f'tr-g{grade}-gorsel-sanatlar-tymm-2024.js';file.write_text(body,encoding='utf-8');summary.append({'grade':grade,'count':len(rows),'file':file.name})
print(json.dumps(summary,ensure_ascii=False,indent=2))
