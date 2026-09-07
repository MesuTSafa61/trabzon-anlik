// ============================================================
// TRABZON ANLIK - ANA SAYFA SİSTEMİ
// ============================================================

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
// ELEMENTLER
// ============================================================

const menuButton =
    document.querySelector("#menuButton");

const mobileNav =
    document.querySelector("#mobileNav");

const searchButton =
    document.querySelector("#searchButton");

const searchInput =
    document.querySelector("#searchInput");

const categoriesContainer =
    document.querySelector("#categoriesContainer");

const businessContainer =
    document.querySelector("#businessContainer");

const placesContainer =
    document.querySelector("#placesContainer");

const searchResultsSection =
    document.querySelector("#searchResultsSection");

const searchResultsContainer =
    document.querySelector("#searchResultsContainer");

const searchResultsTitle =
    document.querySelector("#searchResultsTitle");


// ============================================================
// SAYFA BAŞLANGICI
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Trabzon Anlık başlatılıyor..."
        );

        const connected =
            initializeSupabase();

        if (!connected) {

            showGlobalError(
                "Site bağlantısı kurulamadı. Lütfen sayfayı yenileyin."
            );

            return;
        }

        setupSearch();
        setupMobileMenu();
        setupPopularSearches();

        await loadCategories();
        await loadFeaturedBusinesses();
        await loadPlaces();

        console.log(
            "Trabzon Anlık hazır."
        );
    }
);


// ============================================================
// GENEL HATA
// ============================================================

