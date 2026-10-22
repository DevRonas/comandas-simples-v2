import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// 1) Substitua os dois valores pelos dados do seu projeto Supabase.
// Use a chave publishable/anon do projeto, NUNCA a service_role/secret key.
const SUPABASE_URL = "https://vgjhrjkapqiwqyswwqbh.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_Z12oPHGVfS5xj2EVtha5xw_j-piHCpE";

const configured = SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("COLE_AQUI") &&
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_ANON_KEY.includes("COLE_AQUI");

const $ = (id) => document.getElementById(id);
const brl = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
let supabase;
let products = [];
let selectedQuantities = {};

function message(id, text, type = "") {
  const el = $(id);
  el.textContent = text;
  el.className = `message ${type}`;
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
function setSignedIn(isSignedIn) {
  $("authPanel").classList.toggle("hidden", isSignedIn);
  $("appPanel").classList.toggle("hidden", !isSignedIn);
  $("logoutBtn").classList.toggle("hidden", !isSignedIn);
}
function showTab(tab) {
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  $("ordersTab").classList.toggle("hidden", tab !== "orders");
  $("productsTab").classList.toggle("hidden", tab !== "products");
}
document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));
$("toggleOrderForm").addEventListener("click", () => {
  const form = $("newOrderForm");
  const collapsed = form.classList.toggle("collapsed");
  $("toggleOrderForm").textContent = collapsed ? "Expandir pedido ▼" : "Recolher pedido ▲";
  $("toggleOrderForm").setAttribute("aria-expanded", String(!collapsed));
});

if (!configured) {
  $("setupNotice").classList.remove("hidden");
  $("authPanel").classList.add("hidden");
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  init();
}

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  setSignedIn(!!session);
  if (session) await loadAll();
  supabase.auth.onAuthStateChange((_event, sessionNow) => {
    setSignedIn(!!sessionNow);
    if (sessionNow) setTimeout(() => loadAll(), 0);
  });
}

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  message("authMessage", "Entrando…");
  const { error } = await supabase.auth.signInWithPassword({
    email: $("email").value.trim(),
    password: $("password").value
  });
  if (error) message("authMessage", error.message, "error");
  else message("authMessage", "Login realizado.", "success");
});
$("logoutBtn").addEventListener("click", async () => { await supabase.auth.signOut(); });

async function loadAll() {
  await loadProducts();
  await loadOrders();
}
async function loadProducts() {
  const { data, error } = await supabase.from("products").select("*").order("name");
  if (error) { $("orderProductList").innerHTML = `<p class="message error">${escapeHtml(error.message)}</p>`; return; }
  products = data || [];
  renderPicker();
  renderTablePicker();
  renderProductAdmin();
}
function renderTablePicker() {
  const tableNames = Array.from({ length: 12 }, (_, i) => `Mesa ${i + 1}`);
  const current = $("customerLabel").value.trim();
  const selectedTable = tableNames.includes(current) ? current : "";
  const takeawaySelected = current === "Balcão / retirada";
  $("tablePicker").innerHTML = tableNames.map(name => `
    <button type="button" class="tableButton ${selectedTable === name ? "selected" : ""}" data-table-name="${name}">
      <span class="tableIcon">▦</span><span>${name}</span>
    </button>`).join("") + `
      <button type="button" class="tableButton takeaway ${takeawaySelected ? "selected" : ""}" data-table-name="Balcão / retirada">
        <span class="tableIcon">↗</span><span>Balcão / retirada</span>
      </button>`;
  document.querySelectorAll("[data-table-name]").forEach(btn => btn.addEventListener("click", () => {
    const name = btn.dataset.tableName;
    if (name === "Balcão / retirada") {
      $("customerLabel").value = "";
      $("customerLabel").placeholder = "Digite o nome ou número do pedido";
      renderTablePicker();
      $("customerLabel").focus();
    } else {
      $("customerLabel").value = name;
      $("customerLabel").placeholder = "Ex.: Mesa 3, João, retirada da Ana";
      renderTablePicker();
    }
  }));
}
$("customerLabel").addEventListener("input", renderTablePicker);

