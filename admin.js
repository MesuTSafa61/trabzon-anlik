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
// ELEMENTLER
// ============================================================

const loginScreen =
    document.querySelector("#loginScreen");

const loginForm =
    document.querySelector("#loginForm");

const loginEmail =
    document.querySelector("#loginEmail");

const loginPassword =
    document.querySelector("#loginPassword");

const loginError =
    document.querySelector("#loginError");

const adminApp =
    document.querySelector("#adminApp");

const adminUser =
    document.querySelector("#adminUser");

const logoutButton =
    document.querySelector("#logoutButton");

const refreshButton =
    document.querySelector("#refreshButton");

const applications =
    document.querySelector("#applications");

const reviewsList =
    document.querySelector("#reviewsList");

const adminMessage =
    document.querySelector("#adminMessage");


// ============================================================
// SAYFA BAŞLANGICI
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeAdmin
);


// ============================================================
// ADMIN BAŞLAT
// ============================================================

async function initializeAdmin() {

    try {

        const {
            data: {
                session
            }
        } = await supabaseClient.auth.getSession();


        if (!session) {

            showLogin();

            return;
        }


        const isAdmin =
            await checkAdmin(
                session.user.id
            );


        if (!isAdmin) {

            await supabaseClient.auth.signOut();

            showLoginError(
                "Bu hesap yönetim paneline erişim yetkisine sahip değil."
            );

            return;
        }


        showAdmin(
            session.user
        );


    } catch (error) {

        console.error(
            "Admin başlatma hatası:",
            error
        );

        showLoginError(
            "Yönetim paneli başlatılamadı."
        );

    }

}


// ============================================================
// ADMIN KONTROLÜ
// ============================================================

async function checkAdmin(
    userId
) {

    const {
        data,
        error
    } = await supabaseClient
        .from("admin_users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();


    if (error) {

        console.error(
            "Admin kontrol hatası:",
            error
        );

        return false;
    }


    return !!data;

}


// ============================================================
// GİRİŞ
// ============================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const email =
                loginEmail.value.trim();

            const password =
                loginPassword.value;


            if (!email || !password) {

                showLoginError(
                    "E-posta ve şifre gerekli."
                );

                return;
            }


            setLoginLoading(
                true
            );


            const {
                data,
                error
            } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });


            setLoginLoading(
                false
            );


            if (error) {

                console.error(
                    "Giriş hatası:",
                    error
                );

                showLoginError(
                    "Giriş yapılamadı. E-posta veya şifre hatalı olabilir."
                );

                return;
            }


            const user =
                data?.user;


            if (!user) {

                showLoginError(
                    "Kullanıcı bilgileri alınamadı."
                );

                return;
            }


            const isAdmin =
                await checkAdmin(
                    user.id
                );


            if (!isAdmin) {

                await supabaseClient.auth.signOut();

                showLoginError(
                    "Bu hesap admin olarak tanımlanmamış."
                );

                return;
            }


            loginError.style.display =
                "none";


            showAdmin(
                user
            );

        }
    );

}


// ============================================================
// GİRİŞ EKRANI
// ============================================================

function showLogin() {

    if (loginScreen) {

        loginScreen.style.display =
            "flex";

    }


    if (adminApp) {

        adminApp.style.display =
            "none";

    }

}


// ============================================================
// ADMIN PANELİNİ GÖSTER
// ============================================================

async function showAdmin(
    user
) {

    if (loginScreen) {

        loginScreen.style.display =
            "none";

    }


    if (adminApp) {

        adminApp.style.display =
            "block";

    }


    if (adminUser) {

        adminUser.textContent =
            `Giriş yapan admin: ${user.email || ""}`;

    }


    await Promise.all([
        loadApplications(),
        loadReviews()
    ]);

}


// ============================================================
// ÇIKIŞ
// ============================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function() {

            const confirmed =
                confirm(
                    "Yönetim panelinden çıkış yapmak istiyor musunuz?"
                );


            if (!confirmed) {

                return;
            }


            await supabaseClient.auth.signOut();


            if (adminApp) {

                adminApp.style.display =
                    "none";

            }


            showLogin();

        }
    );

}


