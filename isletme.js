const SUPABASE_URL =
    "https://yhunhkzsecppbnhjewrt.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_0h5ycfDBJjgdf6bXlZ9OEg_K45u2b2v";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

// ============================================================
// YARDIMCI FONKSİYONLAR
// ============================================================
function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getSlug() {
    return new URLSearchParams(
        window.location.search
    ).get("slug");
}

function normalizePhone(phone) {
    if (!phone) return "";

    let number = String(phone).replace(/\D/g, "");

    if (number.startsWith("0")) {
        number = "90" + number.substring(1);
    }

    if (!number.startsWith("90")) {
        number = "90" + number;
    }

    return number;
}

function starsHtml(rating) {
    const value = Math.round(Number(rating || 0));
    let html = "";

    for (let i = 1; i <= 5; i++) {
        html += i <= value ? "★" : "☆";
    }

    return html;
}

// ============================================================
// GALERİ FOTOĞRAFLARINI YÜKLE
// ============================================================
async function loadBusinessImages(businessId) {
    try {
        const { data: images, error } =
            await supabaseClient
                .from("business_images")
                .select(`
                    id,
                    business_id,
                    image_url,
                    is_cover,
                    sort_order,
                    created_at
                `)
                .eq("business_id", businessId)
                .order("is_cover", { ascending: false })
                .order("sort_order", { ascending: true })
                .order("created_at", { ascending: true });

        if (error) {
            console.warn(
                "İşletme galerisi okunamadı:",
                error
            );

            return [];
        }

        return images || [];

    } catch (error) {
        console.warn(
            "Galeri yükleme hatası:",
            error
        );

        return [];
    }
}

// ============================================================
// İŞLETMEYİ YÜKLE
// ============================================================
async function loadBusiness() {

    const slug = getSlug();

    if (!slug) {

        showError(
            "İşletme bağlantısı bulunamadı."
        );

        return;
    }

    try {

        const { data: business, error } =
            await supabaseClient
                .from("businesses")
                .select(`
                    id,
                    name,
                    slug,
                    description,
                    address,
                    district,
                    phone,
                    website,
                    instagram,
                    image_url,
                    latitude,
                    longitude,
                    rating,
                    review_count,
                    category_id
                `)
                .eq("slug", slug)
                .eq("is_approved", true)
                .maybeSingle();

        if (error) {

            console.error(
                "İşletme yükleme hatası:",
                error
            );

            showError(
                "İşletme bilgileri alınamadı."
            );

            return;
        }

        if (!business) {

            showError(
                "Bu işletme bulunamadı veya henüz onaylanmadı."
            );

            return;
        }

        const images =
            await loadBusinessImages(
                business.id
            );

        let category = null;

        if (business.category_id) {

            const { data: categoryData } =
                await supabaseClient
                    .from("categories")
                    .select("name, icon")
                    .eq(
                        "id",
                        business.category_id
                    )
                    .maybeSingle();

            category =
                categoryData || null;
        }

        renderBusiness(
            business,
            category,
            images
        );

        await loadReviews(
            business.id
        );

        setupReviewForm(
            business.id
        );

        setupShareButtons();

        setupGalleryLightbox();

    } catch (error) {

        console.error(
            "İşletme genel hata:",
            error
        );

        showError(
            "Bir hata oluştu. Lütfen tekrar deneyin."
        );
    }
}

