// ============================================================
// TRABZON ANLIK - ADMIN PANEL
// ============================================================

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
        throw new Error(
            "Supabase kütüphanesi yüklenemedi."
        );
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
    document.getElementById(
        "photoBusinessSearch"
    );

const businessSearch =
    document.getElementById(
        "businessSearch"
    );

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
// FOTOĞRAF LIGHTBOX GLOBAL
// ============================================================

let photoGallery = [];

let photoGalleryIndex = 0;

let photoTouchStartX = 0;

let photoTouchStartY = 0;


// ============================================================
// ANALYTICS GLOBAL
// ============================================================

let allAnalyticsEvents = [];

let analyticsLoading = false;


// ============================================================
// FOTOĞRAF LIGHTBOX
// ============================================================

function createPhotoLightbox() {

    if (
        document.getElementById(
            "photoLightbox"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");


    style.id =
        "photoLightboxStyles";


    style.textContent = `

        .photo-lightbox {
            display:none;
            position:fixed;
            inset:0;
            width:100%;
            height:100%;
            background:rgba(0,0,0,.94);
            z-index:5000;
            align-items:center;
            justify-content:center;
            padding:20px;
            touch-action:none;
        }

        .photo-lightbox.open {
            display:flex;
        }

        .photo-lightbox-content {
            position:relative;
            width:100%;
            height:100%;
            display:flex;
            align-items:center;
            justify-content:center;
        }

        .photo-lightbox-image {
            max-width:90vw;
            max-height:90vh;
            width:auto;
            height:auto;
            object-fit:contain;
            border-radius:10px;
            user-select:none;
            -webkit-user-select:none;
            -webkit-user-drag:none;
            touch-action:none;
            box-shadow:0 20px 60px rgba(0,0,0,.4);
            transition:opacity .15s ease;
        }

        .photo-lightbox-close,
        .photo-lightbox-prev,
        .photo-lightbox-next {
            position:absolute;
            border:0;
            color:#fff;
            background:rgba(255,255,255,.15);
            z-index:10;
            display:flex;
            align-items:center;
            justify-content:center;
            cursor:pointer;
            transition:.2s;
            -webkit-tap-highlight-color:transparent;
        }

        .photo-lightbox-close:hover,
        .photo-lightbox-prev:hover,
        .photo-lightbox-next:hover {
            background:rgba(255,255,255,.28);
        }

        .photo-lightbox-close {
            top:15px;
            right:20px;
            width:46px;
            height:46px;
            border-radius:50%;
            font-size:31px;
            line-height:1;
        }

        .photo-lightbox-prev,
        .photo-lightbox-next {
            top:50%;
            transform:translateY(-50%);
            width:54px;
            height:54px;
            border-radius:50%;
            font-size:38px;
            line-height:1;
        }

        .photo-lightbox-prev {
            left:20px;
        }

        .photo-lightbox-next {
            right:20px;
        }

        .photo-lightbox-counter {
            position:absolute;
            bottom:18px;
            left:50%;
            transform:translateX(-50%);
            color:#fff;
            background:rgba(0,0,0,.6);
            padding:8px 14px;
            border-radius:20px;
            font-size:13px;
            font-weight:700;
            z-index:10;
            white-space:nowrap;
        }

        .gallery-item img {
            cursor:zoom-in;
        }

        @media(max-width:600px) {

            .photo-lightbox {
                padding:8px;
            }

            .photo-lightbox-image {
                max-width:96vw;
                max-height:84vh;
                border-radius:7px;
            }

            .photo-lightbox-prev,
            .photo-lightbox-next {
                width:43px;
                height:43px;
                font-size:29px;
                background:rgba(255,255,255,.13);
            }

            .photo-lightbox-prev {
                left:8px;
            }

            .photo-lightbox-next {
                right:8px;
            }

            .photo-lightbox-close {
                top:10px;
                right:10px;
                width:42px;
                height:42px;
                font-size:28px;
            }

            .photo-lightbox-counter {
                bottom:12px;
                font-size:12px;
                padding:7px 12px;
            }
        }

    `;


    document.head.appendChild(
        style
    );


    const lightbox =
        document.createElement("div");


    lightbox.id =
        "photoLightbox";


    lightbox.className =
        "photo-lightbox";


    lightbox.innerHTML = `

        <div class="photo-lightbox-content">

            <button
                type="button"
                class="photo-lightbox-close"
                id="photoLightboxClose"
                aria-label="Kapat"
            >
                ×
            </button>

            <button
                type="button"
                class="photo-lightbox-prev"
                id="photoLightboxPrev"
                aria-label="Önceki fotoğraf"
            >
                ‹
            </button>

            <img
                id="photoLightboxImage"
                class="photo-lightbox-image"
                src=""
                alt="İşletme fotoğrafı"
                draggable="false"
            >

            <button
                type="button"
                class="photo-lightbox-next"
                id="photoLightboxNext"
                aria-label="Sonraki fotoğraf"
            >
                ›
            </button>

            <div
                class="photo-lightbox-counter"
                id="photoLightboxCounter"
            >
                1 / 1
            </div>

        </div>

    `;


    document.body.appendChild(
        lightbox
    );


    document
        .getElementById("photoLightboxClose")
        ?.addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                closePhotoGallery();

            }
        );


    document
        .getElementById("photoLightboxPrev")
        ?.addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                showPreviousPhoto();

            }
        );


    document
        .getElementById("photoLightboxNext")
        ?.addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                showNextPhoto();

            }
        );


    lightbox.addEventListener(
        "click",
        function(event) {

            if (
                event.target === lightbox ||
                event.target.classList.contains(
                    "photo-lightbox-content"
                )
            ) {

                closePhotoGallery();

            }

        }
    );


    lightbox.addEventListener(
        "touchstart",
        function(event) {

            if (
                event.touches.length !== 1
            ) {
                return;
            }


            photoTouchStartX =
                event.touches[0].clientX;

            photoTouchStartY =
                event.touches[0].clientY;

        },
        {
            passive:true
        }
    );


    lightbox.addEventListener(
        "touchend",
        function(event) {

            if (
                !photoTouchStartX
            ) {
                return;
            }


            if (
                event.changedTouches.length !== 1
            ) {

                photoTouchStartX = 0;
                photoTouchStartY = 0;

                return;
            }


            const endX =
                event.changedTouches[0].clientX;

            const endY =
                event.changedTouches[0].clientY;


            const diffX =
                endX -
                photoTouchStartX;

            const diffY =
                endY -
                photoTouchStartY;


            photoTouchStartX = 0;
            photoTouchStartY = 0;


            if (
                Math.abs(diffX) < 50 ||
                Math.abs(diffX) <= Math.abs(diffY)
            ) {
                return;
            }


            if (diffX > 0) {

                showPreviousPhoto();

            } else {

                showNextPhoto();

            }

        },
        {
            passive:true
        }
    );
}