// ============================================================
// YENİLE
// ============================================================

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async function() {

            await Promise.all([
                loadApplications(),
                loadReviews()
            ]);

        }
    );

}


// ============================================================
// OTURUM DEĞİŞİKLİĞİ
// ============================================================

supabaseClient.auth.onAuthStateChange(
    async function(
        event,
        session
    ) {

        if (
            event === "SIGNED_OUT" ||
            !session
        ) {

            showLogin();

            return;
        }


        if (
            event === "SIGNED_IN"
        ) {

            const isAdmin =
                await checkAdmin(
                    session.user.id
                );


            if (!isAdmin) {

                await supabaseClient.auth.signOut();

                showLoginError(
                    "Bu hesabın admin yetkisi yok."
                );

                return;
            }


            showAdmin(
                session.user
            );

        }

    }
);


// ============================================================
// YORUMLARI GETİR
// ============================================================

async function loadReviews() {

    if (!reviewsList) {

        return;
    }


    reviewsList.innerHTML = `
        <div class="empty-state">
            Yorumlar yükleniyor...
        </div>
    `;


    const {
        data,
        error
    } = await supabaseClient
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

        console.error(
            "Yorumlar yüklenemedi:",
            error
        );


        reviewsList.innerHTML = `
            <div class="empty-state">
                Yorumlar yüklenemedi.
                <br><br>
                ${escapeHtml(error.message)}
            </div>
        `;

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        reviewsList.innerHTML = `
            <div class="empty-state">
                Henüz yorum bulunmuyor.
            </div>
        `;

        return;
    }


    reviewsList.innerHTML = "";


    data.forEach(
        review => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "review-card";


            const businessName =
                review.businesses?.name ||
                "İşletme";


            const rating =
                Number(
                    review.rating || 0
                );


            const stars =
                "★".repeat(
                    Math.max(
                        0,
                        Math.min(
                            5,
                            rating
                        )
                    )
                ) +
                "☆".repeat(
                    Math.max(
                        0,
                        5 - rating
                    )
                );


            const date =
                formatDate(
                    review.created_at
                );


            const status =
                review.is_approved
                    ? `
                        <span class="status approved-status">
                            ✓ Yayında
                        </span>
                      `
                    : `
                        <span class="status pending-status">
                            ⏳ Onay Bekliyor
                        </span>
                      `;


            const actionButtons =
                review.is_approved

                    ? `
                        <button
                            class="action-button delete-button"
                            onclick="deleteReview(${review.id})"
                        >
                            🗑 Yorumu Sil
                        </button>
                      `

                    : `
                        <button
                            class="action-button approve-button"
                            onclick="approveReview(${review.id})"
                        >
                            ✓ Yorumu Onayla
                        </button>

                        <button
                            class="action-button reject-button"
                            onclick="deleteReview(${review.id})"
                        >
                            ✕ Reddet / Sil
                        </button>
                      `;


            card.innerHTML = `

                <div class="review-top">

                    <div>

                        <h2 class="review-title">
                            ${escapeHtml(
                                review.name ||
                                "İsimsiz"
                            )}
                        </h2>

                        <div class="review-meta">

                            <span class="review-business">
                                🏪
                                ${escapeHtml(
                                    businessName
                                )}
                            </span>

                            <div class="review-date">
                                ${escapeHtml(date)}
                            </div>

                        </div>

                    </div>


                    ${status}

                </div>


                <div class="review-rating">
                    ${stars}
                    <span style="font-size:14px; color:#777;">
                        (${rating}/5)
                    </span>
                </div>


                <div class="review-comment">

                    ${escapeHtml(
                        review.comment ||
                        "Yorum metni bulunmuyor."
                    )}

                </div>


                <div class="review-actions">

                    ${actionButtons}

                </div>

            `;


            reviewsList.appendChild(
                card
            );

        }
    );

}


// ============================================================
// YORUM ONAYLA
// ============================================================

