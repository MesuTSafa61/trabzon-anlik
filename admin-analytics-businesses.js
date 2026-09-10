// ============================================================
// TRABZON ANLIK - İŞLETME ANALYTICS
// ============================================================

(function () {
    "use strict";

    let currentEvents = [];

    // ------------------------------------------------------------
    // TEST KAYITLARINI TEMİZLE
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
    // İŞLETME ANALYTICS HESAPLA
    // ------------------------------------------------------------

    function calculateBusinessStats(events) {

        const stats = {};

        events.forEach(function (event) {

            // Sadece gerçek işletme görüntülenmeleri
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
    // İŞLETME ADINI BUL
    // ------------------------------------------------------------

    function getBusinessName(businessId) {

        const lists = [
            window.allBusinesses,
            window.businesses
        ];

        for (let i = 0; i < lists.length; i++) {

            const list = lists[i];

            if (!Array.isArray(list)) {
                continue;
            }

            const business = list.find(function (item) {
                return String(item.id) ===
                    String(businessId);
            });

            if (business && business.name) {
                return business.name;
            }
        }

        return "İşletme #" + businessId;
    }

    // ------------------------------------------------------------
    // TARİH FORMATLA
    // ------------------------------------------------------------

    function formatDate(dateString) {

        if (!dateString) {
            return "-";
        }

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return "-";
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

    // ------------------------------------------------------------
    // HTML GÜVENLİK
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
    // ANA RENDER
    // ------------------------------------------------------------

    function renderBusinessAnalytics(events) {

        currentEvents = getRealEvents(events);

        const stats =
            calculateBusinessStats(currentEvents);

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

            box = document.createElement("div");

            box.id =
                "adminAnalyticsBusinessesBox";

            dashboard.appendChild(box);
        }

        const totalViews =
            stats.reduce(function (sum, item) {
                return sum + item.views;
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
                    Henüz işletme görüntülenmesi bulunmuyor.
                </div>
            `;

        } else {

            rows = stats
                .slice(0, 20)
                .map(function (item, index) {

                    const name =
                        getBusinessName(
                            item.businessId
                        );

                    let medal = "";

                    if (index === 0) {
                        medal = "🥇";
                    } else if (index === 1) {
                        medal = "🥈";
                    } else if (index === 2) {
                        medal = "🥉";
                    } else {
                        medal =
                            String(index + 1);
                    }

                    return `
                        <div class="analytics-business-row">

                            <div class="analytics-business-rank">
                                ${medal}
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
                                <strong>${item.views}</strong>
                                <span>görüntülenme</span>
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
                        Sadece gerçek
                        <strong>business_view</strong>
                        kayıtları hesaplanır.
                    </div>
                </div>

            </div>

            <div class="analytics-business-summary">

                <div class="analytics-business-summary-card">
                    <span>Toplam Görüntülenme</span>
                    <strong>${totalViews}</strong>
                </div>

                <div class="analytics-business-summary-card">
                    <span>Görüntülenen İşletme</span>
                    <strong>${uniqueBusinesses}</strong>
                </div>

                <div class="analytics-business-summary-card">
                    <span>1. Sıradaki</span>
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
    // ANALYTICS RENDER FONKSİYONUNA BAĞLAN
    // ------------------------------------------------------------

    function installHook() {

        if (
            typeof window.renderAnalyticsBox !==
            "function"
        ) {
            return;
        }

        if (
            window.renderAnalyticsBox
                .__businessAnalyticsWrapped
        ) {
            return;
        }

        const original =
            window.renderAnalyticsBox;

        function wrapped(events) {

            const result =
                original.apply(this, arguments);

            setTimeout(function () {
                renderBusinessAnalytics(events);
            }, 0);

            return result;
        }

        wrapped.__businessAnalyticsWrapped = true;

        window.renderAnalyticsBox = wrapped;
    }

    // ------------------------------------------------------------
    // BAŞLAT
    // ------------------------------------------------------------

    function init() {

        addStyles();

        installHook();

        setTimeout(function () {
            installHook();
        }, 300);

        setTimeout(function () {
            installHook();
        }, 1000);
    }

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

})();