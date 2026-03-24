// ===== GREEN BASKET — MAIN APP =====
const API = 'http://localhost:5000/api';

// ===== STATE =====
let state = {
  user: null,
  token: null,
  cart: [],
  products: [],
  currentPage: 'home'
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('gb_user');
  const token = localStorage.getItem('gb_token');
  if (saved && token) {
    state.user = JSON.parse(saved);
    state.token = token;
  }
  const savedCart = localStorage.getItem('gb_cart');
  if (savedCart) state.cart = JSON.parse(savedCart);

  renderNav();
  updateCartCount();

  // Route on load
  const hash = window.location.hash.replace('#', '') || 'home';
  navigate(hash);
  window.addEventListener('hashchange', () => navigate(window.location.hash.replace('#', '') || 'home'));
});

// ===== NAVIGATION =====
function navigate(page) {
  state.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(`page-${page}`);
  if (el) { el.classList.add('active'); window.scrollTo(0, 0); }
  else navigate('home');

  // Load page data
  if (page === 'products') loadProducts();
  else if (page === 'dashboard') loadDashboard();
  else if (page === 'orders') loadMyOrders();
  else if (page === 'checkout') renderCheckout();
}

function go(page) {
  window.location.hash = page;
}

// ===== NAVBAR =====
function renderNav() {
  const links = document.getElementById('nav-links');
  if (!links) return;
  const { user } = state;

  if (!user) {
    links.innerHTML = `
      <a href="#products" onclick="go('products')">🛒 Shop</a>
      <a href="#login" onclick="go('login')" class="hide-mobile">Login</a>
      <a href="#register" onclick="go('register')" class="btn-nav-cta">Get Started</a>
    `;
  } else {
    links.innerHTML = `
      <a href="#products" onclick="go('products')">🛒 Shop</a>
      ${user.role === 'customer' ? `<button class="cart-btn" onclick="toggleCart()">🛍 Cart <span class="cart-count" id="cart-count">0</span></button>` : ''}
      <a href="#dashboard" onclick="go('dashboard')">Dashboard</a>
      <span class="user-badge">${user.role}</span>
      <span class="hide-mobile" style="color:rgba(255,255,255,0.7);font-size:0.85rem;">Hi, ${user.name.split(' ')[0]}</span>
      <button onclick="logout()" class="hide-mobile">Logout</button>
    `;
    updateCartCount();
  }
}

function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (el) { const total = state.cart.reduce((s, i) => s + i.quantity, 0); el.textContent = total; el.style.display = total > 0 ? 'flex' : 'none'; }
}

// ===== AUTH =====
async function register() {
  const name = document.getElementById('reg-name')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const role = document.querySelector('.role-option.selected')?.dataset.role || 'customer';
  const phone = document.getElementById('reg-phone')?.value.trim();

  if (!name || !email || !password) return showError('reg-error', 'Please fill all required fields');

  try {
    const res = await apiPost('/auth/register', { name, email, password, role, phone });
    loginSuccess(res);
  } catch (e) { showError('reg-error', e.message); }
}

async function login() {
  const email = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  if (!email || !password) return showError('login-error', 'Please fill all fields');

  try {
    const res = await apiPost('/auth/login', { email, password });
    loginSuccess(res);
  } catch (e) { showError('login-error', e.message); }
}

function loginSuccess({ token, user }) {
  state.token = token;
  state.user = user;
  localStorage.setItem('gb_token', token);
  localStorage.setItem('gb_user', JSON.stringify(user));
  renderNav();
  toast('Welcome back, ' + user.name.split(' ')[0] + '! 👋', 'success');
  go('dashboard');
}

function logout() {
  state.user = null; state.token = null; state.cart = [];
  localStorage.removeItem('gb_token'); localStorage.removeItem('gb_user'); localStorage.removeItem('gb_cart');
  renderNav();
  toast('Logged out successfully');
  go('home');
}

function selectRole(el, role) {
  document.querySelectorAll('.role-option').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
}

