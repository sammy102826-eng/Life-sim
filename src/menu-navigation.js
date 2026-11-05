/* Always provide a non-destructive escape from gameplay menus. Decisions retain their own choices. */
function menuBackToLife(){tab='Life';wsel=null;wsub=null;sel=null;NV.O=[];NV.S=[];draw(1);}
const menuNavigationView=gameView;gameView=function(){const html=menuNavigationView();if(tab==='Life')return html;const root=document.createElement('div');root.innerHTML=html;const info=root.querySelector('.info');if(info)info.insertAdjacentHTML('afterbegin',B('Back to Life','menuBackToLife()'));return root.innerHTML;};
