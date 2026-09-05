const SUPABASE_URL =
    "https://yhunhkzsecppbnhjewrt.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_0h5ycfDBJjgdf6bXlZ9OEg_K45u2b2v";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

const container =
    document.getElementById(
        "businessContainer"
    );


// ============================================================
// HTML GÜVENLİĞİ
// ============================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// İŞLETMEYİ YÜKLE
// ============================================================

async function loadBusiness() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const slug =
        params.get("slug");


    if (!slug) {

        container.innerHTML = `
            <div class="error">

                <h2>
                    İşletme bulunamadı
                </h2>

                <p>
                    Geçerli bir işletme adresi belirtilmemiş.
                </p>

            </div>
        `;

        return;
    }


    console.log(
        "İşletme slug:",
        slug
    );


    try {

        const {
            data: business,
            error
        } = await supabaseClient

            .from("businesses")

            .select(`
                id,
                name,
                slug,
                category_id,
                description,
                address,
                district,
                phone,
                website,
                instagram,
                image_url,
                rating,
                review_count,
                is_approved
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

            container.innerHTML = `
                <div class="error">

                    <h2>
                        Bir hata oluştu
                    </h2>

                    <p>
                        İşletme bilgileri alınamadı.
                    </p>

                </div>
            `;

            return;
        }


        if (!business) {

            container.innerHTML = `
                <div class="error">

                    <h2>
                        İşletme bulunamadı
                    </h2>

                    <p>
                        Bu işletme yayında olmayabilir.
                    </p>

                </div>
            `;

            return;
        }


        // ====================================================
        // KATEGORİ
        // ====================================================

        let categoryName =
            "İşletme";


        if (business.category_id) {

            const {
                data: category
            } = await supabaseClient

                .from("categories")

                .select(
                    "name"
                )

                .eq(
                    "id",
                    business.category_id
                )

                .maybeSingle();


            if (category) {

                categoryName =
                    category.name;
            }
        }


        // ====================================================
        // FOTOĞRAF
        // ====================================================

        const image =
            business.image_url ||
            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=80";


        // ====================================================
        // PUAN
        // ====================================================

        const rating =
            Number(
                business.rating || 0
            );


        const ratingText =
            rating > 0
                ? `⭐ ${rating.toFixed(1)}`
                : "⭐ Yeni";


        // ====================================================
        // BUTONLAR
        // ====================================================

        let actions = "";


        // TELEFON

        if (business.phone) {

            actions += `
                <a
                    class="business-action"
                    href="tel:${escapeHtml(
                        business.phone
                    )}"
                >
                    📞 Ara
                </a>
            `;
        }


        // INSTAGRAM

        if (business.instagram) {

            let instagramUrl =
                business.instagram.trim();


            if (
                !instagramUrl.startsWith(
                    "http"
                )
            ) {

                instagramUrl =
                    "https://instagram.com/" +
                    instagramUrl.replace(
                        "@",
                        ""
                    );
            }


            actions += `
                <a
                    class="business-action"
                    href="${escapeHtml(
                        instagramUrl
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    📷 Instagram
                </a>
            `;
        }


        // WEB SİTESİ

        if (business.website) {

            let websiteUrl =
                business.website.trim();


            if (
                !websiteUrl.startsWith(
                    "http"
                )
            ) {

                websiteUrl =
                    "https://" +
                    websiteUrl;
            }


            actions += `
                <a
                    class="business-action"
                    href="${escapeHtml(
                        websiteUrl
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    🌐 Web Sitesi
                </a>
            `;
        }


        // ====================================================
        // SAYFAYI OLUŞTUR
        // ====================================================

        container.innerHTML = `

            <article class="business-detail-card">

                <img
                    class="business-detail-image"
                    src="${escapeHtml(
                        image
                    )}"
                    alt="${escapeHtml(
                        business.name
                    )}"
                    onerror="
                        this.src='https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=80'
                    "
                >


                <div class="business-detail-content">

                    <span class="business-detail-category">

                        ${escapeHtml(
                            categoryName
                        )}

                    </span>


                    <h1 class="business-detail-title">

                        ${escapeHtml(
                            business.name
                        )}

                    </h1>


                    <div class="business-detail-rating">

                        ${ratingText}

                        ${
                            business.review_count ||
                            0
                        }

                        değerlendirme

                    </div>


                    ${
                        business.description
                            ? `
                                <div
                                    class="business-detail-description"
                                >
                                    ${escapeHtml(
                                        business.description
                                    )}
                                </div>
                            `
                            : ""
                    }


                    <div class="business-info">


                        ${
                            business.district
                                ? `
                                    <div
                                        class="business-info-item"
                                    >

                                        📍

                                        <strong>
                                            İlçe:
                                        </strong>

                                        ${escapeHtml(
                                            business.district
                                        )}

                                    </div>
                                `
                                : ""
                        }


                        ${
                            business.address
                                ? `
                                    <div
                                        class="business-info-item"
                                    >

                                        🏠

                                        <strong>
                                            Adres:
                                        </strong>

                                        ${escapeHtml(
                                            business.address
                                        )}

                                    </div>
                                `
                                : ""
                        }


                        ${
                            business.phone
                                ? `
                                    <div
                                        class="business-info-item"
                                    >

                                        📞

                                        <strong>
                                            Telefon:
                                        </strong>

                                        ${escapeHtml(
                                            business.phone
                                        )}

                                    </div>
                                `
                                : ""
                        }


                    </div>


                    ${
                        actions
                            ? `
                                <div
                                    class="business-actions"
                                >

                                    ${actions}

                                </div>
                            `
                            : ""
                    }


                </div>

            </article>

        `;

    } catch (error) {

        console.error(
            "İşletme sayfası hatası:",
            error
        );

        container.innerHTML = `
            <div class="error">

                <h2>
                    Bir hata oluştu
                </h2>

                <p>
                    İşletme bilgileri yüklenirken
                    beklenmeyen bir hata oluştu.
                </p>

            </div>
        `;
    }
}


// ============================================================
// BAŞLAT
// ============================================================

loadBusiness();