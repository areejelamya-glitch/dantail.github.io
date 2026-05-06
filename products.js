// ==================== products.js ====================
const CART_KEY = 'gaza_cart';
const STORAGE_KEY = 'gaza_products';
const FAVORITES_KEY = 'gaza_favorites';

function getImageUrl(imageInput) {
    if (imageInput && (imageInput.startsWith('http://') || imageInput.startsWith('https://'))) {
        return imageInput;
    }
    if (imageInput && imageInput.trim() !== '') {
        return 'images/' + imageInput;
    }
    return 'https://placehold.co/400x600/eee/999?text=No+Image';
}

async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (response.ok) return await response.json();
    } catch (e) {}
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
function getCart() { const cart = localStorage.getItem(CART_KEY); return cart ? JSON.parse(cart) : []; }
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function addToCart(productId) {
    let cart = getCart();
    const existing = cart.find(item => item.productId === productId);
    if (existing) { existing.quantity += 1; }
    else { cart.push({ productId: productId, quantity: 1 }); }
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
function clearCart() { localStorage.removeItem(CART_KEY); updateCartCount(); }
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
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'inline-block' : 'none';
    });
}

// ========== دوال المفضلة ==========
function getFavorites() { const favs = localStorage.getItem(FAVORITES_KEY); return favs ? JSON.parse(favs) : []; }
function saveFavorites(favs) { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs)); }
function isFavorite(productId) { return getFavorites().includes(productId); }
function toggleFavorite(productId) {
    let favs = getFavorites();
    if (favs.includes(productId)) { favs = favs.filter(id => id !== productId); }
    else { favs.push(productId); }
    saveFavorites(favs);
    updateFavoriteIcons();
    if (window.location.pathname.includes('favorites.html')) { renderFavorites(); }
}
function updateFavoriteIcons() {
    document.querySelectorAll('.fav-icon').forEach(icon => {
        const pid = Number(icon.dataset.productId);
        if (isFavorite(pid)) {
            icon.classList.remove('far'); icon.classList.add('fas'); icon.style.color = '#e87d9a';
        } else {
            icon.classList.remove('fas'); icon.classList.add('far'); icon.style.color = '#9c3b5a';
        }
    });
}

// ========== عرض المنتجات ==========
async function renderProducts(containerSelector, filterCategory = null, searchTerm = null) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    let productsToShow = await loadProducts();
    if (filterCategory) productsToShow = productsToShow.filter(p => p.category === filterCategory);
    if (searchTerm) {
        const term = searchTerm.trim().toLowerCase();
        productsToShow = productsToShow.filter(p => p.name.toLowerCase().includes(term) || (p.category && p.category.toLowerCase().includes(term)));
    }
    productsToShow.sort((a, b) => b.id - a.id);
    container.innerHTML = '';
    if (productsToShow.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:40px;">لا توجد منتجات.</p>';
        return;
    }
    productsToShow.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const discountBadge = product.discount ? `<span class="discount-badge">${product.discount}</span>` : '';
        const oldPriceHtml = product.oldPrice ? `<span class="old-price">${product.oldPrice} شيكل</span>` : '';
        const stars = '★'.repeat(Math.floor(product.rating || 0)) + '☆'.repeat(5 - Math.floor(product.rating || 0));
        const waLink = `https://wa.me/${product.whatsapp}?text=${encodeURIComponent('مرحباً، أريد الاستفسار عن: ' + product.name)}`;
        const imageUrl = getImageUrl(product.image);
        const heartIcon = isFavorite(product.id) ? 'fas' : 'far';
        const heartColor = isFavorite(product.id) ? '#e87d9a' : '#9c3b5a';
        card.innerHTML = `
            ${discountBadge}
            <i class="fav-icon ${heartIcon} fa-heart" data-product-id="${product.id}" onclick="event.preventDefault(); toggleFavorite(${product.id});" style="position:absolute; top:14px; left:14px; z-index:3; cursor:pointer; font-size:1.2rem; color:${heartColor}; background:rgba(255,255,255,0.8); padding:6px; border-radius:50%;"></i>
            <a href="product.html?id=${product.id}" style="text-decoration:none; color:inherit;">
                <div class="product-img lazyload" data-bg="${imageUrl}" style="background-color:#fdfbf9; background-size:cover; background-position:center; transition: opacity 0.4s ease; opacity:0;"></div>
                <div class="product-title">${product.name}</div>
            </a>
            <div class="product-info">
                ${product.rating ? `<div class="rating">${stars} <span>(${product.reviews} تقييم)</span></div>` : ''}
                <div class="price-wrapper">
                    <span class="current-price">${product.price} شيكل</span>
                    ${oldPriceHtml}
                </div>
                <div class="product-actions">
                    <button class="btn-cart" onclick="addToCart(${product.id})"><i class="fas fa-cart-plus"></i> أضف للعربة</button>
                    <a href="${waLink}" target="_blank" class="btn-wa"><i class="fab fa-whatsapp"></i> شراء سريع</a>
                </div>
            </div>`;
        container.appendChild(card);
    });
    observeLazyImages();
}

// ========== Lazy Loading ==========
const lazyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const imgDiv = entry.target;
            const bg = imgDiv.dataset.bg;
            if (bg && !imgDiv.classList.contains('loaded')) {
                const tempImg = new Image();
                tempImg.onload = () => { imgDiv.style.backgroundImage = `url('${bg}')`; imgDiv.style.opacity = '1'; imgDiv.classList.add('loaded'); };
                tempImg.onerror = () => { imgDiv.style.backgroundImage = "url('https://placehold.co/400x600/eee/999?text=No+Image')"; imgDiv.style.opacity = '1'; imgDiv.classList.add('loaded'); };
                tempImg.src = bg;
                lazyObserver.unobserve(imgDiv);
            }
        }
    });
}, { rootMargin: "300px" });
function observeLazyImages() { document.querySelectorAll('.lazyload:not(.loaded)').forEach(el => lazyObserver.observe(el)); }

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    observeLazyImages();
});
