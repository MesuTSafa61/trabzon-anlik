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
        .eq("is_approved", false)
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(error);

        applications.innerHTML = `
            <div class="empty-state">
                Başvurular yüklenemedi.
                <br><br>
                ${error.message}
            </div>
        `;

        return;
    }


    if (!data || data.length === 0) {

        applications.innerHTML = `
            <div class="empty-state">
                🎉 Bekleyen başvuru bulunmuyor.
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


            card.innerHTML = `

                <div class="application-top">

                    <div>

                        <h2 class="application-title">
                            ${escapeHtml(business.name)}
                        </h2>

                        <div class="application-meta">
                            ${escapeHtml(category)}
                            ·
                            ${escapeHtml(business.district || "-")}
                        </div>

                    </div>

                    <span class="status">
                        ⏳ Bekliyor
                    </span>

                </div>


                <div class="application-details">

                    <div class="detail">
                        <strong>Adres</strong>
                        <span>
                            ${escapeHtml(business.address || "-")}
                        </span>
                    </div>


                    <div class="detail">
                        <strong>Telefon</strong>
                        <span>
                            ${escapeHtml(business.phone || "-")}
                        </span>
                    </div>


                    <div class="detail">
                        <strong>Yetkili</strong>
                        <span>
                            ${escapeHtml(business.owner_name || "-")}
                        </span>
                    </div>


                    <div class="detail">
                        <strong>Yetkili Telefon</strong>
                        <span>
                            ${escapeHtml(business.owner_phone || "-")}
                        </span>
                    </div>


                    <div class="detail">
                        <strong>E-posta</strong>
                        <span>
                            ${escapeHtml(business.owner_email || "-")}
                        </span>
                    </div>


                    <div class="detail">
                        <strong>Instagram</strong>
                        <span>
                            ${escapeHtml(business.instagram || "-")}
                        </span>
                    </div>

                </div>


                <div class="application-actions">

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


                    <button
                        class="action-button delete-button"
                        onclick="deleteBusiness(${business.id})"
                    >
                        🗑 Sil
                    </button>

                </div>

            `;


            applications.appendChild(card);

        }
    );

}


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

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        "İşletme başarıyla onaylandı.",
        "success"
    );


    await loadApplications();

}


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
            is_approved: false
        })
        .eq("id", id);


    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        "Başvuru reddedildi.",
        "success"
    );

}


async function deleteBusiness(id) {

    const confirmed =
        confirm(
            "Bu başvuruyu tamamen silmek istediğinize emin misiniz?"
        );

    if (!confirmed) return;


    const {
        error
    } = await supabaseClient
        .from("businesses")
        .delete()
        .eq("id", id);


    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        "Başvuru silindi.",
        "success"
    );


    await loadApplications();

}


function showMessage(
    text,
    type
) {

    adminMessage.textContent =
        text;

    adminMessage.className =
        `message ${type}`;

}


function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
