#!/usr/bin/env python3
"""Generate static grade 1-3 TYMM outcome modules from locally verified MEB PDFs.

The generated JS files preserve official top-level outcome wording and source locators.
No question content is copied from the curriculum documents.
"""
from __future__ import annotations
import json, re, pathlib, sys

ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE_DIR=ROOT/'docs'/'sources'
OUT_DIR=ROOT/'js'/'curriculum'/'outcomes'
TEXT_DIR=ROOT/'.tmp-curriculum-text'
TEXT_DIR.mkdir(exist_ok=True)

SPECS={
 'turkish':{
  'pdf':'TURKCE_1_4_TYMM_2024.pdf','source_id':'meb-tymm-primary-turkish-1-4-2024','url':'https://tymm.meb.gov.tr/upload/program/2024programtur1234Onayli.pdf',
  'pattern':r'T\.[DKOY]\.[1-4]\.[0-9]+','course_id':'turkce','course_name':'Türkçe','program_version':'TYMM_ILKOKUL_TURKCE_2024','skill':'LANGUAGE_LITERACY',
  'grades':[1,2,3], 'evidence':['single-choice','short-answer','open-response','audio-response']},
 'math':{
  'pdf':'MATEMATIK_1_4_TYMM_2024.pdf','source_id':'meb-tymm-primary-math-1-4-2024','url':'https://tymm.meb.gov.tr/upload/program/2024programmat1234Onayli.pdf',
  'pattern':r'MAT\.[1-4]\.[0-9]+\.[0-9]+','course_id':'matematik','course_name':'Matematik','program_version':'TYMM_ILKOKUL_MATEMATIK_2024','skill':'MATHEMATICAL_REASONING',
  'grades':[1,2,3], 'evidence':['single-choice','short-answer','open-response','interactive-simulation']},
 'life':{
  'pdf':'HAYAT_BILGISI_1_3_TYMM_2024.pdf','source_id':'meb-tymm-life-science-1-3-2024','url':'https://tymm.meb.gov.tr/upload/program/2024programhay123Onayli.pdf',
  'pattern':r'HB\.[1-3]\.[0-9]+\.[0-9]+','course_id':'hayat-bilgisi','course_name':'Hayat Bilgisi','program_version':'TYMM_HAYAT_BILGISI_2024','skill':'LIFE_AND_CIVIC_REASONING',
  'grades':[1,2,3], 'evidence':['single-choice','matching','open-response','performance-task']},
 'movement':{
  'pdf':'BEDEN_EGITIMI_VE_OYUN_1_4_TYMM.pdf','source_id':'meb-tymm-body-play-1-4-2024','url':'https://tymm.meb.gov.tr/upload/program/beden-egitimi-ve-oyun-programi.pdf',
  'pattern':r'BEO\.[1-4]\.[0-9]+\.[0-9]+','course_id':'beden-egitimi-ve-oyun','course_name':'Beden Eğitimi ve Oyun','program_version':'TYMM_BEDEN_EGITIMI_OYUN_2024','skill':'PHYSICAL_LITERACY',
  'grades':[1,2,3], 'evidence':['performance-task','interactive-simulation','observation-rubric']}
}

MANUAL_PATCH={
 'MAT.1.3.3':'Günlük yaşamdaki nesneleri biçimsel özelliklerine göre ayırt edebilme',
 'MAT.1.3.4':'Günlük yaşamda karşılaşılan geometrik yapılardaki geometrik şekilleri çözümleyebilme',
 'MAT.1.3.5':'Biçimsel özelliklerine göre geometrik şekilleri sınıflandırabilme',
 'HB.1.1.4':'Fiziksel özelliklerini ve temel duygularını açıklayabilme'
}

SKILL_NAMES={'D':'Dinleme/İzleme','K':'Konuşma','O':'Okuma','Y':'Yazma'}

def run_pdftotext(pdf:pathlib.Path,txt:pathlib.Path):
 import subprocess
 subprocess.run(['pdftotext','-layout',str(pdf),str(txt)],check=True)