async function approveReview(
    reviewId
) {

    const confirmed =
        confirm(
            "Bu yorumu yayınlamak istediğinize emin misiniz?"
        );


    if (!confirmed) {

        return;
    }


    const {
        data: review,
        error: reviewError
    } = await supabaseClient
        .from("reviews")
        .select(`
            id,
            business_id,
            rating,
            is_approved
        `)
        .eq(
            "id",
            reviewId
        )
        .maybeSingle();


    if (reviewError) {

        console.error(
            reviewError
        );

        showMessage(
            "Yorum bilgisi alınamadı: " +
            reviewError.message,
            "error"
        );

        return;
    }


    if (!review) {

        showMessage(
            "Yorum bulunamadı.",
            "error"
        );

        return;
    }


    const {
        error
    } = await supabaseClient
        .from("reviews")
        .update({
            is_approved: true
        })
        .eq(
            "id",
            reviewId
        );


    if (error) {

        console.error(
            "Yorum onaylama hatası:",
            error
        );

        showMessage(
            "Yorum onaylanamadı: " +
            error.message,
            "error"
        );

        return;
    }


    await updateBusinessRating(
        review.business_id
    );


    showMessage(
        "Yorum başarıyla yayınlandı. ✓",
        "success"
    );


    await loadReviews();

}


// ============================================================
// İŞLETME PUANINI GÜNCELLE
// ============================================================

async function updateBusinessRating(
    businessId
) {

    if (!businessId) {

        return;
    }


    const {
        data: approvedReviews,
        error
    } = await supabaseClient
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

        console.error(
            "Puan hesaplama hatası:",
            error
        );

        return;
    }


    const ratings =
        (approvedReviews || [])
            .map(
                review =>
                    Number(
                        review.rating
                    )
            )
            .filter(
                rating =>
                    rating >= 1 &&
                    rating <= 5
            );


    const reviewCount =
        ratings.length;


    const total =
        ratings.reduce(
            (
                sum,
                rating
            ) =>
                sum + rating,
            0
        );


    const average =
        reviewCount > 0
            ? Number(
                (
                    total /
                    reviewCount
                ).toFixed(1)
            )
            : 0;


    const {
        error: updateError
    } = await supabaseClient
        .from("businesses")
        .update({
            rating: average,
            review_count: reviewCount
        })
        .eq(
            "id",
            businessId
        );


    if (updateError) {

        console.error(
            "İşletme puanı güncellenemedi:",
            updateError
        );

    }

}


// ============================================================
// YORUM SİL
// ============================================================

async function deleteReview(
    reviewId
) {

    const confirmed =
        confirm(
            "Bu yorumu tamamen silmek istediğinize emin misiniz?"
        );


    if (!confirmed) {

        return;
    }


    const {
        data: review,
        error: reviewError
    } = await supabaseClient
        .from("reviews")
        .select(`
            id,
            business_id
        `)
        .eq(
            "id",
            reviewId
        )
        .maybeSingle();


    if (reviewError) {

        console.error(
            reviewError
        );

        showMessage(
            "Yorum bilgisi alınamadı: " +
            reviewError.message,
            "error"
        );

        return;
    }


    if (!review) {

        showMessage(
            "Yorum bulunamadı.",
            "error"
        );

        return;
    }


    const {
        error
    } = await supabaseClient
        .from("reviews")
        .delete()
        .eq(
            "id",
            reviewId
        );


    if (error) {

        console.error(
            "Yorum silme hatası:",
            error
        );

        showMessage(
            "Yorum silinemedi: " +
            error.message,
            "error"
        );

        return;
    }


    await updateBusinessRating(
        review.business_id
    );


    showMessage(
        "Yorum başarıyla silindi.",
        "success"
    );


    await loadReviews();

}


// ============================================================
// BAŞVURULARI GETİR
// ============================================================

