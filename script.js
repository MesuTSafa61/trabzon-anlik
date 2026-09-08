// ============================================================
// TRABZON ANLIK - ANA SAYFA SİSTEMİ
// Güncel sürüm + ANALYTICS
// ============================================================

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

const ANALYTICS_PAGE_SESSION_KEY =
    "trabzon_anlik_page_view_sent";


// ------------------------------------------------------------
// ZİYARETÇİ ID OLUŞTUR
// ------------------------------------------------------------

function getAnalyticsVisitorId() {
    try {
        let visitorId =
            localStorage.getItem(
                ANALYTICS_VISITOR_KEY
            );

        if (!visitorId) {
            if (
                window.crypto &&
                typeof window.crypto.randomUUID === "function"
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


// ------------------------------------------------------------
// ANALYTICS EVENT KAYDET
// ------------------------------------------------------------

async function trackAnalytics(
    eventType,
    businessId = null,
    eventId = null
) {
    const visitorId =
        getAnalyticsVisitorId();

    const payload = {
        event_type: String(eventType),
        business_id:
            businessId !== null &&
            businessId !== undefined &&
            businessId !== ""
                ? Number(businessId)
                : null,
        event_id:
            eventId !== null &&
            eventId !== undefined &&
            eventId !== ""
                ? Number(eventId)
                : null,
        visitor_id: visitorId
    };

    // --------------------------------------------------------
    // ÖNCE SUPABASE CLIENT
    // --------------------------------------------------------

    try {
        if (supabaseClient) {
            const {
                error
            } = await supabaseClient
                .from("analytics_events")
                .insert(payload);

            if (!error) {
                console.log(
                    "✅ Analytics kaydedildi:",
                    payload
                );

                return true;
            }

            console.warn(
                "⚠️ Supabase analytics insert hatası:",
                error
            );
        }
    } catch (error) {
        console.warn(
            "⚠️ Supabase analytics istemci hatası:",
            error
        );
    }

    // --------------------------------------------------------
    // YEDEK: DOĞRUDAN SUPABASE REST API
    // --------------------------------------------------------

    try {
        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/analytics_events`,
                {
                    method: "POST",
                    headers: {
                        "apikey":
                            SUPABASE_PUBLISHABLE_KEY,
                        "Authorization":
                            `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
                        "Content-Type":
                            "application/json",
                        "Prefer":
                            "return=minimal"
                    },
                    body:
                        JSON.stringify(payload),
                    keepalive: true
                }
            );

        if (response.ok) {
            console.log(
                "✅ Analytics REST üzerinden kaydedildi:",
                payload
            );

            return true;
        }

        const errorText =
            await response.text();

        console.warn(
            "❌ Analytics REST hatası:",
            response.status,
            errorText
        );

        return false;
    } catch (error) {
        console.warn(
            "❌ Analytics REST bağlantı hatası:",
            error
        );

        return false;
    }
}


// ------------------------------------------------------------
// ANA SAYFA ZİYARETİ
// ------------------------------------------------------------

function trackHomepageVisit() {
    try {
        const sessionKey =
            `${ANALYTICS_PAGE_SESSION_KEY}_${window.location.pathname}`;

        const alreadySent =
            sessionStorage.getItem(
                sessionKey
            );

        if (alreadySent === "1") {
            console.log(
                "Analytics: Bu sayfa oturumunda page_view zaten gönderildi."
            );
            return;
        }

        sessionStorage.setItem(
            sessionKey,
            "1"
        );
    } catch (error) {
        console.warn(
            "Analytics session kontrolü yapılamadı:",
            error
        );
    }

    // Sayfa açılışını kaydet.
    // Await etmiyoruz; sayfanın yüklenmesini bekletmesin.
    void trackAnalytics(
        "page_view"
    );
}


// ------------------------------------------------------------
// İŞLETME KARTI TIKLAMA TAKİBİ
// ------------------------------------------------------------

function setupBusinessAnalytics() {
    if (
        window.__trabzonAnlikBusinessAnalyticsReady
    ) {
        return;
    }

    window.__trabzonAnlikBusinessAnalyticsReady =
        true;

    document.addEventListener(
        "click",
        event => {
            const businessCard =
                event.target.closest(
                    "a.business-card[data-business-id]"
                );

            if (!businessCard) {
                return;
            }

            const businessId =
                businessCard.dataset.businessId;

            if (!businessId) {
                return;
            }

            const href =
                businessCard.getAttribute(
                    "href"
                );

            if (
                !href ||
                href === "#"
            ) {
                return;
            }

            // ------------------------------------------------
            // İŞLETME KARTINA TIKLAMA
            // ------------------------------------------------
            //
            // BURADA business_view DEĞİL,
            // business_click kullanıyoruz.
            //
            // Gerçek business_view kaydı
            // isletme.js içindeki detay sayfasından gelecek.
            // ------------------------------------------------

            void trackAnalytics(
                "business_click",
                businessId
            );

            // Normal tıklamada tarayıcının
            // doğal navigasyon davranışını bozma.
            //
            // Analytics "keepalive" ve REST fallback
            // sayesinde sayfa değişse bile kayıt
            // gönderilmeye çalışılır.
        },
        true
    );
}


// ============================================================
// SUPABASE BAŞLAT
// ============================================================

function initializeSupabase() {
    if (!window.supabase) {
        console.error(
            "❌ Supabase kütüphanesi yüklenemedi."
        );

        return false;
    }

    try {
        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY
            );

        console.log(
            "✅ Supabase bağlantısı hazır."
        );

        return true;
    } catch (error) {
        console.error(
            "❌ Supabase başlatma hatası:",
            error
        );

        return false;
    }
}


