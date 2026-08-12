import csv,ast,json,collections
scls={}
with open('.ptb/scp_statements.csv') as f:
    r=csv.reader(f); next(r)
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
            'height':row.get('height'),'weight':row.get('weight'),'heart_axis':row.get('heart_axis'),
            'validated':row.get('validated_by_human')=='True'})
sel=[]
for sc in ('NORM','MI','STTC','CD','HYP'):
    b=buckets[sc]; b.sort(key=lambda x:(not x['validated'],x['ecg_id']))
    sel+=b[:400]
json.dump(sel,open('.ptb/sample2000.json','w'))
print('total',len(sel),'per_class',dict(collections.Counter(x['superclass'] for x in sel)))
