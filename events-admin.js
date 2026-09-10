// ============================================================
// TRABZON ANLIK - ETKİNLİK YÖNETİMİ
// ============================================================

(function () {
    "use strict";

    const EVENTS_TABLE = "events";

    let eventsData = [];
    let editingEventId = null;

    // ============================================================
    // SUPABASE
    // ============================================================

    function getSupabase() {
        if (typeof supabaseClient !== "undefined" && supabaseClient) {
            return supabaseClient;
        }

        if (
            typeof window.supabaseClient !== "undefined" &&
            window.supabaseClient
        ) {
            return window.supabaseClient;
        }

        if (
            typeof supabase !== "undefined" &&
            supabase.createClient
        ) {
            const SUPABASE_URL =
                "https://yhunhkzsecppbnhjewrt.supabase.co";

            const SUPABASE_PUBLISHABLE_KEY =
                "sb_publishable_0h5ycfDBJjgdf6bXlZ9OEg_K45u2b2v";

            return supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY
            );
        }

        return null;
    }

    // ============================================================
    // YARDIMCI
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

    function formatDate(dateString) {
        if (!dateString) {
            return "-";
        }

        const date = new Date(
            dateString + "T00:00:00"
        );

        if (isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString(
            "tr-TR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );
    }

    function formatTime(timeString) {
        if (!timeString) {
            return "";
        }

        return String(timeString).slice(0, 5);
    }

    function isPastEvent(eventDate) {
        if (!eventDate) {
            return false;
        }

        const today =
            new Date().toISOString().split("T")[0];

        return eventDate < today;
    }

    function showMessage(message, type) {
        const box =
            document.getElementById(
                "eventsAdminMessage"
            );

        if (!box) {
            return;
        }

        box.textContent = message;

        box.style.display = "block";

        if (type === "success") {
            box.style.background = "#dcfce7";
            box.style.color = "#166534";
        } else if (type === "error") {
            box.style.background = "#fee2e2";
            box.style.color = "#991b1b";
        } else {
            box.style.background = "#dbeafe";
            box.style.color = "#1e40af";
        }

        setTimeout(function () {
            box.style.display = "none";
        }, 4000);
    }

    // ============================================================
    // HTML
    // ============================================================

    function createEventsInterface() {
        const section =
            document.getElementById(
                "section-events"
            );

        if (!section) {
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

                <button
                    type="button"
                    class="refresh-btn"
                    id="eventsRefreshBtn"
                >
                    🔄 Yenile
                </button>
            </div>

            <div
                id="eventsAdminMessage"
                style="
                    display:none;
                    padding:12px 15px;
                    border-radius:10px;
                    margin-bottom:18px;
                    font-size:14px;
                    font-weight:700;
                "
            ></div>

            <div
                style="
                    background:#fff;
                    border:1px solid #e5e7eb;
                    border-radius:15px;
                    padding:20px;
                    margin-bottom:20px;
                "
            >
                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:15px;
                        flex-wrap:wrap;
                        margin-bottom:15px;
                    "
                >
                    <div>
                        <strong style="font-size:18px;">
                            Etkinlik Yönetimi
                        </strong>

                        <div
                            style="
                                color:#6b7280;
                                font-size:13px;
                                margin-top:4px;
                            "
                        >
                            Yeni etkinlik oluştur, düzenle ve yayın durumunu yönet.
                        </div>
                    </div>

                    <button
                        type="button"
                        class="action-btn btn-blue"
                        id="newEventBtn"
                    >
                        ➕ Yeni Etkinlik
                    </button>
                </div>

                <div
                    style="
                        display:grid;
                        grid-template-columns:2fr 1fr 1fr;
                        gap:12px;
                    "
                    class="events-filter-grid"
                >
                    <input
                        id="eventsSearch"
                        class="form-control"
                        type="text"
                        placeholder="🔍 Etkinlik ara..."
                    >

                    <select
                        id="eventsStatusFilter"
                        class="form-control"
                    >
                        <option value="">
                            Tüm Durumlar
                        </option>
                        <option value="approved">
                            🟢 Yayında
                        </option>
                        <option value="pending">
                            🟡 Bekliyor
                        </option>
                    </select>

                    <select
                        id="eventsDateFilter"
                        class="form-control"
                    >
                        <option value="">
                            Tüm Tarihler
                        </option>
                        <option value="upcoming">
                            📅 Yaklaşan
                        </option>
                        <option value="past">
                            🕘 Geçmiş
                        </option>
                    </select>
                </div>
            </div>

            <div id="eventsList">
                <div class="loading">
                    Etkinlikler yükleniyor...
                </div>
            </div>
        `;

        createEventModal();

        bindEventsInterface();

        loadEvents();
    }

    // ============================================================
    // MODAL
    // ============================================================

    function createEventModal() {
        if (
            document.getElementById(
                "eventAdminModal"
            )
        ) {
            return;
        }

        const modal =
            document.createElement("div");

        modal.id = "eventAdminModal";

        modal.className = "modal-overlay";

        modal.innerHTML = `
            <div class="edit-modal">

                <div class="modal-header">
                    <h3 id="eventModalTitle">
                        🎉 Yeni Etkinlik
                    </h3>

                    <button
                        type="button"
                        class="modal-close"
                        id="closeEventModal"
                    >
                        ×
                    </button>
                </div>

                <form id="eventForm">

                    <div class="modal-body">

                        <div class="edit-form-grid">

                            <div class="form-group full-width">
                                <label>
                                    Etkinlik Adı *
                                </label>

                                <input
                                    id="eventTitle"
                                    class="form-control"
                                    required
                                    maxlength="200"
                                    placeholder="Örn. Trabzon Konser Gecesi"
                                >
                            </div>

                            <div class="form-group">
                                <label>
                                    Kategori
                                </label>

                                <select
                                    id="eventCategory"
                                    class="form-control"
                                >
                                    <option value="">
                                        Kategori seç
                                    </option>
                                    <option value="Konser">
                                        🎵 Konser
                                    </option>
                                    <option value="Tiyatro">
                                        🎭 Tiyatro
                                    </option>
                                    <option value="Spor">
                                        ⚽ Spor
                                    </option>
                                    <option value="Festival">
                                        🎪 Festival
                                    </option>
                                    <option value="Sergi">
                                        🖼️ Sergi
                                    </option>
                                    <option value="Seminer">
                                        🎓 Seminer
                                    </option>
                                    <option value="Çocuk">
                                        🧒 Çocuk
                                    </option>
                                    <option value="Diğer">
                                        📌 Diğer
                                    </option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>
                                    İlçe
                                </label>

                                <input
                                    id="eventDistrict"
                                    class="form-control"
                                    placeholder="Örn. Ortahisar"
                                >
                            </div>

                            <div class="form-group">
                                <label>
                                    Etkinlik Tarihi *
                                </label>

                                <input
                                    id="eventDate"
                                    class="form-control"
                                    type="date"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label>
                                    Başlangıç Saati
                                </label>

                                <input
                                    id="eventTime"
                                    class="form-control"
                                    type="time"
                                >
                            </div>

                            <div class="form-group">
                                <label>
                                    Bitiş Saati
                                </label>

                                <input
                                    id="eventEndTime"
                                    class="form-control"
                                    type="time"
                                >
                            </div>

                            <div class="form-group">
                                <label>
                                    Mekân
                                </label>

                                <input
                                    id="eventVenue"
                                    class="form-control"
                                    placeholder="Örn. Trabzon Meydan Parkı"
                                >
                            </div>

                            <div class="form-group full-width">
                                <label>
                                    Adres
                                </label>

                                <input
                                    id="eventAddress"
                                    class="form-control"
                                    placeholder="Etkinliğin açık adresi"
                                >
                            </div>

                            <div class="form-group">
                                <label>
                                    İletişim Telefonu
                                </label>

                                <input
                                    id="eventPhone"
                                    class="form-control"
                                    type="tel"
                                    placeholder="0462..."
                                >
                            </div>

                            <div class="form-group">
                                <label>
                                    Bilet / Kayıt Linki
                                </label>

                                <input
                                    id="eventTicketUrl"
                                    class="form-control"
                                    type="url"
                                    placeholder="https://..."
                                >
                            </div>

                            <div class="form-group full-width">
                                <label>
                                    Kapak Fotoğrafı URL
                                </label>

                                <input
                                    id="eventImageUrl"
                                    class="form-control"
                                    type="url"
                                    placeholder="Fotoğraf bağlantısı"
                                >

                                <small
                                    style="
                                        display:block;
                                        color:#6b7280;
                                        margin-top:6px;
                                    "
                                >
                                    Fotoğraf yükleme sistemini sonraki aşamada ayrı
                                    olarak bağlayacağız.
                                </small>
                            </div>

                            <div class="form-group full-width">
                                <label>
                                    Açıklama
                                </label>

                                <textarea
                                    id="eventDescription"
                                    class="form-control"
                                    rows="6"
                                    maxlength="10000"
                                    placeholder="Etkinlik hakkında detaylı bilgi..."
                                ></textarea>
                            </div>

                            <div class="form-group">
                                <label>
                                    Yayın Durumu
                                </label>

                                <select
                                    id="eventApproved"
                                    class="form-control"
                                >
                                    <option value="false">
                                        🟡 Bekliyor
                                    </option>

                                    <option value="true">
                                        🟢 Yayında
                                    </option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>
                                    Öne Çıkarma
                                </label>

                                <select
                                    id="eventFeatured"
                                    class="form-control"
                                >
                                    <option value="false">
                                        Normal
                                    </option>

                                    <option value="true">
                                        ⭐ Öne Çıkar
                                    </option>
                                </select>
                            </div>

                        </div>

                    </div>

                    <div class="modal-footer">

                        <button
                            type="button"
                            class="modal-btn cancel-btn"
                            id="cancelEventBtn"
                        >
                            Vazgeç
                        </button>

                        <button
                            type="submit"
                            class="modal-btn save-btn"
                            id="saveEventBtn"
                        >
                            💾 Etkinliği Kaydet
                        </button>

                    </div>

                </form>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // ============================================================
    // EVENT BINDINGS
    // ============================================================

    function bindEventsInterface() {
        const refresh =
            document.getElementById(
                "eventsRefreshBtn"
            );

        if (refresh) {
            refresh.addEventListener(
                "click",
                loadEvents
            );
        }

        const newButton =
            document.getElementById(
                "newEventBtn"
            );

        if (newButton) {
            newButton.addEventListener(
                "click",
                openNewEventModal
            );
        }

        const search =
            document.getElementById(
                "eventsSearch"
            );

        if (search) {
            search.addEventListener(
                "input",
                renderEvents
            );
        }

        const status =
            document.getElementById(
                "eventsStatusFilter"
            );

        if (status) {
            status.addEventListener(
                "change",
                renderEvents
            );
        }

        const dateFilter =
            document.getElementById(
                "eventsDateFilter"
            );

        if (dateFilter) {
            dateFilter.addEventListener(
                "change",
                renderEvents
            );
        }

        const close =
            document.getElementById(
                "closeEventModal"
            );

        if (close) {
            close.addEventListener(
                "click",
                closeEventModal
            );
        }

        const cancel =
            document.getElementById(
                "cancelEventBtn"
            );

        if (cancel) {
            cancel.addEventListener(
                "click",
                closeEventModal
            );
        }

        const form =
            document.getElementById(
                "eventForm"
            );

        if (form) {
            form.addEventListener(
                "submit",
                saveEvent
            );
        }

        const modal =
            document.getElementById(
                "eventAdminModal"
            );

        if (modal) {
            modal.addEventListener(
                "click",
                function (event) {
                    if (
                        event.target === modal
                    ) {
                        closeEventModal();
                    }
                }
            );
        }
    }

    // ============================================================
    // EVENTS LOAD
    // ============================================================

    async function loadEvents() {
        const list =
            document.getElementById(
                "eventsList"
            );

        if (list) {
            list.innerHTML = `
                <div class="loading">
                    Etkinlikler yükleniyor...
                </div>
            `;
        }

        const client = getSupabase();

        if (!client) {
            if (list) {
                list.innerHTML = `
                    <div class="empty">
                        Supabase bağlantısı bulunamadı.
                    </div>
                `;
            }

            return;
        }

        try {
            const result =
                await client
                    .from(EVENTS_TABLE)
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
                throw result.error;
            }

            eventsData =
                result.data || [];

            renderEvents();

        } catch (error) {
            console.error(
                "Etkinlikler yüklenemedi:",
                error
            );

            if (list) {
                list.innerHTML = `
                    <div class="empty">
                        ❌ Etkinlikler yüklenirken hata oluştu.<br><br>
                        ${escapeHtml(error.message)}
                    </div>
                `;
            }
        }
    }

    // ============================================================
    // FILTER
    // ============================================================

    function getFilteredEvents() {
        const search =
            document.getElementById(
                "eventsSearch"
            );

        const status =
            document.getElementById(
                "eventsStatusFilter"
            );

        const dateFilter =
            document.getElementById(
                "eventsDateFilter"
            );

        const searchValue =
            search
                ? search.value
                    .trim()
                    .toLocaleLowerCase("tr-TR")
                : "";

        const statusValue =
            status
                ? status.value
                : "";

        const dateValue =
            dateFilter
                ? dateFilter.value
                : "";

        return eventsData.filter(
            function (event) {

                if (
                    searchValue &&
                    !(
                        String(event.title || "")
                            .toLocaleLowerCase("tr-TR")
                            .includes(searchValue)
                        ||
                        String(event.venue || "")
                            .toLocaleLowerCase("tr-TR")
                            .includes(searchValue)
                        ||
                        String(event.district || "")
                            .toLocaleLowerCase("tr-TR")
                            .includes(searchValue)
                    )
                ) {
                    return false;
                }

                if (
                    statusValue === "approved" &&
                    event.is_approved !== true
                ) {
                    return false;
                }

                if (
                    statusValue === "pending" &&
                    event.is_approved !== false
                ) {
                    return false;
                }

                if (
                    dateValue === "upcoming" &&
                    isPastEvent(event.event_date)
                ) {
                    return false;
                }

                if (
                    dateValue === "past" &&
                    !isPastEvent(event.event_date)
                ) {
                    return false;
                }

                return true;
            }
        );
    }

    // ============================================================
    // RENDER
    // ============================================================

    function renderEvents() {
        const list =
            document.getElementById(
                "eventsList"
            );

        if (!list) {
            return;
        }

        const filtered =
            getFilteredEvents();

        if (!filtered.length) {
            list.innerHTML = `
                <div class="empty">
                    🎉 Henüz etkinlik bulunmuyor.
                </div>
            `;

            return;
        }

        list.innerHTML =
            filtered
                .map(
                    renderEventCard
                )
                .join("");
    }

    function renderEventCard(event) {
        const approved =
            event.is_approved === true;

        const featured =
            event.is_featured === true;

        const past =
            isPastEvent(
                event.event_date
            );

        const time =
            formatTime(
                event.event_time
            );

        const endTime =
            formatTime(
                event.end_time
            );

        let timeText =
            time || "";

        if (
            time &&
            endTime
        ) {
            timeText =
                time +
                " - " +
                endTime;
        }

        return `
            <div
                class="business-card"
                data-event-id="${escapeHtml(event.id)}"
            >

                <div class="business-top">

                    <div>
                        <div class="business-title">
                            ${escapeHtml(event.title)}
                        </div>

                        <div class="business-meta">
                            ${
                                event.category
                                    ? escapeHtml(event.category) + " • "
                                    : ""
                            }
                            ${
                                event.venue
                                    ? escapeHtml(event.venue)
                                    : "Mekân belirtilmemiş"
                            }
                        </div>
                    </div>

                    <div class="badges">

                        ${
                            approved
                                ? `
                                    <span class="badge badge-green">
                                        ✓ Yayında
                                    </span>
                                `
                                : `
                                    <span class="badge badge-yellow">
                                        ⏳ Bekliyor
                                    </span>
                                `
                        }

                        ${
                            featured
                                ? `
                                    <span class="badge badge-blue">
                                        ⭐ Öne Çıkan
                                    </span>
                                `
                                : ""
                        }

                        ${
                            past
                                ? `
                                    <span class="badge badge-red">
                                        Geçmiş
                                    </span>
                                `
                                : `
                                    <span class="badge badge-green">
                                        📅 Yaklaşan
                                    </span>
                                `
                        }

                    </div>

                </div>

                <div class="business-info">

                    <div>
                        <strong>📅 Tarih:</strong>
                        ${formatDate(event.event_date)}
                    </div>

                    <div>
                        <strong>🕐 Saat:</strong>
                        ${escapeHtml(timeText || "-")}
                    </div>

                    <div>
                        <strong>📍 İlçe:</strong>
                        ${escapeHtml(event.district || "-")}
                    </div>

                    <div>
                        <strong>🏛️ Mekân:</strong>
                        ${escapeHtml(event.venue || "-")}
                    </div>

                    ${
                        event.phone
                            ? `
                                <div>
                                    <strong>📞 Telefon:</strong>
                                    ${escapeHtml(event.phone)}
                                </div>
                            `
                            : ""
                    }

                    ${
                        event.ticket_url
                            ? `
                                <div>
                                    <strong>🎟️ Bilet:</strong>
                                    Var
                                </div>
                            `
                            : ""
                    }

                </div>

                ${
                    event.description
                        ? `
                            <div class="description">
                                ${escapeHtml(event.description)}
                            </div>
                        `
                        : ""
                }

                ${
                    event.image_url
                        ? `
                            <div
                                style="
                                    margin-bottom:15px;
                                    border-radius:12px;
                                    overflow:hidden;
                                    height:220px;
                                    background:#f3f4f6;
                                "
                            >
                                <img
                                    src="${escapeHtml(event.image_url)}"
                                    alt="${escapeHtml(event.title)}"
                                    style="
                                        width:100%;
                                        height:100%;
                                        object-fit:cover;
                                    "
                                >
                            </div>
                        `
                        : ""
                }

                <div class="business-actions">

                    <button
                        type="button"
                        class="action-btn btn-blue"
                        onclick="window.editEvent('${escapeHtml(event.id)}')"
                    >
                        ✏️ Düzenle
                    </button>

                    <button
                        type="button"
                        class="action-btn ${
                            approved
                                ? "btn-yellow"
                                : "btn-green"
                        }"
                        onclick="window.toggleEventApproval(
                            '${escapeHtml(event.id)}',
                            ${approved ? "false" : "true"}
                        )"
                    >
                        ${
                            approved
                                ? "⏳ Yayından Kaldır"
                                : "✓ Yayına Al"
                        }
                    </button>

                    <button
                        type="button"
                        class="action-btn ${
                            featured
                                ? "btn-gray"
                                : "btn-yellow"
                        }"
                        onclick="window.toggleEventFeatured(
                            '${escapeHtml(event.id)}',
                            ${featured ? "false" : "true"}
                        )"
                    >
                        ${
                            featured
                                ? "☆ Öne Çıkarmayı Kaldır"
                                : "⭐ Öne Çıkar"
                        }
                    </button>

                    <button
                        type="button"
                        class="action-btn btn-red"
                        onclick="window.deleteEvent('${escapeHtml(event.id)}')"
                    >
                        🗑️ Sil
                    </button>

                </div>

            </div>
        `;
    }

    // ============================================================
    // NEW
    // ============================================================

    function openNewEventModal() {
        editingEventId = null;

        document.getElementById(
            "eventModalTitle"
        ).textContent =
            "🎉 Yeni Etkinlik";

        document.getElementById(
            "eventForm"
        ).reset();

        document.getElementById(
            "eventApproved"
        ).value = "false";

        document.getElementById(
            "eventFeatured"
        ).value = "false";

        openEventModal();
    }

    // ============================================================
    // EDIT
    // ============================================================

    function editEvent(id) {
        const event =
            eventsData.find(
                function (item) {
                    return item.id === id;
                }
            );

        if (!event) {
            showMessage(
                "Etkinlik bulunamadı.",
                "error"
            );

            return;
        }

        editingEventId = id;

        document.getElementById(
            "eventModalTitle"
        ).textContent =
            "✏️ Etkinliği Düzenle";

        document.getElementById(
            "eventTitle"
        ).value =
            event.title || "";

        document.getElementById(
            "eventCategory"
        ).value =
            event.category || "";

        document.getElementById(
            "eventDistrict"
        ).value =
            event.district || "";

        document.getElementById(
            "eventDate"
        ).value =
            event.event_date || "";

        document.getElementById(
            "eventTime"
        ).value =
            formatTime(event.event_time);

        document.getElementById(
            "eventEndTime"
        ).value =
            formatTime(event.end_time);

        document.getElementById(
            "eventVenue"
        ).value =
            event.venue || "";

        document.getElementById(
            "eventAddress"
        ).value =
            event.address || "";

        document.getElementById(
            "eventPhone"
        ).value =
            event.contact_phone || "";

        document.getElementById(
            "eventTicketUrl"
        ).value =
            event.ticket_url || "";

        document.getElementById(
            "eventImageUrl"
        ).value =
            event.image_url || "";

        document.getElementById(
            "eventDescription"
        ).value =
            event.description || "";

        document.getElementById(
            "eventApproved"
        ).value =
            event.is_approved
                ? "true"
                : "false";

        document.getElementById(
            "eventFeatured"
        ).value =
            event.is_featured
                ? "true"
                : "false";

        openEventModal();
    }

    // ============================================================
    // SAVE
    // ============================================================

    async function saveEvent(event) {
        event.preventDefault();

        const client =
            getSupabase();

        if (!client) {
            showMessage(
                "Supabase bağlantısı bulunamadı.",
                "error"
            );

            return;
        }

        const saveButton =
            document.getElementById(
                "saveEventBtn"
            );

        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent =
                "⏳ Kaydediliyor...";
        }

        const data = {
            title:
                document.getElementById(
                    "eventTitle"
                ).value.trim(),

            category:
                document.getElementById(
                    "eventCategory"
                ).value.trim() || null,

            district:
                document.getElementById(
                    "eventDistrict"
                ).value.trim() || null,

            event_date:
                document.getElementById(
                    "eventDate"
                ).value,

            event_time:
                document.getElementById(
                    "eventTime"
                ).value || null,

            end_time:
                document.getElementById(
                    "eventEndTime"
                ).value || null,

            venue:
                document.getElementById(
                    "eventVenue"
                ).value.trim() || null,

            address:
                document.getElementById(
                    "eventAddress"
                ).value.trim() || null,

            contact_phone:
                document.getElementById(
                    "eventPhone"
                ).value.trim() || null,

            ticket_url:
                document.getElementById(
                    "eventTicketUrl"
                ).value.trim() || null,

            image_url:
                document.getElementById(
                    "eventImageUrl"
                ).value.trim() || null,

            description:
                document.getElementById(
                    "eventDescription"
                ).value.trim() || null,

            is_approved:
                document.getElementById(
                    "eventApproved"
                ).value === "true",

            is_featured:
                document.getElementById(
                    "eventFeatured"
                ).value === "true"
        };

        try {
            let result;

            if (editingEventId) {

                result =
                    await client
                        .from(EVENTS_TABLE)
                        .update(data)
                        .eq(
                            "id",
                            editingEventId
                        );

            } else {

                result =
                    await client
                        .from(EVENTS_TABLE)
                        .insert(data);
            }

            if (result.error) {
                throw result.error;
            }

            closeEventModal();

            showMessage(
                editingEventId
                    ? "Etkinlik başarıyla güncellendi."
                    : "Etkinlik başarıyla oluşturuldu.",
                "success"
            );

            await loadEvents();

        } catch (error) {

            console.error(
                "Etkinlik kaydetme hatası:",
                error
            );

            showMessage(
                "Etkinlik kaydedilemedi: " +
                error.message,
                "error"
            );

        } finally {

            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent =
                    "💾 Etkinliği Kaydet";
            }
        }
    }

    // ============================================================
    // APPROVAL
    // ============================================================

    async function toggleEventApproval(
        id,
        value
    ) {
        const client =
            getSupabase();

        if (!client) {
            return;
        }

        try {

            const result =
                await client
                    .from(EVENTS_TABLE)
                    .update({
                        is_approved:
                            value === true ||
                            value === "true"
                    })
                    .eq(
                        "id",
                        id
                    );

            if (result.error) {
                throw result.error;
            }

            showMessage(
                value === true ||
                value === "true"
                    ? "Etkinlik yayına alındı."
                    : "Etkinlik yayından kaldırıldı.",
                "success"
            );

            await loadEvents();

        } catch (error) {

            console.error(error);

            showMessage(
                "İşlem başarısız: " +
                error.message,
                "error"
            );
        }
    }

    // ============================================================
    // FEATURED
    // ============================================================

    async function toggleEventFeatured(
        id,
        value
    ) {
        const client =
            getSupabase();

        if (!client) {
            return;
        }

        try {

            const result =
                await client
                    .from(EVENTS_TABLE)
                    .update({
                        is_featured:
                            value === true ||
                            value === "true"
                    })
                    .eq(
                        "id",
                        id
                    );

            if (result.error) {
                throw result.error;
            }

            showMessage(
                value === true ||
                value === "true"
                    ? "Etkinlik öne çıkarıldı."
                    : "Etkinlik öne çıkarmadan kaldırıldı.",
                "success"
            );

            await loadEvents();

        } catch (error) {

            console.error(error);

            showMessage(
                "İşlem başarısız: " +
                error.message,
                "error"
            );
        }
    }

    // ============================================================
    // DELETE
    // ============================================================

    async function deleteEvent(id) {
        const event =
            eventsData.find(
                function (item) {
                    return item.id === id;
                }
            );

        if (!event) {
            return;
        }

        const confirmed =
            confirm(
                '"' +
                event.title +
                '" etkinliğini silmek istediğine emin misin?'
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
                    .from(EVENTS_TABLE)
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

            console.error(error);

            showMessage(
                "Etkinlik silinemedi: " +
                error.message,
                "error"
            );
        }
    }

    // ============================================================
    // MODAL OPEN / CLOSE
    // ============================================================

    function openEventModal() {
        const modal =
            document.getElementById(
                "eventAdminModal"
            );

        if (!modal) {
            return;
        }

        modal.classList.add(
            "open"
        );
    }

    function closeEventModal() {
        const modal =
            document.getElementById(
                "eventAdminModal"
            );

        if (!modal) {
            return;
        }

        modal.classList.remove(
            "open"
        );

        editingEventId = null;
    }

    // ============================================================
    // GLOBAL
    // ============================================================

    window.editEvent =
        editEvent;

    window.toggleEventApproval =
        toggleEventApproval;

    window.toggleEventFeatured =
        toggleEventFeatured;

    window.deleteEvent =
        deleteEvent;

    // ============================================================
    // INIT
    // ============================================================

    function initEventsAdmin() {
        createEventsInterface();
    }

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initEventsAdmin
        );
    } else {
        initEventsAdmin();
    }

})();