// ============================================================
// İŞLETME DETAYI
// ============================================================
function renderBusiness(
    business,
    category,
    images = []
) {

    const container =
        document.querySelector(
            "#businessContainer"
        );

    if (!container) return;

    document.title =
        `${business.name} | Trabzon Anlık`;

    const categoryName =
        category?.name || "İŞLETME";

    const categoryIcon =
        category?.icon || "🏪";

    const rating =
        Number(business.rating || 0);

    const reviewCount =
        Number(
            business.review_count || 0
        );

    let coverImage = null;

    if (images.length > 0) {

        coverImage =
            images.find(
                image =>
                    image.is_cover === true
            ) || images[0];
    }

    const coverUrl =
        coverImage?.image_url ||
        business.image_url ||
        "";

    let imageHtml;

    if (coverUrl) {

        imageHtml = `
            <img
                class="business-detail-image"
                src="${escapeHtml(coverUrl)}"
                alt="${escapeHtml(business.name)}"
                onerror="
                    this.style.display='none';
                    const fallback=this.parentElement.querySelector('.business-detail-image-fallback');
                    if(fallback) fallback.style.display='flex';
                "
            >

            <div
                class="business-detail-image-fallback"
                style="
                    display:none;
                    width:100%;
                    height:100%;
                    align-items:center;
                    justify-content:center;
                    font-size:80px;
                    background:#eef2f7;
                "
            >
                ${escapeHtml(categoryIcon)}
            </div>
        `;

    } else {

        imageHtml = `
            <div
                class="business-detail-image-fallback"
                style="
                    display:flex;
                    width:100%;
                    height:100%;
                    align-items:center;
                    justify-content:center;
                    font-size:80px;
                    background:#eef2f7;
                "
            >
                ${escapeHtml(categoryIcon)}
            </div>
        `;
    }

    let galleryHtml = "";

    if (images.length > 0) {

        galleryHtml = `
            <div class="business-gallery">

                <div class="business-gallery-title">

                    <span>📷</span>

                    <strong>
                        Fotoğraflar
                    </strong>

                    <small>
                        ${images.length} fotoğraf
                    </small>

                </div>

                <div class="business-gallery-grid">

                    ${
                        images
                            .map(
                                image => `
                                    <button
                                        type="button"
                                        class="business-gallery-item"
                                        data-gallery-url="${escapeHtml(image.image_url)}"
                                        aria-label="Fotoğrafı büyüt"
                                    >

                                        <img
                                            src="${escapeHtml(image.image_url)}"
                                            alt="${escapeHtml(business.name)} fotoğrafı"
                                            loading="lazy"
                                            draggable="false"
                                        >

                                        ${
                                            image.is_cover
                                                ? `
                                                    <span class="gallery-cover-badge">
                                                        ⭐ Kapak
                                                    </span>
                                                `
                                                : ""
                                        }

                                    </button>
                                `
                            )
                            .join("")
                    }

                </div>

            </div>
        `;
    }

    container.innerHTML = `
        <article class="business-detail-card">

            <div class="business-detail-image-wrap">

                ${imageHtml}

                <div class="business-image-overlay"></div>

                <div class="business-image-category">
                    ${escapeHtml(categoryIcon)}
                    ${escapeHtml(categoryName)}
                </div>

            </div>

            ${galleryHtml}

            <div class="business-detail-content">

                <h1 class="business-detail-title">
                    ${escapeHtml(business.name)}
                </h1>

                <div class="business-detail-rating">

                    <span class="detail-rating-stars">
                        ${starsHtml(rating)}
                    </span>

                    <strong>
                        ${rating.toFixed(1)}
                    </strong>

                    <span>
                        (${reviewCount} değerlendirme)
                    </span>

                </div>

                <p class="business-detail-description">
                    ${escapeHtml(
                        business.description ||
                        "Bu işletme hakkında henüz açıklama eklenmemiş."
                    )}
                </p>

                <div class="business-info">

                    <div class="business-info-item">

                        <span>📍</span>

                        <div>

                            <strong>
                                İlçe
                            </strong>

                            <br>

                            ${escapeHtml(
                                business.district ||
                                "Belirtilmemiş"
                            )}

                        </div>

                    </div>

                    <div class="business-info-item">

                        <span>🏠</span>

                        <div>

                            <strong>
                                Adres
                            </strong>

                            <br>

                            ${escapeHtml(
                                business.address ||
                                "Belirtilmemiş"
                            )}

                        </div>

                    </div>

                    ${
                        business.phone
                            ? `
                                <div class="business-info-item">

                                    <span>📞</span>

                                    <div>

                                        <strong>
                                            Telefon
                                        </strong>

                                        <br>

                                        ${escapeHtml(
                                            business.phone
                                        )}

                                    </div>

                                </div>
                            `
                            : ""
                    }

                </div>

                <div class="business-actions">

                    ${
                        business.phone
                            ? `
                                <a
                                    class="business-action phone"
                                    href="tel:${escapeHtml(
                                        business.phone
                                    )}"
                                >
                                    📞 Ara
                                </a>
                            `
                            : ""
                    }

                    ${
                        business.phone
                            ? `
                                <a
                                    class="business-action whatsapp"
                                    href="https://wa.me/${normalizePhone(
                                        business.phone
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    💬 WhatsApp
                                </a>
                            `
                            : ""
                    }

                    ${
                        business.instagram
                            ? `
                                <a
                                    class="business-action instagram"
                                    href="${formatInstagram(
                                        business.instagram
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    📷 Instagram
                                </a>
                            `
                            : ""
                    }

                    ${
                        business.website
                            ? `
                                <a
                                    class="business-action website"
                                    href="${formatWebsite(
                                        business.website
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    🌐 Web Sitesi
                                </a>
                            `
                            : ""
                    }

                    ${
                        business.address ||
                        (
                            business.latitude &&
                            business.longitude
                        )
                            ? `
                                <a
                                    class="business-action map"
                                    href="${getMapUrl(
                                        business
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    📍 Yol Tarifi
                                </a>
                            `
                            : ""
                    }

                </div>

                <div class="share-actions">

                    <button
                        type="button"
                        id="share-business"
                        class="share-button"
                    >
                        📤 Paylaş
                    </button>

                    <button
                        type="button"
                        id="copy-business-link"
                        class="share-button"
                    >
                        🔗 Linki Kopyala
                    </button>

                </div>

                <div class="business-map">
                    ${renderMap(business)}
                </div>

            </div>

        </article>
    `;
}

