// ============================================================
// TRABZON ANLIK - ANALYTICS TARİH FİLTRESİ
// ============================================================

(function () {
    "use strict";

    let selectedRange = "30";
    let originalRenderAnalyticsBox = null;
    let filterInitialized = false;

    // ------------------------------------------------------------
    // TARİH FİLTRESİ
    // ------------------------------------------------------------

    function getFilteredEvents(events) {
        if (!Array.isArray(events)) {
            return [];
        }

        // Test kayıtlarını hiçbir zaman gösterme
        const realEvents = events.filter(function (event) {
            return event &&
                event.event_type !== "test_page_view";
        });

        if (selectedRange === "all") {
            return realEvents;
        }

        const days = Number(selectedRange);

        if (!Number.isFinite(days)) {
            return realEvents;
        }

        const now = new Date();

        // Bugünün başlangıcı
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
            startDate.setDate(startDate.getDate() - (days - 1));
        }

        return realEvents.filter(function (event) {
            if (!event.created_at) {
                return false;
            }

            const eventDate = new Date(event.created_at);

            if (Number.isNaN(eventDate.getTime())) {
                return false;
            }

            return eventDate >= startDate;
        });
    }

    // ------------------------------------------------------------
    // FİLTRE BAŞLIĞI
    // ------------------------------------------------------------

    function createFilterBox() {
        if (document.getElementById("adminAnalyticsFilterBox")) {
            return;
        }

        const dashboard =
            document.getElementById("section-dashboard");

        if (!dashboard) {
            return;
        }

        const box = document.createElement("div");

        box.id = "adminAnalyticsFilterBox";

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
            box.querySelectorAll(".analytics-filter-btn");

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {

                const range =
                    button.getAttribute("data-range");

                selectedRange = range;

                buttons.forEach(function (item) {
                    item.classList.remove("active");
                });

                button.classList.add("active");

                refreshAnalytics();
            });
        });

        filterInitialized = true;
    }

    // ------------------------------------------------------------
    // ANALYTICS YENİLE
    // ------------------------------------------------------------

    function refreshAnalytics() {
        if (typeof originalRenderAnalyticsBox !== "function") {
            return;
        }

        const allEvents =
            window.__trabzonAnalyticsAllEvents || [];

        const filteredEvents =
            getFilteredEvents(allEvents);

        originalRenderAnalyticsBox(filteredEvents);
    }

    // ------------------------------------------------------------
    // RENDER HOOK
    // ------------------------------------------------------------

    function installRenderHook() {

        if (
            typeof window.renderAnalyticsBox !== "function" ||
            window.renderAnalyticsBox.__filterWrapped
        ) {
            return;
        }

        originalRenderAnalyticsBox =
            window.renderAnalyticsBox;

        const originalFunction =
            window.renderAnalyticsBox;

        function wrappedRenderAnalyticsBox(events) {

            // Analytics.js tarafından gelen tüm olayları sakla
            window.__trabzonAnalyticsAllEvents =
                Array.isArray(events) ? events.slice() : [];

            const filteredEvents =
                getFilteredEvents(events);

            return originalFunction(filteredEvents);
        }

        wrappedRenderAnalyticsBox.__filterWrapped = true;

        window.renderAnalyticsBox =
            wrappedRenderAnalyticsBox;
    }

    // ------------------------------------------------------------
    // STİLLER
    // ------------------------------------------------------------

    function addFilterStyles() {

        if (document.getElementById("analyticsFilterStyles")) {
            return;
        }

        const style =
            document.createElement("style");

        style.id = "analyticsFilterStyles";

        style.textContent = `

            #adminAnalyticsFilterBox {
                background: #ffffff;
                border: 1px solid #e7e9ee;
                border-radius: 18px;
                padding: 20px;
                margin: 20px 0;
                box-shadow: 0 6px 20px rgba(16, 28, 53, 0.05);
            }

            .analytics-filter-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                margin-bottom: 16px;
            }

            .analytics-filter-title {
                color: #101c35;
                font-size: 18px;
                font-weight: 800;
                line-height: 1.3;
            }

            .analytics-filter-subtitle {
                color: #70798b;
                font-size: 13px;
                margin-top: 5px;
            }

            .analytics-filter-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 9px;
            }

            .analytics-filter-btn {
                appearance: none;
                border: 1px solid #e7e9ee;
                background: #f6f7f9;
                color: #182033;
                border-radius: 10px;
                padding: 10px 15px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                transition:
                    background 0.2s ease,
                    color 0.2s ease,
                    border-color 0.2s ease,
                    transform 0.2s ease;
            }

            .analytics-filter-btn:hover {
                transform: translateY(-1px);
                border-color: #7b1830;
            }

            .analytics-filter-btn.active {
                background: #7b1830;
                border-color: #7b1830;
                color: #ffffff;
            }

            @media (max-width: 700px) {

                #adminAnalyticsFilterBox {
                    padding: 16px;
                    border-radius: 15px;
                }

                .analytics-filter-title {
                    font-size: 16px;
                }

                .analytics-filter-subtitle {
                    font-size: 12px;
                }

                .analytics-filter-buttons {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }

                .analytics-filter-btn {
                    width: 100%;
                    padding: 11px 8px;
                    font-size: 12px;
                }

                .analytics-filter-btn:last-child {
                    grid-column: span 2;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // ------------------------------------------------------------
    // BAŞLAT
    // ------------------------------------------------------------

    function init() {

        installRenderHook();

        createFilterBox();

        // Analytics dosyası biraz daha sonra yüklenmişse
        // tekrar kontrol et.
        setTimeout(function () {
            installRenderHook();
            createFilterBox();
        }, 300);

        setTimeout(function () {
            installRenderHook();
            createFilterBox();
        }, 1000);
    }

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

})();