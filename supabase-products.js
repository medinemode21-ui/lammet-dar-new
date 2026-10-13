/* Supabase product-list integration for Lammet Dar */
(async function () {
  const url = "https://qtqkmgfezfrmvnpnoefj.supabase.co";
  const key = "sb_publishable_eVLZYm7jGM2ML1gN60rWvQ_DZ6r6nCI";
  const status = document.getElementById("connectionStatus");
  if (!window.lammetDemoProducts || !window.lammetRenderProducts) return;
  try {
    if (status) status.textContent = "جاري تحميل المنتجات…";
    const response = await fetch(
      url + "/rest/v1/products?select=id,name,image_path,price_dzd,available&available=eq.true&order=created_at.desc",
      { headers: { apikey: key, Authorization: "Bearer " + key } }
    );
    if (!response.ok) throw new Error("Supabase request failed");
    const rows = await response.json();
    if (rows.length) {
      window.lammetDemoProducts = rows.map(function (p) {
        let image = p.image_path || "";
        if (image && !/^https?:\/\//i.test(image)) {
          image = url + "/storage/v1/object/public/product-images/" +
            image.split("/").map(encodeURIComponent).join("/");
        }
        return {
          id: String(p.id), name: p.name, category: "منتجات منزلية",
          price: Number(p.price_dzd), emoji: "🧺", image: image,
          desc: "منتوج منزلي جزائري", seller: "منتوج منزلي"
        };
      });
      window.lammetUseLiveProducts = true;
      window.lammetSetProducts(window.lammetDemoProducts);
      if (status) status.textContent = "منتجات من المتجر";
    } else {
      if (status) status.textContent = "عرض تجريبي";
    }
    window.lammetRenderProducts();
  } catch (error) {
    if (status) status.textContent = "عرض تجريبي";
    console.warn("Lammet Dar: using demo products", error);
  }
})();