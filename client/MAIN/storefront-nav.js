(function () {
  'use strict';

  var iconPaths = {
    'fa-angle-down': '<path d="m6 9 6 6 6-6"/>',
    'fa-user': '<circle cx="12" cy="8" r="3.4"/><path d="M5.5 20c.3-4 2.7-6 6.5-6s6.2 2 6.5 6"/>',
    'fa-bag-shopping': '<path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
    'fa-magnifying-glass': '<circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 4.5 4.5"/>'
  };
  document.querySelectorAll('i[class*="fa-"]').forEach(function (icon) {
    var kind = Object.keys(iconPaths).find(function (name) { return icon.classList.contains(name); });
    if (!kind) return;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '1em');
    svg.setAttribute('height', '1em');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'svg-icon ' + kind);
    svg.innerHTML = iconPaths[kind];
    icon.replaceWith(svg);
  });

  function loginReturn(filename) {
    try { const value = decodeURIComponent(filename); return /^[A-Za-z0-9 _().&-]+\.html$/i.test(value) ? value : 'clothe-home.html'; }
    catch (_) { return 'clothe-home.html'; }
  }
  document.querySelectorAll('.icons i.fa-magnifying-glass, .icons i.fa-user, .icons i.fa-bag-shopping').forEach(function (icon) {
    var kind = icon.classList.contains('fa-magnifying-glass') ? 'search' : icon.classList.contains('fa-user') ? 'account' : 'bag';
    var href = kind === 'search' ? 'search_and_cart.html' : kind === 'bag' ? 'search_and_cart.html?bag=1' : (localStorage.getItem('adornment_access_token') ? 'account.html' : 'login.html');
    var parent = icon.parentElement;
    if (parent && parent.tagName === 'A') { parent.href = href; parent.setAttribute('aria-label', kind === 'bag' ? 'Open shopping bag' : kind === 'search' ? 'Search products' : 'Sign in'); }
    else { var link = document.createElement('a'); link.href = href; link.setAttribute('aria-label', kind === 'bag' ? 'Open shopping bag' : kind === 'search' ? 'Search products' : 'Sign in'); parent.insertBefore(link, icon); link.appendChild(icon); }
  });
  if (/AI Studio/i.test(document.title) && !document.querySelector('.navbar')) {
    const header=document.createElement('nav');header.setAttribute('aria-label','Store navigation');header.style.cssText='display:flex;gap:18px;align-items:center;padding:14px 5%;background:#211d18;color:#fff;font:14px system-ui';
    header.innerHTML='<a href="clothe-home.html" style="color:inherit;margin-right:auto;font-weight:700">ATONEMENT.</a><a href="search_and_cart.html" style="color:inherit">Shop</a><a href="account.html" style="color:inherit">My Account</a><a href="search_and_cart.html?bag=1" style="color:inherit">Bag</a>';
    document.body.prepend(header);
  }
  if (document.querySelector('.product-info .btn, main.product .btn')) {
    var setupProductButton = async function () {
      var button = document.querySelector('.product-info .btn, main.product .btn'); if (!button) return;
      var pending = sessionStorage.getItem('atonement.pending-add');
      if (pending && window.StorefrontAPI.isSignedIn()) {
        try { var item = JSON.parse(pending); await window.StorefrontAPI.addToCart(item.productId,item.variantId,1); sessionStorage.removeItem('atonement.pending-add'); location.href='search_and_cart.html?bag=1'; return; }
        catch (error) { sessionStorage.removeItem('atonement.pending-add'); alert(error.message); }
      }
      button.addEventListener('click', async function () {
        button.disabled = true;
        try {
          var title = document.querySelector('.product-info h1, main.product h1')?.textContent.trim();
          var result = await window.StorefrontAPI.products({q:title,page:1,pageSize:100});
          var product = (result.items||[]).find(function (item) { return item.name.toLowerCase()===String(title).toLowerCase(); });
          if (!product) { alert('This sample product is not in the live product catalog yet. Add it in the admin inventory before ordering.'); return; }
          var size=document.querySelector('input[name="size"]:checked')?.value; var color=document.querySelector('input[name="color"]:checked')?.value;
          var variant=(product.variants||[]).find(function(v){return (!size||!v.size||v.size===size)&&(!color||!v.color||v.color.toLowerCase()===color.toLowerCase())&&v.stock>0});
          if (!variant) { alert('The selected size or color is unavailable. Choose an in-stock option in the live catalog.'); return; }
          if (!window.StorefrontAPI.isSignedIn()) {
            sessionStorage.setItem('atonement.pending-add',JSON.stringify({productId:product._id,variantId:variant._id}));
            location.href='login.html?returnTo='+encodeURIComponent(loginReturn(location.pathname.split('/').pop())); return;
          }
          await window.StorefrontAPI.addToCart(product._id,variant._id,1); location.href='search_and_cart.html?bag=1';
        } catch(error) { alert(error.message); } finally { button.disabled=false; }
      });
    };
    if (window.StorefrontAPI) setupProductButton();
    else { var script = document.createElement('script'); script.src = '../storefront-api.js'; script.onload = setupProductButton; document.body.append(script); }
  }
  document.querySelectorAll('button').forEach(function(button){
    if (!/add to bag/i.test(button.textContent) || button.closest('.product-info, main.product')) return;
    var card=button.closest('.jewelry1,.image2'),name=card?.querySelector('h6')?.textContent.trim();
    var page=decodeURIComponent(location.pathname.split('/').pop()||'').toLowerCase();
    var category=page==='gowns.html'?'Gowns':page==='suit.html'?'Suits':page==='jumpsuit.html'?'Jumpsuit':page==='summer.html'?'Summer':page==='collars&ties.html'?'Collars & Ties':page==='2-piece.html'?'2-Piece':'';
    var destination='search_and_cart.html'+(category||name?'?'+new URLSearchParams({...(category?{cat:category}:{}),...(name?{q:name}:{})}):'');
    button.querySelectorAll('a[href="#"]').forEach(function(link){link.href=destination;link.textContent='VIEW IN SHOP';});
    button.addEventListener('click',function(event){if(event.target.closest('a'))return;location.href=destination});
  });
})();
