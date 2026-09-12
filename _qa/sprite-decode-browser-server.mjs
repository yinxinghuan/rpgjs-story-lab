import {createServer} from 'node:http'
import {readFileSync} from 'node:fs'
import {build} from 'esbuild'
const bundle=await build({entryPoints:['_qa/sprite-decode-browser.ts'],bundle:true,write:false,format:'esm',platform:'browser'})
const html='<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>发布素材解码恢复检查</title><body style="font:18px/1.6 system-ui;padding:24px"><h1>发布素材解码恢复检查</h1><p>本机测试：只读取现有主角PNG，不创建旅程、不联网生成、不改素材。</p><output>待检查</output><script type="module" src="./check.js"></script></body></html>'
const server=createServer((req,res)=>{const path=new URL(req.url,'http://127.0.0.1').pathname;if(path==='/'){res.setHeader('Content-Type','text/html');res.end(html)}else if(path==='/check.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].contents)}else if(path==='/hero.png'){res.setHeader('Content-Type','image/png');res.end(readFileSync('public/art/overhead/hero-gait-v2.png'))}else{res.writeHead(404);res.end()}})
server.listen(5401,'127.0.0.1',()=>console.log('Local pixel decoder QA: http://127.0.0.1:5401/'))
process.on('SIGINT',()=>server.close(()=>process.exit(0)))