// ============================================================
// ELEMENTLER
// ============================================================

const menuButton =
    document.querySelector(
        "#menuButton"
    );

const mobileNav =
    document.querySelector(
        "#mobileNav"
    );

const searchButton =
    document.querySelector(
        "#searchButton"
    );

const searchInput =
    document.querySelector(
        "#searchInput"
    );

const categoriesContainer =
    document.querySelector(
        "#categoriesContainer"
    );

const businessContainer =
    document.querySelector(
        "#businessContainer"
    );

const placesContainer =
    document.querySelector(
        "#placesContainer"
    );

const searchResultsSection =
    document.querySelector(
        "#searchResultsSection"
    );

const searchResultsContainer =
    document.querySelector(
        "#searchResultsContainer"
    );

const searchResultsTitle =
    document.querySelector(
        "#searchResultsTitle"
    );


// ============================================================
// SABİT KATEGORİLER
// ============================================================

const fallbackCategories = [
    {
        id: "fallback-kafe",
        name: "Kafeler",
        slug: "kafe",
        icon: "☕",
        description: "Kahve ve sohbet"
    },
    {
        id: "fallback-restoran",
        name: "Restoranlar",
        slug: "restoran",
        icon: "🍽️",
        description: "Lezzet durakları"
    },
    {
        id: "fallback-kahvalti",
        name: "Kahvaltı",
        slug: "kahvalti",
        icon: "🍳",
        description: "Güne güzel başla"
    },
    {
        id: "fallback-fastfood",
        name: "Fast Food",
        slug: "fast-food",
        icon: "🍔",
        description: "Hızlı ve lezzetli"
    },
    {
        id: "fallback-otel",
        name: "Oteller",
        slug: "otel",
        icon: "🏨",
        description: "Konaklama"
    },
    {
        id: "fallback-kuafor",
        name: "Berber & Kuaför",
        slug: "berber-kuafor",
        icon: "💈",
        description: "Bakım ve güzellik"
    },
    {
        id: "fallback-market",
        name: "Marketler",
        slug: "market",
        icon: "🛒",
        description: "Alışveriş"
    },
    {
        id: "fallback-spor",
        name: "Spor",
        slug: "spor",
        icon: "🏋️",
        description: "Spor ve fitness"
    },
    {
        id: "fallback-giyim",
        name: "Giyim",
        slug: "giyim",
        icon: "👕",
        description: "Moda ve alışveriş"
    },
    {
        id: "fallback-oto",
        name: "Oto",
        slug: "oto",
        icon: "🚗",
        description: "Otomotiv"
    },
    {
        id: "fallback-teknoloji",
        name: "Teknoloji",
        slug: "teknoloji",
        icon: "📱",
        description: "Telefon ve teknoloji"
    },
    {
        id: "fallback-egitim",
        name: "Eğitim",
        slug: "egitim",
        icon: "🎓",
        description: "Kurs ve eğitim"
    }
];


// ============================================================
// FALLBACK KEŞİF YERLERİ
// ============================================================

