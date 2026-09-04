// ============================================================
// TRABZON ANLIK
// İŞLETME EKLEME SİSTEMİ
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


// ------------------------------------------------------------
// ELEMENTLER
// ------------------------------------------------------------

const form =
    document.querySelector("#businessForm");

const categorySelect =
    document.querySelector("#categoryId");

const submitButton =
    document.querySelector("#submitButton");

const formMessage =
    document.querySelector("#formMessage");


// ------------------------------------------------------------
// SAYFA BAŞLANGICI
// ------------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadCategories();

    }
);


// ============================================================
// KATEGORİLERİ GETİR
// ============================================================

async function loadCategories() {

    categorySelect.innerHTML = `
        <option value="">Kategori seçin</option>
    `;

    const {
        data,
        error
    } = await supabaseClient
        .from("categories")
        .select("id, name")
        .order("id", {
            ascending: true
        });

    if (error) {

        console.error("Kategori yükleme hatası:", error);

        showMessage(
            "Kategoriler yüklenemedi. Lütfen sayfayı yenileyin.",
            "error"
        );

        return;
    }

    console.log("Gelen kategoriler:", data);

    if (!data || data.length === 0) {

        showMessage(
            "Supabase'de henüz kategori bulunamadı.",
            "error"
        );

        return;
    }

    data.forEach(category => {

        const option = document.createElement("option");

        option.value = category.id;
        option.textContent = category.name;

        categorySelect.appendChild(option);

    });

}

    const {
        data,
        error
    } = await supabaseClient
        .from("categories")
        .select("id,name")
        .order("id", {
            ascending: true
        });


    if (error) {

        console.error(
            "Kategori yükleme hatası:",
            error
        );

        showMessage(
            "Kategoriler yüklenemedi. Lütfen sayfayı yenileyin.",
            "error"
        );

        return;
    }


    data.forEach(category => {

        const option =
            document.createElement("option");

        option.value =
            category.id;

        option.textContent =
            category.name;

        categorySelect.appendChild(
            option
        );

    });

}


// ============================================================
// FORM GÖNDERME
// ============================================================

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        await submitBusiness();

    }
);


// ============================================================
// İŞLETME BAŞVURUSU
// ============================================================

async function submitBusiness() {

    clearMessage();


    const businessName =
        document
            .querySelector("#businessName")
            .value
            .trim();


    const categoryId =
        document
            .querySelector("#categoryId")
            .value;


    const district =
        document
            .querySelector("#district")
            .value
            .trim();


    const address =
        document
            .querySelector("#address")
            .value
            .trim();


    const description =
        document
            .querySelector("#description")
            .value
            .trim();


    const phone =
        document
            .querySelector("#phone")
            .value
            .trim();


    const website =
        document
            .querySelector("#website")
            .value
            .trim();


    const instagram =
        document
            .querySelector("#instagram")
            .value
            .trim();


    const ownerName =
        document
            .querySelector("#ownerName")
            .value
            .trim();


    const ownerPhone =
        document
            .querySelector("#ownerPhone")
            .value
            .trim();


    const ownerEmail =
        document
            .querySelector("#ownerEmail")
            .value
            .trim();


    const imageInput =
        document.querySelector(
            "#businessImage"
        );


    // --------------------------------------------------------
    // SLUG
    // --------------------------------------------------------

    const slug =
        createUniqueSlug(
            businessName
        );


    // --------------------------------------------------------
    // BUTONU KİLİTLE
    // --------------------------------------------------------

    submitButton.disabled = true;

    submitButton.textContent =
        "Başvuru gönderiliyor...";


    try {

        // ----------------------------------------------------
        // FOTOĞRAF YÜKLE
        // ----------------------------------------------------

        let imageUrl = null;


        if (
            imageInput.files &&
            imageInput.files.length > 0
        ) {

            const file =
                imageInput.files[0];


            if (file.size > 5 * 1024 * 1024) {

                throw new Error(
                    "Fotoğraf boyutu 5 MB'dan büyük olamaz."
                );

            }


            if (
                ![
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ].includes(file.type)
            ) {

                throw new Error(
                    "Sadece JPG, PNG veya WebP fotoğraf yükleyebilirsiniz."
                );

            }


            const fileExtension =
                file.name
                    .split(".")
                    .pop()
                    .toLowerCase();


            const fileName =
                `${crypto.randomUUID()}.${fileExtension}`;


            const filePath =
                `business/${fileName}`;


            const {
                error: uploadError
            } = await supabaseClient
                .storage
                .from("business-images")
                .upload(
                    filePath,
                    file,
                    {
                        cacheControl: "3600",
                        upsert: false
                    }
                );


            if (uploadError) {

                throw uploadError;

            }


            const {
                data: publicData
            } = supabaseClient
                .storage
                .from("business-images")
                .getPublicUrl(
                    filePath
                );


            imageUrl =
                publicData.publicUrl;

        }


        // ----------------------------------------------------
        // İŞLETME KAYDI
        // ----------------------------------------------------

        const {
            error: insertError
        } = await supabaseClient
            .from("businesses")
            .insert({

                name: businessName,

                slug: slug,

                category_id:
                    Number(categoryId),

                description:
                    description || null,

                address:
                    address || null,

                district:
                    district,

                phone:
                    phone || null,

                website:
                    website || null,

                instagram:
                    instagram || null,

                image_url:
                    imageUrl,

                owner_name:
                    ownerName,

                owner_phone:
                    ownerPhone,

                owner_email:
                    ownerEmail || null,

                is_approved:
                    false,

                is_featured:
                    false

            });


        if (insertError) {

            throw insertError;

        }


        // ----------------------------------------------------
        // BAŞARILI
        // ----------------------------------------------------

        showMessage(
            `
            <strong>Başvurunuz başarıyla alındı! 🎉</strong>
            <br><br>
            İşletme bilgileriniz ekibimiz tarafından
            incelenecek. Onaylandıktan sonra
            Trabzon Anlık'ta yayınlanacaktır.
            `,
            "success"
        );


        form.reset();


    } catch (error) {

        console.error(
            "İşletme başvuru hatası:",
            error
        );


        showMessage(
            `
            Başvuru gönderilemedi.
            <br><br>
            Lütfen bilgileri kontrol edip tekrar deneyin.
            `,
            "error"
        );

    } finally {

        submitButton.disabled =
            false;

        submitButton.textContent =
            "İşletme Başvurusu Gönder";

    }

}


// ============================================================
// SLUG OLUŞTUR
// ============================================================

function createUniqueSlug(name) {

    return name
        .toLowerCase()
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        + "-"
        + Date.now();

}


// ============================================================
// MESAJ
// ============================================================

function showMessage(
    message,
    type
) {

    formMessage.innerHTML =
        message;

    formMessage.className =
        `form-message ${type}`;

    formMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


function clearMessage() {

    formMessage.innerHTML =
        "";

    formMessage.className =
        "form-message";

}