def clean(value:str)->str:
 value=value.replace('\u2002',' ').replace('\u00ad','').replace('\t',' ')
 value=re.sub(r'\s+',' ',value).strip(' .:\u200b')
 import unicodedata
 return unicodedata.normalize('NFC',value)

def join_parts(parts):
 out=''
 for part in parts:
  part=part.strip()
  if not part: continue
  if out.endswith('-') and part and part[0].islower(): out=out[:-1]+part
  else: out=(out+' '+part).strip()
 return clean(out)

def extract(lines,pattern):
 code_re=re.compile(pattern)
 component_re=re.compile(r'^\s*[a-zçğıöşü]\)\s',re.I)
 stop_re=re.compile(r'^\s*(İÇERİK ÇERÇEVESİ|ÖĞRENME KANITLARI|ÖĞRENME-ÖĞRETME|FARKLILAŞTIRMA|Temel Kabuller|Ön Değerlendirme|Köprü Kurma)')
 candidates={}
 for i,line in enumerate(lines):
  for match in code_re.finditer(line):
   parts=[line[match.end():]]
   for j in range(i+1,min(i+7,len(lines))):
    nxt=lines[j]
    if code_re.search(nxt) or component_re.match(nxt) or stop_re.match(nxt): break
    if not nxt.strip():
     if any(p.strip() for p in parts): break
     continue
    parts.append(nxt)
   text=join_parts(parts)
   if len(text)<8: continue
   score=0
   if re.search(r'(bilme|yabilme|edebilme|uygulayabilme|gösterebilme|kurabilme|oluşturabilme|yönetebilme|değerlendirebilme)$',text,re.I): score+=100
   if len(text)<=220: score+=30
   if len(text)<=150: score+=20
   if 'Öğrenciler' in text: score-=50
   if re.search(r'\b(a|b|c|ç)\)',text): score-=80
   candidates.setdefault(match.group(),[]).append((score,-len(text),-i,text))
 result={code:max(rows) for code,rows in candidates.items()}
 for code,text in MANUAL_PATCH.items():
  if code in candidates:
   matching=[row for row in candidates[code] if clean(row[3])==clean(text)]
   chosen=max(matching) if matching else result[code]
   result[code]=(200,-len(text),chosen[2],text)
 return result

def nearest_heading(lines,index,kind,number):
 if kind=='turkish':
  code_match=re.search(r'T\.([DKOY])\.',lines[index])
  return ({'D':1,'K':2,'O':3,'Y':4}.get(code_match.group(1),1),SKILL_NAMES.get(code_match.group(1),'Türkçe')) if code_match else (1,'Türkçe')
 patterns={
  'math':[re.compile(r'\b([1-9][0-9]*)\.?\s*TEMA\s*:\s*(.+)',re.I),re.compile(r'TEMA\s*:\s*(.+)',re.I)],
  'life':[re.compile(r'\b([1-9][0-9]*)\.?\s*ÖĞRENME ALANI\s*:\s*(.+)',re.I),re.compile(r'ÖĞRENME ALANI\s*:\s*(.+)',re.I)],
  'movement':[re.compile(r'\b([1-9][0-9]*)\.?\s*TEMA\s*:\s*(.+)',re.I),re.compile(r'TEMA\s*:\s*(.+)',re.I)]
 }[kind]
 for j in range(index,max(-1,index-350),-1):
  line=clean(lines[j])
  for pat in patterns:
   m=pat.search(line)
   if m:
    if len(m.groups())==2:
     found_number=int(m.group(1)); title=clean(m.group(2))
    else:
     found_number=number; title=clean(m.group(1))
    title=re.sub(r'\s+(Ders Saati|Kavramsal Beceriler|Alan Becerileri).*','',title,flags=re.I)
    if 3<=len(title)<=120:return (found_number,title)
 return (number,{'math':f'Tema {number}','life':f'Öğrenme Alanı {number}','movement':f'Tema {number}'}[kind])

def slug(value):
 value=value.lower().replace('ı','i')
 import unicodedata
 value=''.join(c for c in unicodedata.normalize('NFD',value) if unicodedata.category(c)!='Mn')
 return re.sub(r'[^a-z0-9]+','-',value).strip('-')

