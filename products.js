// ==================== products.js ====================
const CART_KEY = 'gaza_cart';
const STORAGE_KEY = 'gaza_products';

// ========== دالة مساعدة للصور ==========
function getImageUrl(imageInput) {
    // إذا كان الرابط يبدأ بـ http أو https، نستخدمه كما هو
    if (imageInput && (imageInput.startsWith('http://') || imageInput.startsWith('https://'))) {
        return imageInput;
    }
    // وإلا نعتبره اسم ملف في مجلد images
    if (imageInput && imageInput.trim() !== '') {
        return 'images/' + imageInput;
    }
    // صورة افتراضية إذا لم تقدم صورة
    return 'https://placehold.co/400x600/eee/999?text=No+Image';
}

// ========== دوال المنتجات ==========
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (response.ok) {
            const products = await response.json();
            return products;
        }
    } catch (e) {
        console.log('products.json غير موجود، سيتم استخدام localStorage');
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try { return JSON.parse(stored); } catch (e) { return []; }
    }
    return [];
}

function saveProductsLocal(productsArray) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productsArray));
}

// ========== دوال العربة ==========
function getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(productId) {
    let cart = getCart();
    const existing = cart.find(item => item.productId === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ productId: productId, quantity: 1 });
    }
    saveCart(cart);
    updateCartCount();
    alert('✅ تمت إضافة المنتج إلى العربة');
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.productId !== productId);
    saveCart(cart);
    updateCartCount();
}

function updateCartQuantity(productId, newQuantity) {
    let cart = getCart();
    const item = cart.find(item => item.productId === productId);
    if (item) {
        item.quantity = newQuantity > 0 ? newQuantity : 1;
        saveCart(cart);
    }
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartCount();
}

async function getCartTotal() {
    const cart = getCart();
    const products = await loadProducts();
    return cart.reduce((total, item) => {
        const prod = products.find(p => p.id === item.productId);
        return total + (prod ? prod.price * item.quantity : 0);
    }, 0);
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElements = document.querySelectorAll('.cart-count');
    countElements.forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'inline-block' : 'none';
    });
}

// ========== عرض المنتجات ==========
async function renderProducts(containerSelector, filterCategory = null) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const products = await loadProducts();
    let productsToShow = filterCategory 
        ? products.filter(p => p.category === filterCategory)
        : products;

    productsToShow.sort((a, b) => b.id - a.id);
    container.innerHTML = '';

    if (productsToShow.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:40px; color:#b5836d;">لا توجد منتجات في هذه الفئة.</p>';
        return;
    }

    productsToShow.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const discountBadge = product.discount 
            ? `<span class="discount-badge">${product.discount}</span>` : '';
        const oldPriceHtml = product.oldPrice 
            ? `<span class="old-price">${product.oldPrice} شيكل</span>` : '';
        
        const stars = '★'.repeat(Math.floor(product.rating || 0)) + '☆'.repeat(5 - Math.floor(product.rating || 0));
        const waMessage = encodeURIComponent(`مرحباً، أريد الاستفسار عن: ${product.name}`);
        const waLink = `https://wa.me/${product.whatsapp}?text=${waMessage}`;
        const imageUrl = getImageUrl(product.image);

        card.innerHTML = `
            ${discountBadge}
            <a href="product.html?id=${product.id}" style="text-decoration:none; color:inherit;">
                <div class="product-img" style="background-image: url('${imageUrl}');"></div>
                <div class="product-title">${product.name}</div>
            </a>
            <div class="product-info">
                ${product.rating ? `<div class="rating">${stars} <span>(${product.reviews} تقييم)</span></div>` : ''}
                <div class="price-wrapper">
                    <span class="current-price">${product.price} شيكل</span>
                    ${oldPriceHtml}
                </div>
                <div class="product-actions">
                    <button class="btn-cart" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> أضف للعربة
                    </button>
                    <a href="${waLink}" target="_blank" class="btn-wa">
                        <i class="fab fa-whatsapp"></i> شراء سريع
                    </a>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', updateCartCount);