// ============================================================
// TRABZON ANLIK
// SUPABASE BAĞLANTISI
// ============================================================


// ------------------------------------------------------------
// SUPABASE AYARLARI
// ------------------------------------------------------------

const SUPABASE_URL = "https://yhunhkzsecppbnhjewrt.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_0h5ycfDBJjgdf6bXlZ9OEg_K45u2b2v";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ------------------------------------------------------------
// SAYFA ELEMENTLERİ
// ------------------------------------------------------------

const menuButton =
    document.querySelector(".menu-button");

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


// ------------------------------------------------------------
// SAYFA YÜKLENDİĞİNDE
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {

    console.log("Trabzon Anlık başlatılıyor...");

    await loadCategories();

    await loadFeaturedBusinesses();

    await loadPlaces();

    setupSearch();

    setupMobileMenu();

    setupPopularSearches();

});


// ============================================================
// KATEGORİLERİ GETİR
// ============================================================

async function loadCategories() {

    if (!categoriesContainer) {
        return;
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("categories")
        .select("*")
        .order("id", {
            ascending: true
        });


    if (error) {

        console.error(
            "Kategoriler alınamadı:",
            error
        );

        categoriesContainer.innerHTML = `
            <div class="category-card">
                <span>⚠️</span>
                <strong>Bağlantı hatası</strong>
                <small>Kategoriler yüklenemedi.</small>
            </div>
        `;

        return;
    }


    if (!data || data.length === 0) {

        categoriesContainer.innerHTML = `
            <div class="category-card">
                <span>📂</span>
                <strong>Henüz kategori yok</strong>
                <small>Yakında eklenecek.</small>
            </div>
        `;

        return;
    }


    categoriesContainer.innerHTML = data
        .map(category => {

            return `
                <a
                    href="#isletmeler"
                    class="category-card"
                    data-category="${escapeHtml(category.slug)}"
                >

                    <span>
                        ${escapeHtml(category.icon || "📌")}
                    </span>

                    <strong>
                        ${escapeHtml(category.name)}
                    </strong>

                    <small>
                        ${escapeHtml(
                            category.description || ""
                        )}
                    </small>

                </a>
            `;

        })
        .join("");


    // Kategori tıklamaları

    document
        .querySelectorAll(".category-card[data-category]")
        .forEach(card => {

            card.addEventListener("click", async event => {

                event.preventDefault();

                const categorySlug =
                    card.dataset.category;

                await searchByCategory(
                    categorySlug
                );

            });

        });

}


// ============================================================
// ÖNE ÇIKAN İŞLETMELER
// ============================================================

async function loadFeaturedBusinesses() {

    if (!businessContainer) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("businesses")
        .select(`
            *,
            categories (
                name,
                icon
            )
        `)
        .eq("is_approved", true)
        .eq("is_featured", true)
        .order("created_at", {
            ascending: false
        })
        .limit(6);


    if (error) {

        console.error(
            "İşletmeler alınamadı:",
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
                        Lütfen daha sonra tekrar deneyin.
                    </p>

                </div>

            </article>
        `;

        return;
    }


    if (!data || data.length === 0) {

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
                        Trabzon'daki işletmeler burada yer alacak.
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

        return;
    }


    businessContainer.innerHTML =
        data.map(business => {

            const categoryName =
                business.categories?.name ||
                "İŞLETME";


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
                        >
                      `
                    : `
                        ${escapeHtml(
                            business.categories?.icon || "🏪"
                        )}
                      `;


            const rating =
                Number(business.rating || 0);


            const ratingText =
                rating > 0
                    ? `⭐ ${rating.toFixed(1)}`
                    : "⭐ Yeni";


            return `

                <article class="business-card">

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
                            📍 ${escapeHtml(
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
                                →
                            </span>

                        </div>

                    </div>

                </article>

            `;

        }).join("");

}


// ============================================================
// TRABZON'U KEŞFET
// ============================================================

async function loadPlaces() {

    if (!placesContainer) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("places")
        .select("*")
        .eq("is_featured", true)
        .order("id", {
            ascending: true
        });


    if (error) {

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

        return;
    }


    if (!data || data.length === 0) {

        placesContainer.innerHTML = `
            <a href="#" class="place-card">

                <div>📍</div>

                <strong>
                    Yakında
                </strong>

                <span>
                    Trabzon'un güzel yerleri burada olacak.
                </span>

            </a>
        `;

        return;
    }


    placesContainer.innerHTML =
        data.map(place => {

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

        }).join("");

}


// ============================================================
// ARAMA SİSTEMİ
// ============================================================

function setupSearch() {

    if (!searchButton || !searchInput) {
        return;
    }


    searchButton.addEventListener(
        "click",
        performSearch
    );


    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                performSearch();

            }

        }
    );

}