def write_module(kind,spec,grade,rows):
 export_course={'turkish':'TURKISH','math':'MATH','life':'LIFE_SCIENCE','movement':'MOVEMENT'}[kind]
 filename={
  'turkish':f'tr-g{grade}-turkce-tymm-2024.js','math':f'tr-g{grade}-matematik-tymm-2024.js','life':f'tr-g{grade}-hayat-bilgisi-tymm-2024.js','movement':f'tr-g{grade}-beden-egitimi-ve-oyun-tymm-2024.js'
 }[kind]
 const_name=f'GRADE{grade}_{export_course}_OUTCOMES_TYMM_2024'
 lookup=f'grade{grade}{export_course.title().replace("_","")}OutcomeByCode'
 source={'id':spec['source_id'],'authority':'MEB_TTKB','title':f"{spec['course_name']} Dersi Öğretim Programı, TYMM",'status':f'AUTHORITATIVE_ACTIVE_FOR_GRADE_{grade}_2026_2027','localDocument':f"docs/sources/{spec['pdf']}",'url':spec['url']}
 body='const SOURCE=Object.freeze('+json.dumps(source,ensure_ascii=False,separators=(',',':'))+');\n'
 body+='const RAW='+json.dumps(rows,ensure_ascii=False,indent=2)+';\n'
 body+=f'export const {const_name}=Object.freeze(RAW.map(row=>Object.freeze({{...row,assessmentEvidenceTypes:Object.freeze([...row.assessmentEvidenceTypes]),source:SOURCE}})));\n'
 body+=f'export function {lookup}(code){{return {const_name}.find(row=>row.officialOutcomeCode===String(code||"").trim())||null;}}\n'
 (OUT_DIR/filename).write_text(body,encoding='utf-8')
 return filename,const_name,len(rows)

def main():
 summary=[]
 for kind,spec in SPECS.items():
  pdf=SOURCE_DIR/spec['pdf']
  if not pdf.exists(): raise SystemExit(f'missing {pdf}')
  txt=TEXT_DIR/(pdf.stem+'.txt');run_pdftotext(pdf,txt)
  lines=txt.read_text(encoding='utf-8',errors='ignore').splitlines()
  extracted=extract(lines,spec['pattern'])
  for grade in spec['grades']:
   grade_rows=[]
   for code,(score,neglen,negative_index,text) in sorted(extracted.items(),key=lambda kv:[int(x) if x.isdigit() else x for x in re.split(r'[.]',kv[0])]):
    parts=code.split('.')
    code_grade=int(parts[2] if kind=='turkish' else parts[1])
    if code_grade!=grade: continue
    index=-negative_index
    fallback_unit_number=int(parts[-2]) if kind!='turkish' else {'D':1,'K':2,'O':3,'Y':4}[parts[1]]
    unit_number,unit_name=nearest_heading(lines,index,kind,fallback_unit_number)
    topic=slug(code)
    grade_rows.append({
     'id':f"tr-tymm-g{grade}-{spec['course_id']}-{topic}",'country':'TR','schoolYear':'2026-2027','programFamily':'TYMM','programVersion':spec['program_version'],'grade':grade,'courseId':spec['course_id'],'courseName':spec['course_name'],'unitId':f"unit-{unit_number}" if kind!='turkish' else slug(unit_name),'unitName':unit_name,'topicId':topic,'topicName':text,'officialOutcomeCode':code,'officialOutcomeText':text,'sourceId':spec['source_id'],'sourceLocator':f"{spec['course_name']} {grade}. sınıf / {code} / extracted text line {index+1}",'assessmentEvidenceTypes':spec['evidence'],'disciplinarySkill':spec['skill']
    })
   if not grade_rows: raise SystemExit(f'no rows {kind} g{grade}')
   filename,const_name,count=write_module(kind,spec,grade,grade_rows);summary.append({'kind':kind,'grade':grade,'count':count,'file':filename,'export':const_name})
 print(json.dumps(summary,ensure_ascii=False,indent=2))

if __name__=='__main__': main()
