"""Explicitly authorized local candidate cutout; never writes existing runtime art."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import json, hashlib
def require(condition, message):
    if not condition:
        raise ValueError(message)
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
    require(np.array_equal(rgba[core,:3],np.asarray(original)[core]),'interior color drift')
    return Image.fromarray(rgba),{'edgePixelsUnmixed':int(affected.sum()),'isolatedMattePixelsRemoved':int(specks.sum()),'interiorPixelsUnchanged':int(core.sum())}

if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument('source',type=Path)
    parser.add_argument('output',type=Path)
    parser.add_argument('--neutral-min',type=int,required=True)
    parser.add_argument('--chroma-max',type=int,required=True)
    parser.add_argument('--foot-x',type=int,required=True)
    parser.add_argument('--foot-y',type=int,required=True)
    args=parser.parse_args()
    report_path=args.output.with_suffix('.json')
    def aliases(a,b):
        return a.resolve()==b.resolve() or a.exists() and b.exists() and a.samefile(b)
    require(args.output.suffix.lower()=='.png', 'Output must be a PNG path')
    require(not aliases(args.source,args.output) and not aliases(args.source,report_path), 'Image output and report must not overwrite the source')
    original=Image.open(args.source).convert('RGB')
    require(original.width%3==0 and original.height%4==0, 'Expected an evenly divided 3 by 4 sheet')
    fw,fh=original.width//3,original.height//4
    require(0<args.foot_x<fw and 0<args.foot_y<fh, 'Foot anchor must be inside each cell')
    require(0<=args.neutral_min<=255 and 0<=args.chroma_max<=255, 'Thresholds must be in 0..255')
    rgb=np.asarray(original)
    neutral=Image.fromarray(((rgb.min(2)>=args.neutral_min)&(rgb.max(2).astype(int)-rgb.min(2)<=args.chroma_max)).astype('uint8')*255).copy()
    require(neutral.getpixel((0,0))==255, 'Top-left must be part of the neutral background')
    ImageDraw.floodfill(neutral,(0,0),128)
    alpha=neutral.point(lambda p:0 if p==128 else 255)
    clean,edge_report=remove_edge_matte(original,alpha)
    atlas=Image.new('RGBA',original.size,(0,0,0,0));frames=[]
    for row in range(4):
        for col in range(3):
            region=(col*fw,row*fh,(col+1)*fw,(row+1)*fh)
            bbox=clean.getchannel('A').crop(region).getbbox()
            require(bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<fw and bbox[3]<fh, f'Frame {row},{col}: empty or touching cell edge ({bbox})')
            sprite=clean.crop(region).crop(bbox)
            lx=args.foot_x-sprite.width//2;ly=args.foot_y-sprite.height
            require(lx>0 and ly>0 and lx+sprite.width<fw and ly+sprite.height<fh, f'Frame {row},{col}: subject does not fit anchor ({bbox})')
            x=col*fw+lx;y=row*fh+ly
            atlas.paste(sprite,(x,y))
            frames.append({'row':row,'column':col,'sourceBox':[region[0]+bbox[0],region[1]+bbox[1],region[0]+bbox[2],region[1]+bbox[3]],'destination':[x,y],'size':sprite.size,'footAnchor':[args.foot_x,args.foot_y]})
    args.output.parent.mkdir(parents=True,exist_ok=True)
    atlas.save(args.output)
    report={'source':str(args.source),'sourceSHA256':hashlib.sha256(args.source.read_bytes()).hexdigest(),'output':str(args.output),'outputSHA256':hashlib.sha256(args.output.read_bytes()).hexdigest(),'thresholds':{'neutralMin':args.neutral_min,'chromaMax':args.chroma_max},'alphaExtrema':atlas.getchannel('A').getextrema(),'removedPixels':alpha.histogram()[0],'edgeCorrection':edge_report,'frames':frames,'operation':'Border-connected neutral mask; local two-pixel edge unmix; unscaled frame repack. Interior RGB preserved.'}
    report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False))