// ============================================================
// GALERİ LIGHTBOX
// PREMIUM ZOOM + NOKTAYA ZOOM + PAN + PINCH + SWIPE
// ============================================================
function setupGalleryLightbox() {

    const galleryItems =
        document.querySelectorAll(
            ".business-gallery-item"
        );

    if (!galleryItems.length) {
        return;
    }

    const galleryImages =
        Array.from(galleryItems)
            .map(
                item =>
                    item.dataset.galleryUrl
            )
            .filter(Boolean);

    if (!galleryImages.length) {
        return;
    }

    let currentIndex = 0;

    function openLightbox(index) {

        currentIndex =
            (
                index +
                galleryImages.length
            ) %
            galleryImages.length;

        const oldOverlay =
            document.querySelector(
                ".gallery-lightbox"
            );

        if (oldOverlay) {
            oldOverlay.remove();
        }

        const overlay =
            document.createElement(
                "div"
            );

        overlay.className =
            "gallery-lightbox";

        overlay.innerHTML = `

            <button
                type="button"
                class="gallery-lightbox-close"
                aria-label="Kapat"
            >
                ×
            </button>

            <button
                type="button"
                class="gallery-lightbox-prev"
                aria-label="Önceki fotoğraf"
            >
                ‹
            </button>

            <div class="gallery-lightbox-content">

                <img
                    class="gallery-lightbox-image"
                    src=""
                    alt="Büyük fotoğraf"
                    draggable="false"
                >

                <div class="gallery-lightbox-counter">
                    1 / ${galleryImages.length}
                </div>

            </div>

            <button
                type="button"
                class="gallery-lightbox-next"
                aria-label="Sonraki fotoğraf"
            >
                ›
            </button>

        `;

        document.body.appendChild(
            overlay
        );

        document.body.style.overflow =
            "hidden";

        const image =
            overlay.querySelector(
                ".gallery-lightbox-image"
            );

        const counter =
            overlay.querySelector(
                ".gallery-lightbox-counter"
            );

        const content =
            overlay.querySelector(
                ".gallery-lightbox-content"
            );

        const closeButton =
            overlay.querySelector(
                ".gallery-lightbox-close"
            );

        const prevButton =
            overlay.querySelector(
                ".gallery-lightbox-prev"
            );

        const nextButton =
            overlay.querySelector(
                ".gallery-lightbox-next"
            );

        // ====================================================
        // ZOOM DEĞİŞKENLERİ
        // ====================================================

        let zoomScale = 1;

        const MIN_ZOOM =
            1;

        const MAX_ZOOM =
            4;

        const DOUBLE_TAP_ZOOM =
            2.5;

        let translateX = 0;
        let translateY = 0;

        let isZoomed = false;
        let isAnimating = false;

        let zoomOriginX = 0.5;
        let zoomOriginY = 0.5;

        // ====================================================
        // MOUSE PAN
        // ====================================================

        let isMouseDragging = false;

        let mouseStartX = 0;
        let mouseStartY = 0;

        let mouseStartTranslateX = 0;
        let mouseStartTranslateY = 0;

        // ====================================================
        // TOUCH
        // ====================================================

        let touchStartX = 0;
        let touchStartY = 0;

        let touchStartTime = 0;

        let touchStartTranslateX = 0;
        let touchStartTranslateY = 0;

        let isTouchDragging = false;

        // ====================================================
        // PINCH
        // ====================================================

        let pinchStartDistance = 0;
        let pinchStartScale = 1;

        // ====================================================
        // DOUBLE TAP
        // ====================================================

        let lastTapTime = 0;

        // ====================================================
        // YARDIMCI
        // ====================================================

        function getTouchDistance(
            touch1,
            touch2
        ) {

            const dx =
                touch2.clientX -
                touch1.clientX;

            const dy =
                touch2.clientY -
                touch1.clientY;

            return Math.sqrt(
                dx * dx +
                dy * dy
            );
        }

        // ====================================================
        // GÖRSEL ÖLÇÜSÜ
        // ====================================================

        function getBaseImageSize() {

            const rect =
                image.getBoundingClientRect();

            const currentScale =
                zoomScale || 1;

            return {
                width:
                    rect.width /
                    currentScale,
                height:
                    rect.height /
                    currentScale
            };
        }

        // ====================================================
        // PAN SINIRLAMA
        // ====================================================

        function clampPan() {

            if (!isZoomed || zoomScale <= 1) {

                translateX = 0;
                translateY = 0;

                return;
            }

            const containerRect =
                content.getBoundingClientRect();

            const imageRect =
                image.getBoundingClientRect();

            const baseWidth =
                imageRect.width /
                zoomScale;

            const baseHeight =
                imageRect.height /
                zoomScale;

            const scaledWidth =
                baseWidth *
                zoomScale;

            const scaledHeight =
                baseHeight *
                zoomScale;

            const maxX =
                Math.max(
                    0,
                    (
                        scaledWidth -
                        containerRect.width
                    ) / 2
                );

            const maxY =
                Math.max(
                    0,
                    (
                        scaledHeight -
                        containerRect.height
                    ) / 2
                );

            translateX =
                Math.max(
                    -maxX,
                    Math.min(
                        maxX,
                        translateX
                    )
                );

            translateY =
                Math.max(
                    -maxY,
                    Math.min(
                        maxY,
                        translateY
                    )
                );
        }

        // ====================================================
        // TRANSFORM UYGULA
        // ====================================================

        function applyTransform(
            animate = false
        ) {

            if (!isZoomed) {

                image.style.transition =
                    animate
                        ? "transform 0.25s ease"
                        : "none";

                image.style.transform =
                    "translate3d(0, 0, 0) scale(1)";

                return;
            }

            clampPan();

            image.style.transition =
                animate
                    ? "transform 0.25s cubic-bezier(.2,.8,.2,1)"
                    : "none";

            image.style.transform =
                `
                    translate3d(
                        ${translateX}px,
                        ${translateY}px,
                        0
                    )
                    scale(${zoomScale})
                `;
        }

        // ====================================================
        // ZOOM SIFIRLA
        // ====================================================

        function resetZoom(
            animate = false
        ) {

            isZoomed = false;

            zoomScale = 1;

            translateX = 0;
            translateY = 0;

            zoomOriginX = 0.5;
            zoomOriginY = 0.5;

            isMouseDragging = false;
            isTouchDragging = false;

            image.classList.remove(
                "gallery-zoomed"
            );

            content.classList.remove(
                "gallery-zoom-mode"
            );

            image.style.transformOrigin =
                "50% 50%";

            image.style.cursor =
                "zoom-in";

            if (animate) {

                image.style.transition =
                    "transform 0.25s ease";

                image.style.transform =
                    "translate3d(0,0,0) scale(1)";

            } else {

                image.style.transition =
                    "";

                image.style.transform =
                    "";
            }
        }

        // ====================================================
        // NOKTAYA ZOOM
        // ====================================================

        function zoomToPoint(
            clientX,
            clientY,
            targetScale = DOUBLE_TAP_ZOOM
        ) {

            if (isAnimating) {
                return;
            }

            const rect =
                image.getBoundingClientRect();

            if (
                rect.width <= 0 ||
                rect.height <= 0
            ) {
                return;
            }

            const oldScale =
                zoomScale || 1;

            const pointX =
                (
                    clientX -
                    rect.left
                ) /
                rect.width;

            const pointY =
                (
                    clientY -
                    rect.top
                ) /
                rect.height;

            const clampedX =
                Math.max(
                    0,
                    Math.min(
                        1,
                        pointX
                    )
                );

            const clampedY =
                Math.max(
                    0,
                    Math.min(
                        1,
                        pointY
                    )
                );

            if (!isZoomed) {

                isZoomed = true;

                zoomScale =
                    Math.max(
                        1.01,
                        Math.min(
                            MAX_ZOOM,
                            targetScale
                        )
                    );

                image.classList.add(
                    "gallery-zoomed"
                );

                content.classList.add(
                    "gallery-zoom-mode"
                );

                image.style.cursor =
                    "grab";

                /*
                 * Tıklanan noktanın ekran üzerindeki
                 * konumunu koruyarak zoom yapıyoruz.
                 */
                const containerRect =
                    content.getBoundingClientRect();

                const containerCenterX =
                    containerRect.left +
                    containerRect.width / 2;

                const containerCenterY =
                    containerRect.top +
                    containerRect.height / 2;

                const offsetX =
                    clientX -
                    containerCenterX;

                const offsetY =
                    clientY -
                    containerCenterY;

                translateX =
                    offsetX -
                    offsetX *
                    (
                        zoomScale /
                        oldScale
                    );

                translateY =
                    offsetY -
                    offsetY *
                    (
                        zoomScale /
                        oldScale
                    );

                clampPan();

                image.style.transformOrigin =
                    "50% 50%";

                applyTransform(true);

                return;
            }

            const oldTranslateX =
                translateX;

            const oldTranslateY =
                translateY;

            const containerRect =
                content.getBoundingClientRect();

            const centerX =
                containerRect.left +
                containerRect.width / 2;

            const centerY =
                containerRect.top +
                containerRect.height / 2;

            const relativeX =
                clientX -
                centerX -
                oldTranslateX;

            const relativeY =
                clientY -
                centerY -
                oldTranslateY;

            const newScale =
                zoomScale >= 3.5
                    ? 1
                    : zoomScale >= 2.5
                        ? 3.5
                        : 2.5;

            if (newScale <= 1.01) {

                resetZoom(true);

                return;
            }

            zoomScale =
                Math.min(
                    MAX_ZOOM,
                    newScale
                );

            translateX =
                (
                    clientX -
                    centerX
                ) -
                relativeX *
                (
                    zoomScale /
                    oldScale
                );

            translateY =
                (
                    clientY -
                    centerY
                ) -
                relativeY *
                (
                    zoomScale /
                    oldScale
                );

            isZoomed = true;

            image.classList.add(
                "gallery-zoomed"
            );

            content.classList.add(
                "gallery-zoom-mode"
            );

            image.style.cursor =
                "grab";

            clampPan();

            applyTransform(true);
        }

        // ====================================================
        // ZOOM TOGGLE
        // ====================================================

        function toggleZoom(
            clientX = null,
            clientY = null
        ) {

            if (isAnimating) {
                return;
            }

            if (!isZoomed) {

                const rect =
                    image.getBoundingClientRect();

                const x =
                    clientX !== null
                        ? clientX
                        : rect.left +
                          rect.width / 2;

                const y =
                    clientY !== null
                        ? clientY
                        : rect.top +
                          rect.height / 2;

                zoomToPoint(
                    x,
                    y,
                    DOUBLE_TAP_ZOOM
                );

                return;
            }

            resetZoom(true);
        }

        // ====================================================
        // FOTOĞRAF DEĞİŞTİR
        // ====================================================

        function updateImage(
            withAnimation = false,
            direction = 1
        ) {

            const url =
                galleryImages[
                    currentIndex
                ];

            resetZoom();

            if (!withAnimation) {

                image.src =
                    url;

                counter.textContent =
                    `${currentIndex + 1} / ${galleryImages.length}`;

                return;
            }

            if (isAnimating) {
                return;
            }

            isAnimating = true;

            const outgoingTransform =
                direction > 0
                    ? "translate3d(-55px,0,0) scale(.97)"
                    : "translate3d(55px,0,0) scale(.97)";

            const incomingTransform =
                direction > 0
                    ? "translate3d(55px,0,0) scale(.97)"
                    : "translate3d(-55px,0,0) scale(.97)";

            image.style.transition =
                "opacity .18s ease, transform .18s ease";

            image.style.opacity =
                "0";

            image.style.transform =
                outgoingTransform;

            setTimeout(
                function() {

                    image.src =
                        url;

                    counter.textContent =
                        `${currentIndex + 1} / ${galleryImages.length}`;

                    image.style.transition =
                        "none";

                    image.style.opacity =
                        "0";

                    image.style.transform =
                        incomingTransform;

                    requestAnimationFrame(
                        function() {

                            requestAnimationFrame(
                                function() {

                                    image.style.transition =
                                        "opacity .25s ease, transform .25s cubic-bezier(.2,.8,.2,1)";

                                    image.style.opacity =
                                        "1";

                                    image.style.transform =
                                        "translate3d(0,0,0) scale(1)";

                                    setTimeout(
                                        function() {

                                            image.style.transition =
                                                "";

                                            image.style.transform =
                                                "";

                                            image.style.opacity =
                                                "";

                                            isAnimating =
                                                false;

                                        },
                                        270
                                    );
                                }
                            );
                        }
                    );

                },
                180
            );
        }

        // ====================================================
        // SONRAKİ
        // ====================================================

        function showNext() {

            if (isAnimating) {
                return;
            }

            if (isZoomed) {
                return;
            }

            currentIndex =
                (
                    currentIndex +
                    1
                ) %
                galleryImages.length;

            updateImage(
                true,
                1
            );
        }

        // ====================================================
        // ÖNCEKİ
        // ====================================================

        function showPrevious() {

            if (isAnimating) {
                return;
            }

            if (isZoomed) {
                return;
            }

            currentIndex =
                (
                    currentIndex -
                    1 +
                    galleryImages.length
                ) %
                galleryImages.length;

            updateImage(
                true,
                -1
            );
        }

        // ====================================================
        // KAPAT
        // ====================================================

        function close() {

            document.removeEventListener(
                "keydown",
                handleKeydown
            );

            overlay.remove();

            document.body.style.overflow =
                "";
        }

        // ====================================================
        // KLAVYE
        // ====================================================

        function handleKeydown(
            event
        ) {

            if (
                event.key ===
                "Escape"
            ) {

                close();

                return;
            }

            if (
                event.key ===
                "ArrowRight"
            ) {

                event.preventDefault();

                if (!isZoomed) {
                    showNext();
                }

                return;
            }

            if (
                event.key ===
                "ArrowLeft"
            ) {

                event.preventDefault();

                if (!isZoomed) {
                    showPrevious();
                }

                return;
            }

            if (
                event.key ===
                " "
            ) {

                event.preventDefault();

                toggleZoom();
            }
        }

        // ====================================================
        // KAPAT BUTONU
        // ====================================================

        closeButton.addEventListener(
            "click",
            close
        );

        // ====================================================
        // ÖNCEKİ BUTON
        // ====================================================

        prevButton.addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                if (!isZoomed) {
                    showPrevious();
                }
            }
        );

        // ====================================================
        // SONRAKİ BUTON
        // ====================================================

        nextButton.addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                if (!isZoomed) {
                    showNext();
                }
            }
        );

        // ====================================================
        // ARKA PLAN
        // ====================================================

        overlay.addEventListener(
            "click",
            function(event) {

                if (
                    event.target ===
                    overlay
                ) {

                    close();
                }
            }
        );

        // ====================================================
        // MASAÜSTÜ CLICK
        // ====================================================

        image.addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                if (
                    "ontouchstart" in window
                ) {
                    return;
                }

                toggleZoom(
                    event.clientX,
                    event.clientY
                );
            }
        );

        // ====================================================
        // DOUBLE CLICK
        // ====================================================

        image.addEventListener(
            "dblclick",
            function(event) {

                event.preventDefault();

                event.stopPropagation();

                toggleZoom(
                    event.clientX,
                    event.clientY
                );
            }
        );

        // ====================================================
        // MOUSE DOWN - PAN
        // ====================================================

        image.addEventListener(
            "mousedown",
            function(event) {

                if (!isZoomed) {
                    return;
                }

                event.preventDefault();

                isMouseDragging =
                    true;

                mouseStartX =
                    event.clientX;

                mouseStartY =
                    event.clientY;

                mouseStartTranslateX =
                    translateX;

                mouseStartTranslateY =
                    translateY;

                image.style.cursor =
                    "grabbing";
            }
        );

        // ====================================================
        // MOUSE MOVE
        // ====================================================

        document.addEventListener(
            "mousemove",
            function(event) {

                if (
                    !isMouseDragging ||
                    !isZoomed
                ) {
                    return;
                }

                translateX =
                    mouseStartTranslateX +
                    (
                        event.clientX -
                        mouseStartX
                    );

                translateY =
                    mouseStartTranslateY +
                    (
                        event.clientY -
                        mouseStartY
                    );

                applyTransform(
                    false
                );
            }
        );

        // ====================================================
        // MOUSE UP
        // ====================================================

        document.addEventListener(
            "mouseup",
            function() {

                if (
                    !isMouseDragging
                ) {
                    return;
                }

                isMouseDragging =
                    false;

                image.style.cursor =
                    "grab";

                clampPan();

                applyTransform(
                    false
                );
            }
        );

        // ====================================================
        // DRAG KAPAT
        // ====================================================

        image.addEventListener(
            "dragstart",
            function(event) {

                event.preventDefault();
            }
        );

        // ====================================================
        // TOUCH START
        // ====================================================

        overlay.addEventListener(
            "touchstart",
            function(event) {

                if (
                    !event.touches ||
                    !event.touches.length
                ) {
                    return;
                }

                // ------------------------------
                // PINCH BAŞLANGICI
                // ------------------------------

                if (
                    event.touches.length === 2
                ) {

                    pinchStartDistance =
                        getTouchDistance(
                            event.touches[0],
                            event.touches[1]
                        );

                    pinchStartScale =
                        zoomScale;

                    if (!isZoomed) {

                        const centerX =
                            (
                                event.touches[0].clientX +
                                event.touches[1].clientX
                            ) / 2;

                        const centerY =
                            (
                                event.touches[0].clientY +
                                event.touches[1].clientY
                            ) / 2;

                        zoomToPoint(
                            centerX,
                            centerY,
                            2
                        );

                        pinchStartScale =
                            zoomScale;
                    }

                    return;
                }

                const touch =
                    event.touches[0];

                touchStartX =
                    touch.clientX;

                touchStartY =
                    touch.clientY;

                touchStartTime =
                    Date.now();

                if (isZoomed) {

                    isTouchDragging =
                        true;

                    touchStartTranslateX =
                        translateX;

                    touchStartTranslateY =
                        translateY;
                }

            },
            {
                passive: true
            }
        );

        // ====================================================
        // TOUCH MOVE
        // ====================================================

        overlay.addEventListener(
            "touchmove",
            function(event) {

                if (
                    !event.touches ||
                    !event.touches.length
                ) {
                    return;
                }

                // ------------------------------
                // PINCH ZOOM
                // ------------------------------

                if (
                    event.touches.length === 2
                ) {

                    const distance =
                        getTouchDistance(
                            event.touches[0],
                            event.touches[1]
                        );

                    if (
                        pinchStartDistance <= 0
                    ) {
                        return;
                    }

                    const ratio =
                        distance /
                        pinchStartDistance;

                    zoomScale =
                        Math.max(
                            MIN_ZOOM,
                            Math.min(
                                MAX_ZOOM,
                                pinchStartScale *
                                ratio
                            )
                        );

                    isZoomed =
                        zoomScale >
                        1.01;

                    image.classList.toggle(
                        "gallery-zoomed",
                        isZoomed
                    );

                    content.classList.toggle(
                        "gallery-zoom-mode",
                        isZoomed
                    );

                    image.style.cursor =
                        "grab";

                    applyTransform(
                        false
                    );

                    return;
                }

                // ------------------------------
                // PAN
                // ------------------------------

                if (
                    isZoomed &&
                    event.touches.length === 1 &&
                    isTouchDragging
                ) {

                    const touch =
                        event.touches[0];

                    translateX =
                        touchStartTranslateX +
                        (
                            touch.clientX -
                            touchStartX
                        );

                    translateY =
                        touchStartTranslateY +
                        (
                            touch.clientY -
                            touchStartY
                        );

                    applyTransform(
                        false
                    );
                }

            },
            {
                passive: true
            }
        );

        // ====================================================
        // TOUCH END
        // ====================================================

        overlay.addEventListener(
            "touchend",
            function(event) {

                if (
                    !event.changedTouches ||
                    !event.changedTouches.length
                ) {
                    return;
                }

                // ------------------------------
                // PINCH BİTTİ
                // ------------------------------

                if (
                    pinchStartDistance > 0
                ) {

                    pinchStartDistance =
                        0;

                    isTouchDragging =
                        false;

                    if (
                        zoomScale <=
                        1.05
                    ) {

                        resetZoom(true);

                    } else {

                        isZoomed =
                            true;

                        image.classList.add(
                            "gallery-zoomed"
                        );

                        content.classList.add(
                            "gallery-zoom-mode"
                        );

                        clampPan();

                        applyTransform(
                            false
                        );
                    }

                    return;
                }

                // ------------------------------
                // ZOOMED PAN BİTTİ
                // ------------------------------

                if (isZoomed) {

                    isTouchDragging =
                        false;

                    clampPan();

                    applyTransform(
                        false
                    );

                    return;
                }

                // ------------------------------
                // SWIPE
                // ------------------------------

                const touch =
                    event.changedTouches[0];

                const endX =
                    touch.clientX;

                const endY =
                    touch.clientY;

                const distanceX =
                    endX -
                    touchStartX;

                const distanceY =
                    endY -
                    touchStartY;

                const duration =
                    Date.now() -
                    touchStartTime;

                const minimumSwipe =
                    50;

                if (
                    duration >
                    700
                ) {
                    return;
                }

                if (
                    Math.abs(distanceX) <
                    Math.abs(distanceY)
                ) {
                    return;
                }

                if (
                    Math.abs(distanceX) <
                    minimumSwipe
                ) {
                    return;
                }

                if (
                    distanceX < 0
                ) {

                    showNext();

                } else {

                    showPrevious();
                }
            },
            {
                passive: true
            }
        );

        // ====================================================
        // DOUBLE TAP - MOBİL
        // ====================================================

        overlay.addEventListener(
            "touchend",
            function(event) {

                if (
                    !event.changedTouches ||
                    !event.changedTouches.length
                ) {
                    return;
                }

                if (pinchStartDistance > 0) {
                    return;
                }

                if (isZoomed) {
                    return;
                }

                const touch =
                    event.changedTouches[0];

                const now =
                    Date.now();

                const difference =
                    now -
                    lastTapTime;

                if (
                    difference <
                    320
                ) {

                    lastTapTime =
                        0;

                    zoomToPoint(
                        touch.clientX,
                        touch.clientY,
                        DOUBLE_TAP_ZOOM
                    );

                } else {

                    lastTapTime =
                        now;
                }

            },
            {
                passive: true
            }
        );

        // ====================================================
        // KLAVYE
        // ====================================================

        document.addEventListener(
            "keydown",
            handleKeydown
        );

        // ====================================================
        // İLK FOTOĞRAF
        // ====================================================

        updateImage();
    }

    // ========================================================
    // GALERİ KÜÇÜK FOTOĞRAFLARI
    // ========================================================

    galleryItems.forEach(
        (item, index) => {

            item.addEventListener(
                "click",
                function() {

                    openLightbox(
                        index
                    );

                }
            );

        }
    );
}

