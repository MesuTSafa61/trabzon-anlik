const SUPABASE_URL =
    "https://yhunhkzsecppbnhjewrt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_0h5ycfDBJjgdf6bXlZ9OEg_K45u2b2v";

let supabaseClient = null;

// ============================================================
// ANALYTICS - ZİYARETÇİ TAKİP SİSTEMİ
// ============================================================

const ANALYTICS_VISITOR_KEY =
    "trabzon_anlik_visitor_id";

function getAnalyticsVisitorId() {
    try {
        let visitorId =
            localStorage.getItem(
                ANALYTICS_VISITOR_KEY
            );

        if (!visitorId) {
            if (
                window.crypto &&
                typeof window.crypto.randomUUID ===
                    "function"
            ) {
                visitorId =
                    window.crypto.randomUUID();
            } else {
                visitorId =
                    "visitor_" +
                    Date.now().toString(36) +
                    "_" +
                    Math.random()
                        .toString(36)
                        .substring(2, 12);
            }

            localStorage.setItem(
                ANALYTICS_VISITOR_KEY,
                visitorId
            );
        }

        return visitorId;
    } catch (error) {
        console.warn(
            "Analytics visitor ID oluşturulamadı:",
            error
        );

        return (
            "visitor_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 12)
        );
    }
}

async function trackAnalytics(
    eventType,
    businessId = null,
    eventId = null
) {
    try {
        if (!supabaseClient) {
            return;
        }

        const visitorId =
            getAnalyticsVisitorId();

        const { error } =
            await supabaseClient
                .from("analytics_events")
                .insert({
                    event_type:
                        eventType,
                    business_id:
                        businessId,
                    event_id:
                        eventId,
                    visitor_id:
                        visitorId
                });

        if (error) {
            console.warn(
                "Analytics kayıt hatası:",
                error
            );
            return;
        }

        console.log(
            "Analytics kaydedildi:",
            eventType,
            businessId
        );
    } catch (error) {
        console.warn(
            "Analytics sistem hatası:",
            error
        );
    }
}

function trackPageView() {
    trackAnalytics("page_view");
}

// ============================================================
// SUPABASE
// ============================================================

