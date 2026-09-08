const SUPABASE_URL =
    "https://yhunhkzsecppbnhjewrt.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_0h5ycfDBJjgdf6bXlZ9OEg_K45u2b2v";

const BUSINESS_IMAGES_BUCKET =
    "business-images";


// ============================================================
// SUPABASE
// ============================================================

let supabaseClient = null;

try {
    if (!window.supabase) {
        throw new Error("Supabase kütüphanesi yüklenemedi.");
    }

    supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );

} catch (error) {

    console.error(
        "Supabase başlatma hatası:",
        error
    );
}


// ============================================================
// ELEMENTLER
// ============================================================

const loginScreen =
    document.getElementById("loginScreen");

const loginForm =
    document.getElementById("loginForm");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const loginMessage =
    document.getElementById("loginMessage");

const adminPanel =
    document.getElementById("adminPanel");

const logoutBtn =
    document.getElementById("logoutBtn");

const refreshBtn =
    document.getElementById("refreshBtn");

const mobileMenuBtn =
    document.getElementById("mobileMenuBtn");

const sidebar =
    document.getElementById("sidebar");

const applications =
    document.getElementById("applications");

const pendingApplications =
    document.getElementById("pendingApplications");

const featuredApplications =
    document.getElementById("featuredApplications");

const reviewsList =
    document.getElementById("reviewsList");

const photoBusinesses =
    document.getElementById("photoBusinesses");

const photoBusinessSearch =
    document.getElementById("photoBusinessSearch");

const businessSearch =
    document.getElementById("businessSearch");

const businessCategoryFilter =
    document.getElementById(
        "businessCategoryFilter"
    );

const businessStatusFilter =
    document.getElementById(
        "businessStatusFilter"
    );

const businessFeaturedFilter =
    document.getElementById(
        "businessFeaturedFilter"
    );

const filterResultCount =
    document.getElementById(
        "filterResultCount"
    );

const editBusinessModal =
    document.getElementById(
        "editBusinessModal"
    );

const editBusinessForm =
    document.getElementById(
        "editBusinessForm"
    );

const closeEditModal =
    document.getElementById(
        "closeEditModal"
    );

const cancelEditBtn =
    document.getElementById(
        "cancelEditBtn"
    );


// ============================================================
// GLOBAL
// ============================================================

let allBusinesses = [];

let allReviews = [];

let isInitializing = false;


// ============================================================
// SAYFA BAŞLANGICI
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeAdmin
);


async function initializeAdmin() {

    if (isInitializing) {
        return;
    }

    isInitializing = true;

    try {

        if (!supabaseClient) {

            showLoginMessage(
                "Supabase bağlantısı başlatılamadı.",
                "error"
            );

            showLogin();

            return;
        }


        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session hatası:",
                error
            );

            showLoginMessage(
                "Oturum kontrol edilemedi: " +
                error.message,
                "error"
            );

            showLogin();

            return;
        }


        if (data?.session?.user) {

            await checkAdmin(
                data.session.user
            );

        } else {

            showLogin();

        }


        supabaseClient.auth.onAuthStateChange(
            async (event, session) => {

                if (
                    event === "SIGNED_IN" &&
                    session?.user
                ) {

                    await checkAdmin(
                        session.user
                    );
                }


                if (
                    event === "SIGNED_OUT"
                ) {

                    showLogin();
                }

            }
        );

    } catch (error) {

        console.error(
            "Admin başlangıç hatası:",
            error
        );

        showLoginMessage(
            "Panel başlatılırken hata oluştu: " +
            error.message,
            "error"
        );

        showLogin();

    } finally {

        isInitializing = false;
    }
}


// ============================================================
// ADMİN KONTROLÜ
// ============================================================

async function checkAdmin(user) {

    if (!user) {

        showLogin();

        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("admin_users")
                .select("id")
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Admin kontrol hatası:",
                error
            );

            showLoginMessage(
                "Admin kontrolü sırasında hata oluştu: " +
                error.message,
                "error"
            );

            showLogin();

            return;
        }


        if (!data) {

            await supabaseClient.auth.signOut();

            showLoginMessage(
                "Bu hesap yönetim paneline erişim yetkisine sahip değil.",
                "error"
            );

            return;
        }


        await showAdmin(
            user
        );

    } catch (error) {

        console.error(
            "Admin kontrol exception:",
            error
        );

        showLoginMessage(
            "Admin kontrolünde hata oluştu: " +
            error.message,
            "error"
        );

        showLogin();
    }
}


// ============================================================
// ADMİN PANELİ GÖSTER
// ============================================================

async function showAdmin(user) {

    if (loginScreen) {
        loginScreen.style.display = "none";
    }


    if (adminPanel) {
        adminPanel.style.display = "block";
    }


    try {

        await Promise.all([
            loadApplications(),
            loadReviews()
        ]);

        renderPendingBusinesses();
        renderFeaturedBusinesses();
        renderPhotoBusinesses();

    } catch (error) {

        console.error(
            "Panel yükleme hatası:",
            error
        );
    }
}


// ============================================================
// LOGIN
// ============================================================

loginForm?.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            loginEmail?.value.trim();

        const password =
            loginPassword?.value || "";


        if (!email || !password) {

            showLoginMessage(
                "E-posta ve şifre gerekli.",
                "error"
            );

            return;
        }


        const button =
            loginForm.querySelector(
                'button[type="submit"]'
            );


        if (button) {

            button.disabled = true;
            button.textContent =
                "Giriş yapılıyor...";
        }


        showLoginMessage(
            "",
            "info"
        );


        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });


            if (error) {
                throw error;
            }


            if (data?.user) {

                await checkAdmin(
                    data.user
                );
            }


        } catch (error) {

            console.error(
                "Giriş hatası:",
                error
            );

            showLoginMessage(
                error.message ||
                "Giriş yapılamadı.",
                "error"
            );

        } finally {

            if (button) {

                button.disabled = false;
                button.textContent =
                    "Giriş Yap";
            }
        }

    }
);


// ============================================================
// ÇIKIŞ
// ============================================================

logoutBtn?.addEventListener(
    "click",
    async function () {

        try {

            await supabaseClient.auth.signOut();

        } catch (error) {

            console.error(
                "Çıkış hatası:",
                error
            );

        }

        showLogin();
    }
);


