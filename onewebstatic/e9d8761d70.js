!function(){function a(){function a(){h=!h,h?(e.className="on",f.className="on",b=Math.max(window.innerHeight||document.documentElement.clientHeight,g.offsetHeight,f.offsetHeight),f.style.height=b+"px"):(e.className="off",f.className="off")}var b,c=function(a){return document.getElementById(a)},d=c("mmt"),e=c("mmb"),f=c("mm"),g=document.getElementsByTagName("body")[0],h=!1;e&&f&&g&&(d.onclick=a,e.onclick=a,f.onclick=function(a){var b,c;return b=a?a.target:window.event.srcElement,b=3===b.nodeType?b.parentNode:b,"DIV"===b.tagName&&"mm"!==b.id?(c=b.parentNode,void(c.className=c.className?"":"expanded")):(e.className="off",f.className="off",void(h=!1))})}var b=setInterval(function(){"complete"!==document.readyState&&"interactive"!==document.readyState||(a(),clearInterval(b))},10)}(),function(){function a(){function a(){var a=window.innerWidth||document.documentElement.clientWidth;return a<=650}function b(){var b=a();for(h=0,k=p.length;h<k;h+=1)m=p[h],b?m.newLeaf&&m.leaf&&m.leaf.children.length&&c(m.newLeaf,m.leaf.children):m.leaf&&m.newLeaf&&m.newLeaf.children.length&&c(m.leaf,m.newLeaf.children)}function c(a,b){for(var c=b[0];c;)a.appendChild(c),c=b[0]}function d(){clearTimeout(t),t=setTimeout(b,200)}var e,f,g,h,i,j,k,l,m,n,o,p=[],q=document.querySelector(".template"),r=q.parentNode,s=document.querySelectorAll(".mobile-leaf");for(h=0,k=s.length;h<k;h+=1)if(l=s[h],n=(l.getAttribute("data-weight")||0)-0){for(i=l.parentNode,j=null,o=l.getAttribute("data-id");"BODY"!==i.tagName&&!j;)j=/mobile-base/.test(i.className)?i:j,o=o||i.getAttribute("data-id"),i=i.parentNode;p.push({id:o,leaf:l,base:j,weight:n})}for(p.sort(function(a,b){return a.weight-b.weight}),h=0,k=p.length;h<k;h+=1)m=p[h],g=document.createElement("DIV"),g.setAttribute("class",m.leaf.className),m.id&&g.setAttribute("data-id",m.id),g.setAttribute("data-weight",m.weight),e=g,m.base&&(f=document.createElement("DIV"),f.setAttribute("class",m.base.className+" mobile-base-moved"),f.setAttribute("style",m.base.getAttribute("style")),f.appendChild(g),e=f),m.leaf.className+=" mobile-hide",e.className+=" mobile-show",m.weight<0?r.insertBefore(e,q):r.appendChild(e),m.newLeaf=g;b();var t;window.addEventListener?window.addEventListener("resize",d):window.attachEvent&&window.attachEvent("onresize",d)}var b=setInterval(function(){"complete"===document.readyState&&(clearInterval(b),a())},10);window.runMobileSort=a}();