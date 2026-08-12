import json,sys,math
sys.path.insert(0,'/app/.ptb/py')
import numpy as np
np.random.seed(11)
LO=['I','II','III','AVR','AVL','AVF','V1','V2','V3','V4','V5','V6']
INF=['II','III','AVF']; LAT=['I','AVL','V5','V6']; REG=INF+LAT
cov={r['ecg_id']:r for r in json.load(open('.ptb/sample_big.json'))}
rows=[json.loads(l) for l in open('.ptb/feat.jsonl')]
rows=[r for r in rows if 'f' in r]
recs=[]
for r in rows:
    f=r['f']; ptp={L:f.get(L+'_ptp') for L in LO}
    if any(ptp[L] is None for L in LO): continue
    g=np.mean([ptp[L] for L in LO])
    if g<=0: continue
    c=cov.get(r['ecg_id'],{})
    def num(x):
        try: return float(x)
        except: return None
    h=num(c.get('height')); w=num(c.get('weight'))
    bmi=(w/((h/100)**2)) if (h and w and h>0) else None
    recs.append({'ecg_id':r['ecg_id'],'sup':r['superclass'],'code':r['top_code'],
        'ptp':ptp,'g':g,'reg_ratio':np.mean([ptp[L] for L in REG])/g,
        'inf_ratio':np.mean([ptp[L] for L in INF])/g,'lat_ratio':np.mean([ptp[L] for L in LAT])/g,
        'age':num(r['f'].get('age')) or num(c.get('age')),'sex':c.get('sex'),'bmi':bmi,
        'axis_deg':r['f'].get('axis_deg'),'heart_axis':c.get('heart_axis'),'hr':r['f'].get('hr')})
N=len(recs); print('N analyzed =',N)
rr=np.array([x['reg_ratio'] for x in recs])
print('regional_ratio: mean %.3f sd %.3f  (inf+lat mean ptp / global mean ptp)'%(rr.mean(),rr.std()))
# pattern-positive = bottom tertile of regional_ratio
thr=np.quantile(rr,1/3.0)
for x in recs: x['pos']= x['reg_ratio']<=thr
pos=[x for x in recs if x['pos']]; neg=[x for x in recs if not x['pos']]
print('\n=== PHENOMENON-POSITIVE (bottom tertile regional_ratio, thr=%.3f) ==='%thr)
print('n_pos=%d  n_neg=%d'%(len(pos),len(neg)))
import collections
def dist(g,key):
    c=collections.Counter(x[key] for x in g if x[key] is not None); t=sum(c.values())
    return {k:f'{v} ({100*v/t:.0f}%)' for k,v in c.most_common()}
print('superclass POS:',dist(pos,'sup'))
print('superclass NEG:',dist(neg,'sup'))
print('top_codes POS:',collections.Counter(x['code'] for x in pos).most_common(8))
def mean(g,key):
    v=[x[key] for x in g if x[key] is not None]; return (np.mean(v),len(v)) if v else (None,0)
for key in ['age','bmi','hr','axis_deg','g']:
    mp=mean(pos,key); mn=mean(neg,key)
    print(f'{key}: POS mean={mp[0] if mp[0] is None else round(mp[0],2)} (n={mp[1]})  NEG mean={mn[0] if mn[0] is None else round(mn[0],2)} (n={mn[1]})')
print('sex POS:',dist(pos,'sex'),' NEG:',dist(neg,'sex'))
print('heart_axis POS:',dist(pos,'heart_axis'))
print('heart_axis NEG:',dist(neg,'heart_axis'))
# which leads most attenuated (normalized ptp) in POS
print('\nper-lead normalized ptp (ptp/global) — POS mean vs NEG mean:')
for L in LO:
    p=np.mean([x['ptp'][L]/x['g'] for x in pos]); n=np.mean([x['ptp'][L]/x['g'] for x in neg])
    star=' <=' if p<n-0.05 else ''
    print(f'  {L}: POS {p:.3f}  NEG {n:.3f}{star}')
