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

        console.log(
            "İşletme yükleniyor:",
            slug
        );


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
                "Supabase işletme hatası:",
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


        let category = null;


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

            } else {

                category =
                    categoryData;
            }
        }


        renderBusiness(
            business,
            category
        );


        await loadReviews(
            business.id
        );


        setupReviewForm(
            business.id
        );


        setupShareButtons();


    } catch (error) {

        console.error(
            "Genel işletme hatası:",
            error
        );

        showError(
            "Bir hata oluştu. Lütfen tekrar deneyin."
        );
    }
}


// ============================================================
// İŞLETME DETAYINI OLUŞTUR
// ============================================================

function renderBusiness(
    business,
    category
) {

    const container =
        document.querySelector(
            "#businessContainer"
        );


    if (!container) {

        console.error(
            "#businessContainer bulunamadı."
        );

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


    let imageHtml;


    if (business.image_url) {

        imageHtml = `
            <img
                class="business-detail-image"
                src="${escapeHtml(
                    business.image_url
                )}"
                alt="${escapeHtml(
                    business.name
                )}"
                onerror="
                    this.style.display='none';
                    document.querySelector('.business-detail-image-fallback').style.display='flex';
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

                        <span>
                            📍
                        </span>

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

                        <span>
                            🏠
                        </span>

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

                                    <span>
                                        📞
                                    </span>

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
// INSTAGRAM URL
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


    return `https://instagram.com/${encodeURIComponent(
        instagram
    )}`;
}


// ============================================================
// WEBSITE URL
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


    return `https://${website}`;
}


// ============================================================
// HARİTA URL
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

        const lat =
            Number(
                business.latitude
            );


        const lng =
            Number(
                business.longitude
            );


        return `

            <iframe
                src="https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed"
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


    // Ortalama

    const averageElement =
        document.querySelector(
            "#review-average"
        );


    if (averageElement) {

        averageElement.textContent =
            average.toFixed(1);
    }


    // Sayı

    const countElement =
        document.querySelector(
            "#review-count"
        );


    if (countElement) {

        countElement.textContent =
            count;
    }


    // Yıldızlar

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


    // Yorum yoksa

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


    // ========================================================
    // YILDIZ SEÇİMİ
    // ========================================================

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


    // ========================================================
    // FORM GÖNDERME
    // ========================================================

    form.addEventListener(
        "submit",
        async function(event) {

            // SAYFANIN YENİLENMESİNİ KES
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


            // =================================================
            // KONTROLLER
            // =================================================

            if (
                name.length < 2
            ) {

                showReviewMessage(
                    "Lütfen adınızı yazın.",
                    "error"
                );

                if (nameInput) {
                    nameInput.focus();
                }

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
                comment.length > 1000
            ) {

                showReviewMessage(
                    "Yorumunuz en fazla 1000 karakter olabilir.",
                    "error"
                );

                return;
            }


            // =================================================
            // GÖNDERİLİYOR
            // =================================================

            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Gönderiliyor...";
            }


            clearReviewMessage();


            try {

                const {
                    data,
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
                        })
                        .select()
                        .maybeSingle();


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


                console.log(
                    "Yorum başarıyla gönderildi:",
                    data
                );


                // =================================================
                // BAŞARILI
                // =================================================

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
                    "Yorumunuz gönderildi! Onaylandıktan sonra yayınlanacaktır. ⭐",
                    "success"
                );


                // Formun olduğu bölüme yumuşak şekilde getir

                const message =
                    document.querySelector(
                        "#review-message"
                    );


                if (message) {

                    message.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
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
// PAYLAŞ / LİNK KOPYALA
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

                    console.error(
                        error
                    );


                    alert(
                        "Link kopyalanamadı."
                    );

                }

            }
        );
    }
}


// ============================================================
// SAYFA BAŞLAT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadBusiness();

    }
);