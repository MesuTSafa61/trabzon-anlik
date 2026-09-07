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

    if (!phone) {
        return "";
    }

    let number =
        String(phone).replace(/\D/g, "");

    if (number.startsWith("0")) {
        number =
            "90" + number.substring(1);
    }

    if (!number.startsWith("90")) {
        number =
            "90" + number;
    }

    return number;
}


function starsHtml(rating) {

    const value =
        Math.round(
            Number(rating || 0)
        );

    let html = "";

    for (let i = 1; i <= 5; i++) {

        html +=
            i <= value
                ? "★"
                : "☆";
    }

    return html;
}


// ============================================================
// GALERİ FOTOĞRAFLARINI YÜKLE
// ============================================================

async function loadBusinessImages(businessId) {

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

    const slug =
        getSlug();

    if (!slug) {

        showError(
            "İşletme bağlantısı bulunamadı."
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


        // ====================================================
        // GALERİ
        // ====================================================

        const images =
            await loadBusinessImages(
                business.id
            );


        // ====================================================
        // KATEGORİ
        // ====================================================

        let category = null;

        if (business.category_id) {

            const {
                data: categoryData
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


    // ========================================================
    // KAPAK FOTOĞRAFI
    // ========================================================

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
                src="${escapeHtml(
                    coverUrl
                )}"
                alt="${escapeHtml(
                    business.name
                )}"
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


    // ========================================================
    // GALERİ
    // ========================================================

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


    // ========================================================
    // SAYFA
    // ========================================================

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

                    ${escapeHtml(
                        business.name
                    )}

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

                            <strong>İlçe</strong>

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

                            <strong>Adres</strong>

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

                                        <strong>Telefon</strong>

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
// ============================================================

function setupGalleryLightbox() {

    const galleryItems =
        document.querySelectorAll(
            ".business-gallery-item"
        );


    galleryItems.forEach(
        item => {

            item.addEventListener(
                "click",
                function() {

                    const url =
                        this.dataset.galleryUrl;


                    if (!url) {
                        return;
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

                        <img
                            src="${escapeHtml(url)}"
                            alt="Büyük fotoğraf"
                        >

                    `;


                    document.body.appendChild(
                        overlay
                    );


                    document.body.style.overflow =
                        "hidden";


                    const close =
                        () => {

                            overlay.remove();

                            document.body.style.overflow =
                                "";

                        };


                    overlay
                        .querySelector(
                            ".gallery-lightbox-close"
                        )
                        ?.addEventListener(
                            "click",
                            close
                        );


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


                    document.addEventListener(
                        "keydown",
                        function handleKey(event) {

                            if (
                                event.key ===
                                "Escape"
                            ) {

                                close();

                                document.removeEventListener(
                                    "keydown",
                                    handleKey
                                );
                            }

                        }
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
        instagram.startsWith("http://") ||
        instagram.startsWith("https://")
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
        website.startsWith("http://") ||
        website.startsWith("https://")
    ) {
        return website;
    }


    return "https://" + website;
}


// ============================================================
// HARİTA
// ============================================================

function getMapUrl(
    business
) {

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

function renderMap(
    business
) {

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
                            review.rating || 0
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
            starsHtml(
                average
            );
    }


    if (reviewList.length === 0) {

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
                            ${escapeHtml(name)}
                        </strong>

                        <small>
                            ${escapeHtml(date)}
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
                                itemRating <= rating
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


            if (comment.length > 1000) {

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
                                comment || null,

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
                                behavior: "smooth",
                                block: "center"
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
                ${escapeHtml(message)}
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

                    if (navigator.share) {

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