async function loadApplications() {

    if (!applications) {

        return;
    }


    applications.innerHTML = `
        <div class="empty-state">
            Başvurular yükleniyor...
        </div>
    `;


    const {
        data,
        error
    } = await supabaseClient
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

        console.error(
            "Başvurular yüklenemedi:",
            error
        );


        applications.innerHTML = `
            <div class="empty-state">
                Başvurular yüklenemedi.
                <br><br>
                ${escapeHtml(error.message)}
            </div>
        `;

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        applications.innerHTML = `
            <div class="empty-state">
                Henüz işletme başvurusu bulunmuyor.
            </div>
        `;

        return;
    }


    applications.innerHTML = "";


    data.forEach(
        business => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "application-card";


            const category =
                business.categories?.name ||
                "Kategori belirtilmemiş";


            const status =
                business.is_approved

                    ? `
                        <span class="status approved-status">
                            ✓ Yayında
                        </span>
                      `

                    : `
                        <span class="status pending-status">
                            ⏳ Bekliyor
                        </span>
                      `;


            const featuredButton =
                business.is_featured

                    ? `
                        <button
                            class="action-button featured-remove-button"
                            onclick="toggleFeatured(
                                ${business.id},
                                false
                            )"
                        >
                            ★ Öne Çıkarmayı Kaldır
                        </button>
                      `

                    : `
                        <button
                            class="action-button featured-button"
                            onclick="toggleFeatured(
                                ${business.id},
                                true
                            )"
                        >
                            ☆ Öne Çıkar
                        </button>
                      `;


            card.innerHTML = `

                <div class="application-top">

                    <div>

                        <h2 class="application-title">
                            ${escapeHtml(
                                business.name
                            )}
                        </h2>

                        <div class="application-meta">

                            ${escapeHtml(
                                category
                            )}

                            ·

                            ${escapeHtml(
                                business.district || "-"
                            )}

                        </div>

                    </div>


                    ${status}

                </div>


                <div class="application-details">

                    <div class="detail">

                        <strong>
                            Adres
                        </strong>

                        <span>
                            ${escapeHtml(
                                business.address || "-"
                            )}
                        </span>

                    </div>


                    <div class="detail">

                        <strong>
                            Telefon
                        </strong>

                        <span>
                            ${escapeHtml(
                                business.phone || "-"
                            )}
                        </span>

                    </div>


                    <div class="detail">

                        <strong>
                            Yetkili
                        </strong>

                        <span>
                            ${escapeHtml(
                                business.owner_name || "-"
                            )}
                        </span>

                    </div>


                    <div class="detail">

                        <strong>
                            Yetkili Telefon
                        </strong>

                        <span>
                            ${escapeHtml(
                                business.owner_phone || "-"
                            )}
                        </span>

                    </div>


                    <div class="detail">

                        <strong>
                            E-posta
                        </strong>

                        <span>
                            ${escapeHtml(
                                business.owner_email || "-"
                            )}
                        </span>

                    </div>


                    <div class="detail">

                        <strong>
                            Instagram
                        </strong>

                        <span>
                            ${escapeHtml(
                                business.instagram || "-"
                            )}
                        </span>

                    </div>


                    <div class="detail">

                        <strong>
                            Puan
                        </strong>

                        <span>
                            ⭐
                            ${Number(
                                business.rating || 0
                            ).toFixed(1)}

                            ·

                            ${Number(
                                business.review_count || 0
                            )}

                            yorum
                        </span>

                    </div>


                    <div class="detail">

                        <strong>
                            Öne Çıkan
                        </strong>

                        <span>
                            ${
                                business.is_featured
                                    ? "⭐ Evet"
                                    : "Hayır"
                            }
                        </span>

                    </div>

                </div>


                <div class="application-actions">

                    ${
                        !business.is_approved

                            ? `
                                <button
                                    class="action-button approve-button"
                                    onclick="approveBusiness(
                                        ${business.id}
                                    )"
                                >
                                    ✓ Onayla
                                </button>

                                <button
                                    class="action-button reject-button"
                                    onclick="rejectBusiness(
                                        ${business.id}
                                    )"
                                >
                                    ✕ Reddet
                                </button>
                              `

                            : ""
                    }


                    ${featuredButton}


                    <button
                        class="action-button delete-button"
                        onclick="deleteBusiness(
                            ${business.id}
                        )"
                    >
                        🗑 Sil
                    </button>

                </div>

            `;


            applications.appendChild(
                card
            );

        }
    );

}


