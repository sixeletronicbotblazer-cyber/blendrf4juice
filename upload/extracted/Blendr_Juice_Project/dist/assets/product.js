const PRODUCT_ASSETS = {
  pink: {src:'assets/choose-pink.webp', alt:'Soft Pink Blendr, full bottle on a studio backdrop', caption:'Soft Pink · studio'},
  ivory:{src:'assets/choose-ivory.webp',alt:'Warm Ivory Blendr, full bottle on a studio backdrop',caption:'Warm Ivory · studio'},
  gym:  {src:'assets/scene-gym.webp',alt:'Soft Pink Blendr after a workout',caption:'After training'},
  car:  {src:'assets/scene-car.webp',alt:'Warm Ivory Blendr in a parked car',caption:'On the move'},
  study:{src:'assets/scene-study.webp',alt:'Soft Pink Blendr on a sunny study desk',caption:'Study break'}
};
const PRICES={1:49.97,2:94.97,3:124.97};
const labelColor=color=>color==='pink'?'Soft Pink':'Warm Ivory';
const money=value=>'$'+value.toFixed(2);
let bundle=2,sets=1,colors=['pink','ivory'],cart=[];
try{const saved=JSON.parse(localStorage.getItem('blendr-preview-bag')||'[]');if(Array.isArray(saved))cart=saved.filter(item=>PRICES[item.bundle]&&Array.isArray(item.colors)&&Number.isInteger(item.sets)&&item.sets>0)}catch{}
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
function setGallery(key){
  const image=PRODUCT_ASSETS[key];if(!image)return;
  const target=$('#gallery-image');target.src=image.src;target.alt=image.alt;
  $('#gallery-caption').textContent=image.caption;
  $$('.gallery-thumb').forEach(button=>{const active=button.dataset.gallery===key;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active))});
}
function renderBottlePicks(){
  const wrap=$('#bottle-selects');wrap.replaceChildren();wrap.className='bottle-picks';
  for(let i=0;i<bundle;i++){
    const row=document.createElement('label');row.className='bottle-pick';
    const name=document.createElement('span');name.textContent=`Bottle ${i+1}`;
    const select=document.createElement('select');select.setAttribute('aria-label',`Color for bottle ${i+1}`);
    for(const [value,text] of [['pink','Soft Pink'],['ivory','Warm Ivory']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option)}
    select.value=colors[i];select.addEventListener('change',()=>{colors[i]=select.value;if(i===0)setBaseColor(select.value)});
    row.append(name,select);wrap.append(row);
  }
}
function setBaseColor(color){
  colors[0]=color;
  $('#color-hint').textContent=labelColor(color)+' selected';
  $$('.color-option').forEach(button=>{const active=button.dataset.baseColor===color;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active))});
  const first=$('#bottle-selects select');if(first)first.value=color;
  setGallery(color);
}
function chooseBundle(value){
  bundle=value;colors=Array.from({length:bundle},(_,i)=>colors[i]||(['pink','ivory','pink'][i]));
  $$('.bundle-card').forEach(button=>{const active=Number(button.dataset.bundle)===bundle;button.classList.toggle('selected',active);button.setAttribute('aria-checked',String(active))});
  renderBottlePicks();$('#price-total').textContent=money(PRICES[bundle]*sets);
}
function saveCart(){try{localStorage.setItem('blendr-preview-bag',JSON.stringify(cart))}catch{}}
function renderCart(){
  const body=$('#cart-body');body.replaceChildren();
  if(!cart.length){const p=document.createElement('p');p.className='cart-empty';p.textContent='Your bag is empty. Choose a color and a set to get started.';body.append(p)}
  cart.forEach((item,index)=>{
    const row=document.createElement('div');row.className='cart-line';
    const photo=document.createElement('img');photo.src=PRODUCT_ASSETS[item.colors[0]]?.src||PRODUCT_ASSETS.pink.src;photo.alt='';
    const content=document.createElement('div');content.className='cart-line-content';
    const title=document.createElement('strong');title.textContent=`Blendr ${item.bundle===1?'Solo':item.bundle===2?'Pair':'Trio'} · ${item.bundle*item.sets} ${item.bundle*item.sets===1?'bottle':'bottles'}`;
    const subtitle=document.createElement('small');subtitle.textContent=item.colors.map(labelColor).join(' + ')+(item.sets>1?` · ${item.sets} sets`:'');
    const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.setAttribute('aria-label',`Remove ${title.textContent}`);remove.addEventListener('click',()=>{cart.splice(index,1);saveCart();renderCart()});
    const price=document.createElement('span');price.className='cart-line-price';price.textContent=money(PRICES[item.bundle]*item.sets);
    content.append(title,subtitle,remove);row.append(photo,content,price);body.append(row);
  });
  const subtotal=cart.reduce((total,item)=>total+PRICES[item.bundle]*item.sets,0);
  $('#cart-subtotal').textContent=money(subtotal);
  const count=cart.reduce((total,item)=>total+item.bundle*item.sets,0);$$('[data-bag-count]').forEach(el=>{el.textContent=count;el.hidden=count===0});
  $('#checkout-button').disabled=!cart.length;
}
function openCart(){renderCart();$('#cart-drawer').hidden=false;$('#cart-backdrop').hidden=false;document.body.style.overflow='hidden';$('#close-cart').focus()}
function closeCart(){$('#cart-drawer').hidden=true;$('#cart-backdrop').hidden=true;document.body.style.overflow='';$('#cart-status').textContent=''}
$$('.gallery-thumb').forEach(button=>button.addEventListener('click',()=>setGallery(button.dataset.gallery)));
$$('.color-option').forEach(button=>button.addEventListener('click',()=>setBaseColor(button.dataset.baseColor)));
$$('.bundle-card').forEach(button=>button.addEventListener('click',()=>chooseBundle(Number(button.dataset.bundle))));
$$('[data-qty]').forEach(button=>button.addEventListener('click',()=>{sets=Math.max(1,Math.min(5,sets+(button.dataset.qty==='plus'?1:-1)));$('#set-quantity').textContent=sets;$('#price-total').textContent=money(PRICES[bundle]*sets)}));
$('#add-to-bag').addEventListener('click',()=>{cart.push({bundle,sets,colors:[...colors]});saveCart();openCart()});
$$('[data-open-cart]').forEach(button=>button.addEventListener('click',openCart));
$('#close-cart').addEventListener('click',closeCart);$('#cart-backdrop').addEventListener('click',closeCart);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#cart-drawer').hidden)closeCart()});
$('#checkout-button').addEventListener('click',()=>{$('#cart-status').textContent='Checkout is not available in this preview yet. Your selected bag is saved.'});
$('#mobile-buy').addEventListener('click',()=>{$('#bundles').scrollIntoView({behavior:'smooth',block:'start'})});
const menuButton=$('.menu-toggle'),mobileMenu=$('#product-mobile-menu');
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close menu':'Open menu');mobileMenu.hidden=!open});
mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileMenu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu')}));
renderBottlePicks();renderCart();
const incoming=new URLSearchParams(window.location.search);
const incomingColor=incoming.get('color'),incomingBundle=Number(incoming.get('bundle'));
if(incomingColor==='pink'||incomingColor==='ivory')setBaseColor(incomingColor);
if(PRICES[incomingBundle])chooseBundle(incomingBundle);
if(incoming.get('add')==='1'&&(incomingColor==='pink'||incomingColor==='ivory')&&PRICES[incomingBundle]){
  cart.push({bundle,sets:1,colors:[...colors]});saveCart();openCart();
  const cleanURL=new URL(window.location.href);cleanURL.searchParams.delete('add');
  history.replaceState(null,'',cleanURL.pathname+cleanURL.search+cleanURL.hash);
}