const fallbackPlaces = [
    {
        name: "Uzungöl",
        slug: "uzungol",
        district: "Çaykara",
        description:
            "Trabzon'un en bilinen doğal güzelliklerinden biri.",
        image_url: ""
    },
    {
        name: "Sümela Manastırı",
        slug: "sumela-manastiri",
        district: "Maçka",
        description:
            "Dağların arasında tarihi ve etkileyici bir yapı.",
        image_url: ""
    },
    {
        name: "Atatürk Köşkü",
        slug: "ataturk-kosku",
        district: "Ortahisar",
        description:
            "Trabzon'un simge tarihi yapılarından biri.",
        image_url: ""
    },
    {
        name: "Boztepe",
        slug: "boztepe",
        district: "Ortahisar",
        description:
            "Trabzon manzarasını izlemek için güzel noktalardan biri.",
        image_url: ""
    },
    {
        name: "Hıdırnebi Yaylası",
        slug: "hidirnebi-yaylasi",
        district: "Akçaabat",
        description:
            "Doğa, yayla havası ve Karadeniz manzarası.",
        image_url: ""
    },
    {
        name: "Şahinkaya Kanyonu",
        slug: "sahinkaya-kanyonu",
        district: "Düzköy",
        description:
            "Doğa ve macera sevenler için etkileyici bir keşif noktası.",
        image_url: ""
    }
];


// ============================================================
// SAYFA BAŞLANGICI
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        console.log(
            "Trabzon Anlık başlatılıyor..."
        );

        setupSearch();
        setupMobileMenu();
        setupPopularSearches();
        setupQuickSearchCards();

        const connected =
            initializeSupabase();

        if (!connected) {
            loadFallbackContent();
            return;
        }

        // ====================================================
        // ANALYTICS BAŞLAT
        // ====================================================

        setupBusinessAnalytics();

        // ANA SAYFA GİRİŞİ
        trackHomepageVisit();

        await Promise.allSettled([
            loadCategories(),
            loadFeaturedBusinesses(),
            loadPlaces()
        ]);

        console.log(
            "Trabzon Anlık hazır."
        );
    }
);


// ============================================================
// FALLBACK ANA SAYFA
// ============================================================

function loadFallbackContent() {
    renderFallbackCategories();
    renderFallbackPlaces();
    showNoFeaturedBusinesses();
}


// ============================================================
// GENEL HATA
// ============================================================

function showGlobalError(message) {
    if (categoriesContainer) {
        categoriesContainer.innerHTML = `
            <div class="category-card">
                <span>⚠️</span>
                <strong>Bağlantı hatası</strong>
                <small>${escapeHtml(
                    message
                )}</small>
            </div>
        `;
    }

    if (businessContainer) {
        businessContainer.innerHTML = `
            <article class="business-card">
                <div class="business-image">
                    ⚠️
                </div>
                <div class="business-content">
                    <span class="badge">
                        HATA
                    </span>
                    <h3>
                        İşletmeler yüklenemedi
                    </h3>
                    <p>
                        ${escapeHtml(
                            message
                        )}
                    </p>
                </div>
            </article>
        `;
    }

    if (placesContainer) {
        renderFallbackPlaces();
    }
}


// ============================================================
// KATEGORİLERİ YÜKLE
// ============================================================

async function loadCategories() {
    if (!categoriesContainer) {
        return;
    }

    categoriesContainer.innerHTML = `
        <div class="category-card">
            <span>⏳</span>
            <strong>
                Kategoriler yükleniyor...
            </strong>
            <small>
                Birkaç saniye...
            </small>
        </div>
    `;

    try {
        const {
            data,
            error
        } = await supabaseClient
            .from("categories")
            .select(
                "id, name, slug, icon, description"
            )
            .order(
                "id",
                {
                    ascending: true
                }
            );

        if (error) {
            throw error;
        }

        if (
            !data ||
            data.length === 0
        ) {
            renderFallbackCategories();
            return;
        }

        renderCategories(data);
    } catch (error) {
        console.error(
            "Kategoriler alınamadı:",
            error
        );

        renderFallbackCategories();
    }
}


// ============================================================
// KATEGORİLERİ GÖSTER
// ============================================================

