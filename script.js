/* ==========================================
   CONFIGURACIÓN & ESTADO GLOBAL
   ========================================== */
const whatsappNumber = "542646166402";
let cart = JSON.parse(localStorage.getItem('circuito_cart')) || [];

/* ==========================================
   INICIALIZACIÓN AL CARGAR EL DOM
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    setupScrollEffects();
    setupNavbarScroll();
    setupToastContainer();
    setupSearchFilter();
});

/* ==========================================
   PERSISTENCIA EN LOCALSTORAGE
   ========================================== */
function saveCart() {
    localStorage.setItem('circuito_cart', JSON.stringify(cart));
}

/* ==========================================
   GESTIÓN DEL CARRITO
   ========================================== */
function addToCart(title, price, img) {
    const existingItem = cart.find(item => item.title === title);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ title, price, img, quantity: 1 });
    }
    
    saveCart();
    updateCartUI();
    showToast(`"<strong>${title}</strong>" fue añadido al carrito`);
}

function removeFromCart(title) {
    cart = cart.filter(item => item.title !== title);
    saveCart();
    updateCartUI();
    showToast(`Producto eliminado del carrito`);
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');

    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';
    let total = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">El carrito está vacío.</p>';
    } else {
        cart.forEach(item => {
            total += item.price * item.quantity;
            totalItems += item.quantity;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <img src="${item.img}" alt="${item.title}">
                <div class="cart-item-details">
                    <h4>${item.title}</h4>
                    <p>$${item.price.toLocaleString()} x ${item.quantity}</p>
                </div>
                <i class="fa-solid fa-trash remove-btn" onclick="removeFromCart('${item.title}')"></i>
            `;
            cartItemsContainer.appendChild(itemDiv);
        });
    }

    if (cartCount) cartCount.innerText = totalItems;
    if (cartTotalPrice) cartTotalPrice.innerText = `$${total.toLocaleString()}`;
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.style.display = 'none';
    } else {
        sidebar.classList.add('active');
        overlay.style.display = 'block';
    }
}

/* ==========================================
   MODALES DE PRODUCTO Y CHECKOUT
   ========================================== */
function openModal(title, price, img, description) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-price').innerText = price > 0 ? `$${price.toLocaleString()}` : 'AGOTADO';
    document.getElementById('modal-img').src = img;
    document.getElementById('modal-description').innerText = description;

    const addBtn = document.getElementById('modal-add-btn');
    if (price > 0) {
        addBtn.style.display = 'inline-block';
        addBtn.onclick = function() {
            addToCart(title, price, img);
            closeModal();
        };
    } else {
        addBtn.style.display = 'none';
    }

    document.getElementById('product-modal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function openCheckoutForm() {
    if (cart.length === 0) {
        showToast('⚠️ El carrito está vacío.');
        return;
    }
    document.getElementById('checkout-modal').style.display = 'block';
    document.getElementById('cart-sidebar').classList.remove('active');
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function closeAllModals() {
    closeModal();
    closeCheckoutModal();
    document.getElementById('cart-sidebar').classList.remove('active');
    document.getElementById('overlay').style.display = 'none';
}

/* ==========================================
   ENVÍO DE PEDIDO A WHATSAPP
   ========================================== */
function sendWhatsAppOrder(event) {
    event.preventDefault();
    
    const clientName = document.getElementById('client-name').value.trim();
    const clientNotes = document.getElementById('client-notes').value.trim();

    let message = `*¡Hola Circuito Urbano! Quiero realizar el siguiente pedido:*\n\n`;
    message += `👤 *Cliente:* ${clientName}\n`;
    if (clientNotes) {
        message += `📝 *Notas / Dirección:* ${clientNotes}\n`;
    }
    message += `\n📦 *Productos:*\n`;

    let total = 0;
    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        message += `• ${item.title} (x${item.quantity}) - $${subtotal.toLocaleString()}\n`;
    });

    message += `\n💰 *TOTAL A PAGAR:* $${total.toLocaleString()}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    
    // Limpiar carrito tras hacer pedido
    cart = [];
    saveCart();
    updateCartUI();
    closeCheckoutModal();
}

/* ==========================================
   EFECTOS DINÁMICOS & ANIMACIONES
   ========================================== */
function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

function setupScrollEffects() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.product-card, .feature-card, .hero-content').forEach(el => {
        el.classList.add('fade-in-hidden');
        observer.observe(el);
    });
}

/* BUSCADOR DE PRODUCTOS EN TIEMPO REAL */
function setupSearchFilter() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.product-card');

        cards.forEach(card => {
            const title = card.querySelector('h3').innerText.toLowerCase();
            if (title.includes(query)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

/* NOTIFICACIONES TOAST FLOATING */
function setupToastContainer() {
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}