# ---- CONTROL: does regional_ratio survive covariate adjustment? ----
print('\n=== CONTROL: regional_ratio vs covariates ===')
def corr(a,b):
    m=[(x,y) for x,y in zip(a,b) if x is not None and y is not None]
    if len(m)<20: return None,0
    x=np.array([p[0] for p in m]);y=np.array([p[1] for p in m])
    return float(np.corrcoef(x,y)[0,1]),len(m)
for key in ['bmi','age','axis_deg','g']:
    c,nn=corr([x['reg_ratio'] for x in recs],[x[key] for x in recs])
    print(f'  corr(regional_ratio, {key}) = {None if c is None else round(c,3)}  (n={nn})')
# multivariate: regress reg_ratio on [bmi,age,axis_deg,sex] where all present
rowsC=[x for x in recs if x['bmi'] is not None and x['age'] is not None and x['axis_deg'] is not None and x['sex'] is not None]
if len(rowsC)>50:
    y=np.array([x['reg_ratio'] for x in rowsC])
    X=np.array([[1,x['bmi'],x['age'],x['axis_deg'],1.0 if x['sex']=='0' else 0.0] for x in rowsC])
    beta,_,_,_=np.linalg.lstsq(X,y,rcond=None)
    yhat=X@beta; ss_res=((y-yhat)**2).sum(); ss_tot=((y-y.mean())**2).sum(); r2=1-ss_res/ss_tot
    print(f'  multivariate R^2 (bmi+age+axis+sex -> regional_ratio) = {r2:.3f}  on n={len(rowsC)}')
    resid=y-yhat
    # is pattern-positive still separable in residuals?
    posres=resid[[i for i,x in enumerate(rowsC) if x['pos']]]; negres=resid[[i for i,x in enumerate(rowsC) if not x['pos']]]
    print(f'  residual regional_ratio: POS mean={posres.mean():.3f}  NEG mean={negres.mean():.3f}  (gap in SDs={ (negres.mean()-posres.mean())/resid.std():.2f})')
# ---- SHAPE-SPACE clustering (global size removed) ----
print('\n=== SHAPE-SPACE (each lead ptp/global; size axis removed) clustering ===')
Z=np.array([[x['ptp'][L]/x['g'] for L in LO] for x in recs])
mu=Z.mean(0);sd=Z.std(0);sd[sd==0]=1;Zs=(Z-mu)/sd
def kmeans(Z,k,iters=40,restarts=5):
    best=None;bi=1e18
    for _ in range(restarts):
        c=Z[np.random.choice(len(Z),k,replace=False)]
        for _ in range(iters):
            d=((Z[:,None,:]-c[None])**2).sum(2);lab=d.argmin(1)
            nc=np.array([Z[lab==j].mean(0) if (lab==j).any() else c[j] for j in range(k)])
            if np.allclose(nc,c):c=nc;break
            c=nc
        ine=((Z-c[lab])**2).sum()
        if ine<bi:bi=ine;best=(lab.copy(),c.copy())
    return best
lab,_=kmeans(Zs,8)
sup=[x['sup'] for x in recs]
best=None
for j in range(8):
    idx=[i for i in range(N) if lab[i]==j]
    if len(idx)<N*0.05: continue
    infn=np.mean([recs[i]['inf_ratio'] for i in idx]); latn=np.mean([recs[i]['lat_ratio'] for i in idx])
    comp=collections.Counter(sup[i] for i in idx); pur=comp.most_common(1)[0][1]/len(idx)
    score=infn+latn
    print(f'  Cshape{j}: n={len(idx)} inf_ratio={infn:.2f} lat_ratio={latn:.2f} purity={pur:.2f} labels={dict(comp)}')
    if best is None or score<best[0]: best=(score,j,idx,pur,dict(comp),infn,latn)
sc,j,idx,pur,comp,infn,latn=best
print(f'\n>>> Lowest inferior+lateral SHAPE cluster: Cshape{j} n={len(idx)} ({100*len(idx)/N:.0f}%) purity={pur:.2f}')
print('    labels:',comp)
print(f'    inf_ratio={infn:.2f} lat_ratio={latn:.2f}  -> regional attenuation persists in shape-space & crosses diagnoses' if pur<0.5 else '    (label-dominated)')
json.dump({'N':N,'thr':float(thr)},open('.ptb/analyze2_meta.json','w'))
print('\nDONE N=',N)