// ============================================================
// FOTOĞRAF GALERİSİ AÇ
// ============================================================

function openPhotoGallery(
    images,
    index = 0
) {

    if (
        !Array.isArray(images) ||
        !images.length
    ) {
        return;
    }


    photoGallery =
        images
            .map(
                image => {

                    if (
                        typeof image === "string"
                    ) {
                        return image;
                    }

                    return image?.image_url || "";

                }
            )
            .filter(Boolean);


    if (!photoGallery.length) {
        return;
    }


    photoGalleryIndex =
        Number(index) || 0;


    if (
        photoGalleryIndex < 0
    ) {

        photoGalleryIndex = 0;

    }


    if (
        photoGalleryIndex >=
        photoGallery.length
    ) {

        photoGalleryIndex =
            photoGallery.length - 1;

    }


    createPhotoLightbox();


    const lightbox =
        document.getElementById(
            "photoLightbox"
        );


    if (lightbox) {

        lightbox.classList.add(
            "open"
        );

    }


    document.body.style.overflow =
        "hidden";


    updatePhotoGallery();
}


// ============================================================
// İŞLETME FOTOĞRAF GALERİSİ
// ============================================================

function openBusinessPhotoGallery(
    businessId,
    index = 0
) {

    const business =
        allBusinesses.find(
            item =>
                Number(item.id) ===
                Number(businessId)
        );


    if (!business) {
        return;
    }


    openPhotoGallery(
        business.images || [],
        index
    );
}


// ============================================================
// GALERİ GÜNCELLE
// ============================================================

function updatePhotoGallery() {

    const image =
        document.getElementById(
            "photoLightboxImage"
        );


    const counter =
        document.getElementById(
            "photoLightboxCounter"
        );


    const previous =
        document.getElementById(
            "photoLightboxPrev"
        );


    const next =
        document.getElementById(
            "photoLightboxNext"
        );


    if (
        !image ||
        !photoGallery.length
    ) {
        return;
    }


    if (
        photoGalleryIndex < 0
    ) {

        photoGalleryIndex =
            photoGallery.length - 1;

    }


    if (
        photoGalleryIndex >=
        photoGallery.length
    ) {

        photoGalleryIndex = 0;

    }


    image.style.opacity =
        ".4";


    image.src =
        photoGallery[
            photoGalleryIndex
        ];


    image.onload =
        function() {

            image.style.opacity =
                "1";

        };


    image.onerror =
        function() {

            image.style.opacity =
                "1";

        };


    if (counter) {

        counter.textContent =
            `${photoGalleryIndex + 1} / ${photoGallery.length}`;

    }


    const showNavigation =
        photoGallery.length > 1;


    if (previous) {

        previous.style.display =
            showNavigation
                ? "flex"
                : "none";

    }


    if (next) {

        next.style.display =
            showNavigation
                ? "flex"
                : "none";

    }
}


// ============================================================
// ÖNCEKİ FOTOĞRAF
// ============================================================

function showPreviousPhoto() {

    if (
        !photoGallery.length
    ) {
        return;
    }


    photoGalleryIndex--;


    if (
        photoGalleryIndex < 0
    ) {

        photoGalleryIndex =
            photoGallery.length - 1;

    }


    updatePhotoGallery();
}


