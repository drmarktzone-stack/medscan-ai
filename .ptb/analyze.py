import json,sys
sys.path.insert(0,'/app/.ptb/py')
import numpy as np
np.random.seed(7)
LO=['I','II','III','AVR','AVL','AVF','V1','V2','V3','V4','V5','V6']
COLS=['hr','rr_std_ms','axis_deg','st_II','st_V2','st_V5']+[L+'_ptp' for L in LO]+[L+'_rms' for L in LO]
rows=[json.loads(l) for l in open('.ptb/feat.jsonl') if 'f' in json.loads(l)]
X=[];meta=[]
for r in rows:
    f=r['f']; vec=[f.get(c) for c in COLS]
    X.append(vec); meta.append(r)
X=np.array([[np.nan if v is None else v for v in row] for row in X],dtype=float)
# impute col median
med=np.nanmedian(X,axis=0)
inds=np.where(np.isnan(X)); X[inds]=np.take(med,inds[1])
# standardize
mu=X.mean(0); sd=X.std(0); sd[sd==0]=1; Z=(X-mu)/sd
# PCA
U,S,Vt=np.linalg.svd(Z-Z.mean(0),full_matrices=False)
ev=(S**2)/np.sum(S**2)
print('=== PCA explained variance (top6) ===')
print(', '.join(f'PC{i+1}:{ev[i]*100:.1f}%' for i in range(6)))
for pc in range(3):
    load=Vt[pc]; order=np.argsort(-np.abs(load))[:6]
    print(f'PC{pc+1} top loadings:', ', '.join(f'{COLS[j]}({load[j]:+.2f})' for j in order))
# KMeans
def kmeans(Z,k,iters=60,restarts=8):
    best=None;bestI=1e18
    for _ in range(restarts):
        c=Z[np.random.choice(len(Z),k,replace=False)]
        for _ in range(iters):
            d=((Z[:,None,:]-c[None])**2).sum(2); lab=d.argmin(1)
            nc=np.array([Z[lab==j].mean(0) if (lab==j).any() else c[j] for j in range(k)])
            if np.allclose(nc,c): c=nc;break
            c=nc
        inertia=((Z-c[lab])**2).sum()
        if inertia<bestI: bestI=inertia;best=(lab.copy(),c.copy())
    return best
K=8
lab,cent=kmeans(Z,K)
scl=[m['superclass'] for m in meta]
import collections
print('\n=== clusters (size | superclass composition | purity) ===')
mixed=[]
for j in range(K):
    idx=[i for i in range(len(meta)) if lab[i]==j]
    comp=collections.Counter(scl[i] for i in idx)
    tot=len(idx); top=comp.most_common(1)[0]; purity=top[1]/tot
    comps=', '.join(f'{k}:{v}' for k,v in comp.most_common())
    print(f'C{j}: n={tot} | {comps} | purity={purity:.2f} (dom={top[0]})')
    if tot>=25 and purity<0.5: mixed.append((j,idx,purity,tot))
print('\n=== cross-cutting clusters (n>=25, no single label >=50%) ===')
if not mixed: print('none')
for j,idx,purity,tot in sorted(mixed,key=lambda x:(x[2],-x[3])):
    zc=Z[idx].mean(0)
    order=np.argsort(-np.abs(zc))[:8]
    sig=', '.join(f'{COLS[o]}={zc[o]:+.2f}sd' for o in order)
    comp=collections.Counter(scl[i] for i in idx)
    codes=collections.Counter(meta[i]['top_code'] for i in idx).most_common(6)
    print(f'\nCLUSTER C{j}: n={tot}, purity={purity:.2f}')
    print(' labels:', dict(comp))
    print(' top_codes:', codes)
    print(' signature(z):', sig)
    # median real values for signature features
    realmed={COLS[o]:round(float(np.median(X[idx][:,o])),3) for o in order}
    print(' median_real:', realmed)
# save assignments
outl=[]
for i,m in enumerate(meta):
    outl.append({'ecg_id':m['ecg_id'],'superclass':m['superclass'],'top_code':m['top_code'],'cluster':int(lab[i])})
json.dump({'cols':COLS,'pc_explained':[float(x) for x in ev[:8]],'assign':outl},open('.ptb/analysis_out.json','w'))
print('\nsaved analysis_out.json  n=',len(meta))