// ===== PRODUCTS =====
async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const category = document.getElementById('cat-filter')?.value || '';
  const search = document.getElementById('product-search')?.value || '';
  let url = '/products?';
  if (category && category !== 'all') url += `category=${category}&`;
  if (search) url += `search=${search}`;

  try {
    state.products = await apiGet(url);
    renderProducts(state.products);
  } catch (e) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load products</h3></div>';
  }
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  if (!products.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🌱</div><h3>No products found</h3><p>Try a different search or category</p></div>';
    return;
  }
  const emojiMap = { vegetables: '🥦', fruits: '🍎', grains: '🌾', dairy: '🥛', herbs: '🌿', other: '🌻' };
  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-img-wrap">
        ${p.image ? `<img src="${API.replace('/api','')}${p.image}" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="product-emoji" style="display:none">${emojiMap[p.category] || '🌿'}</div>` : `<div class="product-emoji">${emojiMap[p.category] || '🌿'}</div>`}
        <span class="product-category-badge">${p.category}</span>
      </div>
      <div class="product-body">
        <div class="product-farmer">👨‍🌾 ${p.farmerName || 'Local Farmer'}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.description || 'Fresh from the farm'}</div>
        <div class="product-footer">
          <div>
            <div class="product-price">₹${p.price}<span>/${p.unit}</span></div>
            <div class="product-qty">Stock: ${p.quantity} ${p.unit}</div>
          </div>
          ${state.user?.role === 'customer' || !state.user
            ? `<button class="btn-add-cart" onclick="addToCart('${p._id}','${p.name}',${p.price},'${p.unit}')">+ Add</button>`
            : ''}
        </div>
      </div>
    </div>`).join('');
}

// ===== CART =====
function addToCart(id, name, price, unit) {
  if (!state.user) { toast('Please login to add items to cart', 'warning'); go('login'); return; }
  if (state.user.role !== 'customer') { toast('Only customers can order', 'warning'); return; }
  const existing = state.cart.find(i => i.productId === id);
  if (existing) existing.quantity++;
  else state.cart.push({ productId: id, name, price, unit, quantity: 1 });
  localStorage.setItem('gb_cart', JSON.stringify(state.cart));
  updateCartCount();
  toast(`${name} added to cart 🛒`, 'success');
}

function toggleCart() {
  const overlay = document.getElementById('cart-overlay');
  const panel = document.getElementById('cart-panel');
  overlay?.classList.toggle('open');
  panel?.classList.toggle('open');
  if (panel?.classList.contains('open')) renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById('cart-items-list');
  const totalEl = document.getElementById('cart-total-price');
  if (!container) return;

  if (!state.cart.length) {
    container.innerHTML = '<div class="cart-empty"><div class="empty-icon">🛒</div><p>Your cart is empty</p></div>';
    if (totalEl) totalEl.textContent = '₹0';
    return;
  }

  container.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price} / ${item.unit}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty('${item.productId}', -1)">−</button>
          <span class="qty-num">${item.quantity}</span>
          <button class="qty-btn" onclick="changeQty('${item.productId}', 1)">+</button>
          <button class="btn-remove-item" onclick="removeFromCart('${item.productId}')">✕ Remove</button>
        </div>
      </div>
    </div>`).join('');

  const total = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  if (totalEl) totalEl.textContent = `₹${total}`;
}

function changeQty(id, delta) {
  const item = state.cart.find(i => i.productId === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) removeFromCart(id);
  else { localStorage.setItem('gb_cart', JSON.stringify(state.cart)); renderCartItems(); updateCartCount(); }
}

function removeFromCart(id) {
  state.cart = state.cart.filter(i => i.productId !== id);
  localStorage.setItem('gb_cart', JSON.stringify(state.cart));
  renderCartItems(); updateCartCount();
}

function goCheckout() {
  if (!state.cart.length) { toast('Add items to cart first', 'warning'); return; }
  toggleCart();
  go('checkout');
}

// ===== CHECKOUT =====
function renderCheckout() {
  const container = document.getElementById('checkout-summary');
  const totalEl = document.getElementById('checkout-total');
  if (!container) return;

  if (!state.cart.length) { toast('Your cart is empty', 'warning'); go('products'); return; }

  container.innerHTML = state.cart.map(item => `
    <div class="order-summary-item">
      <span>${item.name} × ${item.quantity}</span>
      <span>₹${item.price * item.quantity}</span>
    </div>`).join('');

  const total = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  if (totalEl) totalEl.textContent = `₹${total}`;

  // Pre-fill user data
  const phoneEl = document.getElementById('checkout-phone');
  if (phoneEl && state.user?.phone) phoneEl.value = state.user.phone;
}

