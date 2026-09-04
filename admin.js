
const SUPABASE_URL =
    "https://yhunhkzsecppbnhjewrt.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_0h5ycfDBJjgdf6bXlZ9OEg_K45u2b2v";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


const applications =
    document.querySelector("#applications");

const refreshButton =
    document.querySelector("#refreshButton");

const adminMessage =
    document.querySelector("#adminMessage");


document.addEventListener(
    "DOMContentLoaded",
    loadApplications
);


refreshButton.addEventListener(
    "click",
    loadApplications
);


// ============================================================
// BAŞVURULARI GETİR
// ============================================================

async function loadApplications() {

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
        .order("created_at", {
            ascending: false
        });


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


    if (!data || data.length === 0) {

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
                document.createElement("div");


            card.className =
                "application-card";


            const category =
                business.categories?.name ||
                "Kategori belirtilmemiş";


            // ------------------------------------------------
            // DURUM
            // ------------------------------------------------

            const status =
                business.is_approved

                    ? `
                        <span class="status approved-status">
                            ✓ Yayında
                        </span>
                      `

                    : `
                        <span class="status">
                            ⏳ Bekliyor
                        </span>
                      `;


            // ------------------------------------------------
            // ÖNE ÇIKAN BUTONU
            // ------------------------------------------------

            const featuredButton =
                business.is_featured

                    ? `
                        <button
                            class="action-button featured-remove-button"
                            onclick="toggleFeatured(${business.id}, false)"
                        >
                            ★ Öne Çıkarmayı Kaldır
                        </button>
                      `

                    : `
                        <button
                            class="action-button featured-button"
                            onclick="toggleFeatured(${business.id}, true)"
                        >
                            ☆ Öne Çıkar
                        </button>
                      `;


            // ------------------------------------------------
            // KART
            // ------------------------------------------------

            card.innerHTML = `

                <div class="application-top">

                    <div>

                        <h2 class="application-title">
                            ${escapeHtml(business.name)}
                        </h2>

                        <div class="application-meta">

                            ${escapeHtml(category)}

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
                                    onclick="approveBusiness(${business.id})"
                                >
                                    ✓ Onayla
                                </button>


                                <button
                                    class="action-button reject-button"
                                    onclick="rejectBusiness(${business.id})"
                                >
                                    ✕ Reddet
                                </button>

                              `

                            : ""
                    }


                    ${featuredButton}


                    <button
                        class="action-button delete-button"
                        onclick="deleteBusiness(${business.id})"
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

async function approveBusiness(id) {

    const confirmed =
        confirm(
            "Bu işletmeyi onaylamak ve yayına almak istediğinize emin misiniz?"
        );


    if (!confirmed) return;


    const {
        error
    } = await supabaseClient
        .from("businesses")
        .update({
            is_approved: true
        })
        .eq("id", id);


    if (error) {

        console.error(error);

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


    if (!confirmed) return;


    const {
        error
    } = await supabaseClient
        .from("businesses")
        .update({
            is_featured: featured
        })
        .eq("id", id);


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

async function rejectBusiness(id) {

    const confirmed =
        confirm(
            "Bu işletmeyi reddetmek istediğinize emin misiniz?"
        );


    if (!confirmed) return;


    const {
        error
    } = await supabaseClient
        .from("businesses")
        .update({
            is_approved: false,
            is_featured: false
        })
        .eq("id", id);


    if (error) {

        console.error(error);

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
// SİL
// ============================================================

async function deleteBusiness(id) {

    const confirmed =
        confirm(
            "Bu işletmeyi tamamen silmek istediğinize emin misiniz?"
        );


    if (!confirmed) return;


    const {
        error
    } = await supabaseClient
        .from("businesses")
        .delete()
        .eq("id", id);


    if (error) {

        console.error(error);

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

    adminMessage.textContent =
        text;


    adminMessage.className =
        `message ${type}`;

}


// ============================================================
// GÜVENLİ HTML
// ============================================================

function escapeHtml(
    value
) {

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