function showGlobalError(message) {

    if (categoriesContainer) {

        categoriesContainer.innerHTML = `
            <div class="category-card">
                <span>⚠️</span>
                <strong>Bağlantı hatası</strong>
                <small>${escapeHtml(message)}</small>
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
                        ${escapeHtml(message)}
                    </p>

                </div>

            </article>
        `;
    }

    if (placesContainer) {

        placesContainer.innerHTML = `
            <a href="#" class="place-card">

                <div>⚠️</div>

                <strong>
                    Bağlantı hatası
                </strong>

                <span>
                    ${escapeHtml(message)}
                </span>

            </a>
        `;
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
                Yükleniyor...
            </strong>

            <small>
                Kategoriler hazırlanıyor
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

            categoriesContainer.innerHTML = `
                <div class="category-card">

                    <span>📂</span>

                    <strong>
                        Henüz kategori yok
                    </strong>

                    <small>
                        Yakında eklenecek.
                    </small>

                </div>
            `;

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
                                    category.slug
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
                                        ""
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

    } catch (error) {

        console.error(
            "Kategoriler alınamadı:",
            error
        );

        categoriesContainer.innerHTML = `
            <div class="category-card">

                <span>⚠️</span>

                <strong>
                    Kategoriler yüklenemedi
                </strong>

                <small>
                    Lütfen sayfayı yenileyin.
                </small>

            </div>
        `;
    }
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
                    Lütfen bekleyin.
                </p>

            </div>

        </article>
    `;

    try {

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

        if (businessError) {
            throw businessError;
        }

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
            throw categoryError;
        }


        // ----------------------------------------------------
        // KATEGORİ EŞLEŞTİR
        // ----------------------------------------------------

        const categoryMap =
            new Map(
                (categories || []).map(
                    category => [

                        String(category.id),

                        category
                    ]
                )
            );


        // ----------------------------------------------------
        // FOTOĞRAFLARI ÇEK
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


        // ----------------------------------------------------
        // EKRANA BAS
        // ----------------------------------------------------

        businessContainer.innerHTML =
            finalBusinesses
                .map(
                    renderBusinessCard
                )
                .join("");

    } catch (error) {

        console.error(
            "Öne çıkan işletmeler alınamadı:",
            error
        );

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
                        Lütfen sayfayı yenileyin.
                    </p>

                </div>

            </article>
        `;
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

            // Önce kapak fotoğrafı
            .order(
                "is_cover",
                {
                    ascending: false
                }
            )

            // Sonra sıra
            .order(
                "sort_order",
                {
                    ascending: true
                }
            )

            // Son olarak yüklenme tarihi
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


        if (error) {

            console.warn(
                "business_images okunamadı. Eski image_url kullanılacak:",
                error
            );

            return businesses;
        }


        // ----------------------------------------------------
        // HER İŞLETME İÇİN İLK FOTOĞRAFI AL
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // FOTOĞRAFI İŞLETMEYE EKLE
        // ----------------------------------------------------

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


                // Galeri yoksa eski fotoğraf
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

    businessContainer.innerHTML = `
        <article class="business-card">

            <div class="business-image">
                🏪
            </div>

            <div class="business-content">

                <span class="badge">
                    YAKINDA
                </span>

                <h3>
                    İlk işletmeler çok yakında
                </h3>

                <p>
                    Trabzon'daki işletmeler
                    burada yer alacak.
                </p>

                <div class="business-bottom">

                    <span>
                        Trabzon Anlık
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

function renderBusinessCard(business) {

    const categoryName =
        business.categories?.name ||
        "İŞLETME";

    const categoryIcon =
        business.categories?.icon ||
        "🏪";


    // --------------------------------------------------------
    // FOTOĞRAF
    // --------------------------------------------------------

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
                    onerror="this.style.display='none'; this.parentElement.textContent='${escapeHtml(categoryIcon)}';"
                >
            `

            : escapeHtml(categoryIcon);


    // --------------------------------------------------------
    // PUAN
    // --------------------------------------------------------

    const rating =
        Number(
            business.rating || 0
        );

    const ratingText =
        rating > 0
            ? `⭐ ${rating.toFixed(1)}`
            : "⭐ Yeni";


    // --------------------------------------------------------
    // SLUG
    // --------------------------------------------------------

    const businessSlug =
        business.slug
            ? encodeURIComponent(
                business.slug
            )
            : "";


    // --------------------------------------------------------
    // DETAY SAYFASI
    // --------------------------------------------------------

    const detailUrl =
        businessSlug
            ? `isletme.html?slug=${businessSlug}`
            : "#";


    // --------------------------------------------------------
    // İŞLETME KARTI
    // --------------------------------------------------------

    return `
        <a
            href="${detailUrl}"
            class="business-card"
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

            <div>⏳</div>

            <strong>
                Yükleniyor...
            </strong>

            <span>
                Keşif noktaları hazırlanıyor.
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

            placesContainer.innerHTML = `
                <a href="#" class="place-card">

                    <div>📍</div>

                    <strong>
                        Yakında
                    </strong>

                    <span>
                        Trabzon'un güzel yerleri
                        burada olacak.
                    </span>

                </a>
            `;

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
                                    place.slug
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

    } catch (error) {

        console.error(
            "Keşif yerleri alınamadı:",
            error
        );

        placesContainer.innerHTML = `
            <a href="#" class="place-card">

                <div>⚠️</div>

                <strong>
                    Yerler yüklenemedi
                </strong>

                <span>
                    Lütfen daha sonra tekrar deneyin.
                </span>

            </a>
        `;
    }
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
// ARAMA BAŞLAT
// ============================================================

async function performSearch() {

    const searchText =
        searchInput.value.trim();

    if (!searchText) {

        alert(
            "Lütfen aramak istediğiniz kelimeyi yazın."
        );

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

        if (businessError) {
            throw businessError;
        }

        if (
            !businesses ||
            businesses.length === 0
        ) {

            renderSearchResults([]);

            return;
        }


        // Fotoğrafları ekle
        const businessesWithImages =
            await attachBusinessImages(
                businesses
            );


        // Kategorileri ekle
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
            throw categoryError;
        }

        if (!category) {

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


        // Fotoğrafları ekle
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

                    String(category.id),

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
                        Başka bir arama yapmayı deneyin.
                    </p>

                </div>

            </article>
        `;

        return;
    }

    searchResultsContainer.innerHTML =
        data
            .map(
                renderBusinessCard
            )
            .join("");

    if (searchResultsSection) {

        searchResultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
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

function escapeForQuery(value) {

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