// ============================================================
// INSTAGRAM
// ============================================================
function formatInstagram(value) {

    let instagram =
        String(value || "").trim();

    if (!instagram) {
        return "#";
    }

    if (
        instagram.startsWith(
            "http://"
        ) ||
        instagram.startsWith(
            "https://"
        )
    ) {
        return instagram;
    }

    instagram =
        instagram.replace(
            /^@/,
            ""
        );

    return (
        "https://instagram.com/" +
        encodeURIComponent(
            instagram
        )
    );
}

// ============================================================
// WEB SİTESİ
// ============================================================
function formatWebsite(value) {

    let website =
        String(value || "").trim();

    if (!website) {
        return "#";
    }

    if (
        website.startsWith(
            "http://"
        ) ||
        website.startsWith(
            "https://"
        )
    ) {
        return website;
    }

    return (
        "https://" +
        website
    );
}

// ============================================================
// HARİTA
// ============================================================
function getMapUrl(business) {

    if (
        business.latitude &&
        business.longitude
    ) {

        return (
            "https://www.google.com/maps/dir/?api=1" +
            `&destination=${business.latitude},${business.longitude}`
        );
    }

    const address =
        encodeURIComponent(
            [
                business.address,
                business.district,
                "Trabzon"
            ]
                .filter(Boolean)
                .join(", ")
        );

    return (
        "https://www.google.com/maps/search/?api=1" +
        `&query=${address}`
    );
}

