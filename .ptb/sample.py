import csv,ast,json,collections
scls={}
with open('.ptb/scp_statements.csv') as f:
    for row in csv.DictReader(f):
        scls[row['']]=row['diagnostic_class'] if 'diagnostic_class' in row else row.get('diagnostic_class','')
# reload properly (first col header is empty)
scls={}
with open('.ptb/scp_statements.csv') as f:
    r=csv.reader(f); hdr=next(r)
    for row in r: scls[row[0]]=row[5]
buckets=collections.defaultdict(list)
with open('.ptb/ptbxl_database.csv') as f:
    for row in csv.DictReader(f):
        try: codes=ast.literal_eval(row['scp_codes'])
        except: continue
        if not codes: continue
        top=max(codes,key=lambda k:codes[k]); sc=scls.get(top,'')
        if sc not in ('NORM','MI','STTC','CD','HYP'): continue
        buckets[sc].append({'ecg_id':int(row['ecg_id']),'filename_lr':row['filename_lr'],
            'top_code':top,'superclass':sc,'age':row.get('age'),'sex':row.get('sex'),
            'validated':row.get('validated_by_human')=='True'})
sel=[]
for sc in ('NORM','MI','STTC','CD','HYP'):
    b=buckets[sc]; b.sort(key=lambda x:(not x['validated'],x['ecg_id']))
    sel+=b[:100]
json.dump(sel,open('.ptb/sample500.json','w'))
print('total',len(sel),{k:len(v) for k,v in buckets.items()})
print('selected per class',collections.Counter(x['superclass'] for x in sel))
