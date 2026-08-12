import csv, ast, json
T={
 "NORM":("א.ק.ג תקין","Normal ECG","NORM",False),
 "IMI":("אוטם שריר הלב תחתון","Inferior myocardial infarction","MI",True),
 "ASMI":("אוטם קדמי-מחיצתי","Anteroseptal myocardial infarction","MI",True),
 "AMI":("אוטם שריר הלב קדמי","Anterior myocardial infarction","MI",True),
 "ILMI":("אוטם תחתון-צדי","Inferolateral myocardial infarction","MI",True),
 "LVH":("היפרטרופיה של חדר שמאל","Left ventricular hypertrophy","HYP",False),
 "RVH":("היפרטרופיה של חדר ימין","Right ventricular hypertrophy","HYP",False),
 "LAFB":("חסם פאסיקולרי קדמי שמאלי","Left anterior fascicular block","CD",False),
 "CRBBB":("חסם צרור ימני מלא","Complete right bundle branch block","CD",False),
 "IRBBB":("חסם צרור ימני חלקי","Incomplete right bundle branch block","CD",False),
 "CLBBB":("חסם צרור שמאלי מלא","Complete left bundle branch block","CD",True),
 "1AVB":("חסם עלייתי-חדרי מדרגה 1","First degree AV block","CD",False),
 "AFIB":("פרפור עליות","Atrial fibrillation","STTC",True),
 "STACH":("טכיקרדיה סינוסית","Sinus tachycardia","STTC",False),
 "ISCAL":("איסכמיה אנטרו-לטרלית","Anterolateral ischemia","STTC",True),
 "NDT":("שינויי T לא ספציפיים","Non-diagnostic T abnormalities","STTC",False),
}
PER=2
found={k:[] for k in T}
with open(".ptb/ptbxl_database.csv") as f:
    for row in csv.DictReader(f):
        if row.get("validated_by_human")!="True": continue
        try: codes=ast.literal_eval(row["scp_codes"])
        except: continue
        if not codes: continue
        mx=max(codes.values())
        for code,(he,en,sc,urg) in T.items():
            conf=codes.get(code)
            if conf is not None and conf>=100.0 and conf>=mx and len(found[code])<PER:
                found[code].append({"ecg_id":int(row["ecg_id"]),"filename_lr":row["filename_lr"],
                 "age":row.get("age"),"sex":("זכר" if row.get("sex")=="0" else "נקבה"),
                 "dx_code":code,"dx_en":en,"dx_he":he,"superclass":sc,"urgent":urg,
                 "scp_codes":codes,"report":row.get("report","")[:180]})
sel=[x for lst in found.values() for x in lst]
json.dump(sel,open(".ptb/selection.json","w"),ensure_ascii=False,indent=1)
print("selected",len(sel))