// ============================================================
// HARİTA GÖSTER
// ============================================================
function renderMap(business) {

    if (
        business.latitude &&
        business.longitude
    ) {

        return `
            <iframe
                src="https://www.google.com/maps?q=${Number(
                    business.latitude
                )},${Number(
                    business.longitude
                )}&z=16&output=embed"
                loading="lazy"
                allowfullscreen
            ></iframe>
        `;
    }

    if (business.address) {

        return `
            <div class="map-placeholder">

                <div class="map-placeholder-icon">
                    📍
                </div>

                <strong>
                    Konum
                </strong>

                <p>
                    ${escapeHtml(
                        business.address
                    )}
                </p>

            </div>
        `;
    }

    return `
        <div class="map-placeholder">

            <div class="map-placeholder-icon">
                📍
            </div>

            <strong>
                Konum bilgisi eklenmemiş
            </strong>

            <p>
                İşletme sahibi konum bilgisini henüz eklememiş.
            </p>

        </div>
    `;
}

// ============================================================
// YORUMLARI YÜKLE
// ============================================================
async function loadReviews(
    businessId
) {

    const container =
        document.querySelector(
            "#reviews-list"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="reviews-loading">
            Yorumlar yükleniyor...
        </div>
    `;

    const {
        data: reviews,
        error
    } =
        await supabaseClient
            .from("reviews")
            .select(`
                id,
                name,
                rating,
                comment,
                created_at
            `)
            .eq(
                "business_id",
                businessId
            )
            .eq(
                "is_approved",
                true
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(
            "Yorum yükleme hatası:",
            error
        );

        container.innerHTML = `
            <div class="review-error">
                Yorumlar şu anda yüklenemiyor.
            </div>
        `;

        return;
    }

    const reviewList =
        reviews || [];

    const count =
        reviewList.length;

    let average = 0;

    if (count > 0) {

        const total =
            reviewList.reduce(
                (
                    sum,
                    review
                ) => {

                    return (
                        sum +
                        Number(
                            review.rating ||
                            0
                        )
                    );

                },
                0
            );

        average =
            total / count;
    }

    const averageElement =
        document.querySelector(
            "#review-average"
        );

    if (averageElement) {

        averageElement.textContent =
            average.toFixed(1);
    }

    const countElement =
        document.querySelector(
            "#review-count"
        );

    if (countElement) {

        countElement.textContent =
            count;
    }

    const starsElement =
        document.querySelector(
            "#review-stars-summary"
        );

    if (starsElement) {

        starsElement.textContent =
            starsHtml(average);
    }

    if (reviewList.length === 0) {

        container.innerHTML = `
            <div class="no-reviews">

                <div>
                    💬
                </div>

                <strong>
                    Henüz yorum yok
                </strong>

                <p>
                    Bu işletme için ilk yorumu sen yaz!
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML =
        reviewList
            .map(
                renderReview
            )
            .join("");
}

// ============================================================
// YORUM KARTI
// ============================================================
function renderReview(
    review
) {

    const date =
        review.created_at
            ? new Date(
                review.created_at
            ).toLocaleDateString(
                "tr-TR",
                {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            )
            : "";

    const name =
        review.name ||
        "Misafir";

    return `
        <article class="review-card">

            <div class="review-top">

                <div class="review-user">

                    <div class="review-avatar">

                        ${escapeHtml(
                            name
                                .charAt(0)
                                .toUpperCase()
                        )}

                    </div>

                    <div>

                        <strong>
                            ${escapeHtml(
                                name
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                date
                            )}
                        </small>

                    </div>

                </div>

                <div class="review-stars">
                    ${starsHtml(
                        review.rating
                    )}
                </div>

            </div>

            ${
                review.comment
                    ? `
                        <p class="review-comment">
                            ${escapeHtml(
                                review.comment
                            )}
                        </p>
                    `
                    : ""
            }

        </article>
    `;
}

// ============================================================
// YORUM FORMU
// ============================================================
function setupReviewForm(
    businessId
) {

    const form =
        document.querySelector(
            "#review-form"
        );

    if (!form) {

        console.error(
            "#review-form bulunamadı."
        );

        return;
    }

    const stars =
        form.querySelectorAll(
            ".star-input"
        );

    const ratingInput =
        form.querySelector(
            "#review-rating"
        );

    const ratingText =
        form.querySelector(
            "#selected-rating"
        );

    stars.forEach(
        star => {

            star.addEventListener(
                "click",
                function() {

                    const rating =
                        Number(
                            this.dataset.rating
                        );

                    ratingInput.value =
                        rating;

                    stars.forEach(
                        item => {

                            const itemRating =
                                Number(
                                    item.dataset.rating
                                );

                            item.classList.toggle(
                                "active",
                                itemRating <=
                                rating
                            );

                        }
                    );

                    if (ratingText) {

                        ratingText.textContent =
                            `${rating} / 5`;
                    }

                }
            );

        }
    );

    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            event.stopPropagation();

            const nameInput =
                form.querySelector(
                    "#review-name"
                );

            const commentInput =
                form.querySelector(
                    "#review-comment"
                );

            const submitButton =
                form.querySelector(
                    ".review-submit"
                );

            const name =
                nameInput
                    ? nameInput.value.trim()
                    : "";

            const comment =
                commentInput
                    ? commentInput.value.trim()
                    : "";

            const rating =
                Number(
                    ratingInput.value
                );

            if (name.length < 2) {

                showReviewMessage(
                    "Lütfen adınızı yazın.",
                    "error"
                );

                nameInput?.focus();

                return;
            }

            if (name.length > 50) {

                showReviewMessage(
                    "Adınız en fazla 50 karakter olabilir.",
                    "error"
                );

                return;
            }

            if (
                rating < 1 ||
                rating > 5
            ) {

                showReviewMessage(
                    "Lütfen 1 ile 5 arasında bir puan seçin.",
                    "error"
                );

                return;
            }

            if (
                comment.length > 1000
            ) {

                showReviewMessage(
                    "Yorumunuz en fazla 1000 karakter olabilir.",
                    "error"
                );

                return;
            }

            clearReviewMessage();

            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Gönderiliyor...";
            }

            try {

                const { error } =
                    await supabaseClient
                        .from("reviews")
                        .insert({
                            business_id:
                                businessId,
                            name:
                                name,
                            rating:
                                rating,
                            comment:
                                comment ||
                                null,
                            is_approved:
                                false
                        });

                if (error) {

                    console.error(
                        "Yorum gönderme hatası:",
                        error
                    );

                    showReviewMessage(
                        "Yorum gönderilemedi. Lütfen tekrar deneyin.",
                        "error"
                    );

                    return;
                }

                form.reset();

                ratingInput.value =
                    "";

                stars.forEach(
                    star => {

                        star.classList.remove(
                            "active"
                        );

                    }
                );

                if (ratingText) {

                    ratingText.textContent =
                        "Puan seçin";
                }

                showReviewMessage(
                    "Yorumunuz gönderildi! ⭐ Onaylandıktan sonra yayınlanacaktır.",
                    "success"
                );

                const message =
                    document.querySelector(
                        "#review-message"
                    );

                if (message) {

                    setTimeout(
                        () => {

                            message.scrollIntoView({
                                behavior:
                                    "smooth",
                                block:
                                    "center"
                            });

                        },
                        50
                    );
                }

            } catch (error) {

                console.error(
                    "Beklenmeyen yorum hatası:",
                    error
                );

                showReviewMessage(
                    "Bir hata oluştu. Lütfen tekrar deneyin.",
                    "error"
                );

            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Yorumu Gönder";
                }
            }
        }
    );
}