function renderCategories(data) {
    if (!categoriesContainer) {
        return;
    }

    categoriesContainer.innerHTML =
        data
            .map(
                category => {
                    return `
                        <a
                            href="#isletmeler"
                            class="category-card"
                            data-category="${escapeHtml(
                                category.slug || ""
                            )}"
                        >
                            <span>
                                ${escapeHtml(
                                    category.icon ||
                                    "📌"
                                )}
                            </span>

                            <strong>
                                ${escapeHtml(
                                    category.name
                                )}
                            </strong>

                            <small>
                                ${escapeHtml(
                                    category.description ||
                                    "İşletmeleri keşfet"
                                )}
                            </small>
                        </a>
                    `;
                }
            )
            .join("");

    document
        .querySelectorAll(
            ".category-card[data-category]"
        )
        .forEach(
            card => {
                card.addEventListener(
                    "click",
                    async event => {
                        event.preventDefault();

                        const categorySlug =
                            card.dataset.category;

                        await searchByCategory(
                            categorySlug
                        );
                    }
                );
            }
        );
}


// ============================================================
// FALLBACK KATEGORİLER
// ============================================================

function renderFallbackCategories() {
    if (!categoriesContainer) {
        return;
    }

    renderCategories(
        fallbackCategories
    );
}


// ============================================================
// ÖNE ÇIKAN İŞLETMELER
// ============================================================

async function loadFeaturedBusinesses() {
    if (!businessContainer) {
        return;
    }

    businessContainer.innerHTML = `
        <article class="business-card">
            <div class="business-image">
                ⏳
            </div>

            <div class="business-content">
                <span class="badge">
                    YÜKLENİYOR
                </span>

                <h3>
                    İşletmeler yükleniyor...
                </h3>

                <p>
                    Trabzon'daki işletmeler hazırlanıyor.
                </p>
            </div>
        </article>
    `;

    try {
        let businesses = null;

        // ----------------------------------------------------
        // ÖNCE ÖNE ÇIKANLAR
        // ----------------------------------------------------

        let {
            data: featuredBusinesses,
            error: featuredError
        } = await supabaseClient
            .from("businesses")
            .select(`
                id,
                name,
                slug,
                category_id,
                description,
                address,
                district,
                phone,
                website,
                instagram,
                image_url,
                rating,
                review_count,
                is_featured,
                is_approved,
                created_at
            `)
            .eq(
                "is_approved",
                true
            )
            .eq(
                "is_featured",
                true
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(6);

        if (featuredError) {
            console.warn(
                "Öne çıkan işletmeler alınamadı:",
                featuredError
            );
        }

        if (
            featuredBusinesses &&
            featuredBusinesses.length > 0
        ) {
            businesses =
                featuredBusinesses;
        } else {
            // ------------------------------------------------
            // ÖNE ÇIKAN YOKSA TÜM ONAYLI İŞLETMELER
            // ------------------------------------------------

            const {
                data: approvedBusinesses,
                error: approvedError
            } = await supabaseClient
                .from("businesses")
                .select(`
                    id,
                    name,
                    slug,
                    category_id,
                    description,
                    address,
                    district,
                    phone,
                    website,
                    instagram,
                    image_url,
                    rating,
                    review_count,
                    is_featured,
                    is_approved,
                    created_at
                `)
                .eq(
                    "is_approved",
                    true
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(6);

            if (approvedError) {
                throw approvedError;
            }

            businesses =
                approvedBusinesses || [];
        }

        // ----------------------------------------------------
        // HİÇ İŞLETME YOKSA
        // ----------------------------------------------------

        if (
            !businesses ||
            businesses.length === 0
        ) {
            showNoFeaturedBusinesses();
            return;
        }

        // ----------------------------------------------------
        // KATEGORİLER
        // ----------------------------------------------------

        const {
            data: categories,
            error: categoryError
        } = await supabaseClient
            .from("categories")
            .select(
                "id, name, icon"
            );

        if (categoryError) {
            console.warn(
                "Kategori bilgileri alınamadı:",
                categoryError
            );
        }

        const categoryMap =
            new Map(
                (categories || []).map(
                    category => [
                        String(
                            category.id
                        ),
                        category
                    ]
                )
            );

        // ----------------------------------------------------
        // FOTOĞRAFLAR
        // ----------------------------------------------------

        const businessesWithImages =
            await attachBusinessImages(
                businesses
            );

        // ----------------------------------------------------
        // KATEGORİ + FOTOĞRAF
        // ----------------------------------------------------

        const finalBusinesses =
            businessesWithImages.map(
                business => {
                    const category =
                        categoryMap.get(
                            String(
                                business.category_id
                            )
                        );

                    return {
                        ...business,
                        categories:
                            category || null
                    };
                }
            );

        businessContainer.innerHTML =
            finalBusinesses
                .map(
                    renderBusinessCard
                )
                .join("");
    } catch (error) {
        console.error(
            "İşletmeler alınamadı:",
            error
        );

        showNoFeaturedBusinesses();
    }
}


// ============================================================
// İŞLETME FOTOĞRAFLARINI GETİR
// ============================================================

async function attachBusinessImages(
    businesses
) {
    if (
        !businesses ||
        businesses.length === 0
    ) {
        return [];
    }

    const businessIds =
        businesses.map(
            business => business.id
        );

    try {
        const {
            data: images,
            error
        } = await supabaseClient
            .from("business_images")
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
                "business_images okunamadı:",
                error
            );

            return businesses;
        }

        const imageMap =
            new Map();

        (images || []).forEach(
            image => {
                const businessId =
                    String(
                        image.business_id
                    );

                if (
                    !imageMap.has(
                        businessId
                    )
                ) {
                    imageMap.set(
                        businessId,
                        image
                    );
                }
            }
        );

        return businesses.map(
            business => {
                const galleryImage =
                    imageMap.get(
                        String(
                            business.id
                        )
                    );

                if (
                    galleryImage &&
                    galleryImage.image_url
                ) {
                    return {
                        ...business,
                        image_url:
                            galleryImage.image_url,
                        gallery_cover_url:
                            galleryImage.image_url,
                        gallery_image_id:
                            galleryImage.id
                    };
                }

                return business;
            }
        );
    } catch (error) {
        console.warn(
            "İşletme fotoğrafları alınamadı:",
            error
        );

        return businesses;
    }
}


