#!/usr/bin/env python3
"""Build a self-contained, read-only sprite review document. No image editing.

Usage: build-art-review.py SPEC.json --root GAME_ROOT --out REVIEW.html
The JSON spec contains title, note and sheets [{label,path,width,height,
columns,rows,status,detail, optional footX/footY}]. Paths are relative to root; only PNGs are embedded.
This inspector is not a game renderer and cannot approve assets for production.
"""
import argparse
import base64
import json
import struct
from pathlib import Path

TEMPLATE = r'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>角色图集准入检查</title>
<style>
:root{font-family:system-ui,sans-serif;color:#e9edf1;background:#101820;color-scheme:dark}*{box-sizing:border-box}body{margin:0;padding:24px;max-width:1040px;margin:auto}h1{font-size:26px;margin:0 0 12px}p{font-size:16px;line-height:1.65}button,select,input{font:inherit;min-height:44px;touch-action:manipulation}button,select{background:#243340;color:inherit;border:1px solid #677886;border-radius:4px;padding:8px 14px}button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #e9bd68;outline-offset:2px}button[aria-pressed=true]{border-color:#e9bd68;background:#4b402a}.controls{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:16px 0;border-block:1px solid #42515e;margin:20px 0}.controls label{display:flex;gap:8px;align-items:center}.controls input{width:110px}.sheets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}article{min-width:0;border:1px solid #50606c;border-radius:4px;overflow:hidden}article h2{font-size:19px;margin:16px 16px 8px}.status{display:block;margin:0 16px 12px;color:#f5c785;font-size:14px}.stage{height:250px;display:grid;place-items:center;background:var(--stage,#141a21);position:relative}.sprite{width:210px;height:210px;background-repeat:no-repeat;image-rendering:auto;position:relative}.feet{position:absolute;left:0;right:0;top:91.16%;border-top:1px solid #eb5274;pointer-events:none}.feet:after{content:'';position:absolute;left:var(--foot-x,50%);top:-5px;height:10px;border-left:1px solid #eb5274}.detail{margin:16px;color:#bec8ce;font-size:14px;overflow-wrap:anywhere}.footnote{color:#bec8ce}summary{cursor:pointer;min-height:44px;padding:10px 16px}details img{width:100%;height:auto;display:block;background:var(--stage,#141a21)}.bottom{margin-top:24px;border-top:1px solid #42515e;padding-top:12px}@media(max-width:600px){body{padding:18px 14px}.sheets{grid-template-columns:1fr}h1{font-size:23px}.controls{gap:8px}.stage{height:240px}.sprite{width:200px;height:200px}}
</style>
<h1 id="title"></h1><p id="note"></p><div class="controls" aria-label="图集检查控制">
<label>观察方向<select id="direction"><option value="0">正面</option><option value="1">左侧</option><option value="2">右侧</option><option value="3">背面</option></select></label>
<button id="play" aria-pressed="false">播放步态</button><label>帧<input id="frame" type="range" min="0" max="2" value="1"><output id="frame-number">2 / 3</output></label>
<button data-color="#141a21" aria-pressed="true">深色底</button><button data-color="#f1eee7" aria-pressed="false">浅色底</button><button data-color="#d41b80" aria-pressed="false">洋红底</button>
</div><p class="footnote">红线仅标出目标脚底。切换底色后，透明区域应露出相同底色；棋盘格若始终存在，就是图像内容。此页仅检查图集，不可操纵游戏人物，也不代表真实场景验收。</p><main class="sheets" id="sheets"></main><p class="bottom">检查页不改动原图、不生成透明像素、不写入存档，也没有准入按钮。尺寸、脚底和视觉评审必须分别通过，才能进入正式场景。</p>
<script id="spec" type="application/json">__SPEC__</script>
<script>
const spec=JSON.parse(document.getElementById('spec').textContent);document.getElementById('title').textContent=spec.title;document.getElementById('note').textContent=spec.note;
const holder=document.getElementById('sheets'),sprites=[];
for(const sheet of spec.sheets){const article=document.createElement('article'),heading=document.createElement('h2'),status=document.createElement('span'),stage=document.createElement('div'),sprite=document.createElement('div'),feet=document.createElement('span'),detail=document.createElement('p'),full=document.createElement('details'),summary=document.createElement('summary'),img=document.createElement('img');heading.textContent=sheet.label;status.className='status';status.textContent=sheet.status;stage.className='stage';sprite.className='sprite';sprite.setAttribute('role','img');sprite.setAttribute('aria-label',sheet.label+' 当前帧');sprite.style.backgroundImage=`url(${sheet.data})`;sprite.style.backgroundSize=`${sheet.columns*100}% ${sheet.rows*100}%`;feet.className='feet';if(Number.isFinite(sheet.footY)){feet.style.top=(sheet.footY/(sheet.height/sheet.rows)*100)+'%';feet.style.setProperty('--foot-x',((sheet.footX??sheet.width/sheet.columns/2)/(sheet.width/sheet.columns)*100)+'%');sprite.append(feet)};stage.append(sprite);detail.className='detail';detail.textContent=sheet.width+' × '+sheet.height+' · '+sheet.columns+' 列 × '+sheet.rows+' 行。'+sheet.detail;summary.textContent='查看原始整张图集';img.src=sheet.data;img.alt=sheet.label+' 原始图集';img.draggable=false;full.append(summary,img);article.append(heading,status,stage,detail,full);holder.append(article);sprites.push({sprite,sheet})}
let playing=false,timer=null,step=1;const direction=document.getElementById('direction'),frame=document.getElementById('frame'),play=document.getElementById('play');
function paint(){const col=Number(frame.value),row=Number(direction.value);document.getElementById('frame-number').textContent=(col+1)+' / 3';for(const {sprite,sheet} of sprites)sprite.style.backgroundPosition=`${col/Math.max(1,sheet.columns-1)*100}% ${row/Math.max(1,sheet.rows-1)*100}%`}
function stop(){playing=false;clearInterval(timer);timer=null;play.textContent='播放步态';play.setAttribute('aria-pressed','false')}
play.onclick=()=>{if(playing)return stop();playing=true;play.textContent='暂停步态';play.setAttribute('aria-pressed','true');timer=setInterval(()=>{frame.value=String([1,0,1,2][step++%4]);paint()},170)};frame.oninput=()=>{stop();paint()};direction.onchange=paint;document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
for(const b of document.querySelectorAll('[data-color]'))b.onclick=()=>{document.documentElement.style.setProperty('--stage',b.dataset.color);for(const c of document.querySelectorAll('[data-color]'))c.setAttribute('aria-pressed',String(c===b))};paint();
</script></html>'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('spec', type=Path)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    spec = json.loads(args.spec.read_text())
    inputs = [args.spec.resolve()] + [(args.root / sheet['path']).resolve() for sheet in spec['sheets']]
    if args.out.resolve() in inputs:
        raise ValueError('Output must not overwrite the spec or a source image')
    for sheet in spec['sheets']:
        data = (args.root / sheet['path']).read_bytes()
        if not data.startswith(b'\x89PNG\r\n\x1a\n'):
            raise ValueError('Only PNG assets are accepted: ' + sheet['path'])
        if len(data) < 24 or tuple(struct.unpack('>II', data[16:24])) != (sheet['width'], sheet['height']):
            raise ValueError('Declared image dimensions do not match PNG: ' + sheet['path'])
        if sheet['columns'] != 3 or sheet['rows'] != 4:
            raise ValueError('This viewer supports the 3-column / 4-direction contract only')
        sheet['data'] = 'data:image/png;base64,' + base64.b64encode(data).decode('ascii')
    payload = json.dumps(spec, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(TEMPLATE.replace('__SPEC__', payload))
    print(json.dumps({'output':str(args.out), 'sheets':len(spec['sheets']), 'readOnly':True}))


if __name__ == '__main__':
    main()