function renderPicker() {
  const available = products.filter(p => p.available);
  if (!available.length) {
    $("orderProductList").innerHTML = '<p class="muted">Nenhum produto disponível. Confira a aba Cardápio.</p>';
    updateTotal();
    return;
  }
  $("orderProductList").innerHTML = available.map(p => {
    const qty = Number(selectedQuantities[p.id] || 0);
    return `
      <div class="pickRow productPick ${qty > 0 ? "chosen" : ""}" data-product-card="${p.id}">
        <button type="button" class="productInfo" data-add-product="${p.id}" aria-label="Adicionar ${escapeHtml(p.name)}">
          <span class="pickName">${escapeHtml(p.name)}</span>
          <span class="pickMeta">${escapeHtml(p.category || "Sem categoria")} · ${brl(p.price)}</span>
          <span class="tapHint">Toque para adicionar</span>
        </button>
        <div class="quantityControl">
          <button type="button" class="qtyButton" data-minus="${p.id}" aria-label="Diminuir ${escapeHtml(p.name)}">−</button>
          <span class="qtyValue" id="qty-${p.id}">${qty}</span>
          <button type="button" class="qtyButton plus" data-plus="${p.id}" aria-label="Aumentar ${escapeHtml(p.name)}">+</button>
        </div>
      </div>`;
  }).join("");
  document.querySelectorAll("[data-add-product]").forEach(btn => btn.addEventListener("click", () => changeQuantity(btn.dataset.addProduct, 1)));
  document.querySelectorAll("[data-plus]").forEach(btn => btn.addEventListener("click", () => changeQuantity(btn.dataset.plus, 1)));
  document.querySelectorAll("[data-minus]").forEach(btn => btn.addEventListener("click", () => changeQuantity(btn.dataset.minus, -1)));
  updateTotal();
}
function changeQuantity(id, delta) {
  selectedQuantities[id] = Math.max(0, Math.min(99, Number(selectedQuantities[id] || 0) + delta));
  renderPicker();
}
function updateTotal() {
  const total = products.filter(p => p.available).reduce((sum, p) => sum + Number(p.price) * Number(selectedQuantities[p.id] || 0), 0);
  $("newOrderTotal").textContent = brl(total);
}
function renderProductAdmin() {
  $("manageProducts").innerHTML = products.length ? products.map(p => `
    <div class="adminProduct">
      <div><strong>${escapeHtml(p.name)}</strong><p>${escapeHtml(p.category || "Sem categoria")} · ${brl(p.price)}</p></div>
      <label class="toggle"><input type="checkbox" data-availability-id="${p.id}" ${p.available ? "checked" : ""}> ${p.available ? "Disponível" : "Esgotado"}</label>
    </div>`).join("") : '<p class="muted">Ainda não há produtos cadastrados.</p>';
  document.querySelectorAll("[data-availability-id]").forEach(input => input.addEventListener("change", async () => {
    const id = input.dataset.availabilityId;
    const { error } = await supabase.from("products").update({ available: input.checked }).eq("id", id);
    if (error) { alert("Não foi possível atualizar: " + error.message); input.checked = !input.checked; }
    else await loadProducts();
  }));
}
$("productForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  message("productMessage", "Salvando…");
  const name = $("productName").value.trim();
  const price = Number($("productPrice").value);
  const category = $("productCategory").value.trim() || null;
  if (!name || !Number.isFinite(price) || price <= 0) {
    message("productMessage", "Informe um nome e um preço maior que zero.", "error"); return;
  }
  const { error } = await supabase.from("products").insert({ name, price, category, available: true });
  if (error) message("productMessage", error.message, "error");
  else {
    $("productForm").reset();
    message("productMessage", "Produto cadastrado!", "success");
    await loadProducts();
  }
});
$("newOrderForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const customerLabel = $("customerLabel").value.trim();
  const notes = $("orderNotes").value.trim() || null;
  const chosen = products.filter(p => p.available && Number(selectedQuantities[p.id] || 0) > 0);
  if (!customerLabel) { message("orderMessage", "Informe um nome ou número para o pedido.", "error"); return; }
  if (!chosen.length) { message("orderMessage", "Adicione pelo menos um produto ao pedido.", "error"); return; }
  message("orderMessage", "Salvando pedido…");
  // O preço unitário é copiado para o item, preservando o valor histórico caso o cardápio mude.
  const total = chosen.reduce((sum, p) => sum + Number(p.price) * Number(selectedQuantities[p.id]), 0);
  const { data: order, error: orderError } = await supabase.from("orders")
    .insert({ customer_label: customerLabel, notes, status: "open", total })
    .select().single();
  if (orderError) { message("orderMessage", orderError.message, "error"); return; }
  const items = chosen.map(p => ({
    order_id: order.id, product_id: p.id, product_name: p.name,
    quantity: Number(selectedQuantities[p.id]), unit_price: Number(p.price)
  }));
  const { error: itemsError } = await supabase.from("order_items").insert(items);
  if (itemsError) {
    // Mantém o pedido visível para correção, mas informa claramente que os itens não foram gravados.
    message("orderMessage", "O pedido foi criado, mas houve erro ao salvar os itens: " + itemsError.message, "error");
    return;
  }
  selectedQuantities = {};
  $("newOrderForm").reset();
  renderPicker();
  renderTablePicker();
  message("orderMessage", "Pedido salvo com sucesso!", "success");
  await loadOrders();
});
$("refreshBtn").addEventListener("click", loadOrders);