// ============================================================
// İŞLETME YOKSA
// ============================================================

function showNoFeaturedBusinesses() {
    if (!businessContainer) {
        return;
    }

    businessContainer.innerHTML = `
        <article class="business-card">
            <div class="business-image">
                🏪
            </div>

            <div class="business-content">
                <span class="badge">
                    TRABZON ANLIK
                </span>

                <h3>
                    Trabzon'daki işletmeler burada
                </h3>

                <p>
                    Kafelerden restoranlara,
                    otellerden mağazalara kadar
                    Trabzon'daki işletmeleri keşfet.
                </p>

                <div class="business-bottom">
                    <span>
                        Yeni işletmeler yakında
                    </span>

                    <span>
                        →
                    </span>
                </div>
            </div>
        </article>

        <article class="business-card">
            <div class="business-image">
                ☕
            </div>

            <div class="business-content">
                <span class="badge">
                    KAFE
                </span>

                <h3>
                    Favori mekanını bul
                </h3>

                <p>
                    Trabzon'da kahve içmek,
                    yemek yemek veya yeni bir
                    yer keşfetmek için ara.
                </p>

                <div class="business-bottom">
                    <span>
                        Keşfet
                    </span>

                    <span>
                        →
                    </span>
                </div>
            </div>
        </article>

        <article class="business-card">
            <div class="business-image">
                📍
            </div>

            <div class="business-content">
                <span class="badge">
                    YEREL
                </span>

                <h3>
                    İşletmeni sen de ekle
                </h3>

                <p>
                    İşletmeni Trabzon Anlık'a
                    ekleyerek daha fazla kişiye ulaş.
                </p>

                <div class="business-bottom">
                    <span>
                        İşletmeni Ekle
                    </span>

                    <span>
                        →
                    </span>
                </div>
            </div>
        </article>
    `;
}


// ============================================================
// İŞLETME KARTI
// ============================================================

function renderBusinessCard(
    business
) {
    const categoryName =
        business.categories?.name ||
        "İŞLETME";

    const categoryIcon =
        business.categories?.icon ||
        "🏪";

    const imageContent =
        business.image_url
            ? `
                <img
                    src="${escapeHtml(
                        business.image_url
                    )}"
                    alt="${escapeHtml(
                        business.name
                    )}"
                    loading="lazy"
                    onerror="
                        this.style.display='none';
                        this.parentElement.textContent='${escapeHtml(
                            categoryIcon
                        )}';
                    "
                >
            `
            : escapeHtml(
                categoryIcon
            );

    const rating =
        Number(
            business.rating || 0
        );

    const ratingText =
        rating > 0
            ? `⭐ ${rating.toFixed(1)}`
            : "⭐ Yeni";

    const businessSlug =
        business.slug
            ? encodeURIComponent(
                business.slug
            )
            : "";

    const detailUrl =
        businessSlug
            ? `isletme.html?slug=${businessSlug}`
            : "#";

    return `
        <a
            href="${detailUrl}"
            class="business-card"
            data-business-id="${escapeHtml(
                business.id
            )}"
            aria-label="${escapeHtml(
                business.name
            )} detaylarını görüntüle"
        >
            <div class="business-image">
                ${imageContent}
            </div>

            <div class="business-content">
                <span class="badge">
                    ${escapeHtml(
                        categoryName
                    ).toUpperCase()}
                </span>

                <h3>
                    ${escapeHtml(
                        business.name
                    )}
                </h3>

                <p>
                    📍
                    ${escapeHtml(
                        business.district ||
                        business.address ||
                        "Trabzon"
                    )}
                </p>

                <div class="business-bottom">
                    <span>
                        ${ratingText}
                    </span>

                    <span>
                        Detaylar →
                    </span>
                </div>
            </div>
        </a>
    `;
}