function initializeSupabase() {
    if (!window.supabase) {
        console.error(
            "Supabase kütüphanesi yüklenemedi."
        );
        return false;
    }

    try {
        supabaseClient =
            window.supabase.createClient(
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

function getBusinessParams() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    return {
        slug: params.get("slug"),
        id: params.get("id")
    };
}

function normalizePhone(phone) {
    if (!phone) return "";

    let number =
        String(phone).replace(
            /\D/g,
            ""
        );

    if (!number) return "";

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
            "90" + number;
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
                    Number(
                        rating || 0
                    )
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

function safeUrl(
    value,
    fallback = "#"
) {
    if (!value) return fallback;

    const url =
        String(value).trim();

    if (!url) return fallback;

    try {
        const parsed =
            new URL(
                url,
                window.location.origin
            );

        if (
            parsed.protocol ===
                "http:" ||
            parsed.protocol ===
                "https:"
        ) {
            return parsed.href;
        }
    } catch (error) {}

    return fallback;
}

function getCurrentPageUrl() {
    return window.location.href;
}

function formatInstagram(value) {
    let instagram =
        String(value || "").trim();

    if (!instagram) return "#";

    if (
        instagram.startsWith(
            "http://"
        ) ||
        instagram.startsWith(
            "https://"
        )
    ) {
        return safeUrl(
            instagram
        );
    }

    instagram = instagram
        .replace(/^@/, "")
        .trim();

    if (!instagram) return "#";

    return (
        "https://instagram.com/" +
        encodeURIComponent(
            instagram
        )
    );
}

function formatWebsite(value) {
    let website =
        String(value || "").trim();

    if (!website) return "#";

    if (
        website.startsWith(
            "http://"
        ) ||
        website.startsWith(
            "https://"
        )
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
// HARİTA
// ============================================================

function getMapUrl(business) {
    const latitude =
        Number(business?.latitude);

    const longitude =
        Number(business?.longitude);

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

    if (!address) return "#";

    return (
        "https://www.google.com/maps/search/?api=1" +
        `&query=${address}`
    );
}

function renderMap(business) {
    const latitude =
        Number(business?.latitude);

    const longitude =
        Number(business?.longitude);

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
                    business.name ||
                        "İşletme konumu"
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

                <strong>Konum</strong>

                <p>
                    ${escapeHtml(
                        business.address
                    )}
                </p>

                <a
                    href="${escapeHtml(
                        getMapUrl(
                            business
                        )
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
// İŞLETME FOTOĞRAFLARI
// ============================================================

async function loadBusinessImages(
    businessId
) {
    if (
        !supabaseClient ||
        !businessId
    ) {
        return [];
    }

    try {
        const {
            data: images,
            error
        } =
            await supabaseClient
                .from(
                    "business_images"
                )
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
                        ascending:
                            false
                    }
                )
                .order(
                    "sort_order",
                    {
                        ascending:
                            true
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            true
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
// KATALOG FOTOĞRAFLARINI TOPLU YÜKLE
// ============================================================

async function loadCatalogImages(
    businessIds
) {
    const imageMap = {};

    if (
        !supabaseClient ||
        !Array.isArray(
            businessIds
        ) ||
        !businessIds.length
    ) {
        return imageMap;
    }

    try {
        const {
            data: images,
            error
        } =
            await supabaseClient
                .from(
                    "business_images"
                )
                .select(`
                    id,
                    business_id,
                    image_url,
                    is_cover,
                    sort_order,
                    created_at
                `)
                .in(
                    "business_id",
                    businessIds
                )
                .order(
                    "is_cover",
                    {
                        ascending:
                            false
                    }
                )
                .order(
                    "sort_order",
                    {
                        ascending:
                            true
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            true
                    }
                );

        if (error) {
            console.warn(
                "Katalog işletme fotoğrafları alınamadı:",
                error
            );

            return imageMap;
        }

        (
            images || []
        ).forEach(
            image => {
                if (
                    !image ||
                    !image.business_id ||
                    !image.image_url
                ) {
                    return;
                }

                const key =
                    String(
                        image.business_id
                    );

                if (
                    !imageMap[key]
                ) {
                    imageMap[key] =
                        [];
                }

                imageMap[key].push(
                    image
                );
            }
        );
    } catch (error) {
        console.warn(
            "Katalog fotoğraf yükleme hatası:",
            error
        );
    }

    return imageMap;
}

// ============================================================
// DETAY/KATALOG BÖLÜMLERİ
// ============================================================

function hideDetailOnlySections() {
    [
        "#review-form",
        "#reviews-list",
        "#review-distribution"
    ].forEach(
        selector => {
            const element =
                document.querySelector(
                    selector
                );

            if (!element) return;

            const section =
                element.closest(
                    "section, .reviews-section, .review-section, .business-reviews"
                );

            if (section) {
                section.style.display =
                    "none";
            } else {
                element.style.display =
                    "none";
            }
        }
    );
}

function showDetailOnlySections() {
    [
        "#review-form",
        "#reviews-list",
        "#review-distribution"
    ].forEach(
        selector => {
            const element =
                document.querySelector(
                    selector
                );

            if (!element) return;

            const section =
                element.closest(
                    "section, .reviews-section, .review-section, .business-reviews"
                );

            if (section) {
                section.style.display =
                    "";
            } else {
                element.style.display =
                    "";
            }
        }
    );
}

// ============================================================
// ANA YÜKLEME
// ============================================================

async function loadBusiness() {
    const {
        slug,
        id
    } = getBusinessParams();

    if (!supabaseClient) {
        showError(
            "Site bağlantısı kurulamadı. Lütfen sayfayı yenileyin."
        );

        return;
    }

    if (!slug && !id) {
        await loadBusinessCatalog();

        return;
    }

    // ========================================================
    // DETAY
    // ========================================================

    try {
        let businessQuery =
            supabaseClient
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
                    "is_approved",
                    true
                );

        if (id) {
            businessQuery =
                businessQuery.eq(
                    "id",
                    id
                );
        } else {
            businessQuery =
                businessQuery.eq(
                    "slug",
                    slug
                );
        }

        const {
            data: business,
            error
        } =
            await businessQuery.maybeSingle();

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

        showDetailOnlySections();

        const images =
            await loadBusinessImages(
                business.id
            );

        let category = null;

        if (
            business.category_id
        ) {
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
                categoryData ||
                null;
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

        // ====================================================
        // ANALYTICS
        // Gerçek işletme detay sayfası görüntülendi.
        // ====================================================
        trackAnalytics(
            "business_view",
            business.id
        );
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
// KATALOG
// ============================================================

async function loadBusinessCatalog() {
    const container =
        document.querySelector(
            "#businessContainer"
        );

    if (!container) return;

    hideDetailOnlySections();

    document.title =
        "İşletmeler | Trabzon Anlık";

    container.innerHTML = `
        <section class="business-catalog">
            <div class="business-catalog-header">
                <div>
                    <span class="business-catalog-kicker">
                        TRABZON ANLIK
                    </span>

                    <h1>
                        İşletmeler
                    </h1>

                    <p>
                        Trabzon'daki işletmeleri keşfet.
                    </p>
                </div>

                <div class="business-catalog-count">
                    Yükleniyor...
                </div>
            </div>

            <div class="business-catalog-loading">
                <div class="business-catalog-spinner"></div>

                <span>
                    İşletmeler yükleniyor...
                </span>
            </div>
        </section>
    `;

    try {
        const {
            data: businesses,
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
                    image_url,
                    rating,
                    review_count,
                    category_id
                `)
                .eq(
                    "is_approved",
                    true
                )
                .order(
                    "name",
                    {
                        ascending:
                            true
                    }
                );

        if (error) {
            console.error(
                "İşletme kataloğu hatası:",
                error
            );

            showError(
                "İşletmeler yüklenemedi. Lütfen tekrar deneyin."
            );

            return;
        }

        const businessList =
            businesses || [];

        if (!businessList.length) {
            container.innerHTML = `
                <section class="business-catalog">
                    <div class="business-catalog-header">
                        <div>
                            <span class="business-catalog-kicker">
                                TRABZON ANLIK
                            </span>

                            <h1>
                                İşletmeler
                            </h1>
                        </div>
                    </div>

                    <div class="business-catalog-empty">
                        <div class="business-catalog-empty-icon">
                            🏪
                        </div>

                        <h2>
                            Henüz işletme bulunmuyor
                        </h2>

                        <p>
                            Onaylanan işletmeler burada görünecek.
                        </p>
                    </div>
                </section>
            `;

            return;
        }

        // ====================================================
        // KATEGORİLER
        // ====================================================

        const categoryIds = [
            ...new Set(
                businessList
                    .map(
                        business =>
                            business.category_id
                    )
                    .filter(Boolean)
            )
        ];

        const categoryMap = {};

        if (
            categoryIds.length
        ) {
            const {
                data: categories,
                error: categoryError
            } =
                await supabaseClient
                    .from("categories")
                    .select(
                        "id, name, icon"
                    )
                    .in(
                        "id",
                        categoryIds
                    );

            if (categoryError) {
                console.warn(
                    "Kategoriler alınamadı:",
                    categoryError
                );
            } else {
                (
                    categories || []
                ).forEach(
                    category => {
                        categoryMap[
                            String(
                                category.id
                            )
                        ] =
                            category;
                    }
                );
            }
        }

        // ====================================================
        // TÜM İŞLETMELERİN FOTOĞRAFLARINI TEK SEFERDE AL
        // ====================================================

        const businessIds =
            businessList.map(
                business =>
                    business.id
            );

        const catalogImageMap =
            await loadCatalogImages(
                businessIds
            );

        // ====================================================
        // KATALOG
        // ====================================================

        container.innerHTML = `
            <section class="business-catalog">
                <div class="business-catalog-header">
                    <div>
                        <span class="business-catalog-kicker">
                            TRABZON ANLIK
                        </span>

                        <h1>
                            İşletmeler
                        </h1>

                        <p>
                            Trabzon'daki işletmeleri keşfet.
                        </p>
                    </div>

                    <div class="business-catalog-count">
                        ${businessList.length}
                        işletme
                    </div>
                </div>

                <div class="business-catalog-grid">
                    ${
                        businessList
                            .map(
                                business =>
                                    renderBusinessCatalogCard(
                                        business,
                                        categoryMap[
                                            String(
                                                business.category_id
                                            )
                                        ] ||
                                            null,
                                        catalogImageMap[
                                            String(
                                                business.id
                                            )
                                        ] ||
                                            []
                                    )
                            )
                            .join("")
                    }
                </div>
            </section>
        `;

        setupCatalogImageFallbacks();
    } catch (error) {
        console.error(
            "İşletme kataloğu genel hata:",
            error
        );

        showError(
            "İşletmeler yüklenirken bir hata oluştu."
        );
    }
}

// ============================================================
// KATALOG KARTI
// ============================================================

function renderBusinessCatalogCard(
    business,
    category,
    images = []
) {
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
            business.review_count ||
                0
        );

    let imageUrl = "";

    if (images.length) {
        const coverImage =
            images.find(
                image =>
                    image.is_cover ===
                    true
            ) ||
            images[0];

        imageUrl =
            coverImage?.image_url ||
            "";
    }

    if (!imageUrl) {
        imageUrl =
            business.image_url ||
            "";
    }

    const businessUrl =
        business.slug
            ? `isletme.html?slug=${encodeURIComponent(
                  business.slug
              )}`
            : `isletme.html?id=${encodeURIComponent(
                  business.id
              )}`;

    return `
        <a
            href="${escapeHtml(
                businessUrl
            )}"
            class="business-catalog-card"
        >
            <div
                class="business-catalog-image-wrap"
            >
                ${
                    imageUrl
                        ? `
                            <img
                                class="business-catalog-image"
                                src="${escapeHtml(
                                    imageUrl
                                )}"
                                alt="${escapeHtml(
                                    business.name
                                )}"
                                loading="lazy"
                                draggable="false"
                            >

                            <div
                                class="business-catalog-image-fallback"
                                style="display:none;"
                            >
                                ${escapeHtml(
                                    categoryIcon
                                )}
                            </div>
                        `
                        : `
                            <div
                                class="business-catalog-image-fallback"
                            >
                                ${escapeHtml(
                                    categoryIcon
                                )}
                            </div>
                        `
                }

                <div
                    class="business-catalog-category"
                >
                    ${escapeHtml(
                        categoryIcon
                    )}
                    ${escapeHtml(
                        categoryName
                    )}
                </div>
            </div>

            <div
                class="business-catalog-content"
            >
                <h2>
                    ${escapeHtml(
                        business.name
                    )}
                </h2>

                <div
                    class="business-catalog-rating"
                >
                    <span
                        class="business-catalog-stars"
                    >
                        ${starsHtml(
                            rating
                        )}
                    </span>

                    <strong>
                        ${formatRating(
                            rating
                        )}
                    </strong>

                    <span>
                        (${reviewCount})
                    </span>
                </div>

                ${
                    business.district
                        ? `
                            <div
                                class="business-catalog-location"
                            >
                                📍
                                ${escapeHtml(
                                    business.district
                                )}
                            </div>
                        `
                        : ""
                }

                ${
                    business.address
                        ? `
                            <div
                                class="business-catalog-address"
                            >
                                ${escapeHtml(
                                    business.address
                                )}
                            </div>
                        `
                        : ""
                }

                <div
                    class="business-catalog-detail"
                >
                    <span>
                        İşletmeyi Gör
                    </span>

                    <span>
                        →
                    </span>
                </div>
            </div>
        </a>
    `;
}

// ============================================================
// KATALOG FOTOĞRAF HATALARI
// ============================================================

function setupCatalogImageFallbacks() {
    document
        .querySelectorAll(
            ".business-catalog-image"
        )
        .forEach(
            image => {
                image.addEventListener(
                    "error",
                    function() {
                        this.style.display =
                            "none";

                        const fallback =
                            this.parentElement?.querySelector(
                                ".business-catalog-image-fallback"
                            );

                        if (fallback) {
                            fallback.style.display =
                                "flex";
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
// İŞLETME DETAY
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
            business.review_count ||
                0
        );

    let coverImage = null;

    if (images.length) {
        coverImage =
            images.find(
                image =>
                    image.is_cover ===
                    true
            ) ||
            images[0];
    }

    const coverUrl =
        coverImage?.image_url ||
        business.image_url ||
        "";

    let imageHtml = "";

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

    if (images.length) {
        galleryHtml = `
            <div class="business-gallery">
                <div class="business-gallery-title">
                    <span>📷</span>

                    <strong>
                        Fotoğraflar
                    </strong>

                    <small>
                        ${images.length}
                        fotoğraf
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
            <div
                class="business-detail-image-wrap"
            >
                ${imageHtml}

                <div
                    class="business-image-overlay"
                ></div>

                <div
                    class="business-image-category"
                >
                    ${escapeHtml(
                        categoryIcon
                    )}
                    ${escapeHtml(
                        categoryName
                    )}
                </div>
            </div>

            ${galleryHtml}

            <div
                class="business-detail-content"
            >
                <div
                    class="business-title-row"
                >
                    <div
                        class="business-title-main"
                    >
                        <h1
                            class="business-detail-title"
                        >
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

                <div
                    class="business-detail-rating"
                >
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

                <p
                    class="business-detail-description"
                >
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
                        <strong>
                            📍 Konum
                        </strong>
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
// FOTOĞRAF HATALARI
// ============================================================

function setupBusinessImageFallbacks() {
    document
        .querySelectorAll(
            ".business-detail-image, .business-gallery-item img"
        )
        .forEach(
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

                            if (
                                fallback
                            ) {
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
// ============================================================

function setupGalleryLightbox() {
    const galleryItems =
        document.querySelectorAll(
            ".business-gallery-item"
        );

    if (!galleryItems.length)
        return;

    const galleryImages =
        Array.from(
            galleryItems
        )
            .map(
                item =>
                    item.dataset
                        .galleryUrl
            )
            .filter(Boolean);

    if (!galleryImages.length)
        return;

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
                    1 /
                    ${galleryImages.length}
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

        const FIRST_ZOOM = 1.6;
        const SECOND_ZOOM = 2.1;
        const MAX_PINCH_ZOOM = 2.3;

        let zoomScale = 1;
        let isZoomed = false;
        let isAnimating = false;

        let translateX = 0;
        let translateY = 0;

        let dragStartX = 0;
        let dragStartY = 0;

        let startTranslateX = 0;
        let startTranslateY = 0;

        let isDragging = false;

        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;

        let pinchStartDistance = 0;
        let pinchStartScale = 1;

        let lastTapTime = 0;

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

        function updateZoomState() {
            isZoomed =
                zoomScale > 1.01;

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

        function clampPan() {
            if (
                !isZoomed ||
                zoomScale <= 1
            ) {
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

            image.style.transform = `
                translate3d(
                    ${translateX}px,
                    ${translateY}px,
                    0
                )
                scale(${zoomScale})
            `;
        }

        function resetZoom(
            animate = false
        ) {
            zoomScale = 1;

            translateX = 0;
            translateY = 0;

            isZoomed = false;
            isDragging = false;

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

        function zoomToPoint(
            clientX,
            clientY,
            targetScale
        ) {
            if (isAnimating)
                return;

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
                containerRect.width /
                    2;

            const centerY =
                containerRect.top +
                containerRect.height /
                    2;

            const localX =
                clientX -
                centerX -
                translateX;

            const localY =
                clientY -
                centerY -
                translateY;

            zoomScale =
                targetScale;

            translateX =
                clientX -
                centerX -
                localX *
                    (
                        targetScale /
                        oldScale
                    );

            translateY =
                clientY -
                centerY -
                localY *
                    (
                        targetScale /
                        oldScale
                    );

            updateZoomState();

            clampPan();

            applyTransform(true);
        }

        function handleZoomClick(
            clientX,
            clientY
        ) {
            if (isAnimating)
                return;

            if (!isZoomed) {
                zoomToPoint(
                    clientX,
                    clientY,
                    FIRST_ZOOM
                );

                return;
            }

            if (zoomScale < 1.9) {
                zoomToPoint(
                    clientX,
                    clientY,
                    SECOND_ZOOM
                );

                return;
            }

            resetZoom(true);
        }

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
                image.src = url;

                counter.textContent =
                    `${currentIndex + 1} / ${galleryImages.length}`;

                return;
            }

            if (isAnimating)
                return;

            isAnimating = true;

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

            setTimeout(() => {
                image.src = url;

                counter.textContent =
                    `${currentIndex + 1} / ${galleryImages.length}`;

                image.style.transition =
                    "none";

                image.style.opacity =
                    "0";

                image.style.transform =
                    incomingTransform;

                requestAnimationFrame(
                    () => {
                        requestAnimationFrame(
                            () => {
                                image.style.transition =
                                    "opacity .25s ease, transform .25s cubic-bezier(.2,.8,.2,1)";

                                image.style.opacity =
                                    "1";

                                image.style.transform =
                                    "translate3d(0,0,0) scale(1)";

                                setTimeout(
                                    () => {
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
            }, 180);
        }

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

        function close() {
            document.removeEventListener(
                "keydown",
                handleKeydown
            );

            overlay.remove();

            document.body.style.overflow =
                "";
        }

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
                    resetZoom(true);
                } else {
                    const rect =
                        image.getBoundingClientRect();

                    handleZoomClick(
                        rect.left +
                            rect.width /
                                2,
                        rect.top +
                            rect.height /
                                2
                    );
                }
            }
        }

        closeButton.addEventListener(
            "click",
            close
        );

        prevButton.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                if (!isZoomed) {
                    showPrevious();
                }
            }
        );

        nextButton.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                if (!isZoomed) {
                    showNext();
                }
            }
        );

        overlay.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    overlay
                ) {
                    close();
                }
            }
        );

        image.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                if (
                    "ontouchstart" in
                    window
                ) {
                    return;
                }

                handleZoomClick(
                    event.clientX,
                    event.clientY
                );
            }
        );

        image.addEventListener(
            "dblclick",
            event => {
                event.preventDefault();

                event.stopPropagation();

                handleZoomClick(
                    event.clientX,
                    event.clientY
                );
            }
        );

        image.addEventListener(
            "mousedown",
            event => {
                if (!isZoomed)
                    return;

                event.preventDefault();

                isDragging = true;

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

        document.addEventListener(
            "mousemove",
            event => {
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

                applyTransform(false);
            }
        );

        document.addEventListener(
            "mouseup",
            () => {
                if (!isDragging)
                    return;

                isDragging = false;

                image.style.cursor =
                    "grab";

                clampPan();

                applyTransform(false);
            }
        );

        image.addEventListener(
            "dragstart",
            event => {
                event.preventDefault();
            }
        );

        overlay.addEventListener(
            "touchstart",
            event => {
                if (
                    !event.touches ||
                    !event.touches.length
                ) {
                    return;
                }

                if (
                    event.touches
                        .length === 2
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
                    isDragging = true;

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

        overlay.addEventListener(
            "touchmove",
            event => {
                if (
                    !event.touches ||
                    !event.touches.length
                ) {
                    return;
                }

                if (
                    event.touches
                        .length === 2
                ) {
                    const distance =
                        getTouchDistance(
                            event.touches[0],
                            event.touches[1]
                        );

                    if (
                        pinchStartDistance <=
                        0
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

                    applyTransform(false);

                    return;
                }

                if (
                    isZoomed &&
                    event.touches
                        .length === 1 &&
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

                    applyTransform(false);
                }
            },
            {
                passive: true
            }
        );

        overlay.addEventListener(
            "touchend",
            event => {
                if (
                    !event.changedTouches ||
                    !event.changedTouches.length
                ) {
                    return;
                }

                if (
                    pinchStartDistance >
                    0
                ) {
                    pinchStartDistance =
                        0;

                    isDragging = false;

                    if (
                        zoomScale <=
                        1.05
                    ) {
                        resetZoom(true);
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
                    isDragging = false;

                    clampPan();

                    applyTransform(false);

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

                if (duration > 700)
                    return;

                if (
                    Math.abs(
                        distanceX
                    ) <
                    Math.abs(
                        distanceY
                    )
                ) {
                    return;
                }

                if (
                    Math.abs(
                        distanceX
                    ) < 50
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

        overlay.addEventListener(
            "touchend",
            event => {
                if (
                    !event.changedTouches ||
                    !event.changedTouches.length
                ) {
                    return;
                }

                if (
                    pinchStartDistance >
                        0 ||
                    isZoomed
                ) {
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
                    difference < 300
                ) {
                    lastTapTime = 0;

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

        document.addEventListener(
            "keydown",
            handleKeydown
        );

        updateImage();
    }

    galleryItems.forEach(
        (
            item,
            index
        ) => {
            item.addEventListener(
                "click",
                () => {
                    openLightbox(index);
                }
            );
        }
    );
}

// ============================================================
// YORUMLAR
// ============================================================

async function loadReviews(
    businessId,
    business
) {
    const container =
        document.querySelector(
            "#reviews-list"
        );

    if (!container)
        return;

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
                        ascending:
                            false
                    }
                );

        if (error) {
            throw error;
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
                    ) =>
                        sum +
                        Number(
                            review.rating ||
                                0
                        ),
                    0
                );

            average =
                total / count;
        } else {
            average =
                Number(
                    business?.rating ||
                        0
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
            !reviewList.length
        ) {
            container.innerHTML = `
                <div class="no-reviews">
                    <div>💬</div>

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
// PUAN
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
    const distribution = {
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
                    Math.round(
                        rating
                    )
                ]++;
            }
        }
    );

    const total =
        reviews.length;

    const container =
        document.querySelector(
            "#review-distribution"
        );

    if (!container)
        return;

    container.innerHTML =
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

                        <div
                            class="review-distribution-bar"
                        >
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
                      day: "numeric",
                      month: "long",
                      year: "numeric"
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
                                .charAt(
                                    0
                                )
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

    if (!form) return;

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
                            this
                                .dataset
                                .rating
                        );

                    if (!ratingInput)
                        return;

                    ratingInput.value =
                        rating;

                    stars.forEach(
                        item => {
                            const itemRating =
                                Number(
                                    item
                                        .dataset
                                        .rating
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
        async function(
            event
        ) {
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
                    ratingInput?.value ||
                        0
                );

            if (
                name.length < 2
            ) {
                showReviewMessage(
                    "Lütfen adınızı yazın.",
                    "error"
                );

                nameInput?.focus();

                return;
            }

            if (
                name.length > 50
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
                        .from(
                            "reviews"
                        )
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

    if (!element) return;

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

    if (!element) return;

    element.textContent = "";

    element.style.display =
        "none";
}

// ============================================================
// FAVORİ
// ============================================================

function setupFavoriteButton(
    business
) {
    const button =
        document.querySelector(
            "#favorite-business"
        );

    if (!button) return;

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
                    ? JSON.parse(
                          saved
                      )
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
        return getFavorites().some(
            item =>
                String(
                    item.id
                ) ===
                String(
                    business.id
                )
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
                        String(
                            item.id
                        ) ===
                        String(
                            business.id
                        )
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
// GEÇİCİ MESAJ
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

    setTimeout(() => {
        element.classList.remove(
            "show"
        );

        setTimeout(() => {
            element.remove();
        }, 250);
    }, 2200);
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
// KOPYALA
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

        textarea.value = text;

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

function showError(message) {
    const container =
        document.querySelector(
            "#businessContainer"
        );

    if (!container) return;

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
// GERİ
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
// KATALOG CSS
// ============================================================

function injectBusinessCatalogStyles() {
    if (
        document.getElementById(
            "business-catalog-styles"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "business-catalog-styles";

    style.textContent = `
        .business-catalog {
            width:100%;
            max-width:1200px;
            margin:0 auto;
            padding:20px;
        }

        .business-catalog-header {
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:20px;
            margin-bottom:25px;
        }

        .business-catalog-kicker {
            display:block;
            font-size:12px;
            font-weight:800;
            letter-spacing:1.5px;
            opacity:.65;
            margin-bottom:5px;
        }

        .business-catalog-header h1 {
            margin:0;
            font-size:32px;
        }

        .business-catalog-header p {
            margin:7px 0 0;
            opacity:.7;
        }

        .business-catalog-count {
            white-space:nowrap;
            font-weight:700;
            padding:10px 15px;
            border-radius:999px;
            background:#f1f5f9;
        }

        .business-catalog-grid {
            display:grid;
            grid-template-columns:
                repeat(
                    auto-fill,
                    minmax(250px, 1fr)
                );
            gap:20px;
        }

        .business-catalog-card {
            display:block;
            color:inherit;
            text-decoration:none;
            overflow:hidden;
            border-radius:18px;
            background:#fff;
            box-shadow:
                0 8px 30px rgba(
                    0,
                    0,
                    0,
                    .08
                );
            transition:
                transform .2s ease,
                box-shadow .2s ease;
        }

        .business-catalog-card:hover {
            transform:translateY(-4px);
            box-shadow:
                0 14px 40px rgba(
                    0,
                    0,
                    0,
                    .13
                );
        }

        .business-catalog-image-wrap {
            position:relative;
            height:210px;
            overflow:hidden;
            background:#eef2f7;
        }

        .business-catalog-image {
            width:100%;
            height:100%;
            object-fit:cover;
            display:block;
        }

        .business-catalog-image-fallback {
            width:100%;
            height:100%;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:60px;
            background:#eef2f7;
        }

        .business-catalog-category {
            position:absolute;
            left:12px;
            bottom:12px;
            padding:7px 11px;
            border-radius:999px;
            background:rgba(
                0,
                0,
                0,
                .68
            );
            color:#fff;
            font-size:12px;
            font-weight:700;
            backdrop-filter:blur(8px);
        }

        .business-catalog-content {
            padding:17px;
        }

        .business-catalog-content h2 {
            margin:0 0 8px;
            font-size:19px;
            line-height:1.25;
        }

        .business-catalog-rating {
            display:flex;
            align-items:center;
            gap:6px;
            margin-bottom:10px;
            font-size:13px;
        }

        .business-catalog-stars {
            letter-spacing:1px;
        }

        .business-catalog-location {
            font-size:13px;
            font-weight:700;
            margin-bottom:5px;
        }

        .business-catalog-address {
            font-size:13px;
            opacity:.65;
            line-height:1.4;
            display:-webkit-box;
            -webkit-line-clamp:2;
            -webkit-box-orient:vertical;
            overflow:hidden;
        }

        .business-catalog-detail {
            display:flex;
            align-items:center;
            justify-content:space-between;
            margin-top:15px;
            padding-top:12px;
            border-top:1px solid #edf0f3;
            font-weight:800;
            font-size:13px;
        }

        .business-catalog-loading {
            min-height:200px;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            gap:12px;
            opacity:.7;
        }

        .business-catalog-spinner {
            width:35px;
            height:35px;
            border:3px solid #ddd;
            border-top-color:#555;
            border-radius:50%;
            animation:
                businessCatalogSpin
                .8s linear infinite;
        }

        @keyframes businessCatalogSpin {
            to {
                transform:rotate(360deg);
            }
        }

        .business-catalog-empty {
            text-align:center;
            padding:70px 20px;
        }

        .business-catalog-empty-icon {
            font-size:65px;
            margin-bottom:15px;
        }

        .business-catalog-empty h2 {
            margin:0 0 8px;
        }

        .business-catalog-empty p {
            opacity:.65;
        }

        @media (max-width:600px) {
            .business-catalog {
                padding:14px;
            }

            .business-catalog-header {
                align-items:flex-start;
            }

            .business-catalog-header h1 {
                font-size:27px;
            }

            .business-catalog-count {
                font-size:12px;
                padding:8px 10px;
            }

            .business-catalog-grid {
                grid-template-columns:
                    repeat(
                        2,
                        minmax(0, 1fr)
                    );
                gap:12px;
            }

            .business-catalog-image-wrap {
                height:150px;
            }

            .business-catalog-content {
                padding:12px;
            }

            .business-catalog-content h2 {
                font-size:16px;
            }

            .business-catalog-rating {
                flex-wrap:wrap;
                gap:4px;
            }

            .business-catalog-address {
                font-size:12px;
            }

            .business-catalog-detail {
                font-size:12px;
            }
        }
    `;

    document.head.appendChild(
        style
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

        injectBusinessCatalogStyles();

        const connected =
            initializeSupabase();

        if (!connected) {
            showError(
                "Site bağlantısı kurulamadı. Lütfen sayfayı yenileyin."
            );

            return;
        }

        // ====================================================
        // ANALYTICS
        // Bu sayfaya gelen ziyaretçiyi kaydet.
        // ====================================================
        trackPageView();

        setupBackNavigation();

        await loadBusiness();

        console.log(
            "Trabzon Anlık işletme sayfası hazır."
        );
    }
);