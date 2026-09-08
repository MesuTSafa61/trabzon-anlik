const SUPABASE_URL =
    "https://yhunhkzsecppbnhjewrt.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_0h5ycfDBJjgdf6bXlZ9OEg_K45u2b2v";

let supabaseClient = null;

// ============================================================
// SUPABASE BAŞLAT
// ============================================================
function initializeSupabase() {
    if (!window.supabase) {
        console.error("Supabase kütüphanesi yüklenemedi.");
        return false;
    }

    try {
        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );

        return true;
    } catch (error) {
        console.error(
            "Supabase başlatma hatası:",
            error
        );

        return false;
    }
}

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
    if (!phone) {
        return "";
    }

    let number =
        String(phone).replace(/\D/g, "");

    if (!number) {
        return "";
    }

    if (number.startsWith("00")) {
        number =
            number.substring(2);
    }

    if (number.startsWith("0")) {
        number =
            "90" +
            number.substring(1);
    }

    if (!number.startsWith("90")) {
        number =
            "90" +
            number;
    }

    return number;
}

function starsHtml(rating) {
    const value =
        Math.max(
            0,
            Math.min(
                5,
                Math.round(
                    Number(rating || 0)
                )
            )
        );

    let html = "";

    for (
        let i = 1;
        i <= 5;
        i++
    ) {
        html +=
            i <= value
                ? "★"
                : "☆";
    }

    return html;
}

function formatRating(value) {
    const rating =
        Number(value || 0);

    return Number.isFinite(rating)
        ? rating.toFixed(1)
        : "0.0";
}

function safeUrl(value, fallback = "#") {
    if (!value) {
        return fallback;
    }

    const url =
        String(value).trim();

    if (!url) {
        return fallback;
    }

    try {
        const parsed =
            new URL(
                url,
                window.location.origin
            );

        if (
            parsed.protocol === "http:" ||
            parsed.protocol === "https:"
        ) {
            return parsed.href;
        }
    } catch (error) {
        return fallback;
    }

    return fallback;
}

function getCurrentPageUrl() {
    return window.location.href;
}

// ============================================================
// INSTAGRAM
// ============================================================
function formatInstagram(value) {
    let instagram =
        String(
            value || ""
        ).trim();

    if (!instagram) {
        return "#";
    }

    if (
        instagram.startsWith("http://") ||
        instagram.startsWith("https://")
    ) {
        return safeUrl(
            instagram
        );
    }

    instagram =
        instagram
            .replace(/^@/, "")
            .trim();

    if (!instagram) {
        return "#";
    }

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
        String(
            value || ""
        ).trim();

    if (!website) {
        return "#";
    }

    if (
        website.startsWith("http://") ||
        website.startsWith("https://")
    ) {
        return safeUrl(
            website
        );
    }

    return safeUrl(
        "https://" + website
    );
}

// ============================================================
// HARİTA URL
// ============================================================
function getMapUrl(business) {
    const latitude =
        Number(
            business?.latitude
        );

    const longitude =
        Number(
            business?.longitude
        );

    if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
    ) {
        return (
            "https://www.google.com/maps/dir/?api=1" +
            `&destination=${latitude},${longitude}`
        );
    }

    const address =
        encodeURIComponent(
            [
                business?.address,
                business?.district,
                "Trabzon"
            ]
                .filter(Boolean)
                .join(", ")
        );

    if (!address) {
        return "#";
    }

    return (
        "https://www.google.com/maps/search/?api=1" +
        `&query=${address}`
    );
}