// ============================================================
// İŞLETME ONAYLA
// ============================================================

async function approveBusiness(
    id
) {

    const confirmed =
        confirm(
            "Bu işletmeyi onaylamak ve yayına almak istediğinize emin misiniz?"
        );


    if (!confirmed) {

        return;
    }


    const {
        error
    } = await supabaseClient
        .from("businesses")
        .update({
            is_approved: true
        })
        .eq(
            "id",
            id
        );


    if (error) {

        console.error(
            error
        );

        showMessage(
            "İşletme onaylanamadı: " +
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        "İşletme başarıyla onaylandı. ✓",
        "success"
    );


    await loadApplications();

}


// ============================================================
// ÖNE ÇIKAR / KALDIR
// ============================================================

async function toggleFeatured(
    id,
    featured
) {

    const confirmationText =
        featured

            ? "Bu işletmeyi ana sayfada öne çıkarmak istediğinize emin misiniz?"

            : "Bu işletmenin öne çıkan durumunu kaldırmak istediğinize emin misiniz?";


    const confirmed =
        confirm(
            confirmationText
        );


    if (!confirmed) {

        return;
    }


    const {
        error
    } = await supabaseClient
        .from("businesses")
        .update({
            is_featured: featured
        })
        .eq(
            "id",
            id
        );


    if (error) {

        console.error(
            "Öne çıkan güncelleme hatası:",
            error
        );


        showMessage(
            "İşlem gerçekleştirilemedi: " +
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        featured
            ? "İşletme ana sayfada öne çıkarıldı. ⭐"
            : "İşletmenin öne çıkan durumu kaldırıldı.",
        "success"
    );


    await loadApplications();

}


// ============================================================
// REDDET
// ============================================================

async function rejectBusiness(
    id
) {

    const confirmed =
        confirm(
            "Bu işletmeyi reddetmek istediğinize emin misiniz?"
        );


    if (!confirmed) {

        return;
    }


    const {
        error
    } = await supabaseClient
        .from("businesses")
        .update({
            is_approved: false,
            is_featured: false
        })
        .eq(
            "id",
            id
        );


    if (error) {

        console.error(
            error
        );

        showMessage(
            "Başvuru reddedilemedi: " +
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        "Başvuru reddedildi.",
        "success"
    );


    await loadApplications();

}


// ============================================================
// İŞLETME SİL
// ============================================================

async function deleteBusiness(
    id
) {

    const confirmed =
        confirm(
            "Bu işletmeyi tamamen silmek istediğinize emin misiniz?"
        );


    if (!confirmed) {

        return;
    }


    const {
        error
    } = await supabaseClient
        .from("businesses")
        .delete()
        .eq(
            "id",
            id
        );


    if (error) {

        console.error(
            error
        );

        showMessage(
            "İşletme silinemedi: " +
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        "İşletme başarıyla silindi.",
        "success"
    );


    await loadApplications();

}


// ============================================================
// MESAJ
// ============================================================

function showMessage(
    text,
    type
) {

    if (!adminMessage) {

        return;
    }


    adminMessage.textContent =
        text;


    adminMessage.className =
        `message ${type}`;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    setTimeout(
        function() {

            if (
                adminMessage.className ===
                `message ${type}`
            ) {

                adminMessage.className =
                    "message";

            }

        },
        5000
    );

}


// ============================================================
// GİRİŞ HATASI
// ============================================================

function showLoginError(
    message
) {

    if (!loginError) {

        return;
    }


    loginError.textContent =
        message;


    loginError.style.display =
        "block";

}


// ============================================================
// GİRİŞ YÜKLENİYOR
// ============================================================

function setLoginLoading(
    loading
) {

    const button =
        loginForm?.querySelector(
            ".login-button"
        );


    if (!button) {

        return;
    }


    button.disabled =
        loading;


    button.textContent =
        loading
            ? "Giriş yapılıyor..."
            : "Giriş Yap";

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
        new Date(
            value
        );


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
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ============================================================
// GÜVENLİ HTML
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