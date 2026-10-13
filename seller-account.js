/* Login, seller profiles and product publishing for Lammet Dar */
const SB_URL="https://qtqkmgfezfrmvnpnoefj.supabase.co";
const SB_KEY="sb_publishable_eVLZYm7jGM2ML1gN60rWvQ_DZ6r6nCI";
let currentSession=null, currentProfile=null;
function authHeaders(){return {"apikey":SB_KEY,"Authorization":"Bearer "+(currentSession?currentSession.access_token:SB_KEY),"Content-Type":"application/json"}}
async function restoreSession(){
 try{
  // Capture the session returned by Supabase after the email-confirmation redirect.
  const hash=new URLSearchParams(window.location.hash.slice(1));
  const redirectedAccess=hash.get("access_token"), redirectedRefresh=hash.get("refresh_token");
  if(redirectedAccess){
   currentSession={access_token:redirectedAccess,refresh_token:redirectedRefresh||"",token_type:hash.get("token_type")||"bearer",expires_in:Number(hash.get("expires_in")||3600),user:null};
   localStorage.setItem("lammetDarSession",JSON.stringify(currentSession));
   history.replaceState(null,"",window.location.pathname+window.location.search);
  }
  const saved=localStorage.getItem("lammetDarSession");
  if(saved){currentSession=JSON.parse(saved);const r=await fetch(SB_URL+"/auth/v1/user",{headers:authHeaders()});if(!r.ok)throw new Error("expired");currentSession.user=await r.json();await loadProfile();}
 }catch(e){currentSession=null;currentProfile=null;localStorage.removeItem("lammetDarSession")}
}
async function loadProfile(){
 if(!currentSession||!currentSession.user||!currentSession.user.id)return;
 const r=await fetch(SB_URL+"/rest/v1/profiles?id=eq."+encodeURIComponent(currentSession.user.id)+"&select=id,full_name,role,phone",{headers:authHeaders()});
 if(r.ok){const rows=await r.json();currentProfile=rows[0]||null}
}
function showAccount(){
 // Explicit demo mode is for storefront testing only; it grants no real-data permissions.
 if(new URLSearchParams(window.location.search).get("mode")==="demo"){
  const demoHtml = '<div class="note">أنت الآن في وضع تجريبي ببيانات نموذجية. يمكنك اختبار التصفح والسلة وواجهة الطلب، ولن تُحفظ طلبات أو بيانات حقيقية.</div><div class="cart-line"><span class="emoji">🧪</span><div class="details"><h3>المتجر التجريبي</h3><p>المنتجات والأسعار المعروضة أمثلة للاختبار</p></div></div><button class="primary" onclick="closeModal();showCategories()">تجربة التصنيفات</button><button class="primary" onclick="closeModal();openCart()">تجربة سلة المشتريات</button><button class="primary" style="background:#f5efe4;color:#153c2c;border:1px solid #d8cdb9" onclick="history.replaceState(null,'',window.location.pathname+window.location.hash);closeModal();showAccount()">الانتقال إلى تسجيل الدخول الحقيقي</button>';
  openModal("وضع المطوّر التجريبي",demoHtml);
  return;
 }
 if(currentSession&&currentSession.user){
  // A confirmed auth session is valid even if the profile query is temporarily empty.
  // Fall back to signup metadata so users are not incorrectly sent back to the login form.
  const meta=currentSession.user.user_metadata||{};
  const profile=currentProfile||{full_name:meta.full_name||"عضو لَمّة الدار",role:meta.account_type==="seller"?"seller":"customer",phone:meta.phone||""};
  const seller=profile.role==="seller"||profile.role==="admin";
  let h='<div class="cart-line"><span class="emoji">👤</span><div class="details"><h3>'+esc(profile.full_name||"عضو لَمّة الدار")+'</h3><p>'+(seller?"حساب صاحبة منتجات":"حساب زبونة")+' · '+esc(currentSession.user.email)+'</p></div></div>';
  if(!currentProfile)h+='<p class="note">تم تسجيل الدخول، لكن بيانات الملف الشخصي لم تُحمّل بعد. يمكنك إعادة فتح الحساب لاحقًا؛ إذا استمرت المشكلة، يلزم فحص سجل الملف الشخصي.</p>';
  if(seller&&currentProfile)h+='<button class="primary" onclick="showMyProducts()">📦 إدارة منتجاتي</button><button class="primary" onclick="showAddProduct()">＋ إضافة منتج جديد</button>';
  else if(!seller)h+='<p class="note">لبيع منتجاتك المنزلية، أنشئي حسابًا جديدًا واختاري «صاحبة منتجات» عند التسجيل.</p>';
  h+='<button class="primary" style="background:#7a342c" onclick="signOut()">تسجيل الخروج</button>';
  openModal("حسابي",h);
 }else showAuth("login");
}
function showAuth(mode){
 const signup=mode==="signup";
 let h='<div class="note">استخدمي بريدك الإلكتروني وكلمة مرور خاصة بك. لا ترسلي كلمة المرور لأي شخص.</div>';
 if(signup)h+='<div class="field"><label>الاسم الكامل</label><input id="authName" autocomplete="name" placeholder="اسمك الكامل"></div><div class="field"><label>رقم الهاتف (اختياري)</label><input id="authPhone" type="tel" placeholder="05 / 06 / 07"></div><div class="field"><label>نوع الحساب</label><select id="authRole" style="width:100%;border:1px solid #ded7c8;border-radius:11px;padding:13px;background:white"><option value="seller">صاحبة منتجات منزلية</option><option value="customer">زبونة</option></select></div>';
 h+='<div class="field"><label>البريد الإلكتروني</label><input id="authEmail" type="email" autocomplete="email" placeholder="name@example.com"></div><div class="field"><label>كلمة المرور</label><input id="authPassword" type="password" autocomplete="'+(signup?"new-password":"current-password")+'" placeholder="8 أحرف أو أكثر"></div><div id="authMessage" class="note"></div>';
 h+='<button class="primary" onclick="'+(signup?"signUp()":"signIn()")+'">'+(signup?"إنشاء الحساب":"دخول")+'</button>';
 if(!signup)h+='<button class="primary" style="background:#f5efe4;color:#153c2c;border:1px solid #d8cdb9" onclick="resendConfirmation()">إعادة إرسال رسالة تأكيد البريد</button>';
 h+='<button class="primary" style="background:#e8e0d2;color:#153c2c" onclick="showAuth(\\''+(signup?"login":"signup")+'\\')">'+(signup?"لديك حساب؟ تسجيل الدخول":"ليس لديك حساب؟ إنشاء حساب")+'</button>';
 openModal(signup?"إنشاء حساب جديد":"تسجيل الدخول",h);
}
async function signUp(){
 const name=document.getElementById("authName").value.trim(),phone=document.getElementById("authPhone").value.trim();
 const email=document.getElementById("authEmail").value.trim(),password=document.getElementById("authPassword").value,role=document.getElementById("authRole").value,box=document.getElementById("authMessage");
 if(!name||!email||password.length<8){box.textContent="أدخلي الاسم والبريد وكلمة مرور من 8 أحرف على الأقل.";return}
 box.textContent="جارٍ إنشاء الحساب…";
 try{
  const redirectTo=window.location.origin+window.location.pathname;
  const r=await fetch(SB_URL+"/auth/v1/signup?redirect_to="+encodeURIComponent(redirectTo),{method:"POST",headers:{"apikey":SB_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password,data:{full_name:name,phone:phone,account_type:role}})});
  const data=await r.json();if(!r.ok)throw new Error(data.msg||data.message||data.error_description||"تعذّر إنشاء الحساب");
  if(data.access_token){currentSession=data;localStorage.setItem("lammetDarSession",JSON.stringify(data));await loadProfile();showAccount();toast("تم إنشاء الحساب بنجاح")}
  else box.textContent="تم إرسال طلب التسجيل. افتحي بريدك الإلكتروني واضغطي رابط التأكيد، ثم عودي لتسجيل الدخول.";
 }catch(e){box.textContent=e.message||"حدث خطأ. حاولي مجددًا."}
}
async function resendConfirmation(){
 const email=document.getElementById("authEmail").value.trim(),box=document.getElementById("authMessage");
 if(!email){box.textContent="أدخلي البريد الإلكتروني أولًا، ثم اضغطي إعادة الإرسال.";return}
 box.textContent="جارٍ إرسال رسالة تأكيد جديدة…";
 try{
  const redirectTo=window.location.origin+window.location.pathname;
  const r=await fetch(SB_URL+"/auth/v1/resend",{method:"POST",headers:{"apikey":SB_KEY,"Content-Type":"application/json"},body:JSON.stringify({type:"signup",email:email,options:{emailRedirectTo:redirectTo}})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.msg||data.message||data.error_description||"تعذّر إرسال رسالة التأكيد.");
  box.textContent="إذا كان هذا البريد مسجلًا ولم يتم تأكيده، فستصلك رسالة جديدة. افحصي البريد الوارد ومجلد الرسائل غير المرغوب فيها.";
 }catch(e){box.textContent=e.message||"تعذّر إرسال رسالة التأكيد. حاولي لاحقًا."}
}
async function signIn(){
 const email=document.getElementById("authEmail").value.trim(),password=document.getElementById("authPassword").value,box=document.getElementById("authMessage");
 if(!email||!password){box.textContent="أدخلي البريد الإلكتروني وكلمة المرور.";return}
 box.textContent="جارٍ تسجيل الدخول…";
 try{
  const r=await fetch(SB_URL+"/auth/v1/token?grant_type=password",{method:"POST",headers:{"apikey":SB_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
  const data=await r.json();if(!r.ok)throw new Error(data.msg||data.message||data.error_description||"بيانات الدخول غير صحيحة");
  currentSession=data;localStorage.setItem("lammetDarSession",JSON.stringify(data));await loadProfile();showAccount();toast("مرحبًا بعودتك");
 }catch(e){box.textContent=e.message||"تعذّر تسجيل الدخول."}
}
function signOut(){currentSession=null;currentProfile=null;localStorage.removeItem("lammetDarSession");closeModal();toast("تم تسجيل الخروج")}
async function showMyProducts(){
 if(!currentSession||!currentProfile||!["seller","admin"].includes(currentProfile.role)){toast("يجب الدخول بحساب صاحبة منتجات");return}
 openModal("إدارة منتجاتي",'<p class="note">هذه المنتجات مرتبطة بحسابك. يمكنك إخفاء المنتج من المتجر أو حذفه نهائيًا.</p><div id="myProductsList" class="note">جارٍ تحميل منتجاتك…</div>');
 try{
  const r=await fetch(SB_URL+"/rest/v1/products?select=id,name,price_dzd,available,created_at&seller_id=eq."+encodeURIComponent(currentSession.user.id)+"&order=created_at.desc",{headers:authHeaders()});
  const rows=await r.json().catch(()=>[]);
  if(!r.ok)throw new Error(rows.message||"تعذّر تحميل المنتجات");
  const el=document.getElementById("myProductsList");if(!el)return;
  if(!rows.length){el.innerHTML='<div class="empty">لا توجد منتجات مرتبطة بحسابك بعد. أضيفي أول منتج للبدء.</div>';return}
  el.innerHTML=rows.map(p=>'<div class="cart-line"><span class="emoji">🧺</span><div class="details"><h3>'+esc(p.name)+'</h3><p>'+money(Number(p.price_dzd))+' · '+(p.available?'ظاهر في المتجر':'مخفي عن المتجر')+'</p><button class="primary" style="padding:9px;margin-top:7px" onclick="toggleProductAvailability('+JSON.stringify(String(p.id))+','+(!p.available)+')">'+(p.available?'إخفاء المنتج':'إظهار المنتج')+'</button><button class="primary" style="padding:9px;background:#7a342c;margin-top:5px" onclick="deleteMyProduct('+JSON.stringify(String(p.id))+')">حذف المنتج</button></div></div>').join("");
 }catch(e){const el=document.getElementById("myProductsList");if(el)el.textContent=e.message||"حدث خطأ أثناء تحميل المنتجات."}
}
async function toggleProductAvailability(id,available){
 if(!currentSession||!currentProfile||!["seller","admin"].includes(currentProfile.role))return;
 try{
  const r=await fetch(SB_URL+"/rest/v1/products?id=eq."+encodeURIComponent(id)+"&seller_id=eq."+encodeURIComponent(currentSession.user.id),{method:"PATCH",headers:{...authHeaders(),"Prefer":"return=minimal"},body:JSON.stringify({available:available})});
  if(!r.ok)throw new Error("تعذّر تحديث المنتج. تحققي من صلاحيات الحساب.");
  toast(available?"تم إظهار المنتج":"تم إخفاء المنتج");showMyProducts();
 }catch(e){toast(e.message||"تعذّر تحديث المنتج")}
}
async function deleteMyProduct(id){
 if(!currentSession||!currentProfile||!["seller","admin"].includes(currentProfile.role))return;
 if(!confirm("هل تريدين حذف هذا المنتج نهائيًا؟"))return;
 try{
  const r=await fetch(SB_URL+"/rest/v1/products?id=eq."+encodeURIComponent(id)+"&seller_id=eq."+encodeURIComponent(currentSession.user.id),{method:"DELETE",headers:authHeaders()});
  if(!r.ok)throw new Error("تعذّر حذف المنتج. تحققي من الصلاحيات.");
  toast("تم حذف المنتج");showMyProducts();
 }catch(e){toast(e.message||"تعذّر حذف المنتج")}
}
function showAddProduct(){
 if(!currentSession||!currentProfile||!["seller","admin"].includes(currentProfile.role)){toast("يجب الدخول بحساب صاحبة منتجات");return}
 const h='<p class="note">سيُحفظ المنتج في قاعدة البيانات ويظهر في المتجر بعد نجاح الحفظ. أضيفي فقط منتجات حقيقية متوفرة لديك.</p><div class="field"><label>اسم المنتج</label><input id="newProductName" placeholder="مثال: كسرة منزلية"></div><div class="field"><label>السعر بالدينار الجزائري</label><input id="newProductPrice" type="number" min="1" step="1" placeholder="مثال: 150"></div><div class="field"><label>صورة المنتج (اختياري، JPG/PNG/WebP حتى 5MB)</label><input id="newProductImage" type="file" accept="image/jpeg,image/png,image/webp"></div><div id="productMessage" class="note"></div><button class="primary" onclick="saveRealProduct()">حفظ ونشر المنتج</button>';
 openModal("إضافة منتج حقيقي",h);
}
async function saveRealProduct(){
 const name=document.getElementById("newProductName").value.trim(),price=Number(document.getElementById("newProductPrice").value),file=document.getElementById("newProductImage").files[0],box=document.getElementById("productMessage");
 if(!name||!Number.isFinite(price)||price<=0){box.textContent="اكتبي اسم المنتج وسعرًا صحيحًا أكبر من صفر.";return}
 if(file&&(file.size>5*1024*1024||!["image/jpeg","image/png","image/webp"].includes(file.type))){box.textContent="الصورة يجب أن تكون JPG أو PNG أو WebP وأقل من 5MB.";return}
 box.textContent="جارٍ حفظ المنتج…";
 try{
  let imagePath=null;
  if(file){
   const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"),path=currentSession.user.id+"/"+Date.now()+"-"+safeName;
   const up=await fetch(SB_URL+"/storage/v1/object/product-images/"+path,{method:"POST",headers:{"apikey":SB_KEY,"Authorization":"Bearer "+currentSession.access_token,"Content-Type":file.type,"x-upsert":"false"},body:file});
   if(!up.ok){const err=await up.json().catch(()=>({}));throw new Error(err.message||"فشل رفع الصورة")}
   imagePath=path;
  }
  const r=await fetch(SB_URL+"/rest/v1/products",{method:"POST",headers:{...authHeaders(),"Prefer":"return=representation"},body:JSON.stringify({seller_id:currentSession.user.id,name:name,image_path:imagePath,price_dzd:price,available:true})});
  const rows=await r.json().catch(()=>[]);if(!r.ok)throw new Error(rows.message||rows.details||"لم يتم حفظ المنتج. تأكدي من تفعيل الحساب وصلاحيات صاحبة المنتجات.");
  const p=rows[0];
  if(p){
   const image=p.image_path?SB_URL+"/storage/v1/object/public/product-images/"+p.image_path.split("/").map(encodeURIComponent).join("/"):"";
   productsData.unshift({id:String(p.id),name:p.name,category:"منتجات منزلية",price:Number(p.price_dzd),emoji:"🧺",image:image,desc:"منتوج منزلي جزائري",seller:currentProfile.full_name||"صاحبة منتجات"});
   renderProducts();
  }
  closeModal();toast("تم نشر المنتج بنجاح ✓");window.scrollTo({top:document.getElementById("products").offsetTop-30,behavior:"smooth"});
 }catch(e){box.textContent=e.message||"حدث خطأ أثناء الحفظ."}
}
function esc(v){return String(v||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
restoreSession();
