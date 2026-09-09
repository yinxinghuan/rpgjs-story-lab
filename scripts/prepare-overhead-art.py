"""Prepare the user-selected overhead studies for an isolated playable art test.
Erase connected checkerboard and unmix its color from the silhouette edge,
then repack unscaled actor frames using the established frame placements.
Sources are never overwritten. Interior RGB is unchanged; only the two-pixel
edge band can have alpha and RGB corrected to remove the former light matte.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import json, hashlib
ROOT=Path(__file__).resolve().parent.parent
SRC=ROOT/'doc/perspective-candidates'
OUT=ROOT/'public/art/overhead'
OUT.mkdir(parents=True,exist_ok=True)
def remove_edge_matte(original, alpha):
    """Unmix the pale checkerboard only in a two-pixel external edge band.

    A nearest opaque interior sample estimates foreground color. The closest
    removed background sample estimates the local checker square. Gold details
    and unchanged interior hair/skin/fuse highlights are protected.
    """
    rgb=np.asarray(original,dtype=np.float32)
    opaque=np.asarray(alpha)>0
    core=np.asarray(Image.fromarray((opaque*255).astype('uint8')).filter(ImageFilter.MinFilter(5)))>0
    edge=opaque&~core
    h,w=opaque.shape
    def shift(a,dy,dx):
        out=np.zeros_like(a)
        sy=slice(max(0,dy),min(h,h+dy));sx=slice(max(0,dx),min(w,w+dx))
        ty=slice(max(0,-dy),min(h,h-dy));tx=slice(max(0,-dx),min(w,w-dx))
        out[ty,tx]=a[sy,sx]
        return out
    fg=np.zeros_like(rgb);bg=np.full_like(rgb,246);found_fg=np.zeros_like(opaque);found_bg=np.zeros_like(opaque)
    offsets=sorted([(dy,dx) for dy in range(-5,6) for dx in range(-5,6) if dy or dx],key=lambda p:p[0]**2+p[1]**2)
    for dy,dx in offsets:
        pick=edge&~found_fg&shift(core,dy,dx)
        fg[pick]=shift(rgb,dy,dx)[pick];found_fg|=pick
        pick=edge&~found_bg&shift(~opaque,dy,dx)
        bg[pick]=shift(rgb,dy,dx)[pick];found_bg|=pick
    chroma=rgb.max(2)-rgb.min(2)
    affected=edge&found_fg&((rgb.mean(2)-fg.mean(2))>18)&(chroma<65)
    delta=fg-bg
    coverage=np.clip(((rgb-bg)*delta).sum(2)/(np.square(delta).sum(2)+1e-6),0,1)
    affected &= coverage<.97
    coverage=np.maximum(coverage,.04)
    corrected=np.clip((rgb-bg*(1-coverage[:,:,None]))/coverage[:,:,None],0,255)
    output=rgb.copy();output[affected]=corrected[affected]
    a=(opaque*255).astype('uint8');a[affected]=np.round(coverage[affected]*255).astype('uint8')
    specks=edge&~found_fg&(chroma<35)&(rgb.mean(2)>140)
    a[specks]=0
    # Explicitly transparent RGB avoids a light matte in consumers that sample
    # straight-alpha textures incorrectly. It does not change visible interiors.
    output[a==0]=0
    rgba=np.dstack([np.round(output).astype('uint8'),a])
    assert np.array_equal(rgba[core,:3],np.asarray(original)[core]),'interior color drift'
    return Image.fromarray(rgba),{'edgePixelsUnmixed':int(affected.sum()),'isolatedMattePixelsRemoved':int(specks.sum()),'interiorPixelsUnchanged':int(core.sum())}

report={}

for name in ['hero','mechanic','props']:
    source=SRC/(name+'-overhead-candidate.png')
    original=Image.open(source).convert('RGB')
    # A border-connected key preserves light hair, skin, ceramic and highlights
    # enclosed by each subject's existing dark silhouette.
    neutral=Image.new('L',original.size)
    neutral.putdata([255 if min(p)>=200 and max(p)-min(p)<=20 else 0 for p in original.getdata()])
    ImageDraw.floodfill(neutral,(0,0),128)
    alpha=neutral.point(lambda p:0 if p==128 else 255)
    clean,edge_report=remove_edge_matte(original,alpha)
    target=OUT/(name+'.png')
    info={'source':str(source.relative_to(ROOT)),'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceSize':original.size,'alphaExtrema':alpha.getextrema(),'removedPixels':alpha.histogram()[0],'edgeCorrection':edge_report,'operation':'border-connected neutral checkerboard removal plus local two-pixel matte unmixing; interior RGB unchanged'}
    if name!='props':
        rows=[0,365,710,1040,original.height]
        atlas=Image.new('RGBA',(1086,1448),(0,0,0,0));frames=[]
        for row in range(4):
            for col in range(3):
                region=(col*362,rows[row],(col+1)*362,rows[row+1])
                tile=clean.crop(region)
                # Use the original binary extraction bounds so edge cleanup does
                # not move feet, scale actors, or change the source frame layout.
                bbox=alpha.crop(region).getbbox()
                assert bbox,'empty actor frame'
                sprite=tile.crop(bbox)
                assert sprite.width<330 and sprite.height<325,(name,row,col,bbox)
                x=col*362+181-sprite.width//2;y=row*362+330-sprite.height
                atlas.paste(sprite,(x,y))
                frames.append({'row':row,'column':col,'sourceBox':[region[0]+bbox[0],region[1]+bbox[1],region[0]+bbox[2],region[1]+bbox[3]],'destination':[x,y],'size':sprite.size,'footAnchor':[181,330]})
        atlas.save(target);info.update({'outputSize':atlas.size,'frames':frames,'operation':info['operation']+'; unscaled frame repack to a common foot anchor'})
    else:
        clean.save(target);info['outputSize']=clean.size
    info['output']=str(target.relative_to(ROOT));info['outputSHA256']=hashlib.sha256(target.read_bytes()).hexdigest()
    report[name]=info
(ROOT/'doc/perspective-candidates/runtime-admission.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:{'size':v['outputSize'],'alpha':v['alphaExtrema'],'removed':v['removedPixels']} for k,v in report.items()},indent=2))