async function loadOrders() {
  const { data: orders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(30);
  if (error) {
    $("openOrders").innerHTML = `<p class="message error">${escapeHtml(error.message)}</p>`;
    return;
  }
  const open = (orders || []).filter(o => o.status === "open");
  const closed = (orders || []).filter(o => o.status === "closed").slice(0, 8);
  await renderOrderList("openOrders", open, true);
  await renderOrderList("closedOrders", closed, false);
}
async function renderOrderList(containerId, orders, canClose) {
  if (!orders.length) { $(containerId).innerHTML = '<p class="muted">Nenhum pedido aqui por enquanto.</p>'; return; }
  const ids = orders.map(o => o.id);
  const { data: allItems, error } = await supabase.from("order_items").select("*").in("order_id", ids);
  if (error) { $(containerId).innerHTML = `<p class="message error">${escapeHtml(error.message)}</p>`; return; }
  const byOrder = {};
  (allItems || []).forEach(item => (byOrder[item.order_id] ||= []).push(item));
  $(containerId).innerHTML = orders.map(o => {
    const items = byOrder[o.id] || [];
    const date = new Date(o.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    return `<article class="orderCard">
      <div class="cardTop"><div><h3>${escapeHtml(o.customer_label)}</h3><p class="pickMeta">${date}</p></div><span class="pill">${canClose ? "Em aberto" : "Fechado"}</span></div>
      <ul class="orderItems">${items.map(i => `<li>${Number(i.quantity)} × ${escapeHtml(i.product_name)} — ${brl(Number(i.unit_price) * Number(i.quantity))}</li>`).join("")}</ul>
      ${o.notes ? `<p class="pickMeta">Observação: ${escapeHtml(o.notes)}</p>` : ""}
      <div class="totalLine"><span>Total</span><strong>${brl(o.total)}</strong></div>
      ${canClose ? `<div class="cardActions"><button class="button secondary" data-reopen="${o.id}">Recarregar lista</button><button class="button primary" data-close="${o.id}">Fechar pedido</button></div>` : ""}
    </article>`;
  }).join("");
  document.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", async () => {
    if (!confirm("Fechar este pedido? Ele continuará no histórico.")) return;
    btn.disabled = true;
    const { error } = await supabase.from("orders").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", btn.dataset.close);
    if (error) { alert("Erro ao fechar pedido: " + error.message); btn.disabled = false; }
    else await loadOrders();
  }));
  document.querySelectorAll("[data-reopen]").forEach(btn => btn.addEventListener("click", loadOrders));
}
