// ============================================================
// TRABZON ANLIK - İŞLETME ANALYTICS
// GERÇEK İŞLETME İSİMLERİ + STABİL FİLTRE SÜRÜMÜ
// ============================================================
(function () {
    "use strict";

    let analyticsEvents = [];

    // ------------------------------------------------------------
    // SUPABASE AYARLARI
    // ------------------------------------------------------------
    const SUPABASE_URL =
        "https://yhunhkzsecppbnhjewrt.supabase.co";

    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_0h5ycfDBJjgdf6bXlZ9OEg_K45u2b2v";

    // ------------------------------------------------------------
    // İŞLETME İSİMLERİ CACHE
    // ------------------------------------------------------------
    let businessNames = {};
    let businessNamesLoading = false;

    // ------------------------------------------------------------
    // GERÇEK OLAYLAR
    // ------------------------------------------------------------
    function realEvents(events) {
        if (!Array.isArray(events)) {
            return [];
        }

        return events.filter(function (event) {
            return event &&
                event.event_type !== "test_page_view";
        });
    }

    // ------------------------------------------------------------
    // SEÇİLİ FİLTREYİ BUL
    // ------------------------------------------------------------
    function selectedRange() {
        const button =
            document.querySelector(
                "#adminAnalyticsFilterBox .analytics-filter-btn.active"
            );

        if (!button) {
            return "30";
        }

        return (
            button.getAttribute("data-range") ||
            "30"
        );
    }

    // ------------------------------------------------------------
    // TARİH FİLTRESİ
    // ------------------------------------------------------------
    function filterByDate(events) {
        const source =
            realEvents(events);

        const range =
            selectedRange();

        if (range === "all") {
            return source;
        }

        const days =
            parseInt(range, 10);

        if (!Number.isFinite(days)) {
            return source;
        }

        const now =
            new Date();

        const startOfToday =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                0,
                0,
                0,
                0
            );

        let startDate =
            new Date(startOfToday);

        if (days > 1) {
            startDate.setDate(
                startDate.getDate() -
                (days - 1)
            );
        }

        return source.filter(
            function (event) {
                if (!event.created_at) {
                    return false;
                }

                const date =
                    new Date(
                        event.created_at
                    );

                if (
                    Number.isNaN(
                        date.getTime()
                    )
                ) {
                    return false;
                }

                return date >= startDate;
            }
        );
    }

    // ------------------------------------------------------------
    // SADECE BUSINESS_VIEW
    // ------------------------------------------------------------
    function calculate(events) {
        const result = {};

        events.forEach(
            function (event) {
                if (
                    event.event_type !==
                        "business_view" ||
                    event.business_id === null ||
                    event.business_id === undefined
                ) {
                    return;
                }

                const id =
                    String(
                        event.business_id
                    );

                if (!result[id]) {
                    result[id] = {
                        id: id,
                        views: 0
                    };
                }

                result[id].views++;
            }
        );

        return Object.values(result).sort(
            function (a, b) {
                return b.views - a.views;
            }
        );
    }

    // ------------------------------------------------------------
    // HTML GÜVENLİĞİ
    // ------------------------------------------------------------
    function escapeHtml(value) {
        return String(
            value ?? ""
        )
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

    // ------------------------------------------------------------
    // MEVCUT GLOBAL LİSTELERİ KONTROL ET
    // ------------------------------------------------------------
    function findBusinessInGlobals(id) {
        const sources = [
            window.allBusinesses,
            window.businesses,
            window.__allBusinesses,
            window.__trabzonBusinesses
        ];

        for (
            let i = 0;
            i < sources.length;
            i++
        ) {
            const list =
                sources[i];

            if (!Array.isArray(list)) {
                continue;
            }

            const found =
                list.find(
                    function (business) {
                        return (
                            business &&
                            String(
                                business.id
                            ) === String(id)
                        );
                    }
                );

            if (
                found &&
                found.name
            ) {
                return String(
                    found.name
                );
            }
        }

        return null;
    }

    // ------------------------------------------------------------
    // İŞLETME ADINI BUL
    // ------------------------------------------------------------
    function businessName(id) {
        const key =
            String(id);

        // Önce cache
        if (
            businessNames[key]
        ) {
            return businessNames[key];
        }

        // Sonra mevcut global listeler
        const globalName =
            findBusinessInGlobals(id);

        if (globalName) {
            businessNames[key] =
                globalName;

            return globalName;
        }

        // Teknik ID'yi kullanıcıya göstermiyoruz.
        return "İşletme adı alınamadı";
    }

    // ------------------------------------------------------------
    // SUPABASE'DEN GERÇEK İŞLETME İSİMLERİNİ ÇEK
    // ------------------------------------------------------------
    async function loadBusinessNames(events) {
        if (!Array.isArray(events)) {
            return;
        }

        const ids = [];

        events.forEach(
            function (event) {
                if (
                    event.event_type !==
                        "business_view" ||
                    event.business_id === null ||
                    event.business_id === undefined
                ) {
                    return;
                }

                const id =
                    String(
                        event.business_id
                    );

                if (
                    !ids.includes(id)
                ) {
                    ids.push(id);
                }
            }
        );

        if (!ids.length) {
            return;
        }

        // Zaten cache'de olanları tekrar çekme
        const missingIds =
            ids.filter(
                function (id) {
                    return !businessNames[id];
                }
            );

        if (!missingIds.length) {
            return;
        }

        // Başka bir sorgu devam ediyorsa
        // mevcut sorgunun bitmesini bekle.
        if (businessNamesLoading) {
            let attempts = 0;

            while (
                businessNamesLoading &&
                attempts < 40
            ) {
                await new Promise(
                    function (resolve) {
                        setTimeout(
                            resolve,
                            50
                        );
                    }
                );

                attempts++;
            }

            return;
        }

        businessNamesLoading = true;

        try {
            // ----------------------------------------------------
            // SUPABASE REST
            // ----------------------------------------------------
            const filter =
                missingIds.join(",");

            const url =
                SUPABASE_URL +
                "/rest/v1/businesses" +
                "?select=id,name" +
                "&id=in.(" +
                encodeURIComponent(filter) +
                ")";

            const response =
                await fetch(
                    url,
                    {
                        method: "GET",

                        headers: {
                            "apikey":
                                SUPABASE_PUBLISHABLE_KEY,

                            "Authorization":
                                "Bearer " +
                                SUPABASE_PUBLISHABLE_KEY,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Supabase işletme sorgusu başarısız: " +
                    response.status
                );
            }

            const data =
                await response.json();

            if (Array.isArray(data)) {
                data.forEach(
                    function (business) {
                        if (
                            business &&
                            business.id !== null &&
                            business.name
                        ) {
                            businessNames[
                                String(
                                    business.id
                                )
                            ] =
                                String(
                                    business.name
                                );
                        }
                    }
                );
            }

        } catch (error) {
            console.error(
                "Analytics işletme isimleri alınamadı:",
                error
            );

        } finally {
            businessNamesLoading =
                false;
        }
    }

    // ------------------------------------------------------------
    // DÖNEM ADI
    // ------------------------------------------------------------
    function rangeName() {
        const range =
            selectedRange();

        const names = {
            "1":
                "Bugün",

            "7":
                "Son 7 Gün",

            "30":
                "Son 30 Gün",

            "90":
                "Son 90 Gün",

            "all":
                "Tüm Zamanlar"
        };

        return (
            names[range] ||
            "Son 30 Gün"
        );
    }

    // ------------------------------------------------------------
    // GÖSTER
    // ------------------------------------------------------------
    async function render() {
        const filtered =
            filterByDate(
                analyticsEvents
            );

        const businesses =
            calculate(filtered);

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
                document.createElement(
                    "div"
                );

            box.id =
                "adminAnalyticsBusinessesBox";

            dashboard.appendChild(
                box
            );
        }

        // --------------------------------------------------------
        // GERÇEK İŞLETME İSİMLERİNİ AL
        // --------------------------------------------------------
        await loadBusinessNames(
            filtered
        );

        // --------------------------------------------------------
        // VERİLERİ TEKRAR HESAPLA
        // --------------------------------------------------------
        const totalViews =
            businesses.reduce(
                function (
                    sum,
                    item
                ) {
                    return (
                        sum +
                        item.views
                    );
                },
                0
            );

        const businessCount =
            businesses.length;

        const first =
            businesses.length
                ? businesses[0]
                : null;

        // --------------------------------------------------------
        // LİSTE
        // --------------------------------------------------------
        let rows = "";

        if (!businesses.length) {
            rows = `
                <div class="analytics-business-empty">
                    Bu dönem için işletme görüntülenmesi bulunmuyor.
                </div>
            `;
        } else {
            rows =
                businesses
                    .slice(0, 20)
                    .map(
                        function (
                            item,
                            index
                        ) {
                            let rank =
                                index + 1;

                            if (
                                index === 0
                            ) {
                                rank = "🥇";
                            }

                            if (
                                index === 1
                            ) {
                                rank = "🥈";
                            }

                            if (
                                index === 2
                            ) {
                                rank = "🥉";
                            }

                            const name =
                                businessName(
                                    item.id
                                );

                            return `
                                <div class="analytics-business-row">

                                    <div class="analytics-business-rank">
                                        ${rank}
                                    </div>

                                    <div class="analytics-business-info">

                                        <div class="analytics-business-name">
                                            ${escapeHtml(
                                                name
                                            )}
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
                        }
                    )
                    .join("");
        }

        // --------------------------------------------------------
        // PANEL HTML
        // --------------------------------------------------------
        box.innerHTML = `
            <div class="analytics-business-header">

                <div class="analytics-business-title">
                    🏆 En Çok Görüntülenen İşletmeler
                </div>

                <div class="analytics-business-subtitle">
                    ${escapeHtml(
                        rangeName()
                    )}
                    dönemindeki gerçek işletme görüntülenmeleri
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
                        ${businessCount}
                    </strong>

                </div>

                <div class="analytics-business-summary-card">

                    <span>
                        En Çok Görüntülenen
                    </span>

                    <strong>
                        ${
                            first
                                ? escapeHtml(
                                    businessName(
                                        first.id
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
            document.createElement(
                "style"
            );

        style.id =
            "analyticsBusinessStyles";

        style.textContent = `
            #adminAnalyticsBusinessesBox {
                background: #fff;
                border: 1px solid #e7e9ee;
                border-radius: 18px;
                padding: 22px;
                margin: 20px 0;
                box-shadow:
                    0 6px 20px
                    rgba(16, 28, 53, .05);
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
                background: #fff;
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
                }

                .analytics-business-summary {
                    grid-template-columns: 1fr;
                    gap: 8px;
                }

                .analytics-business-row {
                    grid-template-columns:
                        34px minmax(0, 1fr) auto;
                    gap: 8px;
                    padding: 11px;
                }

                .analytics-business-name {
                    font-size: 13px;
                }

                .analytics-business-views {
                    min-width: 65px;
                }
            }
        `;

        document.head.appendChild(
            style
        );
    }

    // ------------------------------------------------------------
    // ANA ANALYTICS FONKSİYONUNU YAKALA
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
                .__businessAnalyticsStable
        ) {
            return;
        }

        const original =
            window.renderAnalyticsBox;

        function wrapped(events) {

            analyticsEvents =
                Array.isArray(events)
                    ? events.slice()
                    : [];

            const result =
                original.apply(
                    this,
                    arguments
                );

            setTimeout(
                function () {
                    render();
                },
                0
            );

            return result;
        }

        wrapped.__businessAnalyticsStable =
            true;

        window.renderAnalyticsBox =
            wrapped;
    }

    // ------------------------------------------------------------
    // FİLTRE DEĞİŞİKLİĞİNİ TAKİP ET
    // ------------------------------------------------------------
    function installFilterWatcher() {

        const filter =
            document.getElementById(
                "adminAnalyticsFilterBox"
            );

        if (!filter) {
            return;
        }

        if (
            filter.__businessWatcher
        ) {
            return;
        }

        filter.__businessWatcher =
            true;

        filter.addEventListener(
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
                    function () {
                        render();
                    },
                    50
                );
            }
        );
    }

    // ------------------------------------------------------------
    // BAŞLAT
    // ------------------------------------------------------------
    function init() {

        addStyles();

        installHook();

        installFilterWatcher();

        setTimeout(
            function () {
                installHook();
                installFilterWatcher();
            },
            500
        );

        setTimeout(
            function () {
                installHook();
                installFilterWatcher();
            },
            1500
        );

    }

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

})();