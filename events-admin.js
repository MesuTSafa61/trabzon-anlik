// ============================================================
// TRABZON ANLIK - ETKİNLİK YÖNETİMİ
// ============================================================
// events-admin.js
// ============================================================

(function () {
    "use strict";

    // ============================================================
    // SUPABASE
    // ============================================================

    const SUPABASE_URL =
        "https://yhunhkzsecppbnhjewrt.supabase.co";

    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_0h5ycfDBJjgdf6bXlZ9OEg_K45u2b2v";

    let eventsSupabase = null;

    function getSupabase() {
        if (eventsSupabase) {
            return eventsSupabase;
        }

        if (typeof supabaseClient !== "undefined" && supabaseClient) {
            eventsSupabase = supabaseClient;
            return eventsSupabase;
        }

        if (
            window.supabaseClient &&
            typeof window.supabaseClient.from === "function"
        ) {
            eventsSupabase = window.supabaseClient;
            return eventsSupabase;
        }

        if (
            typeof supabase !== "undefined" &&
            supabase &&
            typeof supabase.createClient === "function"
        ) {
            eventsSupabase = supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY
            );

            return eventsSupabase;
        }

        console.error("Supabase bağlantısı bulunamadı.");
        return null;
    }

    // ============================================================
    // GENEL YARDIMCILAR
    // ============================================================

    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDate(dateValue) {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue + "T00:00:00");

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    function formatTime(timeValue) {
        if (!timeValue) {
            return "";
        }

        return String(timeValue).slice(0, 5);
    }

    function isPastEvent(event) {
        if (!event || !event.event_date) {
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const eventDate = new Date(
            event.event_date + "T00:00:00"
        );

        return eventDate < today;
    }

    function showMessage(message, type) {
        const existing = document.getElementById(
            "eventsAdminMessage"
        );

        if (!existing) {
            return;
        }

        existing.textContent = message;
        existing.className =
            "events-admin-message " +
            (type || "info");

        clearTimeout(
            showMessage.timeout
        );

        showMessage.timeout = setTimeout(function () {
            existing.textContent = "";
            existing.className =
                "events-admin-message";
        }, 3500);
    }

    // ============================================================
    // SAYFA BAŞLIĞI
    // ============================================================

    function updateTopbarTitle() {
        const possibleSelectors = [
            "#topbarTitle",
            "#pageTitle",
            ".topbar-title",
            ".page-title"
        ];

        for (const selector of possibleSelectors) {
            const element =
                document.querySelector(selector);

            if (element) {
                element.textContent = "Etkinlikler";
                return;
            }
        }

        const headings =
            document.querySelectorAll(
                "header h1, header h2, .topbar h1, .topbar h2"
            );

        headings.forEach(function (heading) {
            const text =
                heading.textContent.trim();

            if (
                text === "Dashboard" ||
                text === "Yönetim Paneli"
            ) {
                heading.textContent = "Etkinlikler";
            }
        });
    }

    // ============================================================
    // HTML
    // ============================================================

    function renderPage() {
        const section =
            document.getElementById(
                "section-events"
            );

        if (!section) {
            console.warn(
                "section-events bulunamadı."
            );
            return;
        }

        section.innerHTML = `
            <div class="section-header">
                <div>
                    <h2>🎉 Etkinlikler</h2>
                    <p>
                        Trabzon'daki etkinlikleri buradan yönetebilirsin.
                    </p>
                </div>
            </div>

            <div class="events-admin-toolbar">

                <div class="events-admin-search">
                    <input
                        type="text"
                        id="eventsSearch"
                        placeholder="Etkinlik ara..."
                    >
                </div>

                <div class="events-admin-filters">

                    <select id="eventsStatusFilter">
                        <option value="all">
                            Tüm durumlar
                        </option>

                        <option value="approved">
                            Yayında
                        </option>

                        <option value="pending">
                            Bekliyor
                        </option>
                    </select>

                    <select id="eventsDateFilter">
                        <option value="all">
                            Tüm tarihler
                        </option>

                        <option value="upcoming">
                            Yaklaşan
                        </option>

                        <option value="past">
                            Geçmiş
                        </option>
                    </select>

                    <button
                        type="button"
                        class="refresh-btn"
                        id="eventsAddButton"
                    >
                        + Yeni Etkinlik
                    </button>

                </div>
            </div>

            <div
                id="eventsAdminMessage"
                class="events-admin-message"
            ></div>

            <div
                id="eventsList"
                class="events-admin-list"
            ></div>
        `;

        attachEvents();

        loadEvents();
    }

    // ============================================================
    // EVENT LISTENER
    // ============================================================

    function attachEvents() {
        const search =
            document.getElementById(
                "eventsSearch"
            );

        const status =
            document.getElementById(
                "eventsStatusFilter"
            );

        const date =
            document.getElementById(
                "eventsDateFilter"
            );

        const addButton =
            document.getElementById(
                "eventsAddButton"
            );

        if (search) {
            search.addEventListener(
                "input",
                renderFilteredEvents
            );
        }

        if (status) {
            status.addEventListener(
                "change",
                renderFilteredEvents
            );
        }

        if (date) {
            date.addEventListener(
                "change",
                renderFilteredEvents
            );
        }

        if (addButton) {
            addButton.addEventListener(
                "click",
                function () {
                    openEventModal();
                }
            );
        }
    }

    // ============================================================
    // VERİ
    // ============================================================

    let allEvents = [];

    async function loadEvents() {
        const client = getSupabase();

        if (!client) {
            showMessage(
                "Supabase bağlantısı bulunamadı.",
                "error"
            );
            return;
        }

        const list =
            document.getElementById(
                "eventsList"
            );

        if (list) {
            list.innerHTML = `
                <div class="events-loading">
                    Etkinlikler yükleniyor...
                </div>
            `;
        }

        try {
            const result =
                await client
                    .from("events")
                    .select("*")
                    .order(
                        "event_date",
                        {
                            ascending: true
                        }
                    )
                    .order(
                        "event_time",
                        {
                            ascending: true
                        }
                    );

            if (result.error) {
                console.error(
                    "Etkinlik yükleme hatası:",
                    result.error
                );

                throw result.error;
            }

            allEvents =
                Array.isArray(result.data)
                    ? result.data
                    : [];

            renderFilteredEvents();

        } catch (error) {
            console.error(error);

            if (list) {
                list.innerHTML = `
                    <div class="events-empty">
                        <strong>Etkinlikler yüklenemedi.</strong>
                        <br>
                        <span>
                            ${escapeHtml(
                                error.message ||
                                "Bilinmeyen hata"
                            )}
                        </span>
                    </div>
                `;
            }

            showMessage(
                "Etkinlikler yüklenirken hata oluştu.",
                "error"
            );
        }
    }

    // ============================================================
    // FİLTRE
    // ============================================================

    function renderFilteredEvents() {
        const searchInput =
            document.getElementById(
                "eventsSearch"
            );

        const statusFilter =
            document.getElementById(
                "eventsStatusFilter"
            );

        const dateFilter =
            document.getElementById(
                "eventsDateFilter"
            );

        const searchText =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLocaleLowerCase("tr-TR")
                : "";

        const status =
            statusFilter
                ? statusFilter.value
                : "all";

        const date =
            dateFilter
                ? dateFilter.value
                : "all";

        const filtered =
            allEvents.filter(function (event) {

                const searchableText = [
                    event.title,
                    event.category,
                    event.venue,
                    event.district,
                    event.address,
                    event.description
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLocaleLowerCase("tr-TR");

                if (
                    searchText &&
                    !searchableText.includes(
                        searchText
                    )
                ) {
                    return false;
                }

                if (
                    status === "approved" &&
                    event.is_approved !== true
                ) {
                    return false;
                }

                if (
                    status === "pending" &&
                    event.is_approved !== false
                ) {
                    return false;
                }

                if (
                    date === "upcoming" &&
                    isPastEvent(event)
                ) {
                    return false;
                }

                if (
                    date === "past" &&
                    !isPastEvent(event)
                ) {
                    return false;
                }

                return true;
            });

        renderEvents(filtered);
    }

    // ============================================================
    // LİSTE
    // ============================================================

    function renderEvents(events) {
        const list =
            document.getElementById(
                "eventsList"
            );

        if (!list) {
            return;
        }

        if (!events.length) {
            list.innerHTML = `
                <div class="events-empty">
                    Henüz etkinlik bulunmuyor.
                </div>
            `;

            return;
        }

        list.innerHTML =
            events.map(
                renderEventCard
            ).join("");
    }

    function renderEventCard(event) {
        const past =
            isPastEvent(event);

        const statusBadge =
            event.is_approved
                ? `
                    <span class="badge badge-green">
                        ✓ Yayında
                    </span>
                `
                : `
                    <span class="badge badge-yellow">
                        ⏳ Bekliyor
                    </span>
                `;

        const featuredBadge =
            event.is_featured
                ? `
                    <span class="badge badge-blue">
                        ⭐ Öne Çıkan
                    </span>
                `
                : "";

        const pastBadge =
            past
                ? `
                    <span class="badge badge-red">
                        Geçmiş
                    </span>
                `
                : "";

        const imageHtml =
            event.image_url
                ? `
                    <div class="event-admin-image">
                        <img
                            src="${escapeHtml(
                                event.image_url
                            )}"
                            alt="${escapeHtml(
                                event.title
                            )}"
                            loading="lazy"
                            onerror="this.style.display='none';"
                        >
                    </div>
                `
                : "";

        const timeText = [
            formatTime(
                event.event_time
            ),
            formatTime(
                event.end_time
            )
                ? " - " +
                  formatTime(
                      event.end_time
                  )
                : ""
        ].join("");

        const locationParts = [
            event.venue,
            event.district
        ].filter(Boolean);

        const ticketHtml =
            event.ticket_url
                ? `
                    <a
                        href="${escapeHtml(
                            event.ticket_url
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="event-ticket-link"
                    >
                        🎟 Bilet / Kayıt
                    </a>
                `
                : "";

        const phoneHtml =
            event.contact_phone
                ? `
                    <div>
                        📞
                        ${escapeHtml(
                            event.contact_phone
                        )}
                    </div>
                `
                : "";

        const description =
            event.description
                ? `
                    <div class="event-admin-description">
                        ${escapeHtml(
                            event.description
                        )}
                    </div>
                `
                : "";

        return `
            <article
                class="business-card event-admin-card"
                data-event-id="${escapeHtml(
                    event.id
                )}"
            >

                ${imageHtml}

                <div class="business-top">

                    <div>
                        <div class="business-title">
                            ${escapeHtml(
                                event.title
                            )}
                        </div>

                        <div class="business-meta">
                            ${
                                event.category
                                    ? escapeHtml(
                                        event.category
                                    )
                                    : "Etkinlik"
                            }
                        </div>
                    </div>

                    <div class="badges">
                        ${statusBadge}
                        ${featuredBadge}
                        ${pastBadge}
                    </div>

                </div>

                <div class="business-info">

                    <div>
                        📅
                        ${formatDate(
                            event.event_date
                        )}
                        ${
                            timeText
                                ? " • 🕐 " +
                                  escapeHtml(
                                      timeText
                                  )
                                : ""
                        }
                    </div>

                    ${
                        locationParts.length
                            ? `
                                <div>
                                    📍
                                    ${escapeHtml(
                                        locationParts.join(
                                            " • "
                                        )
                                    )}
                                </div>
                            `
                            : ""
                    }

                    ${
                        event.address
                            ? `
                                <div>
                                    🏠
                                    ${escapeHtml(
                                        event.address
                                    )}
                                </div>
                            `
                            : ""
                    }

                    ${phoneHtml}

                    ${ticketHtml}

                    ${description}

                </div>

                <div class="business-actions">

                    <button
                        type="button"
                        class="action-btn btn-blue"
                        onclick="editEvent('${escapeHtml(
                            event.id
                        )}')"
                    >
                        ✏️ Düzenle
                    </button>

                    <button
                        type="button"
                        class="action-btn ${
                            event.is_approved
                                ? "btn-yellow"
                                : "btn-green"
                        }"
                        onclick="toggleEventApproval(
                            '${escapeHtml(
                                event.id
                            )}',
                            ${event.is_approved ? "false" : "true"}
                        )"
                    >
                        ${
                            event.is_approved
                                ? "⏸ Yayından Kaldır"
                                : "✓ Yayına Al"
                        }
                    </button>

                    <button
                        type="button"
                        class="action-btn ${
                            event.is_featured
                                ? "btn-yellow"
                                : "btn-blue"
                        }"
                        onclick="toggleEventFeatured(
                            '${escapeHtml(
                                event.id
                            )}',
                            ${event.is_featured ? "false" : "true"}
                        )"
                    >
                        ${
                            event.is_featured
                                ? "⭐ Öne Çıkanı Kaldır"
                                : "⭐ Öne Çıkar"
                        }
                    </button>

                    <button
                        type="button"
                        class="action-btn btn-red"
                        onclick="deleteEvent(
                            '${escapeHtml(
                                event.id
                            )}'
                        )"
                    >
                        🗑 Sil
                    </button>

                </div>

            </article>
        `;
    }

    // ============================================================
    // MODAL
    // ============================================================

    let editingEventId = null;

    function createModal() {
        let modal =
            document.getElementById(
                "eventAdminModal"
            );

        if (modal) {
            return modal;
        }

        modal =
            document.createElement("div");

        modal.id =
            "eventAdminModal";

        modal.className =
            "modal-overlay";

        modal.innerHTML = `
            <div class="edit-modal event-admin-modal">

                <div class="modal-header">

                    <div>
                        <h3 id="eventModalTitle">
                            Yeni Etkinlik
                        </h3>

                        <p>
                            Etkinlik bilgilerini doldur.
                        </p>
                    </div>

                    <button
                        type="button"
                        class="modal-close"
                        id="eventModalClose"
                    >
                        ×
                    </button>

                </div>

                <div class="modal-body">

                    <div class="edit-form-grid">

                        <div>
                            <label>
                                Etkinlik adı *
                            </label>

                            <input
                                type="text"
                                id="eventTitle"
                                required
                                placeholder="Örn. Trabzon Konser Akşamı"
                            >
                        </div>

                        <div>
                            <label>
                                Kategori
                            </label>

                            <select id="eventCategory">

                                <option value="">
                                    Kategori seç
                                </option>

                                <option value="Konser">
                                    Konser
                                </option>

                                <option value="Tiyatro">
                                    Tiyatro
                                </option>

                                <option value="Spor">
                                    Spor
                                </option>

                                <option value="Festival">
                                    Festival
                                </option>

                                <option value="Sergi">
                                    Sergi
                                </option>

                                <option value="Seminer">
                                    Seminer
                                </option>

                                <option value="Çocuk">
                                    Çocuk
                                </option>

                                <option value="Diğer">
                                    Diğer
                                </option>

                            </select>
                        </div>

                        <div>
                            <label>
                                İlçe
                            </label>

                            <input
                                type="text"
                                id="eventDistrict"
                                placeholder="Örn. Ortahisar"
                            >
                        </div>

                        <div>
                            <label>
                                Tarih *
                            </label>

                            <input
                                type="date"
                                id="eventDate"
                                required
                            >
                        </div>

                        <div>
                            <label>
                                Başlangıç saati
                            </label>

                            <input
                                type="time"
                                id="eventTime"
                            >
                        </div>

                        <div>
                            <label>
                                Bitiş saati
                            </label>

                            <input
                                type="time"
                                id="eventEndTime"
                            >
                        </div>

                        <div>
                            <label>
                                Mekân
                            </label>

                            <input
                                type="text"
                                id="eventVenue"
                                placeholder="Örn. Trabzon Meydan"
                            >
                        </div>

                        <div>
                            <label>
                                Adres
                            </label>

                            <input
                                type="text"
                                id="eventAddress"
                                placeholder="Açık adres"
                            >
                        </div>

                        <div>
                            <label>
                                İletişim telefonu
                            </label>

                            <input
                                type="tel"
                                id="eventPhone"
                                placeholder="0462..."
                            >
                        </div>

                        <div>
                            <label>
                                Bilet / kayıt linki
                            </label>

                            <input
                                type="url"
                                id="eventTicketUrl"
                                placeholder="https://..."
                            >
                        </div>

                        <div class="full-width">
                            <label>
                                Görsel URL
                            </label>

                            <input
                                type="url"
                                id="eventImageUrl"
                                placeholder="https://..."
                            >

                            <small>
                                Görsel yükleme sistemi sonraki aşamada
                                ayrı etkinlik görsel alanı olarak eklenecek.
                            </small>
                        </div>

                        <div class="full-width">
                            <label>
                                Açıklama
                            </label>

                            <textarea
                                id="eventDescription"
                                rows="6"
                                placeholder="Etkinlik hakkında bilgi..."
                            ></textarea>
                        </div>

                        <div class="event-modal-checks">

                            <label>
                                <input
                                    type="checkbox"
                                    id="eventApproved"
                                >
                                Yayında
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    id="eventFeatured"
                                >
                                Öne çıkar
                            </label>

                        </div>

                    </div>

                </div>

                <div class="modal-footer">

                    <button
                        type="button"
                        class="modal-btn cancel-btn"
                        id="eventModalCancel"
                    >
                        İptal
                    </button>

                    <button
                        type="button"
                        class="modal-btn save-btn"
                        id="eventModalSave"
                    >
                        Kaydet
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(modal);

        document
            .getElementById(
                "eventModalClose"
            )
            .addEventListener(
                "click",
                closeEventModal
            );

        document
            .getElementById(
                "eventModalCancel"
            )
            .addEventListener(
                "click",
                closeEventModal
            );

        document
            .getElementById(
                "eventModalSave"
            )
            .addEventListener(
                "click",
                saveEvent
            );

        modal.addEventListener(
            "click",
            function (e) {
                if (
                    e.target === modal
                ) {
                    closeEventModal();
                }
            }
        );

        return modal;
    }

    function openEventModal(event) {
        const modal =
            createModal();

        editingEventId =
            event && event.id
                ? event.id
                : null;

        const title =
            document.getElementById(
                "eventModalTitle"
            );

        if (title) {
            title.textContent =
                editingEventId
                    ? "Etkinliği Düzenle"
                    : "Yeni Etkinlik";
        }

        setInputValue(
            "eventTitle",
            event
                ? event.title
                : ""
        );

        setInputValue(
            "eventCategory",
            event
                ? event.category
                : ""
        );

        setInputValue(
            "eventDistrict",
            event
                ? event.district
                : ""
        );

        setInputValue(
            "eventDate",
            event
                ? event.event_date
                : ""
        );

        setInputValue(
            "eventTime",
            event
                ? formatTime(
                    event.event_time
                )
                : ""
        );

        setInputValue(
            "eventEndTime",
            event
                ? formatTime(
                    event.end_time
                )
                : ""
        );

        setInputValue(
            "eventVenue",
            event
                ? event.venue
                : ""
        );

        setInputValue(
            "eventAddress",
            event
                ? event.address
                : ""
        );

        setInputValue(
            "eventPhone",
            event
                ? event.contact_phone
                : ""
        );

        setInputValue(
            "eventTicketUrl",
            event
                ? event.ticket_url
                : ""
        );

        setInputValue(
            "eventImageUrl",
            event
                ? event.image_url
                : ""
        );

        setInputValue(
            "eventDescription",
            event
                ? event.description
                : ""
        );

        setCheckboxValue(
            "eventApproved",
            event
                ? event.is_approved === true
                : false
        );

        setCheckboxValue(
            "eventFeatured",
            event
                ? event.is_featured === true
                : false
        );

        modal.classList.add(
            "open"
        );

        document.body.classList.add(
            "modal-open"
        );
    }

    function closeEventModal() {
        const modal =
            document.getElementById(
                "eventAdminModal"
            );

        if (modal) {
            modal.classList.remove(
                "open"
            );
        }

        document.body.classList.remove(
            "modal-open"
        );

        editingEventId = null;
    }

    function setInputValue(
        id,
        value
    ) {
        const element =
            document.getElementById(id);

        if (element) {
            element.value =
                value || "";
        }
    }

    function setCheckboxValue(
        id,
        value
    ) {
        const element =
            document.getElementById(id);

        if (element) {
            element.checked =
                Boolean(value);
        }
    }

    function getInputValue(id) {
        const element =
            document.getElementById(id);

        return element
            ? element.value.trim()
            : "";
    }

    function getCheckboxValue(id) {
        const element =
            document.getElementById(id);

        return element
            ? element.checked
            : false;
    }

    // ============================================================
    // KAYDET
    // ============================================================

    async function saveEvent() {
        const client =
            getSupabase();

        if (!client) {
            showMessage(
                "Supabase bağlantısı bulunamadı.",
                "error"
            );
            return;
        }

        const title =
            getInputValue(
                "eventTitle"
            );

        const eventDate =
            getInputValue(
                "eventDate"
            );

        if (!title) {
            alert(
                "Lütfen etkinlik adını gir."
            );
            return;
        }

        if (!eventDate) {
            alert(
                "Lütfen etkinlik tarihini seç."
            );
            return;
        }

        const payload = {
            title: title,
            description:
                getInputValue(
                    "eventDescription"
                ) || null,

            category:
                getInputValue(
                    "eventCategory"
                ) || null,

            event_date:
                eventDate,

            event_time:
                getInputValue(
                    "eventTime"
                ) || null,

            end_time:
                getInputValue(
                    "eventEndTime"
                ) || null,

            venue:
                getInputValue(
                    "eventVenue"
                ) || null,

            district:
                getInputValue(
                    "eventDistrict"
                ) || null,

            address:
                getInputValue(
                    "eventAddress"
                ) || null,

            image_url:
                getInputValue(
                    "eventImageUrl"
                ) || null,

            ticket_url:
                getInputValue(
                    "eventTicketUrl"
                ) || null,

            contact_phone:
                getInputValue(
                    "eventPhone"
                ) || null,

            is_approved:
                getCheckboxValue(
                    "eventApproved"
                ),

            is_featured:
                getCheckboxValue(
                    "eventFeatured"
                )
        };

        const saveButton =
            document.getElementById(
                "eventModalSave"
            );

        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent =
                "Kaydediliyor...";
        }

        try {
            let result;

            if (editingEventId) {
                result =
                    await client
                        .from("events")
                        .update(payload)
                        .eq(
                            "id",
                            editingEventId
                        );
            } else {
                result =
                    await client
                        .from("events")
                        .insert(
                            payload
                        );
            }

            if (result.error) {
                throw result.error;
            }

            closeEventModal();

            showMessage(
                editingEventId
                    ? "Etkinlik güncellendi."
                    : "Etkinlik oluşturuldu.",
                "success"
            );

            await loadEvents();

        } catch (error) {
            console.error(
                "Etkinlik kayıt hatası:",
                error
            );

            showMessage(
                error.message ||
                "Etkinlik kaydedilemedi.",
                "error"
            );

        } finally {
            if (saveButton) {
                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "Kaydet";
            }
        }
    }

    // ============================================================
    // DÜZENLE
    // ============================================================

    window.editEvent =
        function (id) {
            const event =
                allEvents.find(
                    function (item) {
                        return (
                            String(
                                item.id
                            ) ===
                            String(id)
                        );
                    }
                );

            if (!event) {
                alert(
                    "Etkinlik bulunamadı."
                );
                return;
            }

            openEventModal(
                event
            );
        };

    // ============================================================
    // YAYIN DURUMU
    // ============================================================

    window.toggleEventApproval =
        async function (
            id,
            newValue
        ) {
            const client =
                getSupabase();

            if (!client) {
                return;
            }

            const approved =
                newValue === true ||
                newValue === "true";

            try {
                const result =
                    await client
                        .from("events")
                        .update({
                            is_approved:
                                approved
                        })
                        .eq(
                            "id",
                            id
                        );

                if (result.error) {
                    throw result.error;
                }

                showMessage(
                    approved
                        ? "Etkinlik yayına alındı."
                        : "Etkinlik yayından kaldırıldı.",
                    "success"
                );

                await loadEvents();

            } catch (error) {
                console.error(
                    error
                );

                showMessage(
                    error.message ||
                    "İşlem başarısız.",
                    "error"
                );
            }
        };

    // ============================================================
    // ÖNE ÇIKAR
    // ============================================================

    window.toggleEventFeatured =
        async function (
            id,
            newValue
        ) {
            const client =
                getSupabase();

            if (!client) {
                return;
            }

            const featured =
                newValue === true ||
                newValue === "true";

            try {
                const result =
                    await client
                        .from("events")
                        .update({
                            is_featured:
                                featured
                        })
                        .eq(
                            "id",
                            id
                        );

                if (result.error) {
                    throw result.error;
                }

                showMessage(
                    featured
                        ? "Etkinlik öne çıkarıldı."
                        : "Etkinlik öne çıkanlardan kaldırıldı.",
                    "success"
                );

                await loadEvents();

            } catch (error) {
                console.error(
                    error
                );

                showMessage(
                    error.message ||
                    "İşlem başarısız.",
                    "error"
                );
            }
        };

    // ============================================================
    // SİL
    // ============================================================

    window.deleteEvent =
        async function (id) {
            const event =
                allEvents.find(
                    function (item) {
                        return (
                            String(
                                item.id
                            ) ===
                            String(id)
                        );
                    }
                );

            const eventName =
                event &&
                event.title
                    ? event.title
                    : "Bu etkinlik";

            const confirmed =
                confirm(
                    `"${eventName}" etkinliğini silmek istediğine emin misin?`
                );

            if (!confirmed) {
                return;
            }

            const client =
                getSupabase();

            if (!client) {
                return;
            }

            try {
                const result =
                    await client
                        .from("events")
                        .delete()
                        .eq(
                            "id",
                            id
                        );

                if (result.error) {
                    throw result.error;
                }

                showMessage(
                    "Etkinlik silindi.",
                    "success"
                );

                await loadEvents();

            } catch (error) {
                console.error(
                    "Etkinlik silme hatası:",
                    error
                );

                showMessage(
                    error.message ||
                    "Etkinlik silinemedi.",
                    "error"
                );
            }
        };

    // ============================================================
    // CSS
    // ============================================================

    function injectStyles() {
        if (
            document.getElementById(
                "eventsAdminStyles"
            )
        ) {
            return;
        }

        const style =
            document.createElement(
                "style"
            );

        style.id =
            "eventsAdminStyles";

        style.textContent = `
            .events-admin-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 15px;
                margin: 20px 0;
                flex-wrap: wrap;
            }

            .events-admin-search {
                flex: 1;
                min-width: 220px;
            }

            .events-admin-search input {
                width: 100%;
                box-sizing: border-box;
                padding: 12px 15px;
                border: 1px solid #e7e9ee;
                border-radius: 12px;
                font-size: 14px;
                background: #fff;
            }

            .events-admin-filters {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }

            .events-admin-filters select {
                padding: 11px 13px;
                border: 1px solid #e7e9ee;
                border-radius: 12px;
                background: #fff;
                font-size: 14px;
            }

            .events-admin-message {
                min-height: 20px;
                margin: 8px 0 15px;
                font-size: 14px;
            }

            .events-admin-message.success {
                color: #167c45;
            }

            .events-admin-message.error {
                color: #b42318;
            }

            .events-admin-message.info {
                color: #536070;
            }

            .events-admin-list {
                display: grid;
                gap: 16px;
            }

            .event-admin-card {
                position: relative;
            }

            .event-admin-image {
                width: 100%;
                max-height: 280px;
                overflow: hidden;
                border-radius: 14px;
                margin-bottom: 16px;
                background: #f3f4f6;
            }

            .event-admin-image img {
                width: 100%;
                height: 280px;
                object-fit: cover;
                display: block;
            }

            .event-admin-description {
                margin-top: 12px;
                padding: 12px;
                background: #f7f8fa;
                border-radius: 10px;
                line-height: 1.6;
                white-space: pre-line;
            }

            .event-ticket-link {
                display: inline-block;
                margin-top: 8px;
                color: #7b1830;
                font-weight: 700;
                text-decoration: none;
            }

            .events-loading,
            .events-empty {
                padding: 35px 20px;
                text-align: center;
                background: #fff;
                border: 1px solid #e7e9ee;
                border-radius: 16px;
                color: #70798b;
            }

            .event-modal-checks {
                grid-column: 1 / -1;
                display: flex;
                gap: 25px;
                flex-wrap: wrap;
                padding-top: 5px;
            }

            .event-modal-checks label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
            }

            .event-modal-checks input {
                width: 18px;
                height: 18px;
            }

            .event-admin-modal {
                max-width: 850px;
                width: calc(100% - 30px);
                max-height: 90vh;
                overflow-y: auto;
            }

            body.modal-open {
                overflow: hidden;
            }

            @media (max-width: 700px) {
                .events-admin-toolbar {
                    align-items: stretch;
                }

                .events-admin-search {
                    min-width: 100%;
                }

                .events-admin-filters {
                    width: 100%;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                }

                .events-admin-filters select {
                    width: 100%;
                }

                .events-admin-filters .refresh-btn {
                    grid-column: 1 / -1;
                    width: 100%;
                }

                .event-admin-image img {
                    height: 210px;
                }

                .business-actions {
                    display: grid;
                    grid-template-columns: 1fr;
                }

                .business-actions .action-btn {
                    width: 100%;
                }
            }
        `;

        document.head.appendChild(
            style
        );
    }

    // ============================================================
    // MENÜ
    // ============================================================

    function setupMenuTitle() {
        const menuButton =
            document.querySelector(
                '[data-section="events"]'
            );

        if (!menuButton) {
            return;
        }

        menuButton.addEventListener(
            "click",
            function () {
                setTimeout(
                    updateTopbarTitle,
                    50
                );
            }
        );
    }

    // ============================================================
    // BAŞLAT
    // ============================================================

    function initEventsAdmin() {
        const section =
            document.getElementById(
                "section-events"
            );

        if (!section) {
            return;
        }

        injectStyles();

        renderPage();

        setupMenuTitle();

        updateTopbarTitle();
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initEventsAdmin
        );
    } else {
        initEventsAdmin();
    }

})();