// ============================================================
// TRABZON'U KEŞFET
// ============================================================

async function loadPlaces() {
    if (!placesContainer) {
        return;
    }

    placesContainer.innerHTML = `
        <a href="#" class="place-card">
            <div>
                ⏳
            </div>

            <strong>
                Keşif noktaları yükleniyor...
            </strong>

            <span>
                Trabzon hazırlanıyor.
            </span>
        </a>
    `;

    try {
        const {
            data,
            error
        } = await supabaseClient
            .from("places")
            .select(`
                id,
                name,
                slug,
                district,
                description,
                image_url,
                is_featured
            `)
            .eq(
                "is_featured",
                true
            )
            .order(
                "id",
                {
                    ascending: true
                }
            );

        if (error) {
            throw error;
        }

        if (
            !data ||
            data.length === 0
        ) {
            renderFallbackPlaces();
            return;
        }

        renderPlaces(data);
    } catch (error) {
        console.warn(
            "Keşif yerleri alınamadı:",
            error
        );

        renderFallbackPlaces();
    }
}


// ============================================================
// KEŞİF YERLERİNİ GÖSTER
// ============================================================

function renderPlaces(
    data
) {
    if (!placesContainer) {
        return;
    }

    placesContainer.innerHTML =
        data
            .map(
                place => {
                    const imageContent =
                        place.image_url
                            ? `
                                <img
                                    src="${escapeHtml(
                                        place.image_url
                                    )}"
                                    alt="${escapeHtml(
                                        place.name
                                    )}"
                                    loading="lazy"
                                >
                            `
                            : "🏔️";

                    return `
                        <a
                            href="#"
                            class="place-card"
                            data-place="${escapeHtml(
                                place.slug || ""
                            )}"
                        >
                            <div>
                                ${imageContent}
                            </div>

                            <strong>
                                ${escapeHtml(
                                    place.name
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    place.district ||
                                    "Trabzon"
                                )}
                            </span>
                        </a>
                    `;
                }
            )
            .join("");
}


// ============================================================
// FALLBACK KEŞİF YERLERİ
// ============================================================

function renderFallbackPlaces() {
    if (!placesContainer) {
        return;
    }

    placesContainer.innerHTML =
        fallbackPlaces
            .map(
                place => {
                    return `
                        <a
                            href="#"
                            class="place-card"
                            data-place="${escapeHtml(
                                place.slug
                            )}"
                        >
                            <div>
                                🏔️
                            </div>

                            <strong>
                                ${escapeHtml(
                                    place.name
                                )}
                            </strong>

                            <span>
                                📍
                                ${escapeHtml(
                                    place.district
                                )}
                            </span>
                        </a>
                    `;
                }
            )
            .join("");
}


// ============================================================
// ARAMA SİSTEMİ
// ============================================================

function setupSearch() {
    if (
        !searchButton ||
        !searchInput
    ) {
        return;
    }

    searchButton.addEventListener(
        "click",
        performSearch
    );

    searchInput.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Enter"
            ) {
                event.preventDefault();
                performSearch();
            }
        }
    );
}


// ============================================================
// ARAMA
// ============================================================

async function performSearch() {
    const searchText =
        searchInput.value.trim();

    if (!searchText) {
        searchInput.focus();
        return;
    }

    await searchBusinesses(
        searchText
    );
}


// ============================================================
// İŞLETME ARAMA
// ============================================================