// ============================================================
// MOBİL MENÜ
// ============================================================

mobileMenuBtn?.addEventListener(
    "click",
    function () {

        sidebar?.classList.toggle(
            "open"
        );
    }
);


// ============================================================
// MENÜLER
// ============================================================

document.querySelectorAll(
    ".menu-item"
).forEach(
    button => {

        button.addEventListener(
            "click",
            function () {

                const section =
                    this.dataset.section;

                if (!section) {
                    return;
                }


                switchSection(
                    section
                );


                sidebar?.classList.remove(
                    "open"
                );
            }
        );
    }
);


// ============================================================
// BÖLÜM DEĞİŞTİR
// ============================================================

function switchSection(sectionName) {

    document.querySelectorAll(
        ".section"
    ).forEach(
        section => {

            section.classList.remove(
                "active"
            );
        }
    );


    document.querySelectorAll(
        ".menu-item"
    ).forEach(
        item => {

            item.classList.remove(
                "active"
            );
        }
    );


    const target =
        document.getElementById(
            "section-" + sectionName
        );


    const menuItem =
        document.querySelector(
            `.menu-item[data-section="${sectionName}"]`
        );


    if (target) {

        target.classList.add(
            "active"
        );
    }


    if (menuItem) {

        menuItem.classList.add(
            "active"
        );
    }


    const pageTitle =
        document.getElementById(
            "pageTitle"
        );


    const titles = {

        dashboard:
            "Dashboard",

        businesses:
            "İşletmeler",

        pending:
            "Bekleyen Başvurular",

        featured:
            "Öne Çıkanlar",

        reviews:
            "Yorumlar",

        photos:
            "Fotoğraf Yönetimi"

    };


    if (pageTitle) {

        pageTitle.textContent =
            titles[sectionName] ||
            "Dashboard";
    }


    if (sectionName === "pending") {

        renderPendingBusinesses();
    }


    if (sectionName === "featured") {

        renderFeaturedBusinesses();
    }


    if (sectionName === "photos") {

        renderPhotoBusinesses();
    }
}


// ============================================================
// YENİLE
// ============================================================

refreshBtn?.addEventListener(
    "click",
    async function () {

        refreshBtn.disabled = true;

        refreshBtn.textContent =
            "⏳ Yenileniyor...";


        try {

            await Promise.all([
                loadApplications(),
                loadReviews()
            ]);

            renderPendingBusinesses();
            renderFeaturedBusinesses();
            renderPhotoBusinesses();

            showMessage(
                "Bilgiler yenilendi.",
                "success"
            );

        } catch (error) {

            console.error(
                error
            );

        } finally {

            refreshBtn.disabled = false;

            refreshBtn.textContent =
                "🔄 Yenile";
        }
    }
);


// ============================================================
// FİLTRELER
// ============================================================

businessSearch?.addEventListener(
    "input",
    applyBusinessFilters
);

businessCategoryFilter?.addEventListener(
    "change",
    applyBusinessFilters
);

businessStatusFilter?.addEventListener(
    "change",
    applyBusinessFilters
);

businessFeaturedFilter?.addEventListener(
    "change",
    applyBusinessFilters
);

photoBusinessSearch?.addEventListener(
    "input",
    renderPhotoBusinesses
);


// ============================================================
// İŞLETMELERİ YÜKLE
// ============================================================