// ------------------------------------------------------------
// ARAMA
// ------------------------------------------------------------

async function performSearch() {

    const searchText =
        searchInput.value.trim();


    if (!searchText) {

        alert(
            "Lütfen aramak istediğin şeyi yazın."
        );

        searchInput.focus();

        return;
    }


    await searchBusinesses(searchText);

}


// ============================================================
// İŞLETME ARAMA
// ============================================================

async function searchBusinesses(searchText) {

    if (!searchResultsContainer) {
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


    const {
        data,
        error
    } = await supabaseClient
        .from("businesses")
        .select(`
            *,
            categories (
                name,
                icon
            )
        `)
        .eq("is_approved", true)
        .or(
            `name.ilike.%${escapeForQuery(searchText)}%,description.ilike.%${escapeForQuery(searchText)}%,district.ilike.%${escapeForQuery(searchText)}%,address.ilike.%${escapeForQuery(searchText)}%`
        )
        .order("is_featured", {
            ascending: false
        })
        .limit(20);


    if (error) {

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

        return;
    }


    renderSearchResults(data);

}


// ============================================================
// KATEGORİYE GÖRE ARAMA
// ============================================================

async function searchByCategory(categorySlug) {

    if (!searchResultsContainer) {
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


    const {
        data: category,
        error: categoryError
    } = await supabaseClient
        .from("categories")
        .select("id,name")
        .eq("slug", categorySlug)
        .maybeSingle();


    if (categoryError || !category) {

        console.error(
            "Kategori bulunamadı:",
            categoryError
        );

        renderSearchResults([]);

        return;
    }


    searchResultsTitle.textContent =
        category.name;


    const {
        data,
        error
    } = await supabaseClient
        .from("businesses")
        .select(`
            *,
            categories (
                name,
                icon
            )
        `)
        .eq("is_approved", true)
        .eq("category_id", category.id)
        .order("is_featured", {
            ascending: false
        })
        .order("created_at", {
            ascending: false
        })
        .limit(20);


    if (error) {

        console.error(
            "Kategori araması hatası:",
            error
        );

        renderSearchResults([]);

        return;
    }


    renderSearchResults(data);

}


// ============================================================
// ARAMA SONUÇLARINI GÖSTER
// ============================================================

function renderSearchResults(data) {

    if (!searchResultsContainer) {
        return;
    }


    if (!data || data.length === 0) {

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
        data.map(business => {

            const categoryName =
                business.categories?.name ||
                "İŞLETME";


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
                        >
                      `
                    : `
                        ${escapeHtml(
                            business.categories?.icon || "🏪"
                        )}
                      `;


            const rating =
                Number(business.rating || 0);


            const ratingText =
                rating > 0
                    ? `⭐ ${rating.toFixed(1)}`
                    : "⭐ Yeni";


            return `

                <article class="business-card">

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

                            📍 ${escapeHtml(
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
                                →
                            </span>

                        </div>

                    </div>

                </article>

            `;

        }).join("");


    searchResultsSection.scrollIntoView({
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


    links.forEach(link => {

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

    });

}


// ============================================================
// MOBİL MENÜ
// ============================================================

function setupMobileMenu() {

    if (!menuButton) {
        return;
    }


    const nav =
        document.querySelector(
            ".desktop-nav"
        );


    menuButton.addEventListener(
        "click",
        () => {

            if (!nav) {
                return;
            }


            nav.classList.toggle(
                "mobile-menu-open"
            );

        }
    );


    // Menüdeki bağlantıya tıklayınca kapat

    if (nav) {

        nav.querySelectorAll("a")
            .forEach(link => {

                link.addEventListener(
                    "click",
                    () => {

                        nav.classList.remove(
                            "mobile-menu-open"
                        );

                    }
                );

            });

    }

}


// ============================================================
// GÜVENLİ HTML
// ============================================================

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================================
// SUPABASE ARAMA KARAKTERLERİ
// ============================================================

function escapeForQuery(value) {

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_")
        .replace(/,/g, "\\,");
}


// ============================================================
// HATA YAKALAMA
// ============================================================

window.addEventListener(
    "error",
    event => {

        console.error(
            "Trabzon Anlık JavaScript hatası:",
            event.error || event.message
        );

    }
);
