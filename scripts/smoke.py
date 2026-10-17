import sys, json, threading, http.server, socketserver, functools, os
from playwright.sync_api import sync_playwright
ROOT=sys.argv[1]; MODE=sys.argv[2] if len(sys.argv)>2 else 'seeded'
if os.path.isdir(os.path.join(ROOT, 'public')) and os.path.exists(os.path.join(ROOT, 'public', 'index.html')):
    ROOT = os.path.join(ROOT, 'public')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
class SilentServer(socketserver.ThreadingTCPServer):
    def handle_error(self, request, client_address): pass
H=functools.partial(Q,directory=ROOT)
srv=SilentServer(('127.0.0.1',0),H); port=srv.server_address[1]
threading.Thread(target=srv.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{port}'
FB_STUB = r"""
(function(){
  const SEED = %SEED%;
  const store = {};  // path -> data
  Object.entries(SEED).forEach(([k,v])=>store[k]=v);
  window.__writes=[];
  function docRef(path){ return {
    path, get: async()=>({exists: path in store, data:()=>{const d=store[path]; if(d&&d.updatedAt&&typeof d.updatedAt.toMillis!=='function'){const ms=d.updatedAt.toMillis; return {...d,updatedAt:{toMillis:()=>ms}};} return d;}}),
    set: async(d,o)=>{ window.__writes.push(['set',path,Object.keys(d)]); store[path]=o&&o.merge?{...(store[path]||{}),...d}:d; },
    delete: async()=>{ delete store[path]; },
    collection: (n)=>colRef(path+'/'+n) }; }
  function colRef(path){ return { doc:(id)=>docRef(path+'/'+id) }; }
  const fs = { collection:(n)=>colRef(n), batch:()=>({ _o:[], set(r,d){this._o.push(['set',r.path,d])}, delete(r){this._o.push(['del',r.path])}, async commit(){ this._o.forEach(o=>{ if(o[0]==='set'){window.__writes.push(['batch-set',o[1],Object.keys(o[2])]); store[o[1]]=o[2]} }) } }) };
  const user = { uid:'u1', email:'stu@example.com', emailVerified:true, displayName:'Stu Dent', providerData:[], getIdToken: async()=>'tok', reload: async()=>{}, sendEmailVerification: async()=>{} };
  const authObj = { currentUser:null, onAuthStateChanged(cb){ setTimeout(()=>{ this.currentUser= window.__NOAUTH?null:user; cb(window.__NOAUTH?null:user); },30); }, signOut: async()=>{ this.currentUser=null; }, getRedirectResult: async()=>null };
  const firebase = { apps:[], initializeApp(c){ this.apps.push({}); }, auth:Object.assign(()=>authObj,{GoogleAuthProvider:function(){this.setCustomParameters=()=>{}},EmailAuthProvider:{credential:()=>({})}}), firestore:Object.assign(()=>fs,{FieldValue:{serverTimestamp:()=>({toMillis:()=>Date.now()}),delete:()=>null}}) };
  window.firebase=firebase; window.__store=store;
})();
"""
CHART_STUB="window.Chart=function(ctx,cfg){this.data=cfg.data;this.update=function(){};this.destroy=function(){};window.__charts=(window.__charts||0)+1;};"
today=__import__('datetime').date.today().isoformat()
SEED = {
 'users/u1/app/core': {'data':{'subjects':[{'id':'s1','name':'Math','difficulty':'Hard','totalMinutes':90,'topics':[{'id':'t1','sid':'s1','name':'Algebra','topic':'Algebra','minutes':45,'done':False},{'id':'t2','sid':'s1','name':'Calculus','topic':'Calculus','minutes':45,'done':True}]}],'exams':[{'id':'e1','eid':'e1','sid':'s1','name':'Midterm','subject':'Math','date':'2030-01-01'}],'schemaVersion':1},'meta':{'subjects':1,'exams':1,'schemaVersion':1},'updatedAt':{'toMillis':1}},
} if MODE=='seeded' else {}
errors={}
def run():
  print('run start',flush=True)
  with sync_playwright() as p:
    exec_path = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    kwargs = {'args': ['--no-sandbox','--no-proxy-server','--disable-background-networking','--disable-features=OptimizationHints,AutofillServerCommunication']}
    if os.path.exists(exec_path): kwargs['executable_path'] = exec_path
    b = p.chromium.launch(**kwargs)
    ctx=b.new_context(); page=ctx.new_page(); page.set_default_timeout(8000)
    def route(r):
        u=r.request.url
        if 'gstatic.com/firebasejs' in u:
            body = FB_STUB.replace('%SEED%',json.dumps(SEED)) if 'firebase-app-compat' in u else '//stub'
            return r.fulfill(status=200,content_type='application/javascript',body=body)
        if 'chart.js' in u or 'chart.umd' in u: return r.fulfill(status=200,content_type='application/javascript',body=CHART_STUB)
        if 'lucide' in u: return r.fulfill(status=200,content_type='application/javascript',body='window.lucide={createIcons(){}}')
        if u.startswith(BASE): return r.continue_()
        return r.fulfill(status=200,content_type='text/css' if u.endswith('.css') else 'text/plain',body='')
    page.route('**/*',route)
    logs=[]
    page.on('pageerror',lambda e: logs.append(('PAGEERROR',str(e)[:200])))
    page.on('console',lambda m: logs.append(('console.'+m.type,m.text[:200])) if m.type in ('error','warning') else None)
    print('goto',flush=True)
    page.goto(BASE+'/index.html#dash',wait_until='domcontentloaded',timeout=20000); page.wait_for_timeout(2500)
    print('loaded',flush=True)
    out={}
    fr=[f for f in page.frames if f!=page.main_frame]
    out['iframe_url']=fr[0].url if fr else None
    if fr:
        f=fr[0]
        out['dash_subjectCount']=f.evaluate("document.getElementById('subjectCount')&&document.getElementById('subjectCount').textContent")
        out['dash_examsHtml']=(f.evaluate("document.getElementById('dashExamsList')&&document.getElementById('dashExamsList').innerText") or '')[:80]
        out['dash_charts_created']=f.evaluate("window.__charts||0")
    out['shell_taskList']=page.evaluate("document.getElementById('taskList').innerText")[:80]
    out['shell_upcoming']=page.evaluate("document.getElementById('upcomingExamsList').innerText")[:80]
    out['syncState']=page.evaluate("window.eduskillSyncState")
    out['bootLoaderGone']=page.evaluate("!document.getElementById('boot-loader')")
    out['localStorage_keys']=page.evaluate("Object.keys(localStorage).slice(0,40)")
    out['rawKeys']=page.evaluate("(function(){const r=[];for(let i=0;i<localStorage.length;i++){}return r})()")
    # visit each page directly in iframe via navigate
    print('collected',flush=True)
    results={}
    for name in ['subs','time','prog','quiz','insights','notes','settings','dash']:
        logs.append(('--',name))
        page.evaluate(f"navigate('{name}.html', null, false)"); page.wait_for_timeout(1200)
    # confirm dialog test: call from settings frame
    page.evaluate("navigate('subs.html', null, false)"); page.wait_for_timeout(800)
    f=[x for x in page.frames if x!=page.main_frame][0]
    out['confirm_dialog_text']=None
    try:
        f.evaluate("(()=>{window.__p = EduUI.confirmDialog({title:'Delete Subject',message:'Are you sure you want to delete Math?',confirmLabel:'Delete Subject',cancelLabel:'Cancel',isDanger:true});})()")
        f.wait_for_timeout(400)
        out['confirm_dialog_text']=f.evaluate("document.getElementById('eduConfirmOverlay').innerText")
        out['confirm_buttons']=f.evaluate("[...document.querySelectorAll('#eduConfirmOverlay button')].map(b=>b.innerText)")
    except Exception as e: out['confirm_err']=str(e)[:100]
    out['writes']=page.evaluate("window.__writes")
    b.close()
    return out,logs
out,logs=run()
print(json.dumps(out,indent=1)[:3000])
seen=set()
print('--- console/page errors ---')
for k,v in logs:
    key=(k,v)
    if key in seen: continue
    seen.add(key); print(k,v)
srv.shutdown()

page_errors = [v for k, v in logs if k == 'PAGEERROR']
if page_errors:
    print('GATE FAIL: PAGEERROR detected:', page_errors)
    sys.exit(1)
if out.get('syncState') == 'error':
    print("GATE FAIL: syncState is 'error'")
    sys.exit(1)
if MODE == 'seeded':
    if str(out.get('dash_subjectCount')) != '1':
        print(f"GATE FAIL: dash_subjectCount={out.get('dash_subjectCount')}, expected 1")
        sys.exit(1)
    if (out.get('dash_charts_created') or 0) < 1:
        print(f"GATE FAIL: dash_charts_created={out.get('dash_charts_created')}, expected >= 1")
        sys.exit(1)
print('GATE PASS: smoke test passed with 0 errors.')