async function loadApplications() {

    if (!applications) {
        return;
    }


    applications.innerHTML = `
        <div class="loading">
            İşletmeler yükleniyor...
        </div>
    `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("businesses")
                .select(`
                    *,
                    categories (
                        name
                    )
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {
            throw error;
        }


        const businesses =
            data || [];


        if (!businesses.length) {

            allBusinesses = [];

            updateDashboard([]);

            populateCategoryFilter([]);

            applications.innerHTML = `
                <div class="empty">
                    Henüz işletme bulunmuyor.
                </div>
            `;

            updateFilterCount(
                0,
                0
            );

            return;
        }


        const result =
            await Promise.all(
                businesses.map(
                    async business => {

                        const {
                            data: images,
                            error: imageError
                        } =
                            await supabaseClient
                                .from("business_images")
                                .select("*")
                                .eq(
                                    "business_id",
                                    business.id
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


                        if (imageError) {

                            console.warn(
                                "Fotoğraf yükleme hatası:",
                                imageError
                            );
                        }


                        return {
                            ...business,
                            images:
                                images || []
                        };
                    }
                )
            );


        allBusinesses =
            result;


        updateDashboard(
            allBusinesses
        );


        populateCategoryFilter(
            allBusinesses
        );


        applyBusinessFilters();


        renderPendingBusinesses();
        renderFeaturedBusinesses();
        renderPhotoBusinesses();


    } catch (error) {

        console.error(
            "İşletmeler yüklenemedi:",
            error
        );


        applications.innerHTML = `
            <div class="empty">
                ❌ İşletmeler yüklenemedi.<br><br>
                <small>${escapeHtml(
                    error.message || ""
                )}</small>
            </div>
        `;

        throw error;
    }
}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard(
    businesses
) {

    const total =
        businesses.length;


    const pending =
        businesses.filter(
            business =>
                !business.is_approved
        ).length;


    const approved =
        businesses.filter(
            business =>
                business.is_approved
        ).length;


    const featured =
        businesses.filter(
            business =>
                business.is_featured
        ).length;


    const totalElement =
        document.getElementById(
            "statTotalBusinesses"
        );

    const pendingElement =
        document.getElementById(
            "statPendingBusinesses"
        );

    const approvedElement =
        document.getElementById(
            "statApprovedBusinesses"
        );

    const featuredElement =
        document.getElementById(
            "statFeaturedBusinesses"
        );


    if (totalElement) {
        totalElement.textContent =
            total;
    }


    if (pendingElement) {
        pendingElement.textContent =
            pending;
    }


    if (approvedElement) {
        approvedElement.textContent =
            approved;
    }


    if (featuredElement) {
        featuredElement.textContent =
            featured;
    }
}


// ============================================================
// KATEGORİ
// ============================================================

function populateCategoryFilter(
    businesses
) {

    if (!businessCategoryFilter) {
        return;
    }


    const currentValue =
        businessCategoryFilter.value;


    const categories =
        businesses
            .map(
                business =>
                    business.categories?.name
            )
            .filter(Boolean)
            .filter(
                (value, index, array) =>
                    array.indexOf(value) === index
            )
            .sort(
                (a, b) =>
                    a.localeCompare(
                        b,
                        "tr"
                    )
            );


    businessCategoryFilter.innerHTML = `
        <option value="">
            Tüm Kategoriler
        </option>
    `;


    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                category;

            option.textContent =
                category;

            businessCategoryFilter.appendChild(
                option
            );
        }
    );


    if (
        categories.includes(
            currentValue
        )
    ) {

        businessCategoryFilter.value =
            currentValue;
    }
}


// ============================================================
// FİLTRELE
// ============================================================

function applyBusinessFilters() {

    const search =
        (
            businessSearch?.value ||
            ""
        )
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            );


    const category =
        businessCategoryFilter?.value ||
        "";


    const status =
        businessStatusFilter?.value ||
        "";


    const featured =
        businessFeaturedFilter?.value ||
        "";


    const filtered =
        allBusinesses.filter(
            business => {

                const searchable =
                    [
                        business.name,
                        business.phone,
                        business.address,
                        business.district,
                        business.owner_name,
                        business.owner_phone,
                        business.owner_email,
                        business.instagram,
                        business.description,
                        business.categories?.name
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLocaleLowerCase(
                            "tr-TR"
                        );


                if (
                    search &&
                    !searchable.includes(
                        search
                    )
                ) {

                    return false;
                }


                if (
                    category &&
                    business.categories?.name !==
                    category
                ) {

                    return false;
                }


                if (
                    status === "approved" &&
                    !business.is_approved
                ) {

                    return false;
                }


                if (
                    status === "pending" &&
                    business.is_approved
                ) {

                    return false;
                }


                if (
                    featured === "featured" &&
                    !business.is_featured
                ) {

                    return false;
                }


                if (
                    featured === "normal" &&
                    business.is_featured
                ) {

                    return false;
                }


                return true;
            }
        );


    renderBusinesses(
        filtered
    );


    updateFilterCount(
        filtered.length,
        allBusinesses.length
    );
}


// ============================================================
// İŞLETME KARTLARI
// ============================================================

function renderBusinesses(
    businesses
) {

    if (!applications) {
        return;
    }


    if (!businesses.length) {

        applications.innerHTML = `
            <div class="empty">
                🔎 Uygun işletme bulunamadı.
            </div>
        `;

        return;
    }


    applications.innerHTML =
        businesses
            .map(
                renderBusinessCard
            )
            .join("");
}


// ============================================================
// FİLTRE SAYACI
// ============================================================

function updateFilterCount(
    filtered,
    total
) {

    if (!filterResultCount) {
        return;
    }


    filterResultCount.textContent =
        `${filtered} işletme gösteriliyor • Toplam ${total} işletme`;
}


// ============================================================
// İŞLETME KARTI
// ============================================================

function renderBusinessCard(
    business
) {

    const images =
        business.images || [];


    const category =
        business.categories?.name ||
        "Kategori yok";


    const status =
        business.is_approved
            ? "Onaylı"
            : "Bekliyor";


    const statusClass =
        business.is_approved
            ? "badge-green"
            : "badge-yellow";


    const gallery =
        images.length
            ? `
                <div class="gallery">
                    ${images
                        .map(
                            (
                                image,
                                index
                            ) =>
                                renderAdminImage(
                                    image,
                                    images,
                                    index
                                )
                        )
                        .join("")}
                </div>
            `
            : `
                <div class="empty">
                    Henüz fotoğraf eklenmemiş.
                </div>
            `;


    return `
        <div class="business-card">

            <div class="business-top">

                <div>
                    <div class="business-title">
                        ${escapeHtml(
                            business.name || "-"
                        )}
                    </div>

                    <div class="business-meta">
                        ${escapeHtml(
                            category
                        )}
                        •
                        ${escapeHtml(
                            business.district || "-"
                        )}
                    </div>
                </div>

                <div class="badges">

                    <span class="badge ${statusClass}">
                        ${status}
                    </span>

                    ${
                        business.is_featured
                            ? `
                                <span class="badge badge-blue">
                                    ⭐ Öne Çıkan
                                </span>
                            `
                            : ""
                    }

                </div>

            </div>


            <div class="business-info">

                <div>
                    <strong>Adres:</strong><br>
                    ${escapeHtml(
                        business.address || "-"
                    )}
                </div>

                <div>
                    <strong>Telefon:</strong><br>
                    ${escapeHtml(
                        business.phone || "-"
                    )}
                </div>

                <div>
                    <strong>İşletme sahibi:</strong><br>
                    ${escapeHtml(
                        business.owner_name || "-"
                    )}
                </div>

                <div>
                    <strong>Sahibi telefonu:</strong><br>
                    ${escapeHtml(
                        business.owner_phone || "-"
                    )}
                </div>

                <div>
                    <strong>E-posta:</strong><br>
                    ${escapeHtml(
                        business.owner_email || "-"
                    )}
                </div>

                <div>
                    <strong>Instagram:</strong><br>
                    ${escapeHtml(
                        business.instagram || "-"
                    )}
                </div>

                <div>
                    <strong>Puan:</strong><br>
                    ⭐ ${Number(
                        business.rating || 0
                    ).toFixed(1)}
                    (${business.review_count || 0})
                </div>

                <div>
                    <strong>Fotoğraf:</strong><br>
                    ${images.length} adet
                </div>

            </div>


            ${
                business.description
                    ? `
                        <div class="description">
                            ${escapeHtml(
                                business.description
                            )}
                        </div>
                    `
                    : ""
            }


            <div>
                <strong>🖼️ Fotoğraf Galerisi</strong>
                ${gallery}

                <div class="upload-box">

                    <input
                        type="file"
                        id="imageInput-${business.id}"
                        accept="image/*"
                    >

                    <button
                        type="button"
                        class="action-btn btn-blue"
                        onclick="uploadBusinessImage(${business.id})"
                    >
                        ➕ Fotoğraf Ekle
                    </button>

                </div>

            </div>


            <div class="business-actions">

                <button
                    type="button"
                    class="action-btn btn-blue"
                    onclick="openEditBusinessModal(${business.id})"
                >
                    ✏️ Düzenle
                </button>


                ${
                    !business.is_approved
                        ? `
                            <button
                                type="button"
                                class="action-btn btn-green"
                                onclick="approveBusiness(${business.id})"
                            >
                                ✓ Onayla
                            </button>

                            <button
                                type="button"
                                class="action-btn btn-red"
                                onclick="rejectBusiness(${business.id})"
                            >
                                ✕ Reddet
                            </button>
                        `
                        : ""
                }


                <button
                    type="button"
                    class="action-btn btn-yellow"
                    onclick="toggleFeatured(
                        ${business.id},
                        ${!business.is_featured}
                    )"
                >
                    ${
                        business.is_featured
                            ? "⭐ Öne Çıkarmayı Kaldır"
                            : "⭐ Öne Çıkar"
                    }
                </button>


                <button
                    type="button"
                    class="action-btn btn-red"
                    onclick="deleteBusiness(${business.id})"
                >
                    🗑️ Sil
                </button>

            </div>

        </div>
    `;
}


// ============================================================
// FOTOĞRAF KARTI
// ============================================================

function renderAdminImage(
    image,
    images,
    index
) {

    const isCover =
        image.is_cover === true;


    const hasPrevious =
        index > 0;


    const hasNext =
        index <
        images.length - 1;


    return `
        <div class="gallery-item">

            <img
                src="${escapeHtml(
                    image.image_url || ""
                )}"
                alt="İşletme fotoğrafı"
                loading="lazy"
            >


            ${
                isCover
                    ? `
                        <span class="cover-label">
                            ⭐ Kapak
                        </span>
                    `
                    : ""
            }


            <div class="gallery-buttons">

                ${
                    !isCover
                        ? `
                            <button
                                type="button"
                                onclick="setCoverImage(
                                    ${image.id},
                                    ${image.business_id}
                                )"
                            >
                                ⭐
                            </button>
                        `
                        : `
                            <button
                                type="button"
                                disabled
                            >
                                ✓
                            </button>
                        `
                }


                <button
                    type="button"
                    ${
                        hasPrevious
                            ? `onclick="moveImage(
                                ${image.id},
                                ${image.business_id},
                                'up'
                            )"`
                            : "disabled"
                    }
                >
                    ↑
                </button>


                <button
                    type="button"
                    ${
                        hasNext
                            ? `onclick="moveImage(
                                ${image.id},
                                ${image.business_id},
                                'down'
                            )"`
                            : "disabled"
                    }
                >
                    ↓
                </button>


                <button
                    type="button"
                    onclick="deleteBusinessImage(
                        ${image.id},
                        ${image.business_id}
                    )"
                >
                    🗑️
                </button>

            </div>

        </div>
    `;
}


// ============================================================
// BEKLEYENLER
// ============================================================

function renderPendingBusinesses() {

    if (!pendingApplications) {
        return;
    }


    const pending =
        allBusinesses.filter(
            business =>
                !business.is_approved
        );


    if (!pending.length) {

        pendingApplications.innerHTML = `
            <div class="empty">
                ✅ Bekleyen başvuru bulunmuyor.
            </div>
        `;

        return;
    }


    pendingApplications.innerHTML =
        pending
            .map(
                renderBusinessCard
            )
            .join("");
}


// ============================================================
// ÖNE ÇIKANLAR
// ============================================================

function renderFeaturedBusinesses() {

    if (!featuredApplications) {
        return;
    }


    const featured =
        allBusinesses.filter(
            business =>
                business.is_featured
        );


    if (!featured.length) {

        featuredApplications.innerHTML = `
            <div class="empty">
                ⭐ Henüz öne çıkarılmış işletme yok.
            </div>
        `;

        return;
    }


    featuredApplications.innerHTML =
        featured
            .map(
                renderBusinessCard
            )
            .join("");
}


// ============================================================
// FOTOĞRAF YÖNETİMİ
// ============================================================

function renderPhotoBusinesses() {

    if (!photoBusinesses) {
        return;
    }


    const search =
        (
            photoBusinessSearch?.value ||
            ""
        )
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            );


    const filtered =
        allBusinesses.filter(
            business => {

                const text =
                    [
                        business.name,
                        business.district,
                        business.address
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLocaleLowerCase(
                            "tr-TR"
                        );


                return !search ||
                    text.includes(
                        search
                    );
            }
        );


    if (!filtered.length) {

        photoBusinesses.innerHTML = `
            <div class="empty">
                İşletme bulunamadı.
            </div>
        `;

        return;
    }


    photoBusinesses.innerHTML =
        filtered
            .map(
                business => {

                    const images =
                        business.images || [];


                    return `
                        <div class="business-card">

                            <div class="business-top">

                                <div>

                                    <div class="business-title">
                                        ${escapeHtml(
                                            business.name
                                        )}
                                    </div>

                                    <div class="business-meta">
                                        ${escapeHtml(
                                            business.district || "-"
                                        )}
                                    </div>

                                </div>

                                <span class="badge badge-blue">
                                    ${images.length} fotoğraf
                                </span>

                            </div>


                            ${
                                images.length
                                    ? `
                                        <div class="gallery">
                                            ${images
                                                .map(
                                                    (
                                                        image,
                                                        index
                                                    ) =>
                                                        renderAdminImage(
                                                            image,
                                                            images,
                                                            index
                                                        )
                                                )
                                                .join("")}
                                        </div>
                                    `
                                    : `
                                        <div class="empty">
                                            Bu işletmede fotoğraf yok.
                                        </div>
                                    `
                            }

                        </div>
                    `;
                }
            )
            .join("");
}


// ============================================================
// FOTOĞRAF YÜKLE
// ============================================================

async function uploadBusinessImage(
    businessId
) {

    const input =
        document.getElementById(
            `imageInput-${businessId}`
        );


    if (
        !input ||
        !input.files ||
        !input.files.length
    ) {

        showMessage(
            "Önce bir fotoğraf seç.",
            "error"
        );

        return;
    }


    const file =
        input.files[0];


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        showMessage(
            "Sadece fotoğraf yükleyebilirsin.",
            "error"
        );

        return;
    }


    if (
        file.size >
        5 * 1024 * 1024
    ) {

        showMessage(
            "Fotoğraf en fazla 5 MB olabilir.",
            "error"
        );

        return;
    }


    try {

        showMessage(
            "Fotoğraf yükleniyor...",
            "info"
        );


        const {
            data: existing,
            error: existingError
        } =
            await supabaseClient
                .from("business_images")
                .select("*")
                .eq(
                    "business_id",
                    businessId
                )
                .order(
                    "sort_order",
                    {
                        ascending: true
                    }
                );


        if (existingError) {
            throw existingError;
        }


        const images =
            existing || [];


        const maxOrder =
            images.reduce(
                (
                    max,
                    item
                ) =>
                    Math.max(
                        max,
                        Number(
                            item.sort_order || 0
                        )
                    ),
                -1
            );


        const extension =
            (
                file.name
                    .split(".")
                    .pop() ||
                "jpg"
            )
                .toLowerCase()
                .replace(
                    /[^a-z0-9]/g,
                    ""
                ) ||
                "jpg";


        const random =
            Math.random()
                .toString(36)
                .substring(
                    2,
                    10
                );


        const filePath =
            `businesses/${businessId}/${Date.now()}-${random}.${extension}`;


        const {
            error: uploadError
        } =
            await supabaseClient
                .storage
                .from(
                    BUSINESS_IMAGES_BUCKET
                )
                .upload(
                    filePath,
                    file,
                    {
                        cacheControl:
                            "3600",
                        upsert:
                            false,
                        contentType:
                            file.type
                    }
                );


        if (uploadError) {
            throw uploadError;
        }


        const {
            data: publicData
        } =
            supabaseClient
                .storage
                .from(
                    BUSINESS_IMAGES_BUCKET
                )
                .getPublicUrl(
                    filePath
                );


        const imageUrl =
            publicData?.publicUrl;


        if (!imageUrl) {

            throw new Error(
                "Fotoğraf URL'si oluşturulamadı."
            );
        }


        const {
            error: insertError
        } =
            await supabaseClient
                .from("business_images")
                .insert({

                    business_id:
                        businessId,

                    image_url:
                        imageUrl,

                    is_cover:
                        images.length === 0,

                    sort_order:
                        maxOrder + 1
                });


        if (insertError) {

            await supabaseClient
                .storage
                .from(
                    BUSINESS_IMAGES_BUCKET
                )
                .remove([
                    filePath
                ]);

            throw insertError;
        }


        input.value = "";


        showMessage(
            images.length === 0
                ? "Fotoğraf yüklendi ve kapak yapıldı."
                : "Fotoğraf başarıyla yüklendi.",
            "success"
        );


        await loadApplications();

    } catch (error) {

        console.error(
            "Fotoğraf yükleme hatası:",
            error
        );

        showMessage(
            "Fotoğraf yüklenemedi: " +
            error.message,
            "error"
        );
    }
}


// ============================================================
// KAPAK FOTOĞRAFI
// ============================================================

async function setCoverImage(
    imageId,
    businessId
) {

    try {

        const {
            error: resetError
        } =
            await supabaseClient
                .from("business_images")
                .update({
                    is_cover: false
                })
                .eq(
                    "business_id",
                    businessId
                );


        if (resetError) {
            throw resetError;
        }


        const {
            error
        } =
            await supabaseClient
                .from("business_images")
                .update({
                    is_cover: true
                })
                .eq(
                    "id",
                    imageId
                )
                .eq(
                    "business_id",
                    businessId
                );


        if (error) {
            throw error;
        }


        showMessage(
            "Kapak fotoğrafı değiştirildi.",
            "success"
        );


        await loadApplications();

    } catch (error) {

        console.error(
            error
        );

        showMessage(
            "Kapak değiştirilemedi: " +
            error.message,
            "error"
        );
    }
}


// ============================================================
// FOTOĞRAF SİL
// ============================================================

async function deleteBusinessImage(
    imageId,
    businessId
) {

    if (
        !confirm(
            "Bu fotoğrafı silmek istediğine emin misin?"
        )
    ) {

        return;
    }


    try {

        const {
            data: image,
            error: fetchError
        } =
            await supabaseClient
                .from("business_images")
                .select("*")
                .eq(
                    "id",
                    imageId
                )
                .maybeSingle();


        if (fetchError) {
            throw fetchError;
        }


        if (!image) {

            showMessage(
                "Fotoğraf bulunamadı.",
                "error"
            );

            return;
        }


        const wasCover =
            image.is_cover === true;


        const path =
            extractStoragePath(
                image.image_url
            );


        if (path) {

            await supabaseClient
                .storage
                .from(
                    BUSINESS_IMAGES_BUCKET
                )
                .remove([
                    path
                ]);
        }


        const {
            error: deleteError
        } =
            await supabaseClient
                .from("business_images")
                .delete()
                .eq(
                    "id",
                    imageId
                );


        if (deleteError) {
            throw deleteError;
        }


        if (wasCover) {

            const {
                data: remaining
            } =
                await supabaseClient
                    .from("business_images")
                    .select("*")
                    .eq(
                        "business_id",
                        businessId
                    )
                    .order(
                        "sort_order",
                        {
                            ascending: true
                        }
                    )
                    .limit(1);


            if (
                remaining?.length
            ) {

                await supabaseClient
                    .from("business_images")
                    .update({
                        is_cover: true
                    })
                    .eq(
                        "id",
                        remaining[0].id
                    );
            }
        }


        showMessage(
            "Fotoğraf silindi.",
            "success"
        );


        await loadApplications();

    } catch (error) {

        console.error(
            error
        );

        showMessage(
            "Fotoğraf silinemedi: " +
            error.message,
            "error"
        );
    }
}


// ============================================================
// FOTOĞRAF SIRASI
// ============================================================

async function moveImage(
    imageId,
    businessId,
    direction
) {

    try {

        const {
            data: images,
            error
        } =
            await supabaseClient
                .from("business_images")
                .select("*")
                .eq(
                    "business_id",
                    businessId
                )
                .order(
                    "sort_order",
                    {
                        ascending: true
                    }
                );


        if (error) {
            throw error;
        }


        const index =
            images.findIndex(
                image =>
                    Number(image.id) ===
                    Number(imageId)
            );


        if (index === -1) {
            return;
        }


        const targetIndex =
            direction === "up"
                ? index - 1
                : index + 1;


        if (
            targetIndex < 0 ||
            targetIndex >= images.length
        ) {
            return;
        }


        const current =
            images[index];

        const target =
            images[targetIndex];


        const currentOrder =
            Number(
                current.sort_order || 0
            );


        const targetOrder =
            Number(
                target.sort_order || 0
            );


        const {
            error: tempError
        } =
            await supabaseClient
                .from("business_images")
                .update({
                    sort_order: -999999
                })
                .eq(
                    "id",
                    current.id
                );


        if (tempError) {
            throw tempError;
        }


        const {
            error: targetError
        } =
            await supabaseClient
                .from("business_images")
                .update({
                    sort_order:
                        currentOrder
                })
                .eq(
                    "id",
                    target.id
                );


        if (targetError) {
            throw targetError;
        }


        const {
            error: currentError
        } =
            await supabaseClient
                .from("business_images")
                .update({
                    sort_order:
                        targetOrder
                })
                .eq(
                    "id",
                    current.id
                );


        if (currentError) {
            throw currentError;
        }


        await loadApplications();

    } catch (error) {

        console.error(
            "Sıralama hatası:",
            error
        );

        showMessage(
            "Fotoğraf sırası değiştirilemedi: " +
            error.message,
            "error"
        );
    }
}


// ============================================================
// STORAGE PATH
// ============================================================

function extractStoragePath(
    imageUrl
) {

    if (!imageUrl) {
        return null;
    }


    const marker =
        `/object/public/${BUSINESS_IMAGES_BUCKET}/`;


    const position =
        imageUrl.indexOf(
            marker
        );


    if (position === -1) {
        return null;
    }


    return imageUrl.substring(
        position + marker.length
    );
}


// ============================================================
// İŞLETME DÜZENLEME MODALI
// ============================================================

function openEditBusinessModal(
    businessId
) {

    const business =
        allBusinesses.find(
            item =>
                Number(item.id) ===
                Number(businessId)
        );


    if (!business) {

        showMessage(
            "İşletme bulunamadı.",
            "error"
        );

        return;
    }


    const setValue =
        (
            id,
            value
        ) => {

            const element =
                document.getElementById(
                    id
                );

            if (element) {
                element.value =
                    value ?? "";
            }
        };


    setValue(
        "editBusinessId",
        business.id
    );


    setValue(
        "editBusinessName",
        business.name
    );


    setValue(
        "editBusinessDistrict",
        business.district
    );


    setValue(
        "editBusinessAddress",
        business.address
    );


    setValue(
        "editBusinessPhone",
        business.phone
    );


    setValue(
        "editBusinessOwnerName",
        business.owner_name
    );


    setValue(
        "editBusinessOwnerPhone",
        business.owner_phone
    );


    setValue(
        "editBusinessOwnerEmail",
        business.owner_email
    );


    setValue(
        "editBusinessInstagram",
        business.instagram
    );


    setValue(
        "editBusinessDescription",
        business.description
    );


    const category =
        document.getElementById(
            "editBusinessCategory"
        );


    if (category) {

        category.innerHTML = "";

        const option =
            document.createElement(
                "option"
            );

        option.value =
            business.category_id || "";

        option.textContent =
            business.categories?.name ||
            "Kategori yok";

        category.appendChild(
            option
        );

        category.value =
            business.category_id || "";
    }


    setValue(
        "editBusinessApproved",
        String(
            business.is_approved
        )
    );


    setValue(
        "editBusinessFeatured",
        String(
            business.is_featured
        )
    );


    if (editBusinessModal) {

        editBusinessModal.classList.add(
            "open"
        );

        document.body.style.overflow =
            "hidden";
    }
}


// ============================================================
// MODAL KAPAT
// ============================================================

function closeEditBusinessModal() {

    if (editBusinessModal) {

        editBusinessModal.classList.remove(
            "open"
        );
    }


    document.body.style.overflow =
        "";
}


closeEditModal?.addEventListener(
    "click",
    closeEditBusinessModal
);

cancelEditBtn?.addEventListener(
    "click",
    closeEditBusinessModal
);


editBusinessModal?.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            editBusinessModal
        ) {

            closeEditBusinessModal();
        }
    }
);


document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            editBusinessModal?.classList.contains(
                "open"
            )
        ) {

            closeEditBusinessModal();
        }
    }
);


// ============================================================
// İŞLETME KAYDET
// ============================================================

editBusinessForm?.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const getValue =
            id =>
                document.getElementById(
                    id
                )?.value.trim() || "";


        const id =
            getValue(
                "editBusinessId"
            );


        const name =
            getValue(
                "editBusinessName"
            );


        if (!id) {

            showMessage(
                "İşletme kimliği bulunamadı.",
                "error"
            );

            return;
        }


        if (!name) {

            showMessage(
                "İşletme adı boş bırakılamaz.",
                "error"
            );

            return;
        }


        const categoryElement =
            document.getElementById(
                "editBusinessCategory"
            );


        const categoryId =
            categoryElement?.value || null;


        const approved =
            document.getElementById(
                "editBusinessApproved"
            )?.value === "true";


        const featured =
            document.getElementById(
                "editBusinessFeatured"
            )?.value === "true";


        const saveButton =
            editBusinessForm.querySelector(
                'button[type="submit"]'
            );


        if (saveButton) {

            saveButton.disabled = true;

            saveButton.textContent =
                "💾 Kaydediliyor...";
        }


        try {

            const updateData = {

                name,

                district:
                    getValue(
                        "editBusinessDistrict"
                    ),

                address:
                    getValue(
                        "editBusinessAddress"
                    ),

                phone:
                    getValue(
                        "editBusinessPhone"
                    ),

                owner_name:
                    getValue(
                        "editBusinessOwnerName"
                    ),

                owner_phone:
                    getValue(
                        "editBusinessOwnerPhone"
                    ),

                owner_email:
                    getValue(
                        "editBusinessOwnerEmail"
                    ),

                instagram:
                    getValue(
                        "editBusinessInstagram"
                    ),

                description:
                    getValue(
                        "editBusinessDescription"
                    ),

                is_approved:
                    approved,

                is_featured:
                    featured
            };


            if (categoryId) {

                updateData.category_id =
                    categoryId;
            }


            const {
                error
            } =
                await supabaseClient
                    .from("businesses")
                    .update(
                        updateData
                    )
                    .eq(
                        "id",
                        id
                    );


            if (error) {
                throw error;
            }


            closeEditBusinessModal();


            showMessage(
                "İşletme bilgileri başarıyla güncellendi.",
                "success"
            );


            await loadApplications();

        } catch (error) {

            console.error(
                "İşletme güncelleme hatası:",
                error
            );

            showMessage(
                "İşletme güncellenemedi: " +
                error.message,
                "error"
            );

        } finally {

            if (saveButton) {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "💾 Değişiklikleri Kaydet";
            }
        }
    }
);


// ============================================================
// İŞLETME ONAYLA
// ============================================================

async function approveBusiness(
    id
) {

    try {

        const {
            error
        } =
            await supabaseClient
                .from("businesses")
                .update({
                    is_approved: true
                })
                .eq(
                    "id",
                    id
                );


        if (error) {
            throw error;
        }


        showMessage(
            "İşletme onaylandı.",
            "success"
        );


        await loadApplications();

    } catch (error) {

        console.error(
            error
        );

        showMessage(
            "İşletme onaylanamadı: " +
            error.message,
            "error"
        );
    }
}


// ============================================================
// ÖNE ÇIKAR
// ============================================================

async function toggleFeatured(
    id,
    featured
) {

    try {

        const {
            error
        } =
            await supabaseClient
                .from("businesses")
                .update({
                    is_featured:
                        featured
                })
                .eq(
                    "id",
                    id
                );


        if (error) {
            throw error;
        }


        showMessage(
            featured
                ? "İşletme öne çıkarıldı."
                : "Öne çıkarma kaldırıldı.",
            "success"
        );


        await loadApplications();

    } catch (error) {

        console.error(
            error
        );

        showMessage(
            "İşlem gerçekleştirilemedi: " +
            error.message,
            "error"
        );
    }
}


// ============================================================
// REDDET
// ============================================================

async function rejectBusiness(
    id
) {

    if (
        !confirm(
            "Bu işletme başvurusunu reddetmek istediğine emin misin?"
        )
    ) {

        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("businesses")
                .update({

                    is_approved:
                        false,

                    is_featured:
                        false
                })
                .eq(
                    "id",
                    id
                );


        if (error) {
            throw error;
        }


        showMessage(
            "İşletme reddedildi.",
            "success"
        );


        await loadApplications();

    } catch (error) {

        console.error(
            error
        );

        showMessage(
            "İşletme reddedilemedi: " +
            error.message,
            "error"
        );
    }
}


// ============================================================
// İŞLETME SİL
// ============================================================

async function deleteBusiness(
    id
) {

    if (
        !confirm(
            "Bu işletmeyi ve fotoğraflarını tamamen silmek istediğine emin misin?"
        )
    ) {

        return;
    }


    try {

        const {
            data: images,
            error: imageFetchError
        } =
            await supabaseClient
                .from("business_images")
                .select("*")
                .eq(
                    "business_id",
                    id
                );


        if (imageFetchError) {
            throw imageFetchError;
        }


        if (images?.length) {

            const paths =
                images
                    .map(
                        image =>
                            extractStoragePath(
                                image.image_url
                            )
                    )
                    .filter(Boolean);


            if (paths.length) {

                await supabaseClient
                    .storage
                    .from(
                        BUSINESS_IMAGES_BUCKET
                    )
                    .remove(
                        paths
                    );
            }


            const {
                error: imageDeleteError
            } =
                await supabaseClient
                    .from("business_images")
                    .delete()
                    .eq(
                        "business_id",
                        id
                    );


            if (imageDeleteError) {
                throw imageDeleteError;
            }
        }


        const {
            error
        } =
            await supabaseClient
                .from("businesses")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (error) {
            throw error;
        }


        showMessage(
            "İşletme silindi.",
            "success"
        );


        await loadApplications();

    } catch (error) {

        console.error(
            "İşletme silme hatası:",
            error
        );

        showMessage(
            "İşletme silinemedi: " +
            error.message,
            "error"
        );
    }
}


// ============================================================
// YORUMLAR
// ============================================================

async function loadReviews() {

    if (!reviewsList) {
        return;
    }


    reviewsList.innerHTML = `
        <div class="loading">
            Yorumlar yükleniyor...
        </div>
    `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("reviews")
                .select(`
                    *,
                    businesses (
                        id,
                        name
                    )
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {
            throw error;
        }


        allReviews =
            data || [];


        updateReviewDashboard(
            allReviews.length
        );


        if (!allReviews.length) {

            reviewsList.innerHTML = `
                <div class="empty">
                    Henüz yorum bulunmuyor.
                </div>
            `;

            return;
        }


        reviewsList.innerHTML =
            allReviews
                .map(
                    renderReview
                )
                .join("");

    } catch (error) {

        console.error(
            "Yorum yükleme hatası:",
            error
        );


        reviewsList.innerHTML = `
            <div class="empty">
                ❌ Yorumlar yüklenemedi.<br><br>
                <small>${escapeHtml(
                    error.message || ""
                )}</small>
            </div>
        `;

        updateReviewDashboard(0);
    }
}