// ============================================================
// SONRAKİ FOTOĞRAF
// ============================================================

function showNextPhoto() {

    if (
        !photoGallery.length
    ) {
        return;
    }


    photoGalleryIndex++;


    if (
        photoGalleryIndex >=
        photoGallery.length
    ) {

        photoGalleryIndex = 0;

    }


    updatePhotoGallery();
}


// ============================================================
// GALERİ KAPAT
// ============================================================

function closePhotoGallery() {

    document
        .getElementById(
            "photoLightbox"
        )
        ?.classList.remove("open");


    document.body.style.overflow =
        "";


    photoGallery = [];

    photoGalleryIndex = 0;

    photoTouchStartX = 0;

    photoTouchStartY = 0;
}


// ============================================================
// LIGHTBOX KLAVYE
// ============================================================

document.addEventListener(
    "keydown",
    function(event) {

        const lightbox =
            document.getElementById(
                "photoLightbox"
            );


        if (
            !lightbox?.classList.contains(
                "open"
            )
        ) {
            return;
        }


        if (
            event.key === "Escape"
        ) {

            event.preventDefault();

            closePhotoGallery();

            return;
        }


        if (
            event.key === "ArrowLeft"
        ) {

            event.preventDefault();

            showPreviousPhoto();

            return;
        }


        if (
            event.key === "ArrowRight"
        ) {

            event.preventDefault();

            showNextPhoto();

            return;
        }

    }
);


// ============================================================
// BAŞLANGIÇ
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        createPhotoLightbox();

        initializeAdmin();

    }
);