async function searchBusinesses(
    searchText
) {
    if (
        !searchResultsContainer ||
        !searchResultsSection
    ) {
        return;
    }

    searchResultsSection.style.display =
        "block";

    searchResultsTitle.textContent =
        `"${searchText}" için sonuçlar`;

    searchResultsContainer.innerHTML = `
        <article class="business-card">
            <div class="business-image">
                🔎
            </div>

            <div class="business-content">
                <span class="badge">
                    ARANIYOR
                </span>

                <h3>
                    Sonuçlar getiriliyor...
                </h3>

                <p>
                    Lütfen bekleyin.
                </p>
            </div>
        </article>
    `;

    try {
        const cleanQuery =
            escapeForQuery(
                searchText
            );

        const {
            data: businesses,
            error
        } = await supabaseClient
            .from("businesses")
            .select(`
                id,
                name,
                slug,
                category_id,
                description,
                address,
                district,
                phone,
                website,
                instagram,
                image_url,
                rating,
                review_count,
                is_featured,
                is_approved,
                created_at
            `)
            .eq(
                "is_approved",
                true
            )
            .or(
                `name.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%,district.ilike.%${cleanQuery}%,address.ilike.%${cleanQuery}%`
            )
            .order(
                "is_featured",
                {
                    ascending: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(20);

        if (error) {
            throw error;
        }

        if (
            !businesses ||
            businesses.length === 0
        ) {
            renderSearchResults([]);
            return;
        }

        const businessesWithImages =
            await attachBusinessImages(
                businesses
            );

        const businessesWithCategories =
            await attachCategories(
                businessesWithImages
            );

        renderSearchResults(
            businessesWithCategories
        );
    } catch (error) {
        console.error(
            "Arama hatası:",
            error
        );

        searchResultsContainer.innerHTML = `
            <article class="business-card">
                <div class="business-image">
                    ⚠️
                </div>

                <div class="business-content">
                    <span class="badge">
                        HATA
                    </span>

                    <h3>
                        Arama yapılamadı
                    </h3>

                    <p>
                        Lütfen tekrar deneyin.
                    </p>
                </div>
            </article>
        `;
    }
}


// ============================================================
// KATEGORİ ARAMA
// ============================================================

async function searchByCategory(
    categorySlug
) {
    if (
        !searchResultsContainer ||
        !searchResultsSection
    ) {
        return;
    }

    searchResultsSection.style.display =
        "block";

    searchResultsTitle.textContent =
        "Kategori sonuçları";

    searchResultsContainer.innerHTML = `
        <article class="business-card">
            <div class="business-image">
                🔎
            </div>

            <div class="business-content">
                <span class="badge">
                    ARANIYOR
                </span>

                <h3>
                    İşletmeler getiriliyor...
                </h3>

                <p>
                    Lütfen bekleyin.
                </p>
            </div>
        </article>
    `;

    try {
        const {
            data: category,
            error: categoryError
        } = await supabaseClient
            .from("categories")
            .select(
                "id, name, icon"
            )
            .eq(
                "slug",
                categorySlug
            )
            .maybeSingle();

        if (categoryError) {
            const fallback =
                fallbackCategories.find(
                    item =>
                        item.slug ===
                        categorySlug
                );

            if (fallback) {
                searchResultsTitle.textContent =
                    fallback.name;
            }

            renderSearchResults([]);
            return;
        }

        if (!category) {
            const fallback =
                fallbackCategories.find(
                    item =>
                        item.slug ===
                        categorySlug
                );

            if (fallback) {
                searchResultsTitle.textContent =
                    fallback.name;
            }

            renderSearchResults([]);
            return;
        }

        searchResultsTitle.textContent =
            category.name;

        const {
            data: businesses,
            error: businessError
        } = await supabaseClient
            .from("businesses")
            .select(`
                id,
                name,
                slug,
                category_id,
                description,
                address,
                district,
                phone,
                website,
                instagram,
                image_url,
                rating,
                review_count,
                is_featured,
                is_approved,
                created_at
            `)
            .eq(
                "is_approved",
                true
            )
            .eq(
                "category_id",
                category.id
            )
            .order(
                "is_featured",
                {
                    ascending: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(20);

        if (businessError) {
            throw businessError;
        }

        const businessesWithImages =
            await attachBusinessImages(
                businesses || []
            );

        const businessesWithCategories =
            (businessesWithImages || []).map(
                business => ({
                    ...business,
                    categories:
                        category
                })
            );

        renderSearchResults(
            businessesWithCategories
        );
    } catch (error) {
        console.error(
            "Kategori araması hatası:",
            error
        );

        renderSearchResults([]);
    }
}


// ============================================================
// KATEGORİLERİ İŞLETMELERE EKLE
// ============================================================

async function attachCategories(
    businesses
) {
    if (
        !businesses ||
        businesses.length === 0
    ) {
        return [];
    }

    const {
        data: categories,
        error
    } = await supabaseClient
        .from("categories")
        .select(
            "id, name, icon"
        );

    if (error) {
        throw error;
    }

    const categoryMap =
        new Map(
            (categories || []).map(
                category => [
                    String(
                        category.id
                    ),
                    category
                ]
            )
        );

    return businesses.map(
        business => ({
            ...business,
            categories:
                categoryMap.get(
                    String(
                        business.category_id
                    )
                ) || null
        })
    );
}


// ============================================================
// ARAMA SONUÇLARINI GÖSTER
// ============================================================

function renderSearchResults(
    data
) {
    if (!searchResultsContainer) {
        return;
    }

    if (
        !data ||
        data.length === 0
    ) {
        searchResultsContainer.innerHTML = `
            <article class="business-card">
                <div class="business-image">
                    🔍
                </div>

                <div class="business-content">
                    <span class="badge">
                        SONUÇ YOK
                    </span>

                    <h3>
                        Henüz sonuç bulunamadı
                    </h3>

                    <p>
                        Başka bir işletme,
                        kategori veya ilçe arayın.
                    </p>
                </div>
            </article>
        `;

        searchResultsSection?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        return;
    }

    searchResultsContainer.innerHTML =
        data
            .map(
                renderBusinessCard
            )
            .join("");

    searchResultsSection?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ============================================================
// POPÜLER ARAMALAR
// ============================================================

function setupPopularSearches() {
    const links =
        document.querySelectorAll(
            "[data-search]"
        );

    links.forEach(
        link => {
            link.addEventListener(
                "click",
                async event => {
                    event.preventDefault();

                    const value =
                        link.dataset.search;

                    if (!searchInput) {
                        return;
                    }

                    searchInput.value =
                        value;

                    await performSearch();
                }
            );
        }
    );
}


// ============================================================
// HIZLI KATEGORİ / İLÇE KARTLARI
// ============================================================

function setupQuickSearchCards() {
    const cards =
        document.querySelectorAll(
            ".quick-category[data-search], .district-card[data-search]"
        );

    cards.forEach(
        card => {
            card.addEventListener(
                "click",
                async event => {
                    event.preventDefault();

                    const value =
                        card.dataset.search;

                    if (!searchInput) {
                        return;
                    }

                    searchInput.value =
                        value;

                    await performSearch();
                }
            );
        }
    );
}


// ============================================================
// MOBİL MENÜ
// ============================================================

function setupMobileMenu() {
    if (!menuButton) {
        return;
    }

    menuButton.setAttribute(
        "aria-expanded",
        "false"
    );

    menuButton.addEventListener(
        "click",
        () => {
            if (!mobileNav) {
                return;
            }

            mobileNav.classList.toggle(
                "active"
            );

            const isOpen =
                mobileNav.classList.contains(
                    "active"
                );

            menuButton.setAttribute(
                "aria-expanded",
                isOpen
                    ? "true"
                    : "false"
            );
        }
    );

    if (mobileNav) {
        mobileNav
            .querySelectorAll("a")
            .forEach(
                link => {
                    link.addEventListener(
                        "click",
                        () => {
                            mobileNav.classList.remove(
                                "active"
                            );

                            menuButton.setAttribute(
                                "aria-expanded",
                                "false"
                            );
                        }
                    );
                }
            );
    }
}


// ============================================================
// HTML GÜVENLİĞİ
// ============================================================

function escapeHtml(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ============================================================
// SUPABASE ARAMA KARAKTERLERİ
// ============================================================

function escapeForQuery(
    value
) {
    return String(value)
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /%/g,
            "\\%"
        )
        .replace(
            /_/g,
            "\\_"
        )
        .replace(
            /,/g,
            "\\,"
        );
}


// ============================================================
// HATALARI KONSOLA YAZ
// ============================================================

window.addEventListener(
    "error",
    event => {
        console.error(
            "Trabzon Anlık JavaScript hatası:",
            event.error ||
            event.message
        );
    }
);

window.addEventListener(
    "unhandledrejection",
    event => {
        console.error(
            "Trabzon Anlık Promise hatası:",
            event.reason
        );
    }
);