// ============================================================
// YORUM KARTI
// ============================================================

function renderReview(
    review
) {

    const businessName =
        review.businesses?.name ||
        "Bilinmeyen işletme";


    const rating =
        Math.max(
            0,
            Math.min(
                5,
                Math.round(
                    Number(
                        review.rating || 0
                    )
                )
            )
        );


    return `
        <div class="review-card">

            <div class="review-header">

                <div>

                    <div class="review-name">
                        ${escapeHtml(
                            review.user_name ||
                            "İsimsiz"
                        )}
                    </div>

                    <small>
                        ${escapeHtml(
                            businessName
                        )}
                    </small>

                </div>

                <div class="review-stars">
                    ${
                        "⭐".repeat(
                            rating
                        )
                    }
                </div>

            </div>


            <div class="review-comment">
                ${escapeHtml(
                    review.comment || ""
                )}
            </div>


            <small>
                ${formatDate(
                    review.created_at
                )}
            </small>


            <div class="business-actions">

                ${
                    !review.is_approved
                        ? `
                            <button
                                type="button"
                                class="action-btn btn-green"
                                onclick="approveReview(${review.id})"
                            >
                                ✓ Onayla
                            </button>
                        `
                        : `
                            <span class="badge badge-green">
                                ✓ Onaylı
                            </span>
                        `
                }


                <button
                    type="button"
                    class="action-btn btn-red"
                    onclick="deleteReview(
                        ${review.id},
                        ${review.business_id}
                    )"
                >
                    🗑️ Sil
                </button>

            </div>

        </div>
    `;
}


