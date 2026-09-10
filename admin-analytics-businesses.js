// ============================================================
// TRABZON ANLIK - İŞLETME ANALYTICS
// TARİH FİLTRESİYLE UYUMLU SÜRÜM
// ============================================================

(function () {
    "use strict";

    let allBusinessAnalyticsEvents = [];

    // ------------------------------------------------------------
    // GERÇEK OLAYLAR
    // ------------------------------------------------------------

    function getRealEvents(events) {
        if (!Array.isArray(events)) {
            return [];
        }

        return events.filter(function (event) {
            return event &&
                event.event_type !== "test_page_view";
        });
    }

    // ------------------------------------------------------------
    // SEÇİLİ TARİH ARALIĞINI OKU
    // ------------------------------------------------------------

    function getSelectedRange() {
        const activeButton =
            document.querySelector(
                "#adminAnalyticsFilterBox .analytics-filter-btn.active"
            );

        if (!activeButton) {
            return "30";
        }

        return activeButton.getAttribute("data-range") || "30";
    }

    // ------------------------------------------------------------
    // TARİHE GÖRE FİLTRELE
    // ------------------------------------------------------------

    function filterEventsByDate(events) {

        const realEvents = getRealEvents(events);

        const range = getSelectedRange();

        if (range === "all") {
            return realEvents;
        }

        const days = Number(range);

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

    // ------------------------------------------------------------
    // SADECE BUSINESS_VIEW
    // ------------------------------------------------------------

    function calculateBusinessStats(events) {

        const stats = {};

        events.forEach(function (event) {

            if (
                event.event_type !== "business_view" ||
                !event.business_id
            ) {
                return;
            }

            const businessId =
                String(event.business_id);

            if (!stats[businessId]) {

                stats[businessId] = {
                    businessId: businessId,
                    views: 0,
                    lastView: event.created_at || null
                };
            }

            stats[businessId].views++;

            if (
                event.created_at &&
                (
                    !stats[businessId].lastView ||
                    new Date(event.created_at) >
                    new Date(stats[businessId].lastView)
                )
            ) {
                stats[businessId].lastView =
                    event.created_at;
            }
        });

        return Object.values(stats)
            .sort(function (a, b) {
                return b.views - a.views;
            });
    }

    // ------------------------------------------------------------
    // İŞLETME ADI
    // ------------------------------------------------------------

    function getBusinessName(businessId) {

        const possibleLists = [
            window.allBusinesses,
            window.businesses
        ];

        for (
            let i = 0;
            i < possibleLists.length;
            i++
        ) {

            const list =
                possibleLists[i];

            if (!Array.isArray(list)) {
                continue;
            }

            const business =
                list.find(function (item) {

                    return String(item.id) ===
                        String(businessId);

                });

            if (
                business &&
                business.name
            ) {
                return business.name;
            }
        }

        return "İşletme #" + businessId;
    }

    // ------------------------------------------------------------
    // HTML GÜVENLİĞİ
    // ------------------------------------------------------------

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ------------------------------------------------------------
    // SEÇİLİ DÖNEM ADI
    // ------------------------------------------------------------

    function getRangeLabel() {

        const range =
            getSelectedRange();

        const labels = {
            "1": "Bugün",
            "7": "Son 7 Gün",
            "30": "Son 30 Gün",
            "90": "Son 90 Gün",
            "all": "Tüm Zamanlar"
        };

        return labels[range] ||
            "Son 30 Gün";
    }

    // ------------------------------------------------------------
    // RENDER
    // ------------------------------------------------------------

    function renderBusinessAnalytics() {

        const filteredEvents =
            filterEventsByDate(
                allBusinessAnalyticsEvents
            );

        const stats =
            calculateBusinessStats(
                filteredEvents
            );

        let box =
            document.getElementById(
                "adminAnalyticsBusinessesBox"
            );

        if (!box) {

            const dashboard =
                document.getElementById(
                    "section-dashboard"
                );

            if (!dashboard) {
                return;
            }

            box =
                document.createElement("div");

            box.id =
                "adminAnalyticsBusinessesBox";

            dashboard.appendChild(box);
        }

        const totalViews =
            stats.reduce(function (
                total,
                item
            ) {
                return total + item.views;
            }, 0);

        const uniqueBusinesses =
            stats.length;

        const topBusiness =
            stats.length > 0
                ? stats[0]
                : null;

        let rows = "";

        if (stats.length === 0) {

            rows = `
                <div class="analytics-business-empty">
                    Bu dönem için işletme görüntülenmesi bulunmuyor.
                </div>
            `;

        } else {

            rows =
                stats
                    .slice(0, 20)
                    .map(function (
                        item,
                        index
                    ) {

                        const name =
                            getBusinessName(
                                item.businessId
                            );

                        let rank;

                        if (index === 0) {
                            rank = "🥇";
                        } else if (index === 1) {
                            rank = "🥈";
                        } else if (index === 2) {
                            rank = "🥉";
                        } else {
                            rank =
                                String(index + 1);
                        }

                        return `
                            <div class="analytics-business-row">

                                <div class="analytics-business-rank">
                                    ${rank}
                                </div>

                                <div class="analytics-business-info">

                                    <div class="analytics-business-name">
                                        ${escapeHtml(name)}
                                    </div>

                                    <div class="analytics-business-id">
                                        İşletme #${escapeHtml(item.businessId)}
                                    </div>

                                </div>

                                <div class="analytics-business-views">

                                    <strong>
                                        ${item.views}
                                    </strong>

                                    <span>
                                        görüntülenme
                                    </span>

                                </div>

                            </div>
                        `;
                    })
                    .join("");
        }

        box.innerHTML = `

            <div class="analytics-business-header">

                <div>

                    <div class="analytics-business-title">
                        🏆 En Çok Görüntülenen İşletmeler
                    </div>

                    <div class="analytics-business-subtitle">
                        <strong>
                            ${escapeHtml(getRangeLabel())}
                        </strong>
                        dönemindeki gerçek işletme görüntülenmeleri
                    </div>

                </div>

            </div>

            <div class="analytics-business-summary">

                <div class="analytics-business-summary-card">

                    <span>
                        Toplam Görüntülenme
                    </span>

                    <strong>
                        ${totalViews}
                    </strong>

                </div>

                <div class="analytics-business-summary-card">

                    <span>
                        Görüntülenen İşletme
                    </span>

                    <strong>
                        ${uniqueBusinesses}
                    </strong>

                </div>

                <div class="analytics-business-summary-card">

                    <span>
                        1. Sıradaki
                    </span>

                    <strong>
                        ${
                            topBusiness
                                ? escapeHtml(
                                    getBusinessName(
                                        topBusiness.businessId
                                    )
                                )
                                : "-"
                        }
                    </strong>

                </div>

            </div>

            <div class="analytics-business-list">

                ${rows}

            </div>
        `;

        addStyles();
    }

    // ------------------------------------------------------------
    // STİLLER
    // ------------------------------------------------------------

    function addStyles() {

        if (
            document.getElementById(
                "analyticsBusinessStyles"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "analyticsBusinessStyles";

        style.textContent = `

            #adminAnalyticsBusinessesBox {
                background: #ffffff;
                border: 1px solid #e7e9ee;
                border-radius: 18px;
                padding: 22px;
                margin: 20px 0;
                box-shadow:
                    0 6px 20px
                    rgba(16, 28, 53, 0.05);
            }

            .analytics-business-title {
                color: #101c35;
                font-size: 19px;
                font-weight: 800;
            }

            .analytics-business-subtitle {
                color: #70798b;
                font-size: 13px;
                margin-top: 5px;
            }

            .analytics-business-subtitle strong {
                color: #7b1830;
            }

            .analytics-business-summary {
                display: grid;
                grid-template-columns:
                    repeat(3, minmax(0, 1fr));
                gap: 12px;
                margin: 20px 0;
            }

            .analytics-business-summary-card {
                background: #f6f7f9;
                border: 1px solid #e7e9ee;
                border-radius: 14px;
                padding: 15px;
                min-width: 0;
            }

            .analytics-business-summary-card span {
                display: block;
                color: #70798b;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 7px;
            }

            .analytics-business-summary-card strong {
                display: block;
                color: #101c35;
                font-size: 20px;
                font-weight: 800;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .analytics-business-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .analytics-business-row {
                display: grid;
                grid-template-columns:
                    45px minmax(0, 1fr) auto;
                align-items: center;
                gap: 12px;
                padding: 13px 14px;
                border: 1px solid #e7e9ee;
                border-radius: 13px;
                background: #ffffff;
            }

            .analytics-business-rank {
                width: 35px;
                text-align: center;
                font-size: 18px;
                font-weight: 800;
                color: #101c35;
            }

            .analytics-business-info {
                min-width: 0;
            }

            .analytics-business-name {
                color: #182033;
                font-size: 14px;
                font-weight: 800;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .analytics-business-id {
                color: #70798b;
                font-size: 11px;
                margin-top: 3px;
            }

            .analytics-business-views {
                text-align: right;
                min-width: 90px;
            }

            .analytics-business-views strong {
                display: block;
                color: #7b1830;
                font-size: 17px;
                font-weight: 800;
            }

            .analytics-business-views span {
                display: block;
                color: #70798b;
                font-size: 10px;
                margin-top: 2px;
            }

            .analytics-business-empty {
                padding: 25px;
                text-align: center;
                color: #70798b;
                font-size: 13px;
            }

            @media (max-width: 700px) {

                #adminAnalyticsBusinessesBox {
                    padding: 16px;
                    border-radius: 15px;
                }

                .analytics-business-title {
                    font-size: 16px;
                }

                .analytics-business-subtitle {
                    font-size: 11px;
                }

                .analytics-business-summary {
                    grid-template-columns: 1fr;
                    gap: 8px;
                }

                .analytics-business-summary-card {
                    padding: 12px;
                }

                .analytics-business-summary-card strong {
                    font-size: 17px;
                }

                .analytics-business-row {
                    grid-template-columns:
                        34px minmax(0, 1fr) auto;
                    gap: 8px;
                    padding: 11px;
                }

                .analytics-business-rank {
                    width: 28px;
                    font-size: 15px;
                }

                .analytics-business-name {
                    font-size: 13px;
                }

                .analytics-business-views {
                    min-width: 65px;
                }

                .analytics-business-views strong {
                    font-size: 15px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // ------------------------------------------------------------
    // ANALYTICS BOX'A BAĞLAN
    // ------------------------------------------------------------

    function installAnalyticsHook() {

        if (
            typeof window.renderAnalyticsBox !==
            "function"
        ) {
            return;
        }

        if (
            window.renderAnalyticsBox
                .__businessDateAnalyticsWrapped
        ) {
            return;
        }

        const originalRender =
            window.renderAnalyticsBox;

        function wrappedRender(events) {

            allBusinessAnalyticsEvents =
                Array.isArray(events)
                    ? events.slice()
                    : [];

            const result =
                originalRender.apply(
                    this,
                    arguments
                );

            setTimeout(
                renderBusinessAnalytics,
                0
            );

            return result;
        }

        wrappedRender
            .__businessDateAnalyticsWrapped = true;

        window.renderAnalyticsBox =
            wrappedRender;
    }

    // ------------------------------------------------------------
    // FİLTRE BUTONLARINI DİNLE
    // ------------------------------------------------------------

    function installFilterListener() {

        const filterBox =
            document.getElementById(
                "adminAnalyticsFilterBox"
            );

        if (!filterBox) {
            return;
        }

        if (
            filterBox
                .__businessAnalyticsListener
        ) {
            return;
        }

        filterBox
            .__businessAnalyticsListener = true;

        filterBox.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        ".analytics-filter-btn"
                    );

                if (!button) {
                    return;
                }

                setTimeout(
                    renderBusinessAnalytics,
                    20
                );
            }
        );
    }

    // ------------------------------------------------------------
    // BAŞLAT
    // ------------------------------------------------------------

    function init() {

        addStyles();

        installAnalyticsHook();

        installFilterListener();

        setTimeout(function () {

            installAnalyticsHook();
            installFilterListener();

        }, 300);

        setTimeout(function () {

            installAnalyticsHook();
            installFilterListener();

        }, 1000);

        setTimeout(function () {

            if (
                allBusinessAnalyticsEvents.length
            ) {
                renderBusinessAnalytics();
            }

        }, 1500);
    }

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

})();