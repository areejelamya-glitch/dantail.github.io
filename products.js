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

// ========== العربة ==========
function getCart() { /* ... بدون تغيير ... */ }
function saveCart(cart) { /* ... بدون تغيير ... */ }
function addToCart(productId) { /* ... بدون تغيير ... */ }
function removeFromCart(productId) { /* ... بدون تغيير ... */ }
function clearCart() { /* ... بدون تغيير ... */ }
async function getCartTotal() { /* ... بدون تغيير ... */ }
function updateCartCount() { /* ... بدون تغيير ... */ }

// ========== المفضلة ==========
function getFavorites() { /* ... بدون تغيير ... */ }
function saveFavorites(favs) { /* ... بدون تغيير ... */ }
function isFavorite(productId) { /* ... بدون تغيير ... */ }
function toggleFavorite(productId) { /* ... بدون تغيير ... */ }
function updateFavoriteIcons() { /* ... بدون تغيير ... */ }

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
        const waMessage = encodeURIComponent(`مرحباً، أريد الاستفسار عن: ${product.name}`);
        const waLink = `https://wa.me/${product.whatsapp}?text=${waMessage}`;
        const imageUrl = getImageUrl(product.image);
        const heartIcon = isFavorite(product.id) ? 'fas' : 'far';
        const heartColor = isFavorite(product.id) ? '#e87d9a' : '#9c3b5a';
        card.innerHTML = `
            ${discountBadge}
            <i class="fav-icon ${heartIcon} fa-heart" data-product-id="${product.id}" onclick="event.preventDefault(); toggleFavorite(${product.id});" style="position:absolute; top:14px; left:14px; z-index:3; cursor:pointer; font-size:1.2rem; color:${heartColor}; background:rgba(255,255,255,0.8); padding:6px; border-radius:50%;"></i>
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
                    <button class="btn-cart" onclick="addToCart(${product.id})"><i class="fas fa-cart-plus"></i> أضف للعربة</button>
                    <a href="${waLink}" target="_blank" class="btn-wa"><i class="fab fa-whatsapp"></i> شراء سريع</a>
                </div>
            </div>`;
        container.appendChild(card);
    });
    observeLazyImages();
}

document.addEventListener('DOMContentLoaded', updateCartCount);