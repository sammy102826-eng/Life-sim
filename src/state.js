let g,h,camp,scr='title',tab='Life',cur=null,back='title',inv={noAds:false,rich:false,revives:0};
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
try{inv=Object.assign(inv,JSON.parse(ls.get('bt_inv')||'{}'))}catch(e){}