// ============================================================
// ADMİN BAŞLAT
// ============================================================

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
            throw error;
        }


        if (
            data?.session?.user
        ) {

            await checkAdmin(
                data.session.user
            );

        } else {

            showLogin();

        }


        supabaseClient.auth.onAuthStateChange(
            async function(
                event,
                session
            ) {

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
// ADMİN KONTROL
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
            throw error;
        }


        if (!data) {

            await supabaseClient.auth.signOut();


            showLoginMessage(
                "Bu hesap yönetim paneline erişim yetkisine sahip değil.",
                "error"
            );


            return;
        }


        await showAdmin();

    } catch (error) {

        console.error(
            "Admin kontrol hatası:",
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
// ADMİN PANEL
// ============================================================

async function showAdmin() {

    if (loginScreen) {

        loginScreen.style.display =
            "none";

    }


    if (adminPanel) {

        adminPanel.style.display =
            "block";

    }


    try {

        await Promise.all([
            loadApplications(),
            loadReviews(),
            loadAnalytics()
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
    async function(event) {

        event.preventDefault();


        const email =
            loginEmail?.value.trim();


        const password =
            loginPassword?.value || "";


        if (
            !email ||
            !password
        ) {

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


            if (
                data?.user
            ) {

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
    async function() {

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
    function() {

        sidebar?.classList.toggle(
            "open"
        );

    }
);


// ============================================================
// MENÜ
// ============================================================

document.querySelectorAll(
    ".menu-item"
).forEach(
    function(item) {

        item.addEventListener(
            "click",
            function() {

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

function switchSection(
    sectionName
) {

    document.querySelectorAll(
        ".section"
    ).forEach(
        function(section) {

            section.classList.remove(
                "active"
            );

        }
    );


    document.querySelectorAll(
        ".menu-item"
    ).forEach(
        function(item) {

            item.classList.remove(
                "active"
            );

        }
    );


    const target =
        document.getElementById(
            "section-" +
            sectionName
        );


    const menuItem =
        document.querySelector(
            `.menu-item[data-section="${sectionName}"]`
        );


    target?.classList.add(
        "active"
    );


    menuItem?.classList.add(
        "active"
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


    const title =
        document.getElementById(
            "pageTitle"
        );


    if (title) {

        title.textContent =
            titles[sectionName] ||
            "Dashboard";

    }


    if (
        sectionName === "pending"
    ) {

        renderPendingBusinesses();

    }


    if (
        sectionName === "featured"
    ) {

        renderFeaturedBusinesses();

    }


    if (
        sectionName === "photos"
    ) {

        renderPhotoBusinesses();

    }


    if (
        sectionName === "dashboard"
    ) {

        loadAnalytics();

    }

}


// ============================================================
// YENİLE
// ============================================================

refreshBtn?.addEventListener(
    "click",
    async function() {

        refreshBtn.disabled = true;

        refreshBtn.textContent =
            "⏳ Yenileniyor...";


        try {

            await Promise.all([
                loadApplications(),
                loadReviews(),
                loadAnalytics()
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
                "Yenileme hatası:",
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


    applications.innerHTML =
        `
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
                    categories(name)
                `)
                .order(
                    "created_at",
                    {
                        ascending:false
                    }
                );


        if (error) {
            throw error;
        }


        const businesses =
            data || [];


        if (
            !businesses.length
        ) {

            allBusinesses = [];


            updateDashboard([]);


            populateCategoryFilter([]);


            applications.innerHTML =
                `
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
                    async function(business) {

                        const {
                            data:images,
                            error:imageError
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
                                        ascending:true
                                    }
                                )
                                .order(
                                    "created_at",
                                    {
                                        ascending:true
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


        applications.innerHTML =
            `
            <div class="empty">

                ❌ İşletmeler yüklenemedi.

                <br><br>

                <small>
                    ${escapeHtml(
                        error.message || ""
                    )}
                </small>

            </div>
            `;


        throw error;
    }
}


// ============================================================
// DASHBOARD TEMEL İSTATİSTİK
// ============================================================

function updateDashboard(
    businesses
) {

    const total =
        businesses.length;


    const pending =
        businesses.filter(
            function(business) {

                return !business.is_approved;

            }
        ).length;


    const approved =
        businesses.filter(
            function(business) {

                return business.is_approved;

            }
        ).length;


    const featured =
        businesses.filter(
            function(business) {

                return business.is_featured;

            }
        ).length;


    setText(
        "statTotalBusinesses",
        total
    );


    setText(
        "statPendingBusinesses",
        pending
    );


    setText(
        "statApprovedBusinesses",
        approved
    );


    setText(
        "statFeaturedBusinesses",
        featured
    );
}


// ============================================================
// ANALYTICS - TÜM OLAYLARI SAYFALI ÇEK
// ============================================================

async function fetchAllAnalyticsEvents() {

    const pageSize = 1000;

    let from = 0;

    let allEvents = [];

    while (true) {

        const to =
            from +
            pageSize -
            1;


        const {
            data,
            error
        } =
            await supabaseClient
                .from("analytics_events")
                .select(`
                    id,
                    event_type,
                    business_id,
                    event_id,
                    visitor_id,
                    created_at
                `)
                .order(
                    "created_at",
                    {
                        ascending:false
                    }
                )
                .range(
                    from,
                    to
                );


        if (error) {
            throw error;
        }


        const page =
            data || [];


        allEvents =
            allEvents.concat(
                page
            );


        if (
            page.length <
            pageSize
        ) {

            break;

        }


        from +=
            pageSize;

    }


    return allEvents;
}


// ============================================================
// ANALYTICS
// ============================================================

async function loadAnalytics() {

    if (
        analyticsLoading
    ) {
        return;
    }


    analyticsLoading = true;


    try {

        const events =
            await fetchAllAnalyticsEvents();


        allAnalyticsEvents =
            events;


        const totalEvents =
            events.length;


        const uniqueVisitors =
            new Set(
                events
                    .map(
                        function(event) {

                            return event.visitor_id;

                        }
                    )
                    .filter(Boolean)
            ).size;


        const businessViews =
            events.filter(
                function(event) {

                    const type =
                        String(
                            event.event_type ||
                            ""
                        )
                            .toLowerCase()
                            .trim();


                    return (
                        !!event.business_id &&
                        (
                            type === "view" ||
                            type === "business_view" ||
                            type === "business-view" ||
                            type === "business_viewed" ||
                            type.includes("business_view")
                        )
                    );

                }
            ).length;


        const now =
            new Date();


        const last7Date =
            new Date(now);


        last7Date.setDate(
            last7Date.getDate() - 7
        );


        const last30Date =
            new Date(now);


        last30Date.setDate(
            last30Date.getDate() - 30
        );


        const last7Days =
            events.filter(
                function(event) {

                    const created =
                        new Date(
                            event.created_at
                        );


                    return (
                        !Number.isNaN(
                            created.getTime()
                        ) &&
                        created >=
                        last7Date
                    );

                }
            ).length;


        const last30Days =
            events.filter(
                function(event) {

                    const created =
                        new Date(
                            event.created_at
                        );


                    return (
                        !Number.isNaN(
                            created.getTime()
                        ) &&
                        created >=
                        last30Date
                    );

                }
            ).length;


        const todayStart =
            new Date(now);


        todayStart.setHours(
            0,
            0,
            0,
            0
        );


        const todayEvents =
            events.filter(
                function(event) {

                    const created =
                        new Date(
                            event.created_at
                        );


                    return (
                        !Number.isNaN(
                            created.getTime()
                        ) &&
                        created >=
                        todayStart
                    );

                }
            ).length;


        const businessLinked =
            events.filter(
                function(event) {

                    return !!event.business_id;

                }
            ).length;


        setText(
            "statAnalyticsEvents",
            totalEvents
        );


        setText(
            "statUniqueVisitors",
            uniqueVisitors
        );


        setText(
            "statBusinessViews",
            businessViews
        );


        setText(
            "statLast7Days",
            last7Days
        );


        renderAnalyticsBox(
            events
        );

    } catch (error) {

        console.error(
            "Analytics yükleme hatası:",
            error
        );


        allAnalyticsEvents = [];


        setText(
            "statAnalyticsEvents",
            "—"
        );


        setText(
            "statUniqueVisitors",
            "—"
        );


        setText(
            "statBusinessViews",
            "—"
        );


        setText(
            "statLast7Days",
            "—"
        );


        renderAnalyticsError(
            error
        );

    } finally {

        analyticsLoading = false;

    }
}


// ============================================================
// ANALYTICS KUTUSU
// ============================================================

function renderAnalyticsBox(
    events
) {

    let box =
        document.getElementById(
            "adminAnalyticsBox"
        );


    if (!box) {

        const dashboard =
            document.getElementById(
                "section-dashboard"
            );


        if (!dashboard) {
            return;
        }


        box =
            document.createElement(
                "div"
            );


        box.id =
            "adminAnalyticsBox";


        box.style.marginTop =
            "20px";


        dashboard.appendChild(
            box
        );

    }


    const types = {};


    events.forEach(
        function(event) {

            const type =
                event.event_type ||
                "bilinmeyen";


            types[type] =
                (
                    types[type] ||
                    0
                ) + 1;

        }
    );


    const sortedTypes =
        Object.entries(
            types
        )
            .sort(
                function(a,b) {

                    return b[1] - a[1];

                }
            )
            .slice(
                0,
                10
            );


    const businessCounts = {};


    events.forEach(
        function(event) {

            if (!event.business_id) {
                return;
            }


            const id =
                String(
                    event.business_id
                );


            businessCounts[id] =
                (
                    businessCounts[id] ||
                    0
                ) + 1;

        }
    );


    const topBusinesses =
        Object.entries(
            businessCounts
        )
            .sort(
                function(a,b) {

                    return b[1] - a[1];

                }
            )
            .slice(
                0,
                10
            );


    const businessRows =
        topBusinesses.map(
            function(entry) {

                const businessId =
                    Number(
                        entry[0]
                    );


                const count =
                    entry[1];


                const business =
                    allBusinesses.find(
                        function(item) {

                            return Number(
                                item.id
                            ) ===
                            businessId;

                        }
                    );


                const name =
                    business?.name ||
                    `İşletme #${businessId}`;


                return `
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:15px;
                        padding:8px 0;
                        border-bottom:1px solid rgba(0,0,0,.08);
                    ">

                        <span>
                            ${escapeHtml(name)}
                        </span>

                        <strong>
                            ${count}
                        </strong>

                    </div>
                `;

            }
        )
        .join("");


    const now =
        new Date();


    const last7Date =
        new Date(now);


    last7Date.setDate(
        last7Date.getDate() - 7
    );


    const last30Date =
        new Date(now);


    last30Date.setDate(
        last30Date.getDate() - 30
    );


    const todayStart =
        new Date(now);


    todayStart.setHours(
        0,
        0,
        0,
        0
    );


    const todayCount =
        events.filter(
            function(event) {

                const date =
                    new Date(
                        event.created_at
                    );


                return (
                    !Number.isNaN(
                        date.getTime()
                    ) &&
                    date >=
                    todayStart
                );

            }
        ).length;


    const last7Count =
        events.filter(
            function(event) {

                const date =
                    new Date(
                        event.created_at
                    );


                return (
                    !Number.isNaN(
                        date.getTime()
                    ) &&
                    date >=
                    last7Date
                );

            }
        ).length;


    const last30Count =
        events.filter(
            function(event) {

                const date =
                    new Date(
                        event.created_at
                    );


                return (
                    !Number.isNaN(
                        date.getTime()
                    ) &&
                    date >=
                    last30Date
                );

            }
        ).length;


    const uniqueVisitors =
        new Set(
            events
                .map(
                    function(event) {

                        return event.visitor_id;

                    }
                )
                .filter(Boolean)
        ).size;


    const businessLinked =
        events.filter(
            function(event) {

                return !!event.business_id;

            }
        ).length;


    box.innerHTML = `

        <div class="business-card">

            <div class="business-top">

                <div>

                    <div class="business-title">
                        📊 Ziyaretçi İstatistikleri
                    </div>

                    <div class="business-meta">
                        analytics_events tablosundan canlı veriler
                    </div>

                </div>

                <span class="badge badge-blue">
                    ${events.length} olay
                </span>

            </div>


            <div class="business-info">

                <div>
                    <strong>📈 Toplam olay</strong><br>
                    ${events.length}
                </div>


                <div>
                    <strong>👥 Tekil ziyaretçi</strong><br>
                    ${uniqueVisitors}
                </div>


                <div>
                    <strong>📅 Bugün</strong><br>
                    ${todayCount}
                </div>


                <div>
                    <strong>🗓️ Son 7 gün</strong><br>
                    ${last7Count}
                </div>


                <div>
                    <strong>📆 Son 30 gün</strong><br>
                    ${last30Count}
                </div>


                <div>
                    <strong>🏢 İşletme bağlantılı</strong><br>
                    ${businessLinked}
                </div>

            </div>


            ${
                sortedTypes.length
                    ? `

                        <div class="description">

                            <strong>
                                📌 Etkinlik Türleri
                            </strong>

                            <br><br>

                            ${sortedTypes
                                .map(
                                    function(entry) {

                                        const type =
                                            entry[0];

                                        const count =
                                            entry[1];

                                        return `

                                            <div style="
                                                display:flex;
                                                justify-content:space-between;
                                                align-items:center;
                                                gap:20px;
                                                padding:8px 0;
                                                border-bottom:1px solid rgba(0,0,0,.08);
                                            ">

                                                <span>
                                                    ${escapeHtml(type)}
                                                </span>

                                                <strong>
                                                    ${count}
                                                </strong>

                                            </div>

                                        `;

                                    }
                                )
                                .join("")
                            }

                        </div>

                    `
                    : ""
            }


            ${
                businessRows
                    ? `

                        <div class="description">

                            <strong>
                                🏆 En Çok Etkileşim Alan İşletmeler
                            </strong>

                            <br><br>

                            ${businessRows}

                        </div>

                    `
                    : ""
            }


            ${
                events.length
                    ? `

                        <div class="description">

                            <strong>
                                🕐 Son Analytics Kayıtları
                            </strong>

                            <br><br>

                            ${events
                                .slice(
                                    0,
                                    10
                                )
                                .map(
                                    function(event) {

                                        const business =
                                            allBusinesses.find(
                                                function(item) {

                                                    return Number(
                                                        item.id
                                                    ) ===
                                                    Number(
                                                        event.business_id
                                                    );

                                                }
                                            );


                                        return `

                                            <div style="
                                                padding:9px 0;
                                                border-bottom:1px solid rgba(0,0,0,.08);
                                            ">

                                                <div style="
                                                    display:flex;
                                                    justify-content:space-between;
                                                    gap:10px;
                                                    flex-wrap:wrap;
                                                ">

                                                    <strong>
                                                        ${escapeHtml(
                                                            event.event_type ||
                                                            "Bilinmeyen olay"
                                                        )}
                                                    </strong>

                                                    <small>
                                                        ${formatDate(
                                                            event.created_at
                                                        )}
                                                    </small>

                                                </div>


                                                ${
                                                    business
                                                        ? `
                                                            <small>
                                                                🏢 ${escapeHtml(
                                                                    business.name
                                                                )}
                                                            </small>
                                                        `
                                                        : event.business_id
                                                            ? `
                                                                <small>
                                                                    🏢 İşletme #${escapeHtml(
                                                                        event.business_id
                                                                    )}
                                                                </small>
                                                            `
                                                            : ""
                                                }

                                            </div>

                                        `;

                                    }
                                )
                                .join("")
                            }

                        </div>

                    `
                    : `

                        <div class="empty">

                            📊 Henüz analytics verisi oluşmamış.

                            <br><br>

                            Ziyaretçiler siteyi kullanmaya başladıkça
                            burada istatistikler görünecek.

                        </div>

                    `
            }

        </div>

    `;
}


// ============================================================
// ANALYTICS HATA
// ============================================================

function renderAnalyticsError(
    error
) {

    let box =
        document.getElementById(
            "adminAnalyticsBox"
        );


    if (!box) {

        const dashboard =
            document.getElementById(
                "section-dashboard"
            );


        if (!dashboard) {
            return;
        }


        box =
            document.createElement(
                "div"
            );


        box.id =
            "adminAnalyticsBox";


        box.style.marginTop =
            "20px";


        dashboard.appendChild(
            box
        );

    }


    box.innerHTML = `

        <div class="business-card">

            <div class="business-title">
                📊 Ziyaretçi İstatistikleri
            </div>

            <div class="empty">

                ❌ Analytics verileri yüklenemedi.

                <br><br>

                <small>
                    ${escapeHtml(
                        error?.message || ""
                    )}
                </small>

            </div>

        </div>

    `;
}


// ============================================================
// TEXT YARDIMCI
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }
}


// ============================================================
// KATEGORİ
// ============================================================

function populateCategoryFilter(
    businesses
) {

    if (
        !businessCategoryFilter
    ) {
        return;
    }


    const current =
        businessCategoryFilter.value;


    const categories =
        businesses
            .map(
                function(business) {

                    return business
                        .categories
                        ?.name;

                }
            )
            .filter(Boolean)
            .filter(
                function(value,index,array) {

                    return (
                        array.indexOf(
                            value
                        ) === index
                    );

                }
            )
            .sort(
                function(a,b) {

                    return a.localeCompare(
                        b,
                        "tr"
                    );

                }
            );


    businessCategoryFilter.innerHTML =
        `
        <option value="">
            Tüm Kategoriler
        </option>
        `;


    categories.forEach(
        function(category) {

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
            current
        )
    ) {

        businessCategoryFilter.value =
            current;

    }
}


// ============================================================
// FİLTRE
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
            function(business) {

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


    if (
        !businesses.length
    ) {

        applications.innerHTML =
            `
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


    const gallery =
        images.length
            ? `

                <div class="gallery">

                    ${images
                        .map(
                            function(image,index) {

                                return renderAdminImage(
                                    image,
                                    images,
                                    index
                                );

                            }
                        )
                        .join("")
                    }

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
                            business.name ||
                            "-"
                        )}
                    </div>

                    <div class="business-meta">

                        ${escapeHtml(
                            category
                        )}

                        •

                        ${escapeHtml(
                            business.district ||
                            "-"
                        )}

                    </div>

                </div>


                <div class="badges">

                    <span class="badge ${
                        business.is_approved
                            ? "badge-green"
                            : "badge-yellow"
                    }">

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
                        business.address ||
                        "-"
                    )}

                </div>


                <div>

                    <strong>Telefon:</strong><br>

                    ${escapeHtml(
                        business.phone ||
                        "-"
                    )}

                </div>


                <div>

                    <strong>İşletme sahibi:</strong><br>

                    ${escapeHtml(
                        business.owner_name ||
                        "-"
                    )}

                </div>


                <div>

                    <strong>Sahibi telefonu:</strong><br>

                    ${escapeHtml(
                        business.owner_phone ||
                        "-"
                    )}

                </div>


                <div>

                    <strong>E-posta:</strong><br>

                    ${escapeHtml(
                        business.owner_email ||
                        "-"
                    )}

                </div>


                <div>

                    <strong>Instagram:</strong><br>

                    ${escapeHtml(
                        business.instagram ||
                        "-"
                    )}

                </div>


                <div>

                    <strong>Puan:</strong><br>

                    ⭐ ${Number(
                        business.rating ||
                        0
                    ).toFixed(1)}

                    (${business.review_count || 0})

                </div>


                <div>

                    <strong>Fotoğraf:</strong><br>

                    ${images.length}
                    adet

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

                <strong>
                    🖼️ Fotoğraf Galerisi
                </strong>


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


    const businessId =
        image.business_id;


    return `

        <div class="gallery-item">

            <img
                src="${escapeHtml(
                    image.image_url ||
                    ""
                )}"
                alt="İşletme fotoğrafı"
                loading="lazy"
                onclick="openBusinessPhotoGallery(
                    ${businessId},
                    ${index}
                )"
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
                        index > 0
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
                        index <
                        images.length - 1
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
            function(business) {

                return !business.is_approved;

            }
        );


    if (
        !pending.length
    ) {

        pendingApplications.innerHTML =
            `
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
            function(business) {

                return business.is_featured;

            }
        );


    if (
        !featured.length
    ) {

        featuredApplications.innerHTML =
            `
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
            function(business) {

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


                return (
                    !search ||
                    text.includes(
                        search
                    )
                );

            }
        );


    if (
        !filtered.length
    ) {

        photoBusinesses.innerHTML =
            `
            <div class="empty">
                İşletme bulunamadı.
            </div>
            `;


        return;
    }


    photoBusinesses.innerHTML =
        filtered
            .map(
                function(business) {

                    const images =
                        business.images || [];


                    return `

                        <div class="business-card">

                            <div class="business-top">

                                <div>

                                    <div class="business-title">
                                        ${escapeHtml(
                                            business.name ||
                                            "-"
                                        )}
                                    </div>

                                    <div class="business-meta">
                                        ${escapeHtml(
                                            business.district ||
                                            "-"
                                        )}
                                    </div>

                                </div>


                                <span class="badge badge-blue">
                                    ${images.length}
                                    fotoğraf
                                </span>

                            </div>


                            ${
                                images.length
                                    ? `

                                        <div class="gallery">

                                            ${images
                                                .map(
                                                    function(
                                                        image,
                                                        index
                                                    ) {

                                                        return renderAdminImage(
                                                            image,
                                                            images,
                                                            index
                                                        );

                                                    }
                                                )
                                                .join("")
                                            }

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
            data:existing,
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
                        ascending:true
                    }
                );


        if (error) {
            throw error;
        }


        const images =
            existing || [];


        const maxOrder =
            images.reduce(
                function(
                    max,
                    item
                ) {

                    return Math.max(
                        max,
                        Number(
                            item.sort_order ||
                            0
                        )
                    );

                },
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
            error:uploadError
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
            data:publicData
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
            error:insertError
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
            error:resetError
        } =
            await supabaseClient
                .from("business_images")
                .update({
                    is_cover:false
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
                    is_cover:true
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
            "Kapak değiştirme hatası:",
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
            data:image,
            error:fetchError
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
            error:deleteError
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
                data:remaining
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
                            ascending:true
                        }
                    )
                    .limit(1);


            if (
                remaining?.length
            ) {

                await supabaseClient
                    .from("business_images")
                    .update({
                        is_cover:true
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
            "Fotoğraf silme hatası:",
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
            data:images,
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
                        ascending:true
                    }
                );


        if (error) {
            throw error;
        }


        const index =
            images.findIndex(
                function(image) {

                    return (
                        Number(image.id) ===
                        Number(imageId)
                    );

                }
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
            targetIndex >=
            images.length
        ) {
            return;
        }


        const current =
            images[index];


        const target =
            images[targetIndex];


        const currentOrder =
            Number(
                current.sort_order ||
                0
            );


        const targetOrder =
            Number(
                target.sort_order ||
                0
            );


        let result =
            await supabaseClient
                .from("business_images")
                .update({
                    sort_order:
                        -999999
                })
                .eq(
                    "id",
                    current.id
                );


        if (result.error) {
            throw result.error;
        }


        result =
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


        if (result.error) {
            throw result.error;
        }


        result =
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


        if (result.error) {
            throw result.error;
        }


        await loadApplications();

    } catch (error) {

        console.error(
            "Fotoğraf sıralama hatası:",
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
        position +
        marker.length
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
            function(item) {

                return (
                    Number(item.id) ===
                    Number(businessId)
                );

            }
        );


    if (!business) {

        showMessage(
            "İşletme bulunamadı.",
            "error"
        );


        return;
    }


    const setValue =
        function(
            id,
            value
        ) {

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

        category.innerHTML =
            "";


        const option =
            document.createElement(
                "option"
            );


        option.value =
            business.category_id ||
            "";


        option.textContent =
            business.categories?.name ||
            "Kategori yok";


        category.appendChild(
            option
        );


        category.value =
            business.category_id ||
            "";

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


    editBusinessModal?.classList.add(
        "open"
    );


    document.body.style.overflow =
        "hidden";
}


// ============================================================
// MODAL KAPAT
// ============================================================

function closeEditBusinessModal() {

    editBusinessModal?.classList.remove(
        "open"
    );


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
    function(event) {

        if (
            event.target ===
            editBusinessModal
        ) {

            closeEditBusinessModal();

        }

    }
);


// ============================================================
// ESC - MODAL
// ============================================================

document.addEventListener(
    "keydown",
    function(event) {

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
    async function(event) {

        event.preventDefault();


        const getValue =
            function(id) {

                return (
                    document
                        .getElementById(id)
                        ?.value
                        .trim() ||
                    ""
                );

            };


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


        const categoryId =
            document.getElementById(
                "editBusinessCategory"
            )?.value ||
            null;


        const approved =
            document.getElementById(
                "editBusinessApproved"
            )?.value ===
            "true";


        const featured =
            document.getElementById(
                "editBusinessFeatured"
            )?.value ===
            "true";


        const saveButton =
            editBusinessForm.querySelector(
                'button[type="submit"]'
            );


        if (saveButton) {

            saveButton.disabled =
                true;


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
                    is_approved:true
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
            "Onaylama hatası:",
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
            "Öne çıkarma hatası:",
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
            "Reddetme hatası:",
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
            data:images,
            error:imageFetchError
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


        if (
            images?.length
        ) {

            const paths =
                images
                    .map(
                        function(image) {

                            return extractStoragePath(
                                image.image_url
                            );

                        }
                    )
                    .filter(Boolean);


            if (
                paths.length
            ) {

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
                error:imageDeleteError
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


    reviewsList.innerHTML =
        `
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
                    businesses(id,name)
                `)
                .order(
                    "created_at",
                    {
                        ascending:false
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


        if (
            !allReviews.length
        ) {

            reviewsList.innerHTML =
                `
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


        reviewsList.innerHTML =
            `
            <div class="empty">

                ❌ Yorumlar yüklenemedi.

                <br><br>

                <small>
                    ${escapeHtml(
                        error.message ||
                        ""
                    )}
                </small>

            </div>
            `;


        updateReviewDashboard(
            0
        );

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
                        review.rating ||
                        0
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
                    review.comment ||
                    ""
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

    setText(
        "statReviews",
        count
    );
}


// ============================================================
// YORUM ONAY
// ============================================================

async function approveReview(
    reviewId
) {

    try {

        const {
            data:review,
            error:fetchError
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
                    is_approved:true
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
            "Yorum onaylama hatası:",
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
        data:reviews,
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
            function(
                sum,
                review
            ) {

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


    const rating =
        count
            ? total / count
            : 0;


    const {
        error:updateError
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
            "Yorum silme hatası:",
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

    let element =
        document.getElementById(
            "adminMessage"
        );


    if (!element) {

        element =
            document.createElement(
                "div"
            );


        element.id =
            "adminMessage";


        Object.assign(
            element.style,
            {

                position:
                    "fixed",

                right:
                    "20px",

                bottom:
                    "20px",

                zIndex:
                    "9999",

                padding:
                    "14px 18px",

                borderRadius:
                    "10px",

                background:
                    "#111827",

                color:
                    "#fff",

                fontWeight:
                    "700",

                boxShadow:
                    "0 10px 30px rgba(0,0,0,.2)"

            }
        );


        document.body.appendChild(
            element
        );

    }


    element.textContent =
        text;


    element.style.background =
        type === "success"
            ? "#16a34a"
            : type === "error"
                ? "#dc2626"
                : "#2563eb";


    element.style.display =
        "block";


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(
            function() {

                element.style.display =
                    "none";

            },
            4000
        );
}


// ============================================================
// LOGIN MESAJ
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