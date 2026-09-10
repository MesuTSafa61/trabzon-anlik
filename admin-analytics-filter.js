// ============================================================
// TRABZON ANLIK - ANALYTICS TARİH FİLTRESİ
// Tüm Analytics sistemini ortak tarih filtresiyle yönetir.
// ============================================================

(function () {
    "use strict";

    // ============================================================
    // AYARLAR
    // ============================================================

    let selectedRange = "30";

    let filterInitialized = false;

    // ============================================================
    // GLOBAL FİLTRE DURUMU
    // Diğer analytics dosyaları buradan okuyabilir.
    // ============================================================

    window.__trabzonAnalyticsSelectedRange = selectedRange;

    // ============================================================
    // EVENT TÜRÜ
    // ============================================================

    function normalizeEventType(event) {
        return String(event?.event_type || "")
            .trim()
            .toLowerCase();
    }

    // ============================================================
    // GERÇEK EVENT
    // ============================================================

    function isRealEvent(event) {
        return (
            event &&
            normalizeEventType(event) !== "test_page_view"
        );
    }

    // ============================================================
    // TARİH FİLTRESİ
    // ============================================================

    function getFilteredEvents(events) {

        if (!Array.isArray(events)) {
            return [];
        }

        const realEvents = events.filter(isRealEvent);

        // Tüm zamanlar
        if (selectedRange === "all") {
            return realEvents;
        }

        const days = Number(selectedRange);

        if (!Number.isFinite(days)) {
            return realEvents;
        }

        const now = new Date();

        const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0,
            0,
            0,
            0
        );

        let startDate;

        if (days === 1) {

            startDate = todayStart;

        } else {

            startDate = new Date(todayStart);

            startDate.setDate(
                startDate.getDate() - (days - 1)
            );
        }

        return realEvents.filter(function (event) {

            if (!event.created_at) {
                return false;
            }

            const eventDate =
                new Date(event.created_at);

            if (Number.isNaN(eventDate.getTime())) {
                return false;
            }

            return eventDate >= startDate;
        });
    }

    // ============================================================
    // DIŞARIDAN FİLTREYİ OKUMA
    // ============================================================

    window.getTrabzonAnalyticsSelectedRange =
        function () {
            return selectedRange;
        };

    // ============================================================
    // DIŞARIDAN EVENTLERİ FİLTRELEME
    // ============================================================

    window.getTrabzonFilteredAnalyticsEvents =
        function (events) {
            return getFilteredEvents(events);
        };

    // ============================================================
    // FİLTRE BAŞLIĞI
    // ============================================================

    function createFilterBox() {

        if (
            document.getElementById(
                "adminAnalyticsFilterBox"
            )
        ) {
            return;
        }

        const dashboard =
            document.getElementById(
                "section-dashboard"
            );

        if (!dashboard) {
            return;
        }

        const box =
            document.createElement("div");

        box.id =
            "adminAnalyticsFilterBox";

        box.innerHTML = `

            <div class="analytics-filter-header">

                <div>

                    <div class="analytics-filter-title">
                        📅 İstatistik Dönemi
                    </div>

                    <div class="analytics-filter-subtitle">
                        Tüm istatistikleri seçtiğin döneme göre anında güncelle
                    </div>

                </div>

            </div>

            <div class="analytics-filter-buttons">

                <button
                    type="button"
                    class="analytics-filter-btn"
                    data-range="1">
                    Bugün
                </button>

                <button
                    type="button"
                    class="analytics-filter-btn"
                    data-range="7">
                    Son 7 Gün
                </button>

                <button
                    type="button"
                    class="analytics-filter-btn active"
                    data-range="30">
                    Son 30 Gün
                </button>

                <button
                    type="button"
                    class="analytics-filter-btn"
                    data-range="90">
                    Son 90 Gün
                </button>

                <button
                    type="button"
                    class="analytics-filter-btn"
                    data-range="all">
                    Tüm Zamanlar
                </button>

            </div>

        `;

        dashboard.appendChild(box);

        addFilterStyles();

        const buttons =
            box.querySelectorAll(
                ".analytics-filter-btn"
            );

        buttons.forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const range =
                        button.getAttribute(
                            "data-range"
                        );

                    if (!range) {
                        return;
                    }

                    // Yeni filtreyi kaydet
                    selectedRange = range;

                    // Global durumu güncelle
                    window.__trabzonAnalyticsSelectedRange =
                        selectedRange;

                    // Aktif buton
                    buttons.forEach(
                        function (item) {
                            item.classList.remove(
                                "active"
                            );
                        }
                    );

                    button.classList.add(
                        "active"
                    );

                    // ====================================================
                    // EN ÖNEMLİ KISIM
                    // Yenilemeden bütün Analytics'i yeniden oluştur.
                    // ====================================================

                    refreshEntireAnalytics();

                }
            );

        });

        filterInitialized = true;
    }

    // ============================================================
    // TÜM ANALYTICS'İ YENİLE
    // ============================================================

    function refreshEntireAnalytics() {

        const allEvents =
            window.__trabzonAnalyticsAllEvents ||
            window.allAnalyticsEvents ||
            [];

        if (!Array.isArray(allEvents)) {
            return;
        }

        const filteredEvents =
            getFilteredEvents(allEvents);

        // --------------------------------------------------------
        // Ana Analytics kutusu
        // --------------------------------------------------------

        if (
            typeof window.__trabzonOriginalAnalyticsRender ===
            "function"
        ) {

            window.__trabzonOriginalAnalyticsRender(
                filteredEvents
            );

        } else if (
            typeof window.renderAnalyticsBox ===
            "function"
        ) {

            // Güvenli fallback
            window.renderAnalyticsBox(
                filteredEvents
            );
        }

        // --------------------------------------------------------
        // Grafik
        // --------------------------------------------------------

        setTimeout(function () {

            if (
                typeof window.__trabzonRenderAnalyticsChart ===
                "function"
            ) {

                window.__trabzonRenderAnalyticsChart();

            }

        }, 20);

        // --------------------------------------------------------
        // Filtre değiştiğinde ekranın üst kısmına hafifçe
        // güncelleme hissi ver.
        // --------------------------------------------------------

        const analyticsBox =
            document.getElementById(
                "adminAnalyticsBox"
            );

        if (analyticsBox) {

            analyticsBox.style.opacity = "0.55";

            analyticsBox.style.transition =
                "opacity .15s ease";

            setTimeout(function () {

                analyticsBox.style.opacity = "1";

            }, 120);
        }
    }

    // ============================================================
    // RENDER HOOK
    // ============================================================

    function installRenderHook() {

        if (
            typeof window.renderAnalyticsBox !==
            "function"
        ) {
            return;
        }

        if (
            window.renderAnalyticsBox.__trabzonFilterWrapped
        ) {
            return;
        }

        // Ana render fonksiyonunu sakla
        const originalFunction =
            window.renderAnalyticsBox;

        window.__trabzonOriginalAnalyticsRender =
            originalFunction;

        function wrappedRenderAnalyticsBox(
            events
        ) {

            // Supabase'den gelen TÜM eventleri sakla
            window.__trabzonAnalyticsAllEvents =
                Array.isArray(events)
                    ? events.slice()
                    : [];

            // Mevcut seçili filtreyi uygula
            const filteredEvents =
                getFilteredEvents(events);

            return originalFunction(
                filteredEvents
            );
        }

        wrappedRenderAnalyticsBox
            .__trabzonFilterWrapped = true;

        window.renderAnalyticsBox =
            wrappedRenderAnalyticsBox;
    }

    // ============================================================
    // STİLLER
    // ============================================================

    function addFilterStyles() {

        if (
            document.getElementById(
                "analyticsFilterStyles"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "analyticsFilterStyles";

        style.textContent = `

            #adminAnalyticsFilterBox {

                background:#ffffff;

                border:1px solid #e7e9ee;

                border-radius:18px;

                padding:20px;

                margin:20px 0;

                box-shadow:
                    0 6px 20px
                    rgba(16,28,53,.05);

            }

            .analytics-filter-header {

                display:flex;

                align-items:center;

                justify-content:space-between;

                gap:15px;

                margin-bottom:16px;

            }

            .analytics-filter-title {

                color:#101c35;

                font-size:18px;

                font-weight:800;

                line-height:1.3;

            }

            .analytics-filter-subtitle {

                color:#70798b;

                font-size:13px;

                margin-top:5px;

            }

            .analytics-filter-buttons {

                display:flex;

                flex-wrap:wrap;

                gap:9px;

            }

            .analytics-filter-btn {

                appearance:none;

                border:1px solid #e7e9ee;

                background:#f6f7f9;

                color:#182033;

                border-radius:10px;

                padding:10px 15px;

                font-size:13px;

                font-weight:700;

                cursor:pointer;

                transition:
                    background .2s ease,
                    color .2s ease,
                    border-color .2s ease,
                    transform .2s ease;

            }

            .analytics-filter-btn:hover {

                transform:
                    translateY(-1px);

                border-color:#7b1830;

            }

            .analytics-filter-btn.active {

                background:#7b1830;

                border-color:#7b1830;

                color:#ffffff;

            }

            @media (max-width:700px) {

                #adminAnalyticsFilterBox {

                    padding:16px;

                    border-radius:15px;

                }

                .analytics-filter-title {

                    font-size:16px;

                }

                .analytics-filter-subtitle {

                    font-size:12px;

                }

                .analytics-filter-buttons {

                    display:grid;

                    grid-template-columns:
                        repeat(
                            2,
                            minmax(0,1fr)
                        );

                }

                .analytics-filter-btn {

                    width:100%;

                    padding:11px 8px;

                    font-size:12px;

                }

                .analytics-filter-btn:last-child {

                    grid-column:
                        span 2;

                }

            }

        `;

        document.head.appendChild(style);
    }

    // ============================================================
    // BAŞLAT
    // ============================================================

    function init() {

        installRenderHook();

        createFilterBox();

        setTimeout(function () {

            installRenderHook();

            createFilterBox();

        }, 300);

        setTimeout(function () {

            installRenderHook();

            createFilterBox();

        }, 1000);

        setTimeout(function () {

            installRenderHook();

            createFilterBox();

        }, 2000);
    }

    // ============================================================
    // DOM READY
    // ============================================================

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

    // ============================================================
    // ANALYTICS SONRADAN YÜKLENİRSE
    // ============================================================

    const retryIntervals = [
        500,
        1500,
        3000,
        5000
    ];

    retryIntervals.forEach(function (delay) {

        setTimeout(function () {

            installRenderHook();

            createFilterBox();

        }, delay);

    });

})();