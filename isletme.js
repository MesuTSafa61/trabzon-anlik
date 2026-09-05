// ============================================================
// TRABZON ANLIK - İŞLETME DETAY + YORUM / PUAN SİSTEMİ
// ============================================================

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
    const params =
        new URLSearchParams(window.location.search);

    return params.get("slug");
}


function normalizePhone(phone) {
    if (!phone) return "";

    let number =
        String(phone).replace(/\D/g, "");

    if (number.startsWith("0")) {
        number = "90" + number.substring(1);
    }

    if (!number.startsWith("90")) {
        number = "90" + number;
    }

    return number;
}


function formatRating(rating) {
    return Number(rating || 0).toFixed(1);
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
// İŞLETMEYİ YÜKLE
// ============================================================

async function loadBusiness() {

    const slug = getSlug();

    if (!slug) {
        showError("İşletme bulunamadı.");
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
            console.error(error);
            showError("İşletme bilgileri alınamadı.");
            return;
        }

        if (!business) {
            showError("İşletme bulunamadı.");
            return;
        }


        // ====================================================
        // KATEGORİ
        // ====================================================

        let category = null;

        if (business.category_id) {

            const { data } =
                await supabaseClient
                    .from("categories")
                    .select("name, icon")
                    .eq("id", business.category_id)
                    .maybeSingle();

            category = data;
        }


        renderBusiness(
            business,
            category
        );


        await loadReviews(
            business.id
        );


    } catch (error) {

        console.error(error);

        showError(
            "Bir hata oluştu. Lütfen tekrar deneyin."
        );
    }
}


// ============================================================
// İŞLETME DETAYINI GÖSTER
// ============================================================

