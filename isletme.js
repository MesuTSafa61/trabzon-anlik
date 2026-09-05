// ============================================================
// TRABZON ANLIK
// İŞLETME DETAY SAYFASI
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


// ============================================================
// URL GÜVENLİĞİ
// ============================================================

function normalizeUrl(
    value
) {

    if (!value) {
        return "";
    }

    let url =
        String(value).trim();


    if (
        !url.startsWith("http://") &&
        !url.startsWith("https://")
    ) {

        url =
            "https://" +
            url;
    }


    return url;
}


// ============================================================
// WHATSAPP NUMARASI
// ============================================================

function normalizePhone(
    phone
) {

    if (!phone) {
        return "";
    }

    let number =
        String(phone)
            .replace(
                /[^0-9+]/g,
                ""
            );


    // Türkiye numarası

    if (
        number.startsWith("0")
    ) {

        number =
            "90" +
            number.substring(1);
    }


    if (
        number.startsWith("+")
    ) {

        number =
            number.substring(1);
    }


    if (
        !number.startsWith("90") &&
        number.length === 10
    ) {

        number =
            "90" +
            number;
    }


    return number;
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

        showError(
            "Geçerli bir işletme adresi belirtilmemiş."
        );

        return;
    }


    try {


        console.log(
            "İşletme yükleniyor:",
            slug
        );


        // ====================================================
        // İŞLETME
        // ====================================================

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
                    category_id,
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

            showError(
                "İşletme bilgileri alınamadı."
            );

            return;
        }


        if (!business) {

            showError(
                "Bu işletme yayında olmayabilir."
            );

            return;
        }


        // ====================================================
        // KATEGORİ
        // ====================================================

        let categoryName =
            "İşletme";


        let categoryIcon =
            "🏪";


        if (
            business.category_id
        ) {


            const {
                data: category
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


            if (category) {

                categoryName =
                    category.name ||
                    categoryName;

                categoryIcon =
                    category.icon ||
                    categoryIcon;
            }
        }


        // ====================================================
        // FOTOĞRAF
        // ====================================================

        const fallbackImage =
            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=85";


        const image =
            business.image_url ||
            fallbackImage;


        // ====================================================
        // PUAN
        // ====================================================

        const rating =
            Number(
                business.rating || 0
            );


        const ratingText =
            rating > 0
                ? rating.toFixed(1)
                : "Yeni";


        // ====================================================
        // TELEFON
        // ====================================================

        const phone =
            business.phone
                ? String(
                    business.phone
                ).trim()
                : "";


        // ====================================================
        // WHATSAPP
        // ====================================================

        const whatsappNumber =
            normalizePhone(
                phone
            );


        // ====================================================
        // INSTAGRAM
        // ====================================================

        let instagramUrl =
            "";


        if (
            business.instagram
        ) {

            instagramUrl =
                String(
                    business.instagram
                ).trim();


            if (
                !instagramUrl.startsWith(
                    "http://"
                ) &&
                !instagramUrl.startsWith(
                    "https://"
                )
            ) {

                instagramUrl =
                    "https://instagram.com/" +
                    instagramUrl.replace(
                        "@",
                        ""
                    );
            }
        }


        // ====================================================
        // WEB SİTESİ
        // ====================================================

        const websiteUrl =
            normalizeUrl(
                business.website
            );


        // ====================================================
        // HARİTA
        // ====================================================

        let mapUrl =
            "";


        let mapEmbed =
            "";


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


            if (
                Number.isFinite(lat) &&
                Number.isFinite(lng)
            ) {


                mapUrl =
                    `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;


                mapEmbed =
                    `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
            }

        }


        // ====================================================
        // ADRES VARSA HARİTA ARAMASI
        // ====================================================

        if (
            !mapUrl &&
            (
                business.address ||
                business.district
            )
        ) {


            const address =
                [
                    business.name,
                    business.address,
                    business.district,
                    "Trabzon"
                ]
                    .filter(Boolean)
                    .join(", ");


            mapUrl =
                "https://www.google.com/maps/search/?api=1&query=" +
                encodeURIComponent(
                    address
                );
        }


        // ====================================================
        // BUTONLAR
        // ====================================================

        let actions = "";


        // TELEFON

        if (phone) {

            actions += `

                <a
                    class="business-action"
                    href="tel:${escapeHtml(
                        phone
                    )}"
                >

                    📞
                    Telefonla Ara

                </a>

            `;
        }


        // WHATSAPP

        if (whatsappNumber) {

            const whatsappText =
                encodeURIComponent(
                    `Merhaba, ${business.name} hakkında bilgi almak istiyorum.`
                );


            actions += `

                <a
                    class="business-action whatsapp"
                    href="https://wa.me/${escapeHtml(
                        whatsappNumber
                    )}?text=${whatsappText}"
                    target="_blank"
                    rel="noopener noreferrer"
                >

                    💬
                    WhatsApp

                </a>

            `;
        }


        // INSTAGRAM

        if (instagramUrl) {

            actions += `

                <a
                    class="business-action instagram"
                    href="${escapeHtml(
                        instagramUrl
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                >

                    📷
                    Instagram

                </a>

            `;
        }


        // WEB SİTESİ

        if (websiteUrl) {

            actions += `

                <a
                    class="business-action website"
                    href="${escapeHtml(
                        websiteUrl
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                >

                    🌐
                    Web Sitesi

                </a>

            `;
        }


        // HARİTA

        if (mapUrl) {

            actions += `

                <a
                    class="business-action map"
                    href="${escapeHtml(
                        mapUrl
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                >

                    🗺️
                    Yol Tarifi

                </a>

            `;
        }


        // ====================================================
        // HARİTA ALANI
        // ====================================================

        let mapSection =
            "";


        if (mapEmbed) {

            mapSection = `

                <div class="business-map">

                    <iframe
                        src="${escapeHtml(
                            mapEmbed
                        )}"
                        loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"
                        title="${escapeHtml(
                            business.name
                        )} harita"
                    ></iframe>

                </div>

            `;
        }


        // ====================================================
        // PAYLAŞIM
        // ====================================================

        const pageUrl =
            window.location.href;


        // ====================================================
        // SAYFAYI OLUŞTUR
        // ====================================================

        container.innerHTML = `

            <article
                class="business-detail-card"
            >


                <!-- FOTOĞRAF -->

                <div
                    class="business-detail-image-wrap"
                >

                    <img
                        class="business-detail-image"
                        src="${escapeHtml(
                            image
                        )}"
                        alt="${escapeHtml(
                            business.name
                        )}"
                        onerror="
                            this.src='${fallbackImage}'
                        "
                    >


                    <div
                        class="business-image-overlay"
                    ></div>


                    <span
                        class="business-image-category"
                    >

                        ${escapeHtml(
                            categoryIcon
                        )}

                        &nbsp;

                        ${escapeHtml(
                            categoryName
                        )}

                    </span>

                </div>



                <!-- İÇERİK -->

                <div
                    class="business-detail-content"
                >


                    <!-- BAŞLIK -->

                    <h1
                        class="business-detail-title"
                    >

                        ${escapeHtml(
                            business.name
                        )}

                    </h1>


                    <!-- PUAN -->

                    <div
                        class="business-detail-rating"
                    >

                        <span
                            class="rating-main"
                        >

                            ⭐
                            ${escapeHtml(
                                ratingText
                            )}

                        </span>


                        <span>

                            ${
                                business.review_count ||
                                0
                            }

                            değerlendirme

                        </span>

                    </div>


                    <!-- AÇIKLAMA -->

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


                    <!-- BİLGİLER -->

                    <div
                        class="business-info"
                    >


                        ${
                            business.district
                                ? `

                                    <div
                                        class="business-info-item"
                                    >

                                        📍

                                        <span>

                                            <strong>
                                                İlçe:
                                            </strong>

                                            ${escapeHtml(
                                                business.district
                                            )}

                                        </span>

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

                                        <span>

                                            <strong>
                                                Adres:
                                            </strong>

                                            ${escapeHtml(
                                                business.address
                                            )}

                                        </span>

                                    </div>

                                  `
                                : ""
                        }


                        ${
                            phone
                                ? `

                                    <div
                                        class="business-info-item"
                                    >

                                        📞

                                        <span>

                                            <strong>
                                                Telefon:
                                            </strong>

                                            ${escapeHtml(
                                                phone
                                            )}

                                        </span>

                                    </div>

                                  `
                                : ""
                        }


                    </div>


                    <!-- AKSİYONLAR -->

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


                    <!-- PAYLAŞ -->

                    <div
                        class="share-actions"
                    >

                        <button
                            class="share-button"
                            type="button"
                            id="shareBusinessButton"
                        >

                            📤 Paylaş

                        </button>


                        <button
                            class="share-button"
                            type="button"
                            id="copyBusinessButton"
                        >

                            🔗 Linki Kopyala

                        </button>

                    </div>


                    <!-- HARİTA -->

                    ${mapSection}


                </div>

            </article>

        `;


        // ====================================================
        // PAYLAŞ BUTONU
        // ====================================================

        const shareButton =
            document.getElementById(
                "shareBusinessButton"
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
                                    business.name,

                                text:
                                    `${business.name} - Trabzon Anlık`,

                                url:
                                    pageUrl

                            });

                        } else {

                            await copyLink();

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


        // ====================================================
        // LİNK KOPYALA
        // ====================================================

        const copyButton =
            document.getElementById(
                "copyBusinessButton"
            );


        if (copyButton) {

            copyButton.addEventListener(
                "click",
                async () => {

                    const success =
                        await copyLink();


                    if (success) {

                        copyButton.textContent =
                            "✅ Kopyalandı!";


                        setTimeout(
                            () => {

                                copyButton.textContent =
                                    "🔗 Linki Kopyala";

                            },
                            1800
                        );

                    } else {

                        alert(
                            "Link kopyalanamadı."
                        );
                    }

                }
            );
        }


        console.log(
            "İşletme başarıyla yüklendi:",
            business.name
        );


    } catch (error) {


        console.error(
            "İşletme sayfası hatası:",
            error
        );


        showError(
            "İşletme bilgileri yüklenirken beklenmeyen bir hata oluştu."
        );
    }
}


// ============================================================
// LINK KOPYALA
// ============================================================

async function copyLink() {

    try {

        await navigator.clipboard.writeText(
            window.location.href
        );

        return true;

    } catch (error) {

        console.error(
            "Link kopyalama hatası:",
            error
        );

        return false;
    }
}


// ============================================================
// HATA
// ============================================================

function showError(
    message
) {

    container.innerHTML = `

        <div class="error">

            <h2>
                İşletme bulunamadı
            </h2>

            <p>
                ${escapeHtml(
                    message
                )}
            </p>

            <br>

            <a
                href="index.html"
                class="business-action"
            >
                ← Ana Sayfaya Dön
            </a>

        </div>

    `;
}


// ============================================================
// BAŞLAT
// ============================================================

loadBusiness();