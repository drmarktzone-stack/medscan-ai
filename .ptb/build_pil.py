import csv,ast,os,sys,urllib.request,json
sys.path.insert(0,"/app/.ptb/py")
import numpy as np
from PIL import Image,ImageDraw,ImageFont
BASE="https://physionet.org/files/ptb-xl/1.0.3/"; OUT="/app/public/ecg-ptbxl"
LIM=int(sys.argv[1]) if len(sys.argv)>1 else 12
os.makedirs(OUT,exist_ok=True)
F=ImageFont.load_default()
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
    idx={n.upper():i for i,n in enumerate(nm)}
    W,H=1120,880; top=28; pL=44; pR=12; pT=8; pB=8
    img=Image.new("RGB",(W,H),"white"); d=ImageDraw.Draw(img)
    d.text((8,8),title,fill="#333",font=F)
    cols=2; rows=6; gw=(W-pL-pR); gh=(H-top-pB)
    cw=gw//cols; chh=gh//rows
    dur=ph.shape[0]/fs
    for r in range(rows):
        for c in range(cols):
            L=LO[c*6+r] if (c*6+r)<12 else None
            x0=pL+c*cw; y0=top+r*chh; x1=x0+cw-pR; y1=y0+chh-2
            midy=(y0+y1)/2
            # grid: big square 0.2s and 0.5mV
            pxs=(x1-x0)/dur  # px per second
            bigx=pxs*0.2; 
            mvspan=3.6; pxmv=(y1-y0)/mvspan; bigy=pxmv*0.5
            xx=x0
            while xx<=x1:
                d.line([(xx,y0),(xx,y1)],fill="#f6c9d5",width=1); xx+=bigx
            yy=y0
            while yy<=y1:
                d.line([(x0,yy),(x1,yy)],fill="#f6c9d5",width=1); yy+=bigy
            if L and L in idx:
                y=ph[:,idx[L]]
                xsp=(x1-x0)/(len(y)-1)
                pts=[(x0+i*xsp, midy - float(v)*pxmv) for i,v in enumerate(y)]
                d.line(pts,fill="#111",width=1)
            d.text((x0+2,y0+1),L or "",fill="#a33",font=F)
    img.save(out,"PNG")
def feats(fs,nm,ph):
    idx={n.upper():i for i,n in enumerate(nm)}; ref=ph[:,idx.get("II",1)]
    thr=ref.mean()+2*ref.std(); pk=[];last=-999
    for i in range(1,len(ref)-1):
        if ref[i]>thr and ref[i]>=ref[i-1] and ref[i]>ref[i+1] and (i-last)>0.3*fs: pk.append(i);last=i
    hr=round(60.0/np.mean(np.diff(pk)/fs),1) if len(pk)>=2 else None
    per={L:{"min":round(float(ph[:,idx[L]].min()),3),"max":round(float(ph[:,idx[L]].max()),3),"ptp":round(float(np.ptp(ph[:,idx[L]])),3)} for L in LO if L in idx}
    return {"hr_bpm":hr,"r_peaks":len(pk),"leads":per}
sel=json.load(open("/app/.ptb/selection.json")); done=set()
if os.path.exists("/app/.ptb/manifest.jsonl"):
    for l in open("/app/.ptb/manifest.jsonl"):
        try: done.add(json.loads(l)["ecg_id"])
        except: pass
mf=open("/app/.ptb/manifest.jsonl","a"); n=0
for rec in sel:
    if rec["ecg_id"] in done or n>=LIM: 
        if rec["ecg_id"] in done: continue
        break
    try:
        pb=dl(rec["filename_lr"]); fs,nm,ph=rd(pb)
        title=f'#{rec["ecg_id"]}  {rec["dx_en"]}  [{rec["superclass"]}]  age {rec["age"]} {"M" if rec["sex"]=="זכר" else "F"}   -  PTB-XL PhysioNet CC BY 4.0'
        out=f'{OUT}/ptbxl_{rec["ecg_id"]}.png'; render(fs,nm,ph,title,out)
        rec["features"]=feats(fs,nm,ph); rec["png_file"]=f'ptbxl_{rec["ecg_id"]}.png'
        mf.write(json.dumps(rec,ensure_ascii=False)+"\n"); mf.flush(); n+=1
        print("OK",rec["ecg_id"],rec["dx_code"],"HR",rec["features"]["hr_bpm"])
    except Exception as e: print("ERR",rec["ecg_id"],repr(e)[:90])
mf.close(); print("batch",n,"total",len(done)+n,"of",len(sel))