// ============================================================
// HARİTA GÖSTER
// ============================================================
function renderMap(business) {
    const latitude =
        Number(
            business?.latitude
        );

    const longitude =
        Number(
            business?.longitude
        );

    if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
    ) {
        return `
            <iframe
                src="https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed"
                loading="lazy"
                allowfullscreen
                referrerpolicy="no-referrer-when-downgrade"
                title="${escapeHtml(
                    business.name || "İşletme konumu"
                )}"
            ></iframe>
        `;
    }

    if (business?.address) {
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

                <a
                    href="${escapeHtml(
                        getMapUrl(business)
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="map-placeholder-button"
                >
                    Google Maps'te Aç →
                </a>

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
// GALERİ FOTOĞRAFLARINI YÜKLE
// ============================================================
async function loadBusinessImages(businessId) {
    if (!supabaseClient || !businessId) {
        return [];
    }

    try {
        const {
            data: images,
            error
        } =
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
                .eq(
                    "business_id",
                    businessId
                )
                .order(
                    "is_cover",
                    {
                        ascending: false
                    }
                )
                .order(
                    "sort_order",
                    {
                        ascending: true
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );

        if (error) {
            console.warn(
                "İşletme galerisi okunamadı:",
                error
            );

            return [];
        }

        return (
            images || []
        ).filter(
            image =>
                image &&
                image.image_url
        );

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
    const slug =
        getSlug();

    if (!slug) {
        showError(
            "İşletme bağlantısı bulunamadı."
        );

        return;
    }

    if (!supabaseClient) {
        showError(
            "Site bağlantısı kurulamadı. Lütfen sayfayı yenileyin."
        );

        return;
    }

    try {
        const {
            data: business,
            error
        } =
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
                .eq(
                    "slug",
                    slug
                )
                .eq(
                    "is_approved",
                    true
                )
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

        let category =
            null;

        if (business.category_id) {
            const {
                data: categoryData,
                error: categoryError
            } =
                await supabaseClient
                    .from("categories")
                    .select(
                        "name, icon"
                    )
                    .eq(
                        "id",
                        business.category_id
                    )
                    .maybeSingle();

            if (categoryError) {
                console.warn(
                    "Kategori alınamadı:",
                    categoryError
                );
            }

            category =
                categoryData || null;
        }

        renderBusiness(
            business,
            category,
            images
        );

        await loadReviews(
            business.id,
            business
        );

        setupReviewForm(
            business.id
        );

        setupShareButtons();

        setupFavoriteButton(
            business
        );

        setupGalleryLightbox();

        setupBusinessImageFallbacks();

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

    if (!container) {
        return;
    }

    document.title =
        `${business.name} | Trabzon Anlık`;

    const categoryName =
        category?.name ||
        "İŞLETME";

    const categoryIcon =
        category?.icon ||
        "🏪";

    const rating =
        Number(
            business.rating || 0
        );

    const reviewCount =
        Number(
            business.review_count || 0
        );

    let coverImage =
        null;

    if (images.length > 0) {
        coverImage =
            images.find(
                image =>
                    image.is_cover === true
            ) ||
            images[0];
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
                src="${escapeHtml(
                    coverUrl
                )}"
                alt="${escapeHtml(
                    business.name
                )}"
                draggable="false"
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
                ${escapeHtml(
                    categoryIcon
                )}
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
                ${escapeHtml(
                    categoryIcon
                )}
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
                                        data-gallery-url="${escapeHtml(
                                            image.image_url
                                        )}"
                                        aria-label="Fotoğrafı büyüt"
                                    >

                                        <img
                                            src="${escapeHtml(
                                                image.image_url
                                            )}"
                                            alt="${escapeHtml(
                                                business.name
                                            )} fotoğrafı"
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
        <article
            class="business-detail-card"
            data-business-id="${escapeHtml(
                business.id
            )}"
        >

            <div class="business-detail-image-wrap">

                ${imageHtml}

                <div class="business-image-overlay"></div>

                <div class="business-image-category">
                    ${escapeHtml(
                        categoryIcon
                    )}
                    ${escapeHtml(
                        categoryName
                    )}
                </div>

            </div>

            ${galleryHtml}

            <div class="business-detail-content">

                <div class="business-title-row">

                    <div class="business-title-main">

                        <h1 class="business-detail-title">
                            ${escapeHtml(
                                business.name
                            )}
                        </h1>

                    </div>

                    <button
                        type="button"
                        id="favorite-business"
                        class="favorite-business-button"
                        aria-label="İşletmeyi kaydet"
                        title="İşletmeyi kaydet"
                    >
                        ♡
                    </button>

                </div>

                <div class="business-detail-rating">

                    <span
                        class="detail-rating-stars"
                        id="business-detail-stars"
                    >
                        ${starsHtml(
                            rating
                        )}
                    </span>

                    <strong
                        id="business-detail-rating"
                    >
                        ${formatRating(
                            rating
                        )}
                    </strong>

                    <span>
                        (
                        <span id="business-detail-review-count">
                            ${reviewCount}
                        </span>
                        değerlendirme)
                    </span>

                </div>

                <p class="business-detail-description">
                    ${escapeHtml(
                        business.description ||
                        "Bu işletme hakkında henüz açıklama eklenmemiş."
                    )}
                </p>

                <div class="business-info">

                    ${
                        business.district
                            ? `
                                <div class="business-info-item">

                                    <span>📍</span>

                                    <div>

                                        <strong>
                                            İlçe
                                        </strong>

                                        <br>

                                        ${escapeHtml(
                                            business.district
                                        )}

                                    </div>

                                </div>
                            `
                            : ""
                    }

                    ${
                        business.address
                            ? `
                                <div class="business-info-item">

                                    <span>🏠</span>

                                    <div>

                                        <strong>
                                            Adres
                                        </strong>

                                        <br>

                                        ${escapeHtml(
                                            business.address
                                        )}

                                    </div>

                                </div>
                            `
                            : ""
                    }

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
                        business.phone &&
                        normalizePhone(
                            business.phone
                        )
                            ? `
                                <a
                                    class="business-action whatsapp"
                                    href="https://wa.me/${escapeHtml(
                                        normalizePhone(
                                            business.phone
                                        )
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
                                    href="${escapeHtml(
                                        formatInstagram(
                                            business.instagram
                                        )
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
                                    href="${escapeHtml(
                                        formatWebsite(
                                            business.website
                                        )
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
                                    href="${escapeHtml(
                                        getMapUrl(
                                            business
                                        )
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

                    <div class="business-map-title">
                        <strong>📍 Konum</strong>
                    </div>

                    ${renderMap(
                        business
                    )}

                </div>

            </div>

        </article>
    `;
}

