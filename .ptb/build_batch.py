import csv,ast,os,sys,urllib.request,json,time
import numpy as np, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
BASE="https://physionet.org/files/ptb-xl/1.0.3/"; OUT="/app/public/ecg-ptbxl"
LIM=int(sys.argv[1]) if len(sys.argv)>1 else 8
os.makedirs(OUT,exist_ok=True)
def dl(lr):
    b="/app/.ptb/"+os.path.basename(lr)
    for e in (".hea",".dat"):
        if not os.path.exists(b+e): urllib.request.urlretrieve(BASE+lr+e,b+e)
    return b
def rd(pb):
    h=open(pb+".hea").read().splitlines(); p=h[0].split(); ns=int(p[1]); fs=int(p[2])
    g=[];bl=[];nm=[]
    for i in range(1,1+ns):
        q=h[i].split(); gg=q[2]; g.append(float(gg.split("(")[0])); bl.append(float(gg.split("(")[1].split(")")[0])); nm.append(q[-1])
    raw=np.fromfile(pb+".dat",dtype="<i2").reshape(-1,ns); return fs,nm,(raw-np.array(bl))/np.array(g)
LO=["I","II","III","AVR","AVL","AVF","V1","V2","V3","V4","V5","V6"]
def render(fs,nm,ph,title,out):
    idx={n.upper():i for i,n in enumerate(nm)}; t=np.arange(ph.shape[0])/fs
    fig,ax=plt.subplots(6,2,figsize=(11,8.5)); fig.suptitle(title,fontsize=10,y=0.995)
    pos=[("I",0,0),("II",1,0),("III",2,0),("AVR",3,0),("AVL",4,0),("AVF",5,0),("V1",0,1),("V2",1,1),("V3",2,1),("V4",3,1),("V5",4,1),("V6",5,1)]
    for L,r,c in pos:
        a=ax[r][c]
        if L in idx: a.plot(t,ph[:,idx[L]],color="#111",lw=0.6)
        a.set_ylabel(L,rotation=0,labelpad=12,fontsize=8,va="center"); a.set_ylim(-1.8,1.8)
        a.set_xticks(np.arange(0,t[-1]+0.01,0.2)); a.set_yticks(np.arange(-1.5,1.6,0.5))
        a.grid(which="major",color="#f2b8c6",lw=0.5); a.tick_params(labelbottom=False,labelleft=False,length=0)
        for s in a.spines.values(): s.set_color("#f2b8c6")
    ax[5][0].set_xlabel("25 mm/s · 10 mm/mV · 10 s",fontsize=7)
    ax[5][1].set_xlabel("PTB-XL (PhysioNet, CC BY 4.0) · reference",fontsize=7)
    plt.tight_layout(rect=[0,0,1,0.98]); plt.savefig(out,dpi=110); plt.close(fig)
def feats(fs,nm,ph):
    idx={n.upper():i for i,n in enumerate(nm)}; ref=ph[:,idx.get("II",1)]
    thr=ref.mean()+2*ref.std(); pk=[];last=-999
    for i in range(1,len(ref)-1):
        if ref[i]>thr and ref[i]>=ref[i-1] and ref[i]>ref[i+1] and (i-last)>0.3*fs: pk.append(i);last=i
    hr=round(60.0/np.mean(np.diff(pk)/fs),1) if len(pk)>=2 else None
    per={L:{"min":round(float(ph[:,idx[L]].min()),3),"max":round(float(ph[:,idx[L]].max()),3),
        "ptp":round(float(np.ptp(ph[:,idx[L]])),3)} for L in LO if L in idx}
    return {"hr_bpm":hr,"r_peaks":len(pk),"leads":per}
sel=json.load(open("/app/.ptb/selection.json"))
done=set()
if os.path.exists("/app/.ptb/manifest.jsonl"):
    for l in open("/app/.ptb/manifest.jsonl"):
        try: done.add(json.loads(l)["ecg_id"])
        except: pass
n=0
mf=open("/app/.ptb/manifest.jsonl","a")
for rec in sel:
    if rec["ecg_id"] in done: continue
    if n>=LIM: break
    try:
        pb=dl(rec["filename_lr"]); fs,nm,ph=rd(pb)
        title=f'#{rec["ecg_id"]} · {rec["dx_he"]} ({rec["dx_en"]}) · {rec["superclass"]} · {rec["age"]} {rec["sex"]}'
        out=f'{OUT}/ptbxl_{rec["ecg_id"]}.png'; render(fs,nm,ph,title,out)
        rec["features"]=feats(fs,nm,ph); rec["png_file"]=f'ptbxl_{rec["ecg_id"]}.png'
        mf.write(json.dumps(rec,ensure_ascii=False)+"\n"); mf.flush(); n+=1
        print("OK",rec["ecg_id"],rec["dx_code"],"HR",rec["features"]["hr_bpm"])
    except Exception as e: print("ERR",rec["ecg_id"],repr(e)[:80])
mf.close(); print("batch_done",n,"total_done",len(done)+n,"of",len(sel))