function renderBusiness(
    business,
    category
) {

    const categoryName =
        category?.name || "İŞLETME";

    const categoryIcon =
        category?.icon || "🏪";


    document.title =
        `${business.name} | Trabzon Anlık`;


    const title =
        document.querySelector(
            ".business-detail-title"
        );

    if (title) {
        title.textContent =
            business.name;
    }


    const categoryElement =
        document.querySelector(
            ".business-image-category"
        );

    if (categoryElement) {

        categoryElement.innerHTML =
            `${escapeHtml(categoryIcon)}
             ${escapeHtml(categoryName)}`;
    }


    const image =
        document.querySelector(
            ".business-detail-image"
        );

    if (image) {

        if (business.image_url) {

            image.src =
                business.image_url;

            image.alt =
                business.name;

            image.style.display =
                "block";

        } else {

            image.style.display =
                "none";
        }
    }


    const description =
        document.querySelector(
            ".business-detail-description"
        );

    if (description) {

        description.textContent =
            business.description ||
            "Bu işletme hakkında henüz açıklama eklenmemiş.";
    }


    const district =
        document.querySelector(
            "[data-business-district]"
        );

    if (district) {
        district.textContent =
            business.district || "Belirtilmemiş";
    }


    const address =
        document.querySelector(
            "[data-business-address]"
        );

    if (address) {
        address.textContent =
            business.address || "Belirtilmemiş";
    }


    const phone =
        document.querySelector(
            "[data-business-phone]"
        );

    if (phone) {
        phone.textContent =
            business.phone || "Belirtilmemiş";
    }


    // ========================================================
    // PUAN
    // ========================================================

    const rating =
        Number(business.rating || 0);

    const ratingMain =
        document.querySelector(
            ".rating-main"
        );

    if (ratingMain) {

        ratingMain.innerHTML =
            `⭐ ${formatRating(rating)}`;
    }


    const ratingText =
        document.querySelector(
            ".business-detail-rating"
        );

    if (ratingText) {

        ratingText.innerHTML = `
            <span class="detail-rating-stars">
                ${starsHtml(rating)}
            </span>
            <strong>${formatRating(rating)}</strong>
            <span>
                (${business.review_count || 0} değerlendirme)
            </span>
        `;
    }


    // ========================================================
    // TELEFON
    // ========================================================

    const phoneButton =
        document.querySelector(
            ".business-action.phone"
        );

    if (phoneButton) {

        if (business.phone) {

            phoneButton.href =
                `tel:${business.phone}`;

        } else {

            phoneButton.style.display =
                "none";
        }
    }


    // ========================================================
    // WHATSAPP
    // ========================================================

    const whatsappButton =
        document.querySelector(
            ".business-action.whatsapp"
        );

    if (whatsappButton) {

        if (business.phone) {

            const number =
                normalizePhone(
                    business.phone
                );

            whatsappButton.href =
                `https://wa.me/${number}`;

            whatsappButton.target =
                "_blank";

        } else {

            whatsappButton.style.display =
                "none";
        }
    }


    // ========================================================
    // INSTAGRAM
    // ========================================================

    const instagramButton =
        document.querySelector(
            ".business-action.instagram"
        );

    if (instagramButton) {

        if (business.instagram) {

            let instagram =
                business.instagram.trim();

            if (
                !instagram.startsWith("http")
            ) {

                instagram =
                    "https://instagram.com/" +
                    instagram.replace("@", "");
            }

            instagramButton.href =
                instagram;

            instagramButton.target =
                "_blank";

        } else {

            instagramButton.style.display =
                "none";
        }
    }


    // ========================================================
    // WEB SİTESİ
    // ========================================================

    const websiteButton =
        document.querySelector(
            ".business-action.website"
        );

    if (websiteButton) {

        if (business.website) {

            let website =
                business.website.trim();

            if (
                !website.startsWith("http")
            ) {

                website =
                    "https://" + website;
            }

            websiteButton.href =
                website;

            websiteButton.target =
                "_blank";

        } else {

            websiteButton.style.display =
                "none";
        }
    }


    // ========================================================
    // HARİTA
    // ========================================================

    const mapButton =
        document.querySelector(
            ".business-action.map"
        );

    const mapContainer =
        document.querySelector(
            ".business-map"
        );


    if (
        business.latitude &&
        business.longitude
    ) {

        const lat =
            Number(business.latitude);

        const lng =
            Number(business.longitude);


        if (mapButton) {

            mapButton.href =
                `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

            mapButton.target =
                "_blank";
        }


        if (mapContainer) {

            mapContainer.innerHTML = `
                <iframe
                    src="https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed"
                    width="100%"
                    height="350"
                    style="border:0;"
                    loading="lazy"
                    allowfullscreen>
                </iframe>
            `;
        }

    } else if (business.address) {

        const address =
            encodeURIComponent(
                `${business.address}, ${business.district || ""}, Trabzon`
            );


        if (mapButton) {

            mapButton.href =
                `https://www.google.com/maps/search/?api=1&query=${address}`;

            mapButton.target =
                "_blank";
        }


        if (mapContainer) {

            mapContainer.innerHTML = `
                <div class="map-placeholder">
                    <div class="map-placeholder-icon">📍</div>
                    <strong>Konum</strong>
                    <p>
                        ${escapeHtml(
                            business.address
                        )}
                    </p>
                </div>
            `;
        }
    }
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

    const countElement =
        document.querySelector(
            "#review-count"
        );


    if (!container) {
        return;
    }


    const { data: reviews, error } =
        await supabaseClient
            .from("reviews")
            .select(`
                id,
                name,
                rating,
                comment,
                created_at
            `)
            .eq("business_id", businessId)
            .eq("is_approved", true)
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(
            "Yorumlar alınamadı:",
            error
        );

        container.innerHTML =
            `<p class="review-error">
                Yorumlar yüklenemedi.
            </p>`;

        return;
    }


    if (countElement) {

        countElement.textContent =
            reviews?.length || 0;
    }


    if (
        !reviews ||
        reviews.length === 0
    ) {

        container.innerHTML = `
            <div class="no-reviews">
                <div>💬</div>
                <strong>Henüz yorum yok</strong>
                <p>
                    Bu işletme için ilk yorumu sen yaz!
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        reviews
            .map(renderReview)
            .join("");
}


// ============================================================
// YORUM KARTI
// ============================================================

function renderReview(
    review
) {

    const date =
        new Date(
            review.created_at
        ).toLocaleDateString(
            "tr-TR",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


    return `
        <article class="review-card">

            <div class="review-top">

                <div class="review-user">
                    <div class="review-avatar">
                        ${escapeHtml(
                            (review.name || "M")
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </div>

                    <div>
                        <strong>
                            ${escapeHtml(
                                review.name
                            )}
                        </strong>

                        <small>
                            ${date}
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
        (star, index) => {

            star.addEventListener(
                "click",
                () => {

                    const rating =
                        index + 1;

                    ratingInput.value =
                        rating;


                    stars.forEach(
                        (item, i) => {

                            item.classList.toggle(
                                "active",
                                i < rating
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
        async (event) => {

            event.preventDefault();


            const name =
                form.querySelector(
                    "#review-name"
                )?.value.trim();


            const comment =
                form.querySelector(
                    "#review-comment"
                )?.value.trim();


            const rating =
                Number(
                    ratingInput?.value || 0
                );


            const message =
                document.querySelector(
                    "#review-message"
                );


            if (!name || name.length < 2) {

                showReviewMessage(
                    "Lütfen adınızı yazın.",
                    "error"
                );

                return;
            }


            if (
                !rating ||
                rating < 1 ||
                rating > 5
            ) {

                showReviewMessage(
                    "Lütfen 1 ile 5 arasında puan verin.",
                    "error"
                );

                return;
            }


            if (
                comment &&
                comment.length > 1000
            ) {

                showReviewMessage(
                    "Yorumunuz en fazla 1000 karakter olabilir.",
                    "error"
                );

                return;
            }


            const submitButton =
                form.querySelector(
                    "button[type='submit']"
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Gönderiliyor...";
            }


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
                            comment || null,

                        is_approved:
                            false
                    });


            if (error) {

                console.error(error);

                showReviewMessage(
                    "Yorum gönderilemedi. Lütfen tekrar deneyin.",
                    "error"
                );

            } else {

                form.reset();

                ratingInput.value =
                    "";

                stars.forEach(
                    star =>
                        star.classList.remove(
                            "active"
                        )
                );

                if (ratingText) {
                    ratingText.textContent =
                        "Puan seçin";
                }


                showReviewMessage(
                    "Yorumunuz gönderildi. Onaylandıktan sonra yayınlanacaktır. ⭐",
                    "success"
                );
            }


            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Yorumu Gönder";
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


// ============================================================
// HATA
// ============================================================

function showError(
    message
) {

    const container =
        document.querySelector(
            ".business-detail"
        );

    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="business-error">
            <div>😕</div>
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
            async () => {

                const url =
                    window.location.href;

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
                                url
                        });

                    } else {

                        await navigator.clipboard.writeText(
                            url
                        );

                        alert(
                            "İşletme bağlantısı kopyalandı."
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
            async () => {

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
    async () => {

        await loadBusiness();

        setupShareButtons();

        const slug =
            getSlug();


        if (!slug) {
            return;
        }


        const { data: business } =
            await supabaseClient
                .from("businesses")
                .select("id")
                .eq("slug", slug)
                .eq("is_approved", true)
                .maybeSingle();


        if (business) {

            setupReviewForm(
                business.id
            );
        }
    }
);