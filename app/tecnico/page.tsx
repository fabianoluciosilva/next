00:31:50.650 Running build in Washington, D.C., USA (East) – iad1
00:31:50.651 Build machine configuration: 2 cores, 8 GB
00:31:50.780 Cloning github.com/fabianoluciosilva/next (Branch: main, Commit: 4526f13)
00:31:51.080 Cloning completed: 300.000ms
00:31:52.036 Restored build cache from previous deployment (E1Xp3CjfXyffVPkYgTW5LaSW8Qay)
00:31:52.247 Running "vercel build"
00:31:53.514 Vercel CLI 51.2.1
00:31:53.783 Installing dependencies...
00:31:54.905 
00:31:54.905 up to date in 911ms
00:31:54.906 
00:31:54.906 146 packages are looking for funding
00:31:54.907   run `npm fund` for details
00:31:54.934 Detected Next.js version: 16.2.4
00:31:54.938 Running "npm run build"
00:31:55.039 
00:31:55.039 > controle-deslocamento@0.1.0 build
00:31:55.040 > next build
00:31:55.040 
00:31:55.735   Applying modifyConfig from Vercel
00:31:55.750 ▲ Next.js 16.2.4 (Turbopack)
00:31:55.751 - Environments: .env.local
00:31:55.751 
00:31:55.784   Creating an optimized production build ...
00:32:01.704 ✓ Compiled successfully in 5.5s
00:32:01.706   Running TypeScript ...
00:32:04.936 Failed to type check.
00:32:04.937 
00:32:04.937 ./app/tecnico/page.tsx:80:25
00:32:04.937 Type error: Cannot find name 'totalCentcents'.
00:32:04.937 
00:32:04.938   [90m78 |[0m         gasto_hospedagem: [33mNumber[0m(form.hospedagem) * [35m100[0m,
00:32:04.938   [90m79 |[0m         gasto_outros: [33mNumber[0m(form.outros) * [35m100[0m,
00:32:04.938 [31m[1m>[0m [90m80 |[0m         valor_centavos: totalCentcents,
00:32:04.938   [90m   |[0m                         [31m[1m^[0m
00:32:04.938   [90m81 |[0m         comprovante_urls: urls,
00:32:04.938   [90m82 |[0m         versao_app: [33mVERSAO_SISTEMA[0m
00:32:04.938   [90m83 |[0m       })
00:32:04.964 Next.js build worker exited with code: 1 and signal: null
00:32:04.997 Error: Command "npm run build" exited with 1
