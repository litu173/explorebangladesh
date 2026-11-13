"""Fit the lat/lon -> SVG projection of the district map and check every road node lands in the right district."""
import json,re,math,itertools
s=open('assets/js/districts.js',encoding='utf8').read(); D=json.loads(s[s.index('=')+1:].rstrip().rstrip(';'))
polys={}
for d in D:
    rings=[]
    for part in re.findall(r'M[^M]+',d['d']):
        nums=[float(x) for x in re.findall(r'-?\d+\.?\d*',part)]
        rings.append(list(zip(nums[0::2],nums[1::2])))
    polys[d['id']]=rings
def inside(x,y,rings):
    c=False
    for r in rings:
        for (x1,y1),(x2,y2) in zip(r,r[1:]+r[:1]):
            if (y1>y)!=(y2>y) and x<(x2-x1)*(y-y1)/(y2-y1)+x1: c=not c
    return c
def which(x,y):
    for k,r in polys.items():
        if inside(x,y,r): return k
    return None
HQ=json.load(open('tools/hq.json'))
allx=[p[0] for r in polys.values() for ring in r for p in ring]; ally=[p[1] for r in polys.values() for ring in r for p in ring]
print('bbox',min(allx),max(allx),min(ally),max(ally))
def merc(lat): return math.log(math.tan(math.pi/4+math.radians(lat)/2))
best=None
# grid search a linear map in lon and mercator-lat
for ax in [x/1000 for x in range(1150,1400,5)]:
  for bx in range(-2,3):
    pass
# least squares on bbox: map lon range and lat range of the country onto the drawing's bbox, then refine by maximising hits
W,E,N,S_=88.01,92.68,26.63,20.74
def make(w,e,n,s,mode):
    fy=(lambda la:merc(la)) if mode=='m' else (lambda la:la)
    kx=(max(allx)-min(allx))/(e-w); ky=(max(ally)-min(ally))/(fy(n)-fy(s))
    return lambda la,lo:(min(allx)+(lo-w)*kx, min(ally)+(fy(n)-fy(la))*ky)
def score(P):
    return sum(which(*P(la,lo))==k for k,(la,lo) in HQ.items())
for mode in 'lm':
    for dn in [x/100 for x in range(-12,13,4)]:
      for ds in [x/100 for x in range(-24,25,6)]:
        for dw in [x/100 for x in range(-8,9,4)]:
          for de in [x/100 for x in range(-8,9,4)]:
            P=make(W+dw,E+de,N+dn,S_+ds,mode); sc=score(P)
            if not best or sc>best[0]: best=(sc,mode,W+dw,E+de,N+dn,S_+ds)
print('best',best,'of',len(HQ))
sc,mode,w,e,n,s2=best; P=make(w,e,n,s2,mode)
bad=[(k,which(*P(*v))) for k,v in HQ.items() if which(*P(*v))!=k]
print('misses',bad)
json.dump({'mode':mode,'w':w,'e':e,'n':n,'s':s2,'minx':min(allx),'maxx':max(allx),'miny':min(ally),'maxy':max(ally)},open('tools/proj.json','w'))