// ============================================================
// YORUM MESAJI
// ============================================================
function showReviewMessage(
    message,
    type
) {

    const element =
        document.querySelector(
            "#review-message"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        `review-message ${type}`;

    element.style.display =
        "block";
}

function clearReviewMessage() {

    const element =
        document.querySelector(
            "#review-message"
        );

    if (!element) {
        return;
    }

    element.textContent =
        "";

    element.style.display =
        "none";
}

// ============================================================
// HATA
// ============================================================
function showError(
    message
) {

    const container =
        document.querySelector(
            "#businessContainer"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="business-error">

            <div>
                😕
            </div>

            <h2>
                ${escapeHtml(
                    message
                )}
            </h2>

            <a href="index.html">
                Ana Sayfaya Dön
            </a>

        </div>
    `;
}

// ============================================================
// PAYLAŞ
// ============================================================
function setupShareButtons() {

    const shareButton =
        document.querySelector(
            "#share-business"
        );

    const copyButton =
        document.querySelector(
            "#copy-business-link"
        );

    if (shareButton) {

        shareButton.addEventListener(
            "click",
            async function() {

                try {

                    if (
                        navigator.share
                    ) {

                        await navigator.share({
                            title:
                                document.title,
                            text:
                                "Trabzon Anlık'ta bu işletmeye göz at!",
                            url:
                                window.location.href
                        });

                    } else {

                        await navigator.clipboard.writeText(
                            window.location.href
                        );

                        shareButton.textContent =
                            "✓ Link Kopyalandı";

                        setTimeout(
                            () => {

                                shareButton.textContent =
                                    "📤 Paylaş";

                            },
                            2000
                        );
                    }

                } catch (error) {

                    console.log(
                        "Paylaşım iptal edildi."
                    );
                }
            }
        );
    }

    if (copyButton) {

        copyButton.addEventListener(
            "click",
            async function() {

                try {

                    await navigator.clipboard.writeText(
                        window.location.href
                    );

                    copyButton.textContent =
                        "✓ Kopyalandı";

                    setTimeout(
                        () => {

                            copyButton.textContent =
                                "🔗 Linki Kopyala";

                        },
                        2000
                    );

                } catch (error) {

                    alert(
                        "Link kopyalanamadı."
                    );
                }
            }
        );
    }
}

// ============================================================
// BAŞLAT
// ============================================================
document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadBusiness();

    }
);