async function placeOrder() {
  const address = document.getElementById('checkout-address')?.value.trim();
  const phone = document.getElementById('checkout-phone')?.value.trim();
  const notes = document.getElementById('checkout-notes')?.value.trim();
  if (!address || !phone) return toast('Please enter address and phone', 'warning');

  try {
    const res = await apiPost('/orders', {
      products: state.cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
      address, phone, notes
    });
    state.cart = [];
    localStorage.removeItem('gb_cart');
    updateCartCount();
    toast('🎉 Order placed! Delivery boy assigned', 'success');
    go('orders');
  } catch (e) { toast(e.message, 'error'); }
}

// ===== MY ORDERS (CUSTOMER) =====
async function loadMyOrders() {
  const container = document.getElementById('my-orders-list');
  if (!container) return;
  if (!state.user) { go('login'); return; }

  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const orders = await apiGet('/orders/my');
    if (!orders.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><h3>No orders yet</h3><p>Start shopping to see your orders here</p></div>';
      return;
    }
    container.innerHTML = orders.map(o => renderOrderCard(o, 'customer')).join('');
  } catch (e) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Could not load orders</h3></div>'; }
}

// ===== DASHBOARD =====
async function loadDashboard() {
  if (!state.user) { go('login'); return; }
  const { role } = state.user;
  const container = document.getElementById('dashboard-content');
  if (!container) return;

  if (role === 'admin') await loadAdminDashboard(container);
  else if (role === 'farmer') await loadFarmerDashboard(container);
  else if (role === 'customer') await loadCustomerDashboard(container);
  else if (role === 'delivery') await loadDeliveryDashboard(container);
}