// ============================================================
// YORUM SAYISI
// ============================================================

function updateReviewDashboard(
    count
) {

    const element =
        document.getElementById(
            "statReviews"
        );


    if (element) {

        element.textContent =
            count;
    }
}


// ============================================================
// YORUM ONAYLA
// ============================================================

async function approveReview(
    reviewId
) {

    try {

        const {
            data: review,
            error: fetchError
        } =
            await supabaseClient
                .from("reviews")
                .select("*")
                .eq(
                    "id",
                    reviewId
                )
                .single();


        if (fetchError) {
            throw fetchError;
        }


        const {
            error
        } =
            await supabaseClient
                .from("reviews")
                .update({
                    is_approved: true
                })
                .eq(
                    "id",
                    reviewId
                );


        if (error) {
            throw error;
        }


        await updateBusinessRating(
            review.business_id
        );


        showMessage(
            "Yorum onaylandı.",
            "success"
        );


        await Promise.all([
            loadReviews(),
            loadApplications()
        ]);

    } catch (error) {

        console.error(
            error
        );

        showMessage(
            "Yorum onaylanamadı: " +
            error.message,
            "error"
        );
    }
}


// ============================================================
// PUAN HESAPLA
// ============================================================

async function updateBusinessRating(
    businessId
) {

    const {
        data: reviews,
        error
    } =
        await supabaseClient
            .from("reviews")
            .select("rating")
            .eq(
                "business_id",
                businessId
            )
            .eq(
                "is_approved",
                true
            );


    if (error) {
        throw error;
    }


    const list =
        reviews || [];


    const count =
        list.length;


    const total =
        list.reduce(
            (
                sum,
                review
            ) =>
                sum +
                Number(
                    review.rating || 0
                ),
            0
        );


    const rating =
        count
            ? total / count
            : 0;


    const {
        error: updateError
    } =
        await supabaseClient
            .from("businesses")
            .update({

                rating:
                    Math.round(
                        rating * 10
                    ) / 10,

                review_count:
                    count
            })
            .eq(
                "id",
                businessId
            );


    if (updateError) {
        throw updateError;
    }
}


