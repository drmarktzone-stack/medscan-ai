import sys,json,urllib.request,io,os
sys.path.insert(0,'/app/.ptb/py')
import numpy as np
from concurrent.futures import ThreadPoolExecutor
B='https://physionet.org/files/ptb-xl/1.0.3/'
LIM=int(sys.argv[1]) if len(sys.argv)>1 else 170
LO=['I','II','III','AVR','AVL','AVF','V1','V2','V3','V4','V5','V6']
def fetch(u):
    return urllib.request.urlopen(u,timeout=25).read()
def parse(hea_b,dat_b):
    h=hea_b.decode().splitlines(); p=h[0].split(); ns=int(p[1]); fs=int(p[2])
    g=[];bl=[];nm=[]
    for i in range(1,1+ns):
        q=h[i].split(); gg=q[2]; g.append(float(gg.split('(')[0])); bl.append(float(gg.split('(')[1].split(')')[0])); nm.append(q[-1].upper())
    raw=np.frombuffer(dat_b,dtype='<i2').reshape(-1,ns)
    return fs,nm,(raw-np.array(bl))/np.array(g)
def rpeaks(x,fs):
    d=np.diff(x); sq=d*d
    w=max(3,int(0.15*fs)); mwa=np.convolve(sq,np.ones(w)/w,mode='same')
    thr=0.3*mwa.max() if mwa.max()>0 else 1e9
    pk=[]; last=-999; mind=int(0.3*fs)
    for i in range(1,len(mwa)-1):
        if mwa[i]>thr and mwa[i]>=mwa[i-1] and mwa[i]>mwa[i+1] and (i-last)>mind:
            pk.append(i); last=i
    return pk
def feats(fs,nm,ph):
    idx={n:i for i,n in enumerate(nm)}
    II=ph[:,idx.get('II',1)]
    pk=rpeaks(II,fs)
    rr=np.diff(pk)/fs if len(pk)>=2 else np.array([])
    hr=float(60.0/np.median(rr)) if len(rr)>0 else None
    rr_std=float(np.std(rr)*1000) if len(rr)>1 else None
    f={'hr':hr,'rr_std_ms':rr_std,'n_r':len(pk)}
    # frontal axis proxy from net QRS area in I and aVF
    def net(L):
        y=ph[:,idx[L]] if L in idx else np.zeros(ph.shape[0]); return float(y.sum())
    I_n=net('I'); aVF_n=net('AVF')
    f['axis_deg']=float(np.degrees(np.arctan2(aVF_n,I_n)))
    # per-lead ptp & rms
    for L in LO:
        if L in idx:
            y=ph[:,idx[L]]
            f[L+'_ptp']=float(np.ptp(y)); f[L+'_rms']=float(np.sqrt((y*y).mean()))
        else:
            f[L+'_ptp']=None; f[L+'_rms']=None
    # ST proxy: mean amp in R+80..120ms vs PR baseline (R-80..-40ms), avg over II and V2
    def st(L):
        if L not in idx or len(pk)<2: return None
        y=ph[:,idx[L]]; vals=[]
        for r in pk:
            a=r+int(0.08*fs); b=r+int(0.12*fs); base0=r-int(0.08*fs); base1=r-int(0.04*fs)
            if base0>=0 and b<len(y):
                vals.append(y[a:b].mean()-y[base0:base1].mean())
        return float(np.mean(vals)) if vals else None
    f['st_II']=st('II'); f['st_V2']=st('V2'); f['st_V5']=st('V5')
    return f
def work(rec):
    try:
        lr=rec['filename_lr']
        hea=fetch(B+lr+'.hea'); dat=fetch(B+lr+'.dat')
        fs,nm,ph=parse(hea,dat)
        fe=feats(fs,nm,ph)
        return {'ecg_id':rec['ecg_id'],'superclass':rec['superclass'],'top_code':rec['top_code'],
                'age':rec['age'],'sex':rec['sex'],'validated':rec['validated'],'f':fe}
    except Exception as e:
        return {'ecg_id':rec['ecg_id'],'err':repr(e)[:60]}
sel=json.load(open('.ptb/sample_big.json'))
done=set()
if os.path.exists('.ptb/feat.jsonl'):
    for l in open('.ptb/feat.jsonl'):
        try: done.add(json.loads(l)['ecg_id'])
        except: pass
todo=[r for r in sel if r['ecg_id'] not in done][:LIM]
out=open('.ptb/feat.jsonl','a'); ok=0;err=0
with ThreadPoolExecutor(max_workers=16) as ex:
    for res in ex.map(work,todo):
        if 'err' in res: err+=1
        else: ok+=1
        out.write(json.dumps(res)+'\n');out.flush()
out.flush(); out.close()
print('batch ok',ok,'err',err,'total_done',len(done)+len(todo))
