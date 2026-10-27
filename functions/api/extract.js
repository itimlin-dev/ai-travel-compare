// Cloudflare Pages Function. Conservative, text-only public page extraction.
export async function onRequestGet({ request }) {
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
 const fail=(error,status=400)=>new Response(JSON.stringify({error}),{status,headers});
 let target;try{target=new URL(new URL(request.url).searchParams.get('url'));}catch{return fail('無效網址')}
 if(!['http:','https:'].includes(target.protocol)||target.username||target.password||target.port&& !['80','443'].includes(target.port))return fail('僅支援一般公開 HTTPS/HTTP 網頁');
 const host=target.hostname.toLowerCase();
 if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal')||host.endsWith('.onion')||!host.includes('.')||/^\d+\.\d+\.\d+\.\d+$/.test(host)||host.includes(':'))return fail('不支援內部網路或 IP 位址');
 try{
  const response=await fetch(target.toString(),{redirect:'manual',headers:{'Accept':'text/html','User-Agent':'Mozilla/5.0 (compatible; TravelComparePreview/1.2)'}});
  if(response.status>=300&&response.status<400)return fail('來源網站重新導向，請開啟最終行程網址再試',422);
  if(!response.ok)return fail('來源網站拒絕讀取（HTTP '+response.status+'）',422);
  if(!(response.headers.get('content-type')||'').includes('text/html'))return fail('目前只支援 HTML 行程網頁，PDF 請手動複製文字',422);
  const declared=Number(response.headers.get('content-length')||0);if(declared>700000)return fail('網頁內容過大，請改用貼上文字',422);
  const html=(await response.text()).slice(0,700000);
  const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'';
  const clean=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,' ').replace(/<(?:br|\/p|\/div|\/li|\/tr|\/h[1-6])\b[^>]*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n').trim();
  return new Response(JSON.stringify({title:clean(title).slice(0,200),text:clean(html).slice(0,55000)}),{headers});
 }catch{return fail('網頁連線失敗或來源不允許擷取',422)}
}
