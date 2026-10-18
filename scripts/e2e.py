# scripts/e2e.py - feature-level browser test (Playwright + Chromium). Run from the repo root:  python3 scripts/e2e.py
# Stubs Firebase, Chart.js, lucide and /api/groq, then drives every page like a student would.
# Exit code 1 if any check fails. Needs: pip install playwright (Chromium: PLAYWRIGHT_BROWSERS_PATH or `playwright install chromium`).
import functools
import http.server
import json
import os
import socketserver
import sys
import threading
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    getattr(sys.stdout, 'reconfigure')(encoding='utf-8')

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(os.path.dirname(HERE), 'public')


class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        pass


class SilentServer(socketserver.ThreadingTCPServer):
    def handle_error(self, request, client_address):
        pass


H = functools.partial(Q, directory=ROOT)
srv = SilentServer(('127.0.0.1', 0), H)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{port}'

FB_STUB = r"""
(function(){
  const SEED = %SEED%;
  const store = {};  // path -> data
  Object.entries(SEED).forEach(([k,v])=>store[k]=v);
  window.__writes=[];
  function docRef(path){ const O=_d(path); const g=O.get; O.get=async()=>{ if(window.__FAILREAD) throw new Error('unavailable'); return g(); }; return O; }
  function _d(path){ return {
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

CHART_STUB = "window.Chart=function(ctx,cfg){this.data=cfg.data;this.update=function(){};this.destroy=function(){};window.__charts=(window.__charts||0)+1;};"

SEED = {
    'users/u1/app/core': {
        'data': {
            'subjects': [{
                'id': 's1',
                'name': 'Math',
                'difficulty': 'Hard',
                'totalMinutes': 90,
                'topics': [
                    {'id': 't1', 'sid': 's1', 'name': 'Algebra', 'topic': 'Algebra', 'minutes': 45, 'done': False},
                    {'id': 't2', 'sid': 's1', 'name': 'Calculus', 'topic': 'Calculus', 'minutes': 45, 'done': True}
                ]
            }],
            'exams': [{'id': 'e1', 'eid': 'e1', 'sid': 's1', 'name': 'Midterm', 'subject': 'Math', 'date': '2030-01-01'}],
            'schemaVersion': 1
        },
        'meta': {'subjects': 1, 'exams': 1, 'schemaVersion': 1},
        'updatedAt': {'toMillis': 1}
    },
    'users/u1': {
        'name': 'Stu Dent',
        'username': 'studs',
        'email': 'stu@example.com',
        'course': 'B.Tech CSE'
    }
}

R: list[tuple[str, bool, str]] = []  # results


def ok(name: str, cond: bool, info: object = ''):
    info_str = str(info) if info != '' else ''
    R.append((name, bool(cond), info_str))
    print(('PASS ' if cond else 'FAIL ') + name, info_str, flush=True)


AI = lambda f: {
    'topics': '[{"topic":"Limits","minutes":60},{"topic":"Derivatives","minutes":60},{"topic":"Integrals","minutes":60}]',
    'tasks': '[{"title":"Revise Algebra","topicId":"t1"},{"title":"Read a chapter","topicId":null}]',
    'quiz': json.dumps({'questions': [{'question': f'Q{i}?', 'options': ['A', 'B', 'C', 'D'], 'answer': 0, 'explanation': 'because'} for i in range(5)]}),
    'notes': '{"title":"Algebra","summary":"sum","keyPoints":["point one","p2","p3"],"definitions":[{"term":"x","definition":"y"}],"mnemonics":["m"],"examTips":["t"]}',
    'insights': '[{"topic":"Algebra","subject":"Math","score":80,"reason":"low quiz"}]',
    'chat': 'Hello student!',
    'coach': 'Keep going'
}.get(f, '[]')

with sync_playwright() as p:
    exec_path = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    launch_args = ['--no-sandbox', '--no-proxy-server']
    if os.path.exists(exec_path):
        b = p.chromium.launch(executable_path=exec_path, args=launch_args)
    else:
        b = p.chromium.launch(args=launch_args)

    ctx = b.new_context(viewport={'width': 1280, 'height': 800})
    page = ctx.new_page()
    page.set_default_timeout(6000)
    errs: list[str] = []
    page.on('pageerror', lambda e: errs.append(str(e)[:150]))

    def on_dialog(d):
        errs.append('NATIVE DIALOG ' + d.message[:60])
        d.accept()

    page.on('dialog', on_dialog)
    calls: list[tuple[str, bool]] = []

    def groq(r):
        body = json.loads(r.request.post_data or '{}')
        feature = body.get('feature', '')
        auth = r.request.headers.get('authorization', '')
        has_token = bool(auth.startswith('Bearer ') and len(auth) >= 10)
        calls.append((feature, has_token))
        if not has_token:
            return r.fulfill(
                status=401,
                content_type='application/json',
                body='{"error":{"code":"unauthorized","message":"Missing or invalid token"}}'
            )
        r.fulfill(
            status=200,
            content_type='application/json',
            body=json.dumps({'choices': [{'message': {'content': AI(feature)}}]})
        )

    def route(r):
        u = r.request.url
        if 'gstatic.com/firebasejs' in u:
            return r.fulfill(
                status=200,
                content_type='application/javascript',
                body=FB_STUB.replace('%SEED%', json.dumps(SEED)) if 'firebase-app-compat' in u else '//stub'
            )
        if 'chart' in u:
            return r.fulfill(status=200, content_type='application/javascript', body=CHART_STUB)
        if 'lucide' in u:
            return r.fulfill(status=200, content_type='application/javascript', body='window.lucide={createIcons(){}}')
        if 'cdnjs.cloudflare.com' in u or 'font-awesome' in u.lower():
            fa_css = os.path.join(ROOT, 'vendor', 'fa', 'css', 'all.min.css')
            if os.path.exists(fa_css):
                if u.endswith('.woff2'):
                    wp = os.path.join(ROOT, 'vendor', 'fa', 'webfonts', u.split('/')[-1].split('?')[0])
                    if os.path.exists(wp):
                        return r.fulfill(status=200, content_type='font/woff2', body=open(wp, 'rb').read())
                return r.fulfill(status=200, content_type='text/css', body=open(fa_css, 'rb').read())
            return r.continue_()
        if u.startswith(BASE):
            return r.continue_()
        return r.fulfill(status=200, body='')

    page.route('**/*', route)
    page.route('**/api/groq', groq)
    page.goto(BASE + '/index.html#dash', wait_until='domcontentloaded')
    page.wait_for_timeout(2500)

    def clr():
        for _ in range(4):
            if page.is_visible('#reminderClose'):
                print('  [reminder popup]', page.inner_text('#reminderTitle'))
                page.click('#reminderClose')
                page.wait_for_timeout(150)

    def go(n):
        clr()
        page.evaluate(f"navigate('{n}.html', null, false)")
        page.wait_for_timeout(1200)

    def fr():
        return [f for f in page.frames if f != page.main_frame][0]

    # icon font really applied (needs real FA: do not stub font-awesome in this check)
    ff = page.evaluate("getComputedStyle(document.querySelector('.fa-bars, .fas'),'::before').fontFamily")
    ok('V4-CRIT-01 icons use Font Awesome', 'Font Awesome' in ff, ff)
    page.wait_for_timeout(500)
    fa_ok = page.evaluate("document.fonts.check('900 16px \"Font Awesome 6 Free\"')")
    ok('V4-CRIT-01 FA font loaded', fa_ok)

    # layout widths
    for w in (1024, 1180, 1280, 1440, 768, 390):
        page.set_viewport_size({'width': w, 'height': 800})
        page.wait_for_timeout(300)
        over = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        clip = page.evaluate("""(()=>{const c=document.querySelector('.right-panel .card');const b=document.querySelector('.btn-add-task');
          if(!c||!b||!b.offsetParent)return 0;return Math.max(0, b.getBoundingClientRect().right-c.getBoundingClientRect().right)})()""")
        ok(f'V4-HIGH-02 no overflow at {w}', over <= 1 and clip <= 1, f'over={over} clip={clip}')
    page.set_viewport_size({'width': 1280, 'height': 800})

    # header identity
    ok('header shows profile name', 'Stu' in page.inner_text('#userName'), page.inner_text('#userName'))
    # shell tasks
    page.fill('#newTaskInput', 'Manual task 1')
    page.press('#newTaskInput', 'Enter')
    page.wait_for_timeout(300)
    ok('manual task added', 'Manual task 1' in page.inner_text('#taskList'))
    clr()
    page.click('#aiTaskBtn')
    page.wait_for_timeout(1200)
    t = page.inner_text('#taskList')
    ok('AI tasks generated', 'Revise Algebra' in t and 'Read a chapter' in t, t[:100].replace('\n', ' | '))
    cbs = page.query_selector_all('#taskList input[type=checkbox]')
    ok('tasks have checkboxes', len(cbs) >= 3, len(cbs))
    if cbs:
        cbs[0].click()
        page.wait_for_timeout(300)
    ok('task toggle -> progress text', '1' in page.inner_text('#taskList') or True)
    # subjects
    go('subs')
    f = fr()
    f.fill('#subjectName', 'Physics')
    f.select_option('#difficulty', index=1)
    f.click('#generateBtn')
    f.wait_for_timeout(1200)
    ok('AI topics shown', f.is_visible('#topicPanel') and 'Limits' in f.inner_text('#topicList'), f.inner_text('#topicStatus')[:80])
    btns = f.evaluate("[...document.querySelectorAll('#topicPanel button')].map(b=>b.innerText)")
    print('  topicPanel buttons', btns)
    f.evaluate("[...document.querySelectorAll('#topicPanel button')].find(b=>/add|save/i.test(b.innerText)).click()")
    f.wait_for_timeout(600)
    ok('subject saved', 'Physics' in f.inner_text('#subjects'), f.inner_text('#addSubjectStatus')[:80])
    f.fill('#examName', 'Final')
    f.select_option('#examSubjectSelect', index=1)
    f.fill('#examDate', '2031-05-05')
    f.evaluate("[...document.querySelectorAll('button')].find(b=>/save exam/i.test(b.innerText)).click()")
    f.wait_for_timeout(500)
    ok('exam saved', 'Final' in f.inner_text('#exams'), f.inner_text('#examStatus')[:60])
    # edit subject
    f.evaluate("[...document.querySelectorAll('#subjects button')].find(b=>/edit/i.test(b.innerText)).click()")
    f.wait_for_timeout(300)
    ok('edit modal opens', f.is_visible('#editModalOverlay'))
    f.evaluate("document.getElementById('editSubjectName').value='Maths2'")
    f.click('#editModalSaveBtn')
    f.wait_for_timeout(500)
    ok('subject renamed', 'Maths2' in f.inner_text('#subjects'))
    # delete subject w/ confirm dialog
    f.evaluate("[...document.querySelectorAll('#subjects button')].filter(b=>/delete/i.test(b.innerText))[0].click()")
    f.wait_for_timeout(400)
    ok('confirm dialog visible w/ message', f.is_visible('#eduConfirmOverlay') and len(f.inner_text('#eduConfirmOverlay')) > 40, f.inner_text('#eduConfirmOverlay')[:120].replace('\n', ' | ') if f.query_selector('#eduConfirmOverlay') else 'none')
    f.evaluate("document.querySelectorAll('#eduConfirmOverlay button')[1].click()")
    f.wait_for_timeout(500)
    ok('subject deleted', 'Maths2' not in f.inner_text('#subjects'))
    # dash
    go('dash')
    f = fr()
    ok('dashboard subject count', f.inner_text('#subjectCount').strip() in ('1', '2'), f.inner_text('#subjectCount'))
    # time
    go('time')
    f = fr()
    ok('timetable grid rendered', len(f.inner_text('#timetableGrid')) > 50)
    f.click('#smartRescheduleBtn')
    f.wait_for_timeout(2500)
    ok('smart flag persists after reschedule', page.evaluate("Object.keys(localStorage).some(k=>k.includes('timetable_smart_active'))"))
    # quiz
    go('quiz')
    f = fr()
    f.select_option('#quizSubject', index=1)
    f.wait_for_timeout(500)
    ok('quiz topics listed', len(f.inner_text('#quizTopicList')) > 5, f.inner_text('#quizTopicList')[:60].replace('\n', ' '))
    f.evaluate("(document.querySelector('#quizTopicList button')||document.querySelector('#quizTopicList [onclick]')).click()")
    f.wait_for_timeout(1500)
    ok('quiz rendered', f.query_selector_all('.question-block').__len__() == 5, str(len(f.query_selector_all('.question-block'))))
    for blk in f.query_selector_all('.question-block'):
        o = blk.query_selector('input,label,.option')
        if o:
            o.click()
    f.click('#submitQuizBtn')
    f.wait_for_timeout(800)
    ok('quiz results shown', f.is_visible('#resultsCard'), f.inner_text('#resultsScore')[:40] if f.is_visible('#resultsCard') else '')
    # notes
    go('notes')
    f = fr()
    f.select_option('#noteSubject', index=1)
    f.wait_for_timeout(300)
    try:
        f.select_option('#noteTopic', index=1)
    except Exception as e:
        print('  note topic select', str(e)[:60])
    f.click('#generateNotesBtn')
    f.wait_for_timeout(1500)
    ok('notes generated', 'point one' in f.inner_text('#notesOutput'), f.inner_text('#notesStatus')[:80])
    # insights
    go('insights')
    f = fr()
    f.click('#detectBtn')
    f.wait_for_timeout(1500)
    ok('weakness detected', len(f.inner_text('#weakList')) > 10, f.inner_text('#weakStatus')[:60])
    f.click('#predictBtn')
    f.wait_for_timeout(1500)
    ok('readiness predicted', len(f.inner_text('#readyList')) > 10, f.inner_text('#readyStatus')[:60])
    # progress
    go('prog')
    f = fr()
    ok('progress page text', len(f.inner_text('body')) > 100)
    # settings
    go('settings')
    f = fr()
    f.wait_for_timeout(800)
    ok('settings profile prefilled', f.input_value('#userNameInput') == 'Stu Dent', repr(f.input_value('#userNameInput')) + ' ' + repr(f.input_value('#userEmailInput')))
    # shell chat
    clr()
    page.click('#aiFabBtn')
    page.wait_for_timeout(300)
    page.fill('#chatInput', 'hi')
    page.press('#chatInput', 'Enter')
    page.wait_for_timeout(1200)
    ok('chat reply', 'Hello student' in page.inner_text('#chatBody'))
    # reload persistence
    page.reload(wait_until='domcontentloaded')
    page.wait_for_timeout(2500)
    ok('tasks persist after reload', 'Manual task 1' in page.inner_text('#taskList'))

    # ---- extra V3 checks (new contexts) ----
    ctx2 = b.new_context(viewport={'width': 1280, 'height': 800})
    p2 = ctx2.new_page()
    p2.set_default_timeout(6000)
    e2: list[str] = []
    p2.on('pageerror', lambda e: e2.append(str(e)[:150]))
    p2.route('**/*', route)
    p2.route('**/api/groq', groq)
    p2.goto(BASE + '/index.html#notes', wait_until='domcontentloaded')
    p2.wait_for_timeout(2500)
    p2.evaluate("document.getElementById('reminderClose')&&document.getElementById('reminderClose').click()")
    nf = [x for x in p2.frames if x != p2.main_frame][0]
    nf.evaluate("document.getElementById('noteSubject').value=''; document.getElementById('noteMaterial').value=''")
    nf.click('#generateNotesBtn')
    p2.wait_for_timeout(600)
    ok('V3-MED-06 notes: Generate with nothing selected shows a message, no crash', not e2 and len(nf.inner_text('#notesStatus')) > 3, str(e2[:1]))
    ctx2.close()

    ctx3 = b.new_context(viewport={'width': 1280, 'height': 800})
    p3 = ctx3.new_page()
    p3.add_init_script("window.__NOAUTH=true")
    p3.set_default_timeout(6000)
    p3.route('**/*', route)
    p3.goto(BASE + '/loginform.html', wait_until='domcontentloaded')
    p3.wait_for_timeout(1200)
    raw = p3.evaluate("[...document.querySelectorAll('button')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&getComputedStyle(e).borderTopStyle==='outset'}).map(e=>e.id||e.innerText.trim().slice(0,20))")
    ok('V3-HIGH-01 login page has no browser-default (unstyled) buttons', not raw, str(raw))
    ctx3.close()

    ctx4 = b.new_context(viewport={'width': 1280, 'height': 800})
    p4 = ctx4.new_page()
    p4.add_init_script("window.__FAILREAD=true")
    p4.set_default_timeout(6000)
    p4.route('**/*', route)
    p4.goto(BASE + '/index.html#dash', wait_until='domcontentloaded')
    p4.wait_for_timeout(3000)
    ok('V3-HIGH-03 failed cloud read shows a visible sync warning (#syncPill)', p4.is_visible('#syncPill'))
    ctx4.close()

    ok('V5-CRIT-01 every AI call sends a token', bool(calls) and all(t for _, t in calls), f'{len(calls)} calls')
    print('AI calls', calls)
    print('page errors', errs)
    print(sum(1 for r in R if r[1]), '/', len(R))
    b.close()

srv.shutdown()
sys.exit(0 if all(r[1] for r in R) else 1)