// ============================================================
// İŞLETME FOTOĞRAF HATALARI
// ============================================================
function setupBusinessImageFallbacks() {
    const images =
        document.querySelectorAll(
            ".business-detail-image, .business-gallery-item img"
        );

    images.forEach(
        image => {
            image.addEventListener(
                "error",
                function() {
                    if (
                        this.classList.contains(
                            "business-detail-image"
                        )
                    ) {
                        this.style.display =
                            "none";

                        const fallback =
                            this.parentElement?.querySelector(
                                ".business-detail-image-fallback"
                            );

                        if (fallback) {
                            fallback.style.display =
                                "flex";
                        }
                    } else {
                        this.style.opacity =
                            "0.25";
                    }
                },
                {
                    once: true
                }
            );
        }
    );
}

// ============================================================
// GALERİ LIGHTBOX
// ZOOM SİSTEMİNE DOKUNULMADI
// ============================================================
function setupGalleryLightbox() {

    const galleryItems =
        document.querySelectorAll(
            ".business-gallery-item"
        );

    if (
        !galleryItems.length
    ) {
        return;
    }

    const galleryImages =
        Array.from(
            galleryItems
        )
            .map(
                item =>
                    item.dataset.galleryUrl
            )
            .filter(Boolean);

    if (
        !galleryImages.length
    ) {
        return;
    }

    let currentIndex =
        0;

    function openLightbox(
        index
    ) {

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
        // ZOOM AYARLARI
        // ====================================================

        const FIRST_ZOOM =
            1.6;

        const SECOND_ZOOM =
            2.1;

        const MAX_PINCH_ZOOM =
            2.3;

        let zoomScale =
            1;

        let isZoomed =
            false;

        let isAnimating =
            false;

        // ====================================================
        // PAN
        // ====================================================

        let translateX =
            0;

        let translateY =
            0;

        let dragStartX =
            0;

        let dragStartY =
            0;

        let startTranslateX =
            0;

        let startTranslateY =
            0;

        let isDragging =
            false;

        // ====================================================
        // TOUCH
        // ====================================================

        let touchStartX =
            0;

        let touchStartY =
            0;

        let touchStartTime =
            0;

        let pinchStartDistance =
            0;

        let pinchStartScale =
            1;

        let lastTapTime =
            0;

        // ====================================================
        // TOUCH MESAFESİ
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
        // ZOOM DURUMU
        // ====================================================

        function updateZoomState() {

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
                isZoomed
                    ? "grab"
                    : "zoom-in";
        }

        // ====================================================
        // PAN SINIRI
        // ====================================================

        function clampPan() {

            if (
                !isZoomed ||
                zoomScale <= 1
            ) {

                translateX =
                    0;

                translateY =
                    0;

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
        // TRANSFORM
        // ====================================================

        function applyTransform(
            animate = false
        ) {

            if (!isZoomed) {

                image.style.transition =
                    animate
                        ? "transform .25s ease"
                        : "none";

                image.style.transform =
                    "translate3d(0,0,0) scale(1)";

                return;
            }

            clampPan();

            image.style.transition =
                animate
                    ? "transform .25s cubic-bezier(.2,.8,.2,1)"
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

            zoomScale =
                1;

            translateX =
                0;

            translateY =
                0;

            isZoomed =
                false;

            isDragging =
                false;

            image.classList.remove(
                "gallery-zoomed"
            );

            content.classList.remove(
                "gallery-zoom-mode"
            );

            image.style.cursor =
                "zoom-in";

            image.style.transformOrigin =
                "50% 50%";

            image.style.transition =
                animate
                    ? "transform .25s ease"
                    : "";

            image.style.transform =
                animate
                    ? "translate3d(0,0,0) scale(1)"
                    : "";
        }

        // ====================================================
        // NOKTAYA ZOOM
        // ====================================================

        function zoomToPoint(
            clientX,
            clientY,
            targetScale
        ) {

            if (isAnimating) {
                return;
            }

            const rect =
                image.getBoundingClientRect();

            const containerRect =
                content.getBoundingClientRect();

            if (
                rect.width <= 0 ||
                rect.height <= 0
            ) {
                return;
            }

            const oldScale =
                zoomScale;

            const centerX =
                containerRect.left +
                containerRect.width / 2;

            const centerY =
                containerRect.top +
                containerRect.height / 2;

            const localX =
                clientX -
                centerX -
                translateX;

            const localY =
                clientY -
                centerY -
                translateY;

            const newScale =
                targetScale;

            translateX =
                (
                    clientX -
                    centerX
                ) -
                localX *
                (
                    newScale /
                    oldScale
                );

            translateY =
                (
                    clientY -
                    centerY
                ) -
                localY *
                (
                    newScale /
                    oldScale
                );

            zoomScale =
                newScale;

            updateZoomState();

            clampPan();

            applyTransform(
                true
            );
        }

        // ====================================================
        // TIKLAMA ZOOM
        // ====================================================

        function handleZoomClick(
            clientX,
            clientY
        ) {

            if (isAnimating) {
                return;
            }

            if (!isZoomed) {

                zoomToPoint(
                    clientX,
                    clientY,
                    FIRST_ZOOM
                );

                return;
            }

            if (
                zoomScale <
                1.9
            ) {

                zoomToPoint(
                    clientX,
                    clientY,
                    SECOND_ZOOM
                );

                return;
            }

            resetZoom(
                true
            );
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

            isAnimating =
                true;

            const outgoingTransform =
                direction > 0
                    ? "translate3d(-55px,0,0) scale(.98)"
                    : "translate3d(55px,0,0) scale(.98)";

            const incomingTransform =
                direction > 0
                    ? "translate3d(55px,0,0) scale(.98)"
                    : "translate3d(-55px,0,0) scale(.98)";

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
        // SONRAKİ FOTOĞRAF
        // ====================================================

        function showNext() {

            if (
                isAnimating ||
                isZoomed
            ) {
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
        // ÖNCEKİ FOTOĞRAF
        // ====================================================

        function showPrevious() {

            if (
                isAnimating ||
                isZoomed
            ) {
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

                if (isZoomed) {

                    resetZoom(
                        true
                    );

                } else {

                    const rect =
                        image.getBoundingClientRect();

                    handleZoomClick(
                        rect.left +
                        rect.width / 2,
                        rect.top +
                        rect.height / 2
                    );
                }
            }
        }

        // ====================================================
        // KAPAT
        // ====================================================

        closeButton.addEventListener(
            "click",
            close
        );

        // ====================================================
        // ÖNCEKİ
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
        // SONRAKİ
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
        // MASAÜSTÜ TIKLAMA
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

                handleZoomClick(
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

                handleZoomClick(
                    event.clientX,
                    event.clientY
                );
            }
        );

        // ====================================================
        // MOUSE DOWN
        // ====================================================

        image.addEventListener(
            "mousedown",
            function(event) {

                if (!isZoomed) {
                    return;
                }

                event.preventDefault();

                isDragging =
                    true;

                dragStartX =
                    event.clientX;

                dragStartY =
                    event.clientY;

                startTranslateX =
                    translateX;

                startTranslateY =
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
                    !isDragging ||
                    !isZoomed
                ) {
                    return;
                }

                translateX =
                    startTranslateX +
                    (
                        event.clientX -
                        dragStartX
                    );

                translateY =
                    startTranslateY +
                    (
                        event.clientY -
                        dragStartY
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

                if (!isDragging) {
                    return;
                }

                isDragging =
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
        // DRAG ENGELLE
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

                    isDragging =
                        true;

                    dragStartX =
                        touch.clientX;

                    dragStartY =
                        touch.clientY;

                    startTranslateX =
                        translateX;

                    startTranslateY =
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

                    zoomScale =
                        Math.max(
                            1,
                            Math.min(
                                MAX_PINCH_ZOOM,
                                pinchStartScale *
                                (
                                    distance /
                                    pinchStartDistance
                                )
                            )
                        );

                    updateZoomState();

                    applyTransform(
                        false
                    );

                    return;
                }

                if (
                    isZoomed &&
                    event.touches.length === 1 &&
                    isDragging
                ) {

                    const touch =
                        event.touches[0];

                    translateX =
                        startTranslateX +
                        (
                            touch.clientX -
                            dragStartX
                        );

                    translateY =
                        startTranslateY +
                        (
                            touch.clientY -
                            dragStartY
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

                if (
                    pinchStartDistance > 0
                ) {

                    pinchStartDistance =
                        0;

                    isDragging =
                        false;

                    if (
                        zoomScale <=
                        1.05
                    ) {

                        resetZoom(
                            true
                        );

                    } else {

                        updateZoomState();

                        clampPan();

                        applyTransform(
                            false
                        );
                    }

                    return;
                }

                if (isZoomed) {

                    isDragging =
                        false;

                    clampPan();

                    applyTransform(
                        false
                    );

                    return;
                }

                const touch =
                    event.changedTouches[0];

                const distanceX =
                    touch.clientX -
                    touchStartX;

                const distanceY =
                    touch.clientY -
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
        // MOBİL DOUBLE TAP
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

                if (
                    pinchStartDistance > 0
                ) {
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
                    300
                ) {

                    lastTapTime =
                        0;

                    handleZoomClick(
                        touch.clientX,
                        touch.clientY
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
        (
            item,
            index
        ) => {

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
// YORUMLARI YÜKLE
// ============================================================
async function loadReviews(
    businessId,
    business
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

    try {
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
            throw error;
        }

        const reviewList =
            reviews || [];

        const count =
            reviewList.length;

        let average =
            0;

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
                total /
                count;
        } else {
            average =
                Number(
                    business?.rating || 0
                );
        }

        updateBusinessRatingSummary(
            average,
            count
        );

        updateReviewDistribution(
            reviewList
        );

        if (
            reviewList.length === 0
        ) {

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

    } catch (error) {

        console.error(
            "Yorum yükleme hatası:",
            error
        );

        container.innerHTML = `
            <div class="review-error">
                Yorumlar şu anda yüklenemiyor.
            </div>
        `;
    }
}

// ============================================================
// İŞLETME PUAN ÖZETİNİ GÜNCELLE
// ============================================================
function updateBusinessRatingSummary(
    average,
    count
) {
    const averageElement =
        document.querySelector(
            "#review-average"
        );

    if (averageElement) {
        averageElement.textContent =
            formatRating(
                average
            );
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
            starsHtml(
                average
            );
    }

    const detailRating =
        document.querySelector(
            "#business-detail-rating"
        );

    if (detailRating) {
        detailRating.textContent =
            formatRating(
                average
            );
    }

    const detailStars =
        document.querySelector(
            "#business-detail-stars"
        );

    if (detailStars) {
        detailStars.textContent =
            starsHtml(
                average
            );
    }

    const detailCount =
        document.querySelector(
            "#business-detail-review-count"
        );

    if (detailCount) {
        detailCount.textContent =
            count;
    }
}

// ============================================================
// YILDIZ DAĞILIMI
// ============================================================
function updateReviewDistribution(
    reviews
) {
    const distribution =
        {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        };

    reviews.forEach(
        review => {
            const rating =
                Number(
                    review.rating
                );

            if (
                rating >= 1 &&
                rating <= 5
            ) {
                distribution[
                    Math.round(rating)
                ]++;
            }
        }
    );

    const total =
        reviews.length;

    const distributionContainer =
        document.querySelector(
            "#review-distribution"
        );

    if (
        !distributionContainer
    ) {
        return;
    }

    distributionContainer.innerHTML =
        [5, 4, 3, 2, 1]
            .map(
                rating => {

                    const amount =
                        distribution[
                            rating
                        ];

                    const percentage =
                        total > 0
                            ? Math.round(
                                (
                                    amount /
                                    total
                                ) *
                                100
                            )
                            : 0;

                    return `
                        <div class="review-distribution-row">

                            <span>
                                ${rating}★
                            </span>

                            <div class="review-distribution-bar">
                                <span
                                    style="width:${percentage}%"
                                ></span>
                            </div>

                            <small>
                                ${amount}
                            </small>

                        </div>
                    `;
                }
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
                    day:
                        "numeric",
                    month:
                        "long",
                    year:
                        "numeric"
                }
            )
            : "";

    const name =
        String(
            review.name ||
            "Misafir"
        ).trim();

    const safeName =
        name || "Misafir";

    return `
        <article class="review-card">

            <div class="review-top">

                <div class="review-user">

                    <div class="review-avatar">
                        ${escapeHtml(
                            safeName
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </div>

                    <div>

                        <strong>
                            ${escapeHtml(
                                safeName
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
        console.warn(
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

                    if (
                        !ratingInput
                    ) {
                        return;
                    }

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
                    ratingInput?.value || 0
                );

            if (
                name.length <
                2
            ) {
                showReviewMessage(
                    "Lütfen adınızı yazın.",
                    "error"
                );

                nameInput?.focus();

                return;
            }

            if (
                name.length >
                50
            ) {
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
                comment.length >
                1000
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

                const {
                    error
                } =
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

                if (ratingInput) {
                    ratingInput.value =
                        "";
                }

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
                    "Yorumunuz gönderildi! ⭐ Yönetici onayından sonra yayınlanacaktır.",
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
// FAVORİ / KAYDET
// ============================================================
function setupFavoriteButton(
    business
) {
    const button =
        document.querySelector(
            "#favorite-business"
        );

    if (!button) {
        return;
    }

    const storageKey =
        "trabzon_anlik_favorites";

    function getFavorites() {
        try {
            const saved =
                localStorage.getItem(
                    storageKey
                );

            const parsed =
                saved
                    ? JSON.parse(saved)
                    : [];

            return Array.isArray(
                parsed
            )
                ? parsed
                : [];
        } catch (error) {
            return [];
        }
    }

    function saveFavorites(
        favorites
    ) {
        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify(
                    favorites
                )
            );

            return true;
        } catch (error) {
            console.warn(
                "Favori kaydedilemedi:",
                error
            );

            return false;
        }
    }

    function isFavorite() {
        return getFavorites()
            .some(
                item =>
                    String(item.id) ===
                    String(business.id)
            );
    }

    function updateButton() {
        const active =
            isFavorite();

        button.classList.toggle(
            "active",
            active
        );

        button.innerHTML =
            active
                ? "♥"
                : "♡";

        button.title =
            active
                ? "Kaydedilenlerden çıkar"
                : "İşletmeyi kaydet";

        button.setAttribute(
            "aria-label",
            active
                ? "Kaydedilenlerden çıkar"
                : "İşletmeyi kaydet"
        );
    }

    button.addEventListener(
        "click",
        function() {

            const favorites =
                getFavorites();

            const existingIndex =
                favorites.findIndex(
                    item =>
                        String(item.id) ===
                        String(business.id)
                );

            if (
                existingIndex >= 0
            ) {
                favorites.splice(
                    existingIndex,
                    1
                );

                saveFavorites(
                    favorites
                );

                updateButton();

                showTemporaryBusinessMessage(
                    "İşletme kaydedilenlerden çıkarıldı."
                );

            } else {

                favorites.push({
                    id:
                        business.id,
                    name:
                        business.name,
                    slug:
                        business.slug,
                    image_url:
                        business.image_url ||
                        "",
                    saved_at:
                        new Date().toISOString()
                });

                saveFavorites(
                    favorites
                );

                updateButton();

                showTemporaryBusinessMessage(
                    "İşletme kaydedildi ❤️"
                );
            }
        }
    );

    updateButton();
}

// ============================================================
// GEÇİCİ BİLDİRİM
// ============================================================
function showTemporaryBusinessMessage(
    message
) {
    const old =
        document.querySelector(
            ".business-temp-message"
        );

    if (old) {
        old.remove();
    }

    const element =
        document.createElement(
            "div"
        );

    element.className =
        "business-temp-message";

    element.textContent =
        message;

    document.body.appendChild(
        element
    );

    requestAnimationFrame(
        () => {
            element.classList.add(
                "show"
            );
        }
    );

    setTimeout(
        () => {

            element.classList.remove(
                "show"
            );

            setTimeout(
                () => {
                    element.remove();
                },
                250
            );

        },
        2200
    );
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

                const shareData = {
                    title:
                        document.title,
                    text:
                        "Trabzon Anlık'ta bu işletmeye göz at!",
                    url:
                        getCurrentPageUrl()
                };

                try {

                    if (
                        navigator.share
                    ) {

                        await navigator.share(
                            shareData
                        );

                        return;
                    }

                    await copyText(
                        getCurrentPageUrl()
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

                } catch (error) {

                    if (
                        error?.name ===
                        "AbortError"
                    ) {
                        return;
                    }

                    console.warn(
                        "Paylaşım hatası:",
                        error
                    );

                    showTemporaryBusinessMessage(
                        "Paylaşım şu anda kullanılamıyor."
                    );
                }
            }
        );
    }

    if (copyButton) {

        copyButton.addEventListener(
            "click",
            async function() {

                const success =
                    await copyText(
                        getCurrentPageUrl()
                    );

                if (success) {

                    copyButton.textContent =
                        "✓ Kopyalandı";

                    setTimeout(
                        () => {
                            copyButton.textContent =
                                "🔗 Linki Kopyala";
                        },
                        2000
                    );

                } else {

                    showTemporaryBusinessMessage(
                        "Link kopyalanamadı."
                    );
                }
            }
        );
    }
}

// ============================================================
// METİN KOPYALA
// ============================================================
async function copyText(
    text
) {
    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {
            await navigator.clipboard.writeText(
                text
            );

            return true;
        }

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value =
            text;

        textarea.style.position =
            "fixed";

        textarea.style.left =
            "-9999px";

        textarea.style.top =
            "0";

        document.body.appendChild(
            textarea
        );

        textarea.focus();

        textarea.select();

        const successful =
            document.execCommand(
                "copy"
            );

        textarea.remove();

        return successful;

    } catch (error) {

        console.warn(
            "Kopyalama hatası:",
            error
        );

        return false;
    }
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
// GERİ / ANA SAYFA
// ============================================================
function setupBackNavigation() {
    const buttons =
        document.querySelectorAll(
            "[data-back-business]"
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    if (
                        document.referrer &&
                        document.referrer.includes(
                            window.location.hostname
                        )
                    ) {
                        history.back();
                    } else {
                        window.location.href =
                            "index.html";
                    }
                }
            );
        }
    );
}

// ============================================================
// BAŞLAT
// ============================================================
document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "Trabzon Anlık işletme sayfası başlatılıyor..."
        );

        const connected =
            initializeSupabase();

        if (!connected) {

            showError(
                "Site bağlantısı kurulamadı. Lütfen sayfayı yenileyin."
            );

            return;
        }

        setupBackNavigation();

        await loadBusiness();

        console.log(
            "Trabzon Anlık işletme sayfası hazır."
        );
    }
);