// ============================================================
// YORUM SİL
// ============================================================

async function deleteReview(
    reviewId,
    businessId
) {

    if (
        !confirm(
            "Bu yorumu silmek istediğine emin misin?"
        )
    ) {

        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("reviews")
                .delete()
                .eq(
                    "id",
                    reviewId
                );


        if (error) {
            throw error;
        }


        await updateBusinessRating(
            businessId
        );


        showMessage(
            "Yorum silindi.",
            "success"
        );


        await Promise.all([
            loadReviews(),
            loadApplications()
        ]);

    } catch (error) {

        console.error(
            error
        );

        showMessage(
            "Yorum silinemedi: " +
            error.message,
            "error"
        );
    }
}


// ============================================================
// MESAJ
// ============================================================

function showMessage(
    text,
    type = "info"
) {

    let messageElement =
        document.getElementById(
            "adminMessage"
        );


    if (!messageElement) {

        messageElement =
            document.createElement(
                "div"
            );


        messageElement.id =
            "adminMessage";


        messageElement.style.position =
            "fixed";

        messageElement.style.right =
            "20px";

        messageElement.style.bottom =
            "20px";

        messageElement.style.zIndex =
            "9999";

        messageElement.style.padding =
            "14px 18px";

        messageElement.style.borderRadius =
            "10px";

        messageElement.style.background =
            "#111827";

        messageElement.style.color =
            "#fff";

        messageElement.style.fontWeight =
            "700";

        messageElement.style.boxShadow =
            "0 10px 30px rgba(0,0,0,.2)";


        document.body.appendChild(
            messageElement
        );
    }


    messageElement.textContent =
        text;


    if (type === "success") {

        messageElement.style.background =
            "#16a34a";

    } else if (type === "error") {

        messageElement.style.background =
            "#dc2626";

    } else {

        messageElement.style.background =
            "#2563eb";
    }


    messageElement.style.display =
        "block";


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(
            function () {

                messageElement.style.display =
                    "none";

            },
            4000
        );
}


// ============================================================
// LOGIN MESAJI
// ============================================================

function showLoginMessage(
    text,
    type = "info"
) {

    if (!loginMessage) {
        return;
    }


    loginMessage.textContent =
        text || "";


    if (!text) {

        loginMessage.style.display =
            "none";

        return;
    }


    loginMessage.style.display =
        "block";


    loginMessage.style.color =
        type === "error"
            ? "#dc2626"
            : "#2563eb";
}


// ============================================================
// LOGIN GÖSTER
// ============================================================

function showLogin() {

    if (loginScreen) {

        loginScreen.style.display =
            "flex";
    }


    if (adminPanel) {

        adminPanel.style.display =
            "none";
    }


    if (loginPassword) {

        loginPassword.value =
            "";
    }


    if (loginEmail) {

        loginEmail.focus();
    }
}


// ============================================================
// TARİH
// ============================================================

function formatDate(
    value
) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";
    }


    return date.toLocaleString(
        "tr-TR",
        {
            dateStyle:
                "medium",
            timeStyle:
                "short"
        }
    );
}


// ============================================================
// HTML GÜVENLİĞİ
// ============================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
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