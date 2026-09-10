// ============================================================
// TRABZON ANLIK - ANALYTICS TARİH FİLTRESİ
// ============================================================
// 7 / 30 / 90 / Bugün / Tüm Zamanlar
// Filtre değişince tüm analytics anında güncellenir.
// Supabase'den tekrar veri çekmez.
// ============================================================

(function () {

    "use strict";

    // ============================================================
    // AYARLAR
    // ============================================================

    let selectedRange =
        window.__trabzonAnalyticsSelectedRange || "30";

    let filterInitialized = false;

    // ============================================================
    // TARİH FİLTRESİ
    // ============================================================

    function getFilteredEvents(events, range) {

        if (!Array.isArray(events)) {
            return [];
        }

        const realEvents =
            events.filter(function (event) {

                return (
                    event &&
                    String(event.event_type || "")
                        .trim()
                        .toLowerCase() !==
                    "test_page_view"
                );

            });

        const currentRange =
            String(
                range ||
                selectedRange ||
                "30"
            );

        // --------------------------------------------------------
        // TÜM ZAMANLAR
        // --------------------------------------------------------

        if (currentRange === "all") {
            return realEvents;
        }

        const days =
            Number(currentRange);

        if (!Number.isFinite(days)) {
            return realEvents;
        }

        // --------------------------------------------------------
        // BUGÜNÜN BAŞLANGICI
        // --------------------------------------------------------

        const now =
            new Date();

        const todayStart =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                0,
                0,
                0,
                0
            );

        let startDate;

        // Bugün
        if (days === 1) {

            startDate =
                todayStart;

        } else {

            startDate =
                new Date(todayStart);

            startDate.setDate(
                startDate.getDate() -
                (days - 1)
            );
        }

        // --------------------------------------------------------
        // EVENTLERİ FİLTRELE
        // --------------------------------------------------------

        return realEvents.filter(function (event) {

            if (!event.created_at) {
                return false;
            }

            const eventDate =
                new Date(
                    event.created_at
                );

            if (
                Number.isNaN(
                    eventDate.getTime()
                )
            ) {
                return false;
            }

            return eventDate >= startDate;

        });
    }

    // ============================================================
    // FİLTRE KUTUSUNU OLUŞTUR
    // ============================================================

    function createFilterBox() {

        // Zaten varsa tekrar oluşturma
        if (
            document.getElementById(
                "adminAnalyticsFilterBox"
            )
        ) {

            filterInitialized = true;

            updateActiveButton();

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
            document.createElement(
                "div"
            );

        box.id =
            "adminAnalyticsFilterBox";

        box.innerHTML = `

            <div class="analytics-filter-header">

                <div>

                    <div class="analytics-filter-title">
                        📅 Analytics Dönemi
                    </div>

                    <div class="analytics-filter-subtitle">
                        İstatistikleri istediğin tarih aralığına göre görüntüle
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
                    class="analytics-filter-btn"
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

        // --------------------------------------------------------
        // ANALYTICS KUTUSUNDAN ÖNCE EKLE
        // --------------------------------------------------------

        const analyticsBox =
            document.getElementById(
                "adminAnalyticsBox"
            );

        if (
            analyticsBox &&
            analyticsBox.parentNode === dashboard
        ) {

            dashboard.insertBefore(
                box,
                analyticsBox
            );

        } else {

            dashboard.appendChild(
                box
            );
        }

        // --------------------------------------------------------
        // STİLLER
        // --------------------------------------------------------

        addFilterStyles();

        // --------------------------------------------------------
        // BUTONLAR
        // --------------------------------------------------------

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

                    changeAnalyticsRange(
                        range
                    );

                }
            );

        });

        filterInitialized = true;

        updateActiveButton();
    }

    // ============================================================
    // AKTİF BUTONU GÜNCELLE
    // ============================================================

    function updateActiveButton() {

        const box =
            document.getElementById(
                "adminAnalyticsFilterBox"
            );

        if (!box) {
            return;
        }

        const buttons =
            box.querySelectorAll(
                ".analytics-filter-btn"
            );

        buttons.forEach(function (button) {

            const buttonRange =
                button.getAttribute(
                    "data-range"
                );

            if (
                String(buttonRange) ===
                String(selectedRange)
            ) {

                button.classList.add(
                    "active"
                );

            } else {

                button.classList.remove(
                    "active"
                );
            }

        });
    }

    // ============================================================
    // FİLTRE DEĞİŞTİR
    // ============================================================

    async function changeAnalyticsRange(
        range
    ) {

        selectedRange =
            String(range || "30");

        // --------------------------------------------------------
        // GLOBAL OLARAK SAKLA
        // --------------------------------------------------------

        window.__trabzonAnalyticsSelectedRange =
            selectedRange;

        // --------------------------------------------------------
        // AKTİF BUTONU DEĞİŞTİR
        // --------------------------------------------------------

        updateActiveButton();

        // --------------------------------------------------------
        // TÜM GERÇEK EVENTLERİ AL
        // --------------------------------------------------------

        const allEvents =
            Array.isArray(
                window.__trabzonAnalyticsAllEvents
            )
                ? window.__trabzonAnalyticsAllEvents
                : [];

        // --------------------------------------------------------
        // VERİ YOKSA
        // --------------------------------------------------------

        if (!allEvents.length) {

            console.warn(
                "Analytics filtreleme: Henüz veri bulunamadı."
            );

            // Eğer ana sistem hazırsa tekrar yüklemeyi dene
            if (
                typeof window.loadAnalytics ===
                "function"
            ) {

                try {

                    await window.loadAnalytics();

                } catch (error) {

                    console.error(
                        "Analytics yeniden yüklenemedi:",
                        error
                    );
                }

            }

            return;
        }

        // --------------------------------------------------------
        // FİLTRELE
        // --------------------------------------------------------

        let filteredEvents = [];

        if (
            typeof window.getAnalyticsFilteredEvents ===
            "function"
        ) {

            filteredEvents =
                window.getAnalyticsFilteredEvents(
                    allEvents,
                    selectedRange
                );

        } else {

            filteredEvents =
                getFilteredEvents(
                    allEvents,
                    selectedRange
                );
        }

        // --------------------------------------------------------
        // GLOBAL FİLTRELİ VERİ
        // --------------------------------------------------------

        window.__trabzonAnalyticsFilteredEvents =
            filteredEvents;

        // Eski grafik sistemiyle uyumluluk
        window.allAnalyticsEvents =
            filteredEvents;

        // Grafik sistemleri için ayrıca
        window.__trabzonAnalyticsChartEvents =
            filteredEvents;

        // --------------------------------------------------------
        // ANA ANALYTICS SİSTEMİNİ ÇALIŞTIR
        // --------------------------------------------------------

        if (
            typeof window.applyAnalyticsDateFilter ===
            "function"
        ) {

            try {

                await window.applyAnalyticsDateFilter(
                    selectedRange
                );

                return;

            } catch (error) {

                console.error(
                    "Analytics tarih filtresi hatası:",
                    error
                );
            }
        }

        // --------------------------------------------------------
        // YEDEK SİSTEM
        // --------------------------------------------------------

        if (
            typeof window.updateAnalyticsDashboardStats ===
            "function"
        ) {

            window.updateAnalyticsDashboardStats(
                filteredEvents
            );
        }

        if (
            typeof window.renderAnalyticsBox ===
            "function"
        ) {

            await window.renderAnalyticsBox(
                filteredEvents
            );
        }

        // Grafik
        if (
            typeof window.renderAnalyticsChart ===
            "function"
        ) {

            setTimeout(function () {

                try {

                    window.renderAnalyticsChart(
                        filteredEvents
                    );

                } catch (error) {

                    console.error(
                        "Analytics grafik güncelleme hatası:",
                        error
                    );
                }

            }, 0);
        }
    }

    // ============================================================
    // DIŞARIDAN FİLTRE DEĞİŞTİRME
    // ============================================================

    window.changeAnalyticsRange =
        changeAnalyticsRange;

    // Eski isimle uyumluluk
    window.refreshAnalytics =
        function () {

            return changeAnalyticsRange(
                selectedRange
            );

        };

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
            document.createElement(
                "style"
            );

        style.id =
            "analyticsFilterStyles";

        style.textContent = `

            #adminAnalyticsFilterBox {
                margin-top:20px;
                margin-bottom:20px;
                padding:20px;
                background:#ffffff;
                border:1px solid #e7e9ee;
                border-radius:18px;
                box-shadow:
                    0 8px 30px
                    rgba(16,28,53,0.05);
            }

            .analytics-filter-header {
                display:flex;
                align-items:center;
                justify-content:
                    space-between;
                gap:15px;
            }

            .analytics-filter-title {
                color:#101c35;
                font-size:17px;
                font-weight:800;
            }

            .analytics-filter-subtitle {
                margin-top:4px;
                color:#70798b;
                font-size:12px;
            }

            .analytics-filter-buttons {
                display:flex;
                flex-wrap:wrap;
                gap:9px;
                margin-top:16px;
            }

            .analytics-filter-btn {
                appearance:none;
                border:1px solid #e1e4ea;
                background:#f6f7f9;
                color:#182033;
                border-radius:999px;
                padding:9px 15px;
                font-size:12px;
                font-weight:700;
                cursor:pointer;
                transition:
                    all 0.18s ease;
            }

            .analytics-filter-btn:hover {
                border-color:#7b1830;
                color:#7b1830;
            }

            .analytics-filter-btn.active {
                background:#7b1830;
                border-color:#7b1830;
                color:#ffffff;
            }

            .analytics-filter-btn:active {
                transform:scale(0.97);
            }

            @media (max-width:600px) {

                #adminAnalyticsFilterBox {
                    padding:16px;
                    border-radius:15px;
                }

                .analytics-filter-buttons {
                    gap:7px;
                }

                .analytics-filter-btn {
                    padding:8px 12px;
                    font-size:11px;
                }

                .analytics-filter-title {
                    font-size:16px;
                }

            }

        `;

        document.head.appendChild(
            style
        );
    }

    // ============================================================
    // BAŞLAT
    // ============================================================

    function init() {

        addFilterStyles();

        createFilterBox();

        // Analytics kutusu daha sonra oluşuyorsa
        // birkaç kez kontrol et.
        setTimeout(function () {

            createFilterBox();

        }, 300);

        setTimeout(function () {

            createFilterBox();

        }, 800);

        setTimeout(function () {

            createFilterBox();

        }, 1500);
    }

    // ============================================================
    // DOM HAZIR
    // ============================================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();
    }

})();