// ===== ADMIN DASHBOARD =====
async function loadAdminDashboard(container) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const [stats, users, orders] = await Promise.all([
      apiGet('/admin/stats'),
      apiGet('/admin/users'),
      apiGet('/admin/orders')
    ]);

    container.innerHTML = `
      <div class="dashboard-header">
        <h2>Admin Dashboard 🔐</h2>
        <p>Complete platform overview</p>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-info"><div class="stat-val">${stats.users}</div><div class="stat-lbl">Total Users</div></div></div>
        <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-info"><div class="stat-val">${stats.orders}</div><div class="stat-lbl">Total Orders</div></div></div>
        <div class="stat-card"><div class="stat-icon">🌿</div><div class="stat-info"><div class="stat-val">${stats.products}</div><div class="stat-lbl">Products</div></div></div>
        <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-info"><div class="stat-val">₹${stats.revenue}</div><div class="stat-lbl">Revenue</div></div></div>
      </div>

      <div class="dashboard-section">
        <div class="dashboard-section-header"><h3>All Users</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>${users.map(u => `
              <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td><span class="badge badge-${u.role}">${u.role}</span></td>
                <td>${u.phone || '—'}</td>
                <td><span class="badge ${u.isActive ? 'badge-delivered' : 'badge-cancelled'}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td><button class="btn-sm btn-amber" onclick="toggleUser('${u._id}')">Toggle</button>
                    <button class="btn-sm btn-red" onclick="deleteUser('${u._id}')">Delete</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="dashboard-section">
        <div class="dashboard-section-header"><h3>All Orders</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th><th>Delivery Boy</th></tr></thead>
            <tbody>${orders.map(o => `
              <tr>
                <td style="font-size:0.75rem;color:var(--text-light)">#${o._id.slice(-6).toUpperCase()}</td>
                <td><strong>${o.customerName}</strong><br><span style="font-size:0.75rem;color:var(--text-light)">${o.phone}</span></td>
                <td><strong>₹${o.totalPrice}</strong></td>
                <td><span class="badge badge-${o.orderStatus.toLowerCase().replace(' ','-')}">${o.orderStatus}</span></td>
                <td><span class="badge badge-${o.paymentStatus.toLowerCase()}">${o.paymentStatus}</span></td>
                <td>${o.deliveryBoyName || '<span style="color:var(--text-light)">Unassigned</span>'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  } catch (e) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load admin data</h3></div>'; }
}

// ===== FARMER DASHBOARD =====
async function loadFarmerDashboard(container) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const [products, orders] = await Promise.all([apiGet('/products/my'), apiGet('/orders/farmer')]);

    container.innerHTML = `
      <div class="dashboard-header">
        <h2>Farmer Dashboard 👨‍🌾</h2>
        <p>Manage your products and track orders</p>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon">🌿</div><div class="stat-info"><div class="stat-val">${products.length}</div><div class="stat-lbl">Products Listed</div></div></div>
        <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-info"><div class="stat-val">${orders.length}</div><div class="stat-lbl">Total Orders</div></div></div>
        <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-info"><div class="stat-val">₹${orders.filter(o=>o.orderStatus==='Delivered').reduce((s,o)=>s+o.totalPrice,0)}</div><div class="stat-lbl">Revenue</div></div></div>
      </div>

      <div class="product-form" id="product-form-container">
        <h3>➕ Add New Product</h3>
        <div class="form-grid">
          <div class="form-group"><label>Product Name *</label><input type="text" id="p-name" placeholder="e.g. Fresh Tomatoes"></div>
          <div class="form-group"><label>Category</label>
            <select id="p-cat">
              <option value="vegetables">🥦 Vegetables</option>
              <option value="fruits">🍎 Fruits</option>
              <option value="grains">🌾 Grains</option>
              <option value="dairy">🥛 Dairy</option>
              <option value="herbs">🌿 Herbs</option>
              <option value="other">🌻 Other</option>
            </select>
          </div>
          <div class="form-group"><label>Price (₹) *</label><input type="number" id="p-price" placeholder="0.00" min="0"></div>
          <div class="form-group"><label>Quantity *</label><input type="number" id="p-qty" placeholder="0" min="0"></div>
          <div class="form-group"><label>Unit</label>
            <select id="p-unit"><option value="kg">kg</option><option value="g">g</option><option value="litre">litre</option><option value="dozen">dozen</option><option value="bunch">bunch</option><option value="piece">piece</option></select>
          </div>
          <div class="form-group"><label>Product Image</label><input type="file" id="p-image" accept="image/*"></div>
          <div class="form-group full-width"><label>Description</label><textarea id="p-desc" rows="3" placeholder="Describe your product..."></textarea></div>
        </div>
        <button class="btn-primary" onclick="addProduct()" style="max-width:200px;margin-top:0.5rem">Add Product</button>
      </div>

      <div class="dashboard-section">
        <div class="dashboard-section-header"><h3>My Products (${products.length})</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Qty</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="farmer-products-table">
              ${products.map(p => `
              <tr id="prod-row-${p._id}">
                <td><strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td>₹${p.price}/${p.unit}</td>
                <td>${p.quantity}</td>
                <td><span class="badge ${p.isAvailable && p.quantity > 0 ? 'badge-delivered' : 'badge-cancelled'}">${p.isAvailable && p.quantity > 0 ? 'Available' : 'Unavailable'}</span></td>
                <td><button class="btn-sm btn-red" onclick="deleteProduct('${p._id}')">🗑 Delete</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="dashboard-section">
        <div class="dashboard-section-header"><h3>Orders Received (${orders.length})</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>${orders.map(o => `
              <tr>
                <td style="font-size:0.75rem;color:var(--text-light)">#${o._id.slice(-6).toUpperCase()}</td>
                <td>${o.customerName}</td>
                <td>${o.products.map(p=>p.name).join(', ')}</td>
                <td>₹${o.totalPrice}</td>
                <td><span class="badge badge-${o.orderStatus.toLowerCase().replace(' ','-')}">${o.orderStatus}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  } catch (e) { container.innerHTML = '<p>Error loading dashboard</p>'; }
}

// ===== CUSTOMER DASHBOARD =====
async function loadCustomerDashboard(container) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const orders = await apiGet('/orders/my');
    const delivered = orders.filter(o => o.orderStatus === 'Delivered').length;
    const pending = orders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').length;

    container.innerHTML = `
      <div class="dashboard-header">
        <h2>My Account 🛒</h2>
        <p>Welcome back, ${state.user.name}!</p>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-info"><div class="stat-val">${orders.length}</div><div class="stat-lbl">Total Orders</div></div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-info"><div class="stat-val">${delivered}</div><div class="stat-lbl">Delivered</div></div></div>
        <div class="stat-card"><div class="stat-icon">🔄</div><div class="stat-info"><div class="stat-val">${pending}</div><div class="stat-lbl">Pending</div></div></div>
      </div>
      <div style="display:flex;gap:1rem;margin-bottom:2rem;flex-wrap:wrap">
        <button class="btn-primary" onclick="go('products')" style="max-width:200px">🛒 Continue Shopping</button>
        <button class="btn-primary" onclick="go('orders')" style="max-width:200px;background:var(--green-deep)">📦 View All Orders</button>
      </div>
      <div class="dashboard-section">
        <div class="dashboard-section-header"><h3>Recent Orders</h3></div>
        ${orders.slice(0, 5).map(o => renderOrderCard(o, 'customer')).join('') || '<div class="empty-state"><div class="empty-icon">📦</div><h3>No orders yet</h3></div>'}
      </div>`;
  } catch (e) { container.innerHTML = '<p>Error loading dashboard</p>'; }
}

