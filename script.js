document.addEventListener('DOMContentLoaded', () => {
    // Configuration Data
    const finishesData = {
        walnut: { name: "Walnut Wood Composite", price: "$39.00", image: "images/wallet.jpg" },
        birch: { name: "Golden Birch Blend", price: "$39.00", image: "images/wallet.jpg" },
        ebony: { name: "Ebony Timber Blend", price: "$42.00", image: "images/wallet.jpg" }
    };

    // Elements
    const presetLabel = document.getElementById('preset-label');
    const presetPrice = document.getElementById('preset-price');
    const mainImg = document.getElementById('main-product-img');
    const finishSelect = document.getElementById('order-finish-select');
    const finishBtns = document.querySelectorAll('.finish-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeLightboxBtn = document.getElementById('close-lightbox-btn');

    // Set Finish Function
    function setFinish(type) {
        const data = finishesData[type];
        if (!data) return;

        if (presetLabel) presetLabel.innerText = data.name;
        if (presetPrice) presetPrice.innerText = data.price;
        if (mainImg) mainImg.src = data.image;

        if (finishSelect && finishSelect.value !== type) {
            finishSelect.value = type;
        }

        finishBtns.forEach(btn => {
            btn.classList.remove('border-amber-600', 'bg-stone-900/80');
            btn.classList.add('border-stone-800');
        });

        const activeBtn = document.getElementById(`btn-${type}`);
        if (activeBtn) {
            activeBtn.classList.remove('border-stone-800');
            activeBtn.classList.add('border-amber-600', 'bg-stone-900/80');
        }
    }

    // Attach Click Events to Finish Buttons
    finishBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const finishType = btn.getAttribute('data-finish');
            setFinish(finishType);
        });
    });

    // Synchronize Form Select Dropdown Changes with Buttons & Hero Card
    if (finishSelect) {
        finishSelect.addEventListener('change', (e) => {
            setFinish(e.target.value);
        });
    }

    // Lightbox Logic
    function openLightbox(imgSrc) {
        if (lightboxImg && lightbox) {
            lightboxImg.src = imgSrc;
            lightbox.classList.remove('hidden');
            lightbox.classList.add('flex');
        }
    }

    function closeLightbox() {
        if (lightbox) {
            lightbox.classList.remove('flex');
            lightbox.classList.add('hidden');
        }
    }

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const imgSrc = item.getAttribute('data-img');
            openLightbox(imgSrc);
        });
    });

    if (closeLightboxBtn) {
        closeLightboxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeLightbox();
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }
});
