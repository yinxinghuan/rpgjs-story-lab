import {build} from 'esbuild'
await build({entryPoints:['worker/source.ts'],outfile:'worker/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',legalComments:'inline',sourcemap:false})