// ===== DELIVERY DASHBOARD =====
async function loadDeliveryDashboard(container) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const orders = await apiGet('/delivery/orders');
    const pending = orders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').length;
    const delivered = orders.filter(o => o.orderStatus === 'Delivered').length;

    container.innerHTML = `
      <div class="dashboard-header">
        <h2>Delivery Dashboard 🚚</h2>
        <p>Manage your deliveries</p>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-info"><div class="stat-val">${orders.length}</div><div class="stat-lbl">Total Assigned</div></div></div>
        <div class="stat-card"><div class="stat-icon">🔄</div><div class="stat-info"><div class="stat-val">${pending}</div><div class="stat-lbl">Pending</div></div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-info"><div class="stat-val">${delivered}</div><div class="stat-lbl">Delivered</div></div></div>
      </div>
      <div id="delivery-orders">
        ${orders.length === 0 ? '<div class="empty-state"><div class="empty-icon">🚚</div><h3>No orders assigned yet</h3></div>' : ''}
        ${orders.map(o => `
          <div class="order-card">
            <div class="order-card-header">
              <div>
                <div style="font-weight:700">Order #${o._id.slice(-6).toUpperCase()}</div>
                <div class="order-id">${new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
              <span class="badge badge-${o.orderStatus.toLowerCase().replace(/\s/g,'-')}">${o.orderStatus}</span>
            </div>
            <div style="background:var(--cream);border-radius:10px;padding:1rem;margin-bottom:1rem">
              <div style="font-weight:600;margin-bottom:0.5rem">👤 Customer Details</div>
              <div>📱 ${o.phone}</div>
              <div class="order-address">📍 ${o.address}</div>
            </div>
            <div class="order-items">
              ${o.products.map(p => `<div class="order-item-row"><span>${p.name} × ${p.quantity}</span><span>₹${p.price * p.quantity}</span></div>`).join('')}
            </div>
            <div class="order-footer">
              <div class="order-total">₹${o.totalPrice} <span style="font-size:0.75rem;color:var(--text-light);font-family:'DM Sans',sans-serif"> COD</span></div>
              <span class="badge badge-${o.paymentStatus.toLowerCase()}">${o.paymentStatus}</span>
            </div>
            ${o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled' ? `
            <div class="delivery-actions">
              <button class="btn-sm btn-green" onclick="updateDelivery('${o._id}','Out for Delivery')">🚚 Out for Delivery</button>
              <button class="btn-sm btn-primary" onclick="updateDelivery('${o._id}','Delivered')" style="background:var(--green-mid);color:white;padding:6px 14px;border-radius:8px;border:none;font-size:0.8rem;font-weight:600;cursor:pointer">✅ Mark Delivered</button>
            </div>` : ''}
          </div>`).join('')}
      </div>`;
  } catch (e) { container.innerHTML = '<p>Error loading dashboard</p>'; }
}

async function updateDelivery(orderId, status) {
  try {
    await fetch(`${API}/delivery/orders/${orderId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
      body: JSON.stringify({ orderStatus: status })
    });
    toast(status === 'Delivered' ? '✅ Marked as Delivered! Payment completed' : '🚚 Status updated', 'success');
    await loadDeliveryDashboard(document.getElementById('dashboard-content'));
  } catch (e) { toast('Failed to update', 'error'); }
}

