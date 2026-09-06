const SUPABASE_URL =
    "https://yhunhkzsecppbnhjewrt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_0h5ycfDBJjgdf6bXlZ9OEg_K45u2b2v";
const BUSINESS_IMAGES_BUCKET = "business-images";
const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );
// =====================================
// ELEMENTLER
// =====================================
const loginScreen =
    document.getElementById("loginScreen");
const loginForm =
    document.getElementById("loginForm");
const loginEmail =
    document.getElementById("loginEmail");
const loginPassword =
    document.getElementById("loginPassword");
const loginError =
    document.getElementById("loginError");
const adminApp =
    document.getElementById("adminApp");
const adminUser =
    document.getElementById("adminUser");
const logoutButton =
    document.getElementById("logoutButton");
const refreshButton =
    document.getElementById("refreshButton");
const applications =
    document.getElementById("applications");
const reviewsList =
    document.getElementById("reviewsList");
const adminMessage =
    document.getElementById("adminMessage");
// =====================================
// BAŞLANGIÇ
// =====================================
document.addEventListener(
    "DOMContentLoaded",
    initializeAdmin
);
async function initializeAdmin() {
    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();
    if (error) {
        console.error(
            "Session kontrol hatası:",
            error
        );
        showLogin();
        return;
    }
    if (session?.user) {
        await checkAdmin(
            session.user.id
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
                    session.user.id
                );
            }
            if (
                event === "SIGNED_OUT"
            ) {
                showLogin();
            }
        }
    );
}
// =====================================
// ADMİN KONTROLÜ
// =====================================
async function checkAdmin(userId) {
    console.log(
        "Admin kontrolü:",
        userId
    );
    const {
        data,
        error
    } = await supabaseClient
        .from("admin_users")
        .select("id, created_at")
        .eq("id", userId)
        .maybeSingle();
    if (error) {
        console.error(
            "Admin kontrol hatası:",
            error
        );
        showLoginError(
            "Admin kontrolü sırasında hata oluştu: " +
            error.message
        );
        showLogin();
        return;
    }
    if (!data) {
        await supabaseClient.auth.signOut();
        showLoginError(
            "Bu hesap yönetim paneline erişim yetkisine sahip değil."
        );
        return;
    }
    const {
        data: { user }
    } = await supabaseClient.auth.getUser();
    await showAdmin(user);
}
// =====================================
// ADMİN PANELİNİ GÖSTER
// =====================================
async function showAdmin(user) {
    if (loginScreen) {
        loginScreen.style.display = "none";
    }
    if (adminApp) {
        adminApp.style.display = "block";
    }
    if (adminUser) {
        adminUser.textContent =
            user?.email || "";
    }
    await Promise.all([
        loadApplications(),
        loadReviews()
    ]);
}
// =====================================
// LOGIN
// =====================================
loginForm?.addEventListener(
    "submit",
    async (event) => {
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
        setLoginLoading(true);
        showLoginError("");
        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });
        if (error) {
            console.error(
                "Giriş hatası:",
                error
            );
            showLoginError(
                error.message ||
                "Giriş yapılamadı."
            );
            setLoginLoading(false);
            return;
        }
        if (data?.user) {
            await checkAdmin(
                data.user.id
            );
        }
        setLoginLoading(false);
    }
);
// =====================================
// ÇIKIŞ
// =====================================
logoutButton?.addEventListener(
    "click",
    async () => {
        await supabaseClient.auth.signOut();
        showLogin();
    }
);
// =====================================
// YENİLE
// =====================================
refreshButton?.addEventListener(
    "click",
    async () => {
        refreshButton.disabled = true;
        await Promise.all([
            loadApplications(),
            loadReviews()
        ]);
        refreshButton.disabled = false;
        showMessage(
            "Bilgiler yenilendi.",
            "success"
        );
    }
);
// =====================================
// İŞLETMELERİ YÜKLE
// =====================================
async function loadApplications() {
    if (!applications) return;
    applications.innerHTML = `
        <div class="loading">
            İşletmeler yükleniyor...
        </div>
    `;
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
        console.error(
            "İşletmeler yüklenemedi:",
            error
        );
        applications.innerHTML = `
            <div class="error">
                İşletmeler yüklenemedi.
            </div>
        `;
        return;
    }
    if (!data?.length) {
        applications.innerHTML = `
            <div class="empty">
                Henüz işletme bulunmuyor.
            </div>
        `;
        return;
    }
    const businesses =
        await Promise.all(
            data.map(
                async (business) => {
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
                        console.error(
                            "Galeri hatası:",
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
    applications.innerHTML =
        businesses
            .map(renderBusinessCard)
            .join("");
}
// =====================================
// İŞLETME KARTI
// =====================================
function renderBusinessCard(
    business
) {
    const images =
        business.images || [];
    const categoryName =
        business.categories?.name ||
        "Kategori yok";
    const status =
        business.is_approved
            ? "Onaylı"
            : "Bekliyor";
    const statusClass =
        business.is_approved
            ? "approved"
            : "pending";
    const featuredButton =
        business.is_featured
            ? "featured-remove-button"
            : "featured-button";
    const featuredText =
        business.is_featured
            ? "⭐ Öne Çıkarıldı"
            : "☆ Öne Çıkar";
    return `
        <div class="application-card">
            <div class="application-header">
                <div>
                    <h3>
                        ${escapeHtml(
                            business.name || ""
                        )}
                    </h3>
                    <span
                        class="status ${statusClass}"
                    >
                        ${status}
                    </span>
                </div>
                <div class="business-rating">
                    ⭐
                    ${Number(
                        business.rating || 0
                    ).toFixed(1)}
                    (${business.review_count || 0})
                </div>
            </div>
            <div class="application-info">
                <p>
                    <strong>Kategori:</strong>
                    ${escapeHtml(categoryName)}
                </p>
                <p>
                    <strong>İlçe:</strong>
                    ${escapeHtml(
                        business.district || "-"
                    )}
                </p>
                <p>
                    <strong>Adres:</strong>
                    ${escapeHtml(
                        business.address || "-"
                    )}
                </p>
                <p>
                    <strong>Telefon:</strong>
                    ${escapeHtml(
                        business.phone || "-"
                    )}
                </p>
                <p>
                    <strong>İşletme sahibi:</strong>
                    ${escapeHtml(
                        business.owner_name || "-"
                    )}
                </p>
                <p>
                    <strong>Sahibi telefon:</strong>
                    ${escapeHtml(
                        business.owner_phone || "-"
                    )}
                </p>
                <p>
                    <strong>Sahibi e-posta:</strong>
                    ${escapeHtml(
                        business.owner_email || "-"
                    )}
                </p>
                <p>
                    <strong>Instagram:</strong>
                    ${escapeHtml(
                        business.instagram || "-"
                    )}
                </p>
            </div>
            <!-- GALERİ -->
            <div class="admin-gallery">
                <div class="admin-gallery-header">
                    <h4>
                        🖼️ Fotoğraf Galerisi
                    </h4>
                    <span>
                        ${images.length} fotoğraf
                    </span>
                </div>
                ${
                    images.length
                        ? `
                            <div
                                class="admin-gallery-grid"
                            >
                                ${
                                    images
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
                                        .join("")
                                }
                            </div>
                        `
                        : `
                            <div
                                class="admin-gallery-empty"
                            >
                                Henüz fotoğraf eklenmemiş.
                            </div>
                        `
                }
                <div class="admin-upload-area">
                    <input
                        type="file"
                        id="imageInput-${business.id}"
                        accept="image/*"
                    >
                    <button
                        type="button"
                        onclick="uploadBusinessImage(${business.id})"
                    >
                        ➕ Fotoğraf Ekle
                    </button>
                </div>
            </div>
            <!-- BUTONLAR -->
            <div class="application-actions">
                ${
                    !business.is_approved
                        ? `
                            <button
                                class="approve-button"
                                onclick="approveBusiness(
                                    ${business.id}
                                )"
                            >
                                ✓ Onayla
                            </button>
                            <button
                                class="reject-button"
                                onclick="rejectBusiness(
                                    ${business.id}
                                )"
                            >
                                ✕ Reddet
                            </button>
                        `
                        : ""
                }
                <button
                    class="${featuredButton}"
                    onclick="toggleFeatured(
                        ${business.id},
                        ${!business.is_featured}
                    )"
                >
                    ${featuredText}
                </button>
                <button
                    class="delete-button"
                    onclick="deleteBusiness(
                        ${business.id}
                    )"
                >
                    🗑️ İşletmeyi Sil
                </button>
            </div>
        </div>
    `;
}
// =====================================
// GALERİ FOTOĞRAFI
// =====================================
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
        index < images.length - 1;
    return `
        <div class="admin-gallery-item">
            <div class="admin-image-wrapper">
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
                            <span class="cover-badge">
                                ⭐ Kapak
                            </span>
                        `
                        : ""
                }
            </div>
            <div class="admin-image-actions">
                ${
                    !isCover
                        ? `
                            <button
                                onclick="setCoverImage(
                                    ${image.id},
                                    ${image.business_id}
                                )"
                            >
                                ⭐ Kapak Yap
                            </button>
                        `
                        : `
                            <button disabled>
                                ✓ Kapak
                            </button>
                        `
                }
                <button
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
                    class="image-delete-button"
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
// =====================================
// FOTOĞRAF YÜKLE
// =====================================
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
    if (!file.type.startsWith("image/")) {
        showMessage(
            "Sadece fotoğraf dosyaları yüklenebilir.",
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
                    .pop() || "jpg"
            )
                .toLowerCase()
                .replace(
                    /[^a-z0-9]/g,
                    ""
                ) || "jpg";
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
                        cacheControl: "3600",
                        upsert: false,
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
// =====================================
// KAPAK FOTOĞRAFI
// =====================================
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
            "Kapak hatası:",
            error
        );
        showMessage(
            "Kapak fotoğrafı değiştirilemedi: " +
            error.message,
            "error"
        );
    }
}
// =====================================
// FOTOĞRAF SİL
// =====================================
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
        const storagePath =
            extractStoragePath(
                image.image_url
            );
        if (storagePath) {
            const {
                error: storageError
            } =
                await supabaseClient
                    .storage
                    .from(
                        BUSINESS_IMAGES_BUCKET
                    )
                    .remove([
                        storagePath
                    ]);
            if (storageError) {
                console.warn(
                    "Storage silme uyarısı:",
                    storageError
                );
            }
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
// =====================================
// FOTOĞRAF SIRASI
// =====================================
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
        await supabaseClient
            .from("business_images")
            .update({
                sort_order: -999999
            })
            .eq(
                "id",
                current.id
            );
        await supabaseClient
            .from("business_images")
            .update({
                sort_order: currentOrder
            })
            .eq(
                "id",
                target.id
            );
        await supabaseClient
            .from("business_images")
            .update({
                sort_order: targetOrder
            })
            .eq(
                "id",
                current.id
            );
        await loadApplications();
    } catch (error) {
        console.error(
            "Sıralama hatası:",
            error
        );
        showMessage(
            "Fotoğraf sırası değiştirilemedi.",
            "error"
        );
    }
}
// =====================================
// STORAGE PATH
// =====================================
function extractStoragePath(
    imageUrl
) {
    if (!imageUrl) {
        return null;
    }
    const marker =
        `/object/public/${BUSINESS_IMAGES_BUCKET}/`;
    const position =
        imageUrl.indexOf(marker);
    if (position === -1) {
        return null;
    }
    return imageUrl.substring(
        position + marker.length
    );
}
// =====================================
// İŞLETME ONAYLA
// =====================================
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
            "İşletme onaylanamadı.",
            "error"
        );
    }
}
// =====================================
// ÖNE ÇIKAR
// =====================================
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
            "İşlem gerçekleştirilemedi.",
            "error"
        );
    }
}
// =====================================
// İŞLETME REDDET
// =====================================
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
                    is_approved: false,
                    is_featured: false
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
            "İşletme reddedilemedi.",
            "error"
        );
    }
}
// =====================================
// İŞLETME SİL
// =====================================
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
            data: images
        } =
            await supabaseClient
                .from("business_images")
                .select("*")
                .eq(
                    "business_id",
                    id
                );
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
                    .remove(paths);
            }
            await supabaseClient
                .from("business_images")
                .delete()
                .eq(
                    "business_id",
                    id
                );
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
// =====================================
// YORUMLAR
// =====================================
async function loadReviews() {
    if (!reviewsList) return;
    reviewsList.innerHTML = `
        <div class="loading">
            Yorumlar yükleniyor...
        </div>
    `;
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
        console.error(
            "Yorum hatası:",
            error
        );
        reviewsList.innerHTML = `
            <div class="error">
                Yorumlar yüklenemedi.
            </div>
        `;
        return;
    }
    if (!data?.length) {
        reviewsList.innerHTML = `
            <div class="empty">
                Henüz yorum bulunmuyor.
            </div>
        `;
        return;
    }
    reviewsList.innerHTML =
        data
            .map(renderReview)
            .join("");
}
// =====================================
// YORUM KARTI
// =====================================
function renderReview(
    review
) {
    const businessName =
        review.businesses?.name ||
        "Bilinmeyen işletme";
    const rating =
        Number(
            review.rating || 0
        );
    return `
        <div class="review-card">
            <div class="review-header">
                <div>
                    <strong>
                        ${escapeHtml(
                            review.user_name ||
                            "İsimsiz"
                        )}
                    </strong>
                    <span>
                        ${escapeHtml(
                            businessName
                        )}
                    </span>
                </div>
                <div>
                    ${"⭐".repeat(rating)}
                </div>
            </div>
            <p>
                ${escapeHtml(
                    review.comment || ""
                )}
            </p>
            <small>
                ${formatDate(
                    review.created_at
                )}
            </small>
            <div class="review-actions">
                ${
                    !review.is_approved
                        ? `
                            <button
                                class="approve-button"
                                onclick="approveReview(
                                    ${review.id}
                                )"
                            >
                                ✓ Onayla
                            </button>
                        `
                        : `
                            <span
                                class="approved-label"
                            >
                                ✓ Onaylı
                            </span>
                        `
                }
                <button
                    class="delete-button"
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
// =====================================
// YORUM ONAYLA
// =====================================
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
        await loadReviews();
    } catch (error) {
        console.error(
            error
        );
        showMessage(
            "Yorum onaylanamadı.",
            "error"
        );
    }
}
// =====================================
// PUAN GÜNCELLE
// =====================================
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
// =====================================
// YORUM SİL
// =====================================
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
        await loadReviews();
    } catch (error) {
        console.error(
            error
        );
        showMessage(
            "Yorum silinemedi.",
            "error"
        );
    }
}
// =====================================
// MESAJ
// =====================================
function showMessage(
    text,
    type = "info"
) {
    if (!adminMessage) return;
    adminMessage.textContent =
        text;
    adminMessage.className =
        `admin-message ${type}`;
    adminMessage.style.display =
        "block";
    clearTimeout(
        showMessage.timer
    );
    showMessage.timer =
        setTimeout(
            () => {
                adminMessage.style.display =
                    "none";
            },
            4000
        );
}
// =====================================
// LOGIN HATASI
// =====================================
function showLoginError(
    message
) {
    if (!loginError) return;
    loginError.textContent =
        message || "";
    loginError.style.display =
        message
            ? "block"
            : "none";
}
// =====================================
// LOGIN EKRANI
// =====================================
function showLogin() {
    if (loginScreen) {
        loginScreen.style.display =
            "flex";
    }
    if (adminApp) {
        adminApp.style.display =
            "none";
    }
    if (loginPassword) {
        loginPassword.value = "";
    }
}
// =====================================
// LOGIN LOADING
// =====================================
function setLoginLoading(
    loading
) {
    const button =
        loginForm?.querySelector(
            'button[type="submit"]'
        );
    if (!button) return;
    button.disabled =
        loading;
    button.textContent =
        loading
            ? "Giriş yapılıyor..."
            : "Giriş Yap";
}
// =====================================
// TARİH
// =====================================
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
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}
// =====================================
// HTML GÜVENLİĞİ
// =====================================
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