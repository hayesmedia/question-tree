const enc=new TextEncoder();
const cookieName='__Host-question_tree_session';
const ttl=24*60*60;
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"};
async function digest(s){return new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s)));}
function equal(a,b){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;}
async function sign(value,password){const key=await crypto.subtle.importKey('raw',enc.encode(password),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode('question-tree-session:'+value)))].map(v=>v.toString(16).padStart(2,'0')).join('');}
async function authenticated(req,password){const value=(req.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!value)return false;const [expiry,mac,...rest]=value.split('.');if(rest.length||!/^\d+$/.test(expiry)||!/^[a-f0-9]{64}$/.test(mac||''))return false;const seconds=Number(expiry),now=Math.floor(Date.now()/1000);if(seconds<=now||seconds>now+ttl)return false;return equal(enc.encode(mac),enc.encode(await sign(expiry,password)));}
function login(message='',status=200){return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in · Question Tree</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#121927;color:#e6ebf5;font:15px system-ui}main{width:min(360px,85vw);padding:32px;background:#202b3d;border-radius:16px}h1{font-size:24px}p{color:#bac5d9;line-height:1.6}label{display:block;margin:20px 0 8px}input,button{box-sizing:border-box;width:100%;padding:13px;border-radius:8px;font:inherit}input{background:#121927;color:white;border:1px solid #52617d}button{margin-top:16px;background:#7963e2;border:0;color:white;cursor:pointer}.error{color:#ffb4b4}</style></head><body><main><h1>Question Tree</h1><p>Enter the shared password to open your workspace.</p>${message?`<p class="error" role="alert">${message}</p>`:''}<form method="post" action="/login"><label for="password">Password</label><input id="password" name="password" type="password" required autocomplete="current-password" autofocus maxlength="1024"><button>Sign in</button></form></main></body></html>`,{status,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});}
export default {async fetch(req,env){
 if(!env.SITE_PASSWORD)return new Response('Login is not configured yet. The administrator must add the SITE_PASSWORD secret in Cloudflare.',{status:503,headers});
 const url=new URL(req.url);
 if((url.pathname==='/login'||url.pathname==='/logout')&&req.method==='POST'){
  if(req.headers.get('Origin')!==url.origin)return new Response('Forbidden',{status:403,headers});
  if(url.pathname==='/logout')return new Response(null,{status:303,headers:{...headers,Location:'/', 'Set-Cookie':`${cookieName}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`}});
  if(Number(req.headers.get('Content-Length')||0)>4096)return login('Password is too long.',413);
  let body;try{body=await req.text();if(body.length>4096)return login('Password is too long.',413);}catch{return login('Unable to read password.',400);}
  const password=new URLSearchParams(body).get('password')||'';
  if(!equal(await digest(password),await digest(env.SITE_PASSWORD)))return login('Incorrect password. Try again.',401);
  const expiry=String(Math.floor(Date.now()/1000)+ttl),mac=await sign(expiry,env.SITE_PASSWORD);
  return new Response(null,{status:303,headers:{...headers,Location:'/', 'Set-Cookie':`${cookieName}=${expiry}.${mac}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${ttl}`}});
 }
 if(!await authenticated(req,env.SITE_PASSWORD))return login('',401);
 const response=await env.ASSETS.fetch(req);const result=new Response(response.body,response);result.headers.set('Cache-Control','private, no-store');return result;
}};