// ===== FARMER PRODUCT ACTIONS =====
async function addProduct() {
  const name = document.getElementById('p-name')?.value.trim();
  const price = document.getElementById('p-price')?.value;
  const qty = document.getElementById('p-qty')?.value;
  const category = document.getElementById('p-cat')?.value;
  const unit = document.getElementById('p-unit')?.value;
  const desc = document.getElementById('p-desc')?.value;
  const imageFile = document.getElementById('p-image')?.files[0];

  if (!name || !price || !qty) return toast('Name, price, quantity required', 'warning');

  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('quantity', qty);
  formData.append('category', category);
  formData.append('unit', unit);
  formData.append('description', desc);
  if (imageFile) formData.append('image', imageFile);

  try {
    const res = await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${state.token}` },
      body: formData
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
    toast('Product added successfully! 🌿', 'success');
    loadDashboard();
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  try {
    await apiDelete(`/products/${id}`);
    toast('Product deleted', 'success');
    loadDashboard();
  } catch (e) { toast(e.message, 'error'); }
}

async function toggleUser(id) {
  try { await apiPut(`/admin/users/${id}/toggle`, {}); toast('User status updated', 'success'); loadDashboard(); }
  catch (e) { toast(e.message, 'error'); }
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  try { await apiDelete(`/admin/users/${id}`); toast('User deleted', 'success'); loadDashboard(); }
  catch (e) { toast(e.message, 'error'); }
}

// ===== ORDER CARD =====
function renderOrderCard(o, role) {
  return `
    <div class="order-card">
      <div class="order-card-header">
        <div>
          <div style="font-weight:700">Order #${o._id.slice(-6).toUpperCase()}</div>
          <div class="order-date">${new Date(o.createdAt).toLocaleString('en-IN')}</div>
        </div>
        <span class="badge badge-${o.orderStatus.toLowerCase().replace(/\s/g,'-')}">${o.orderStatus}</span>
      </div>
      <div class="order-items">
        ${o.products.map(p => `<div class="order-item-row"><span>${p.name} × ${p.quantity}</span><span>₹${p.price * p.quantity}</span></div>`).join('')}
      </div>
      <div class="order-address">📍 ${o.address}</div>
      <div class="order-footer">
        <div class="order-total">₹${o.totalPrice}</div>
        <div style="display:flex;gap:0.5rem;align-items:center">
          <span class="badge badge-cod">COD</span>
          <span class="badge badge-${o.paymentStatus.toLowerCase()}">${o.paymentStatus}</span>
        </div>
      </div>
      ${o.deliveryBoyName ? `<div style="font-size:0.8rem;color:var(--text-light);margin-top:0.5rem">🚚 Delivery: ${o.deliveryBoyName}</div>` : ''}
    </div>`;
}

// ===== FILTER / SEARCH =====
function filterCategory(cat) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  const catEl = document.getElementById('cat-filter');
  if (catEl) catEl.value = cat;
  loadProducts();
}

let searchTimeout;
function searchProducts() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadProducts, 400);
}

// ===== API HELPERS =====
async function apiGet(path) {
  const res = await fetch(`${API}${path}`, { headers: state.token ? { 'Authorization': `Bearer ${state.token}` } : {} });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Request failed'); }
  return res.json();
}

async function apiPost(path, data) {
  const res = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(state.token ? { 'Authorization': `Bearer ${state.token}` } : {}) }, body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
}

async function apiPut(path, data) {
  const res = await fetch(`${API}${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` }, body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
}

async function apiDelete(path) {
  const res = await fetch(`${API}${path}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${state.token}` } });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Request failed'); }
  return res.json();
}

// ===== UTILS =====
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 4000); }
}

function toast(message, type = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
}
