const SUPABASE_URL =
“https://yhunhkzsecppbnhjewrt.supabase.co”;

const SUPABASE_PUBLISHABLE_KEY =
“sb_publishable_0h5ycfDBJjgdf6bXlZ9OEg_K45u2b2v”;

const supabaseClient =
window.supabase.createClient(
SUPABASE_URL,
SUPABASE_PUBLISHABLE_KEY
);

// ============================================================
// YARDIMCI
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

if (!phone) return "";
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
    Math.round(Number(rating || 0));
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
// İŞLETME YÜKLE
// ============================================================

async function loadBusiness() {

const slug =
    getSlug();
if (!slug) {
    showError(
        "İşletme bulunamadı."
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
            .eq("slug", slug)
            .eq("is_approved", true)
            .maybeSingle();
    if (error) {
        console.error(
            "İşletme hatası:",
            error
        );
        showError(
            "İşletme bilgileri alınamadı."
        );
        return;
    }
    if (!business) {
        showError(
            "İşletme bulunamadı."
        );
        return;
    }
    let category = null;
    if (business.category_id) {
        const {
            data
        } =
            await supabaseClient
                .from("categories")
                .select("name, icon")
                .eq(
                    "id",
                    business.category_id
                )
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
    setupReviewForm(
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
// İŞLETME DETAY
// ============================================================

function renderBusiness(
business,
category
) {

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
    categoryElement.textContent =
        `${category?.icon || "🏪"} ${category?.name || "İŞLETME"}`;
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
        business.district ||
        "Belirtilmemiş";
}
const address =
    document.querySelector(
        "[data-business-address]"
    );
if (address) {
    address.textContent =
        business.address ||
        "Belirtilmemiş";
}
const phone =
    document.querySelector(
        "[data-business-phone]"
    );
if (phone) {
    phone.textContent =
        business.phone ||
        "Belirtilmemiş";
}
const rating =
    Number(
        business.rating || 0
    );
const ratingMain =
    document.querySelector(
        ".rating-main"
    );
if (ratingMain) {
    ratingMain.textContent =
        `⭐ ${rating.toFixed(1)}`;
}
const ratingElement =
    document.querySelector(
        ".business-detail-rating"
    );
if (ratingElement) {
    ratingElement.innerHTML = `
        <span class="detail-rating-stars">
            ${starsHtml(rating)}
        </span>
        <strong>
            ${rating.toFixed(1)}
        </strong>
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
        whatsappButton.href =
            `https://wa.me/${normalizePhone(
                business.phone
            )}`;
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
        Number(
            business.latitude
        );
    const lng =
        Number(
            business.longitude
        );
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
if (!container) {
    return;
}
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
        "Yorumlar alınamadı:",
        error
    );
    container.innerHTML = `
        <div class="review-error">
            Yorumlar yüklenemedi.
        </div>
    `;
    return;
}
const reviewList =
    reviews || [];
const count =
    reviewList.length;
// ========================================================
// ORTALAMA PUAN
// ========================================================
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
                    review.rating || 0
                ),
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
        starsHtml(average);
}
// ========================================================
// YORUM YOK
// ========================================================
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
    star => {
        star.addEventListener(
            "click",
            () => {
                const rating =
                    Number(
                        star.dataset.rating
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
    async event => {
        event.preventDefault();
        const name =
            document
                .querySelector(
                    "#review-name"
                )
                ?.value
                .trim();
        const comment =
            document
                .querySelector(
                    "#review-comment"
                )
                ?.value
                .trim();
        const rating =
            Number(
                ratingInput.value
            );
        if (
            !name ||
            name.length < 2
        ) {
            showReviewMessage(
                "Lütfen adınızı yazın.",
                "error"
            );
            return;
        }
        if (
            rating < 1 ||
            rating > 5
        ) {
            showReviewMessage(
                "Lütfen yıldız puanı seçin.",
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
        const submitButton =
            form.querySelector(
                ".review-submit"
            );
        if (submitButton) {
            submitButton.disabled =
                true;
            submitButton.textContent =
                "Gönderiliyor...";
        }
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
        async () => {
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
“DOMContentLoaded”,
() => {

    loadBusiness();
    setupShareButtons();
}

);