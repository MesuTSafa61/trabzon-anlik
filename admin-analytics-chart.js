// ============================================================
// TRABZON ANLIK - ANALYTICS GRAFİĞİ
// ============================================================
// TEK PARÇA ANALYTICS SİSTEMİ
//
// Tarih filtreleri:
// Bugün
// Son 7 Gün
// Son 30 Gün
// Son 90 Gün
// Tüm Zamanlar
//
// Filtre değişince:
// - Üst istatistikler
// - Analytics istatistikleri
// - Grafik
// - İşletme görüntülenmeleri
// - Olay türleri
// - Son kayıtlar
//
// birlikte güncellenir.
//
// Supabase'den filtre değişiminde tekrar veri çekilmez.
// ============================================================

(function () {

    "use strict";

    // ============================================================
    // YARDIMCI FONKSİYONLAR
    // ============================================================

    function eventType(event) {

        return String(
            event?.event_type || ""
        )
            .trim()
            .toLowerCase();

    }

    function isRealEvent(event) {

        return (
            event &&
            eventType(event) !== "test_page_view"
        );

    }

    function startOfDay(date) {

        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0,
            0,
            0,
            0
        );

    }

    function dateKey(value) {

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return null;

        }

        return [

            date.getFullYear(),

            String(
                date.getMonth() + 1
            ).padStart(2, "0"),

            String(
                date.getDate()
            ).padStart(2, "0")

        ].join("-");

    }

    function displayDate(key) {

        const parts =
            String(key).split("-");

        if (
            parts.length !== 3
        ) {

            return key;

        }

        return (
            parts[2] +
            "." +
            parts[1]
        );

    }

    // ============================================================
    // AKTİF ARALIK
    // ============================================================

    function getCurrentRange() {

        return String(

            window.__trabzonAnalyticsSelectedRange ||

            "30"

        );

    }

    function setCurrentRange(range) {

        window.__trabzonAnalyticsSelectedRange =
            String(range || "30");

    }

    // ============================================================
    // FİLTRE BUTONLARI
    // ============================================================

    function getRangeLabel(range) {

        if (
            String(range) === "1"
        ) {

            return "Bugün";

        }

        if (
            String(range) === "7"
        ) {

            return "Son 7 Gün";

        }

        if (
            String(range) === "30"
        ) {

            return "Son 30 Gün";

        }

        if (
            String(range) === "90"
        ) {

            return "Son 90 Gün";

        }

        return "Tüm Zamanlar";

    }

    // ============================================================
    // EVENTLERİ FİLTRELE
    // ============================================================

    function filterEvents(
        events,
        range
    ) {

        const realEvents = (

            Array.isArray(events)
                ? events
                : []

        ).filter(isRealEvent);

        const selected =
            String(
                range ||
                getCurrentRange()
            );

        // --------------------------------------------------------
        // TÜM ZAMANLAR
        // --------------------------------------------------------

        if (
            selected === "all"
        ) {

            return realEvents;

        }

        const days =
            Number(selected);

        if (
            !Number.isFinite(days)
        ) {

            return realEvents;

        }

        const now =
            new Date();

        const todayStart =
            startOfDay(now);

        let startDate;

        if (
            days === 1
        ) {

            startDate =
                todayStart;

        } else {

            startDate =
                new Date(
                    todayStart
                );

            startDate.setDate(

                startDate.getDate() -
                (
                    days - 1
                )

            );

        }

        return realEvents.filter(
            function (event) {

                if (
                    !event.created_at
                ) {

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

                return (
                    date >= startDate
                );

            }
        );

    }

    // ============================================================
    // GRAFİK VERİSİ
    // ============================================================

    function prepareChartData(
        events
    ) {

        const realEvents =
            (
                Array.isArray(events)
                    ? events
                    : []
            ).filter(
                isRealEvent
            );

        const range =
            getCurrentRange();

        // ========================================================
        // TÜM ZAMANLAR
        // ========================================================

        if (
            range === "all"
        ) {

            if (
                !realEvents.length
            ) {

                return [];

            }

            let earliestDate =
                null;

            let latestDate =
                null;

            realEvents.forEach(
                function (event) {

                    if (
                        !event.created_at
                    ) {

                        return;

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

                        return;

                    }

                    const day =
                        startOfDay(date);

                    if (
                        !earliestDate ||
                        day < earliestDate
                    ) {

                        earliestDate =
                            day;

                    }

                    if (
                        !latestDate ||
                        day > latestDate
                    ) {

                        latestDate =
                            day;

                    }

                }
            );

            if (
                !earliestDate ||
                !latestDate
            ) {

                return [];

            }

            const dailyData = {};

            const current =
                new Date(
                    earliestDate
                );

            while (
                current <= latestDate
            ) {

                const key =
                    dateKey(current);

                dailyData[key] = {

                    date: key,

                    visits: 0,

                    businessViews: 0,

                    total: 0

                };

                current.setDate(
                    current.getDate() + 1
                );

            }

            realEvents.forEach(
                function (event) {

                    const date =
                        new Date(
                            event.created_at
                        );

                    if (
                        Number.isNaN(
                            date.getTime()
                        )
                    ) {

                        return;

                    }

                    const key =
                        dateKey(date);

                    if (
                        !key ||
                        !dailyData[key]
                    ) {

                        return;

                    }

                    const type =
                        eventType(event);

                    dailyData[key].total++;

                    if (
                        type === "page_view"
                    ) {

                        dailyData[
                            key
                        ].visits++;

                    }

                    if (

                        type ===
                        "business_view" &&

                        event.business_id !==
                            null &&

                        event.business_id !==
                            undefined &&

                        event.business_id !== ""

                    ) {

                        dailyData[
                            key
                        ].businessViews++;

                    }

                }
            );

            return Object.values(
                dailyData
            );

        }

        // ========================================================
        // BELİRLİ ARALIK
        // ========================================================

        const days =
            Number(range);

        if (
            !Number.isFinite(days)
        ) {

            return [];

        }

        const now =
            new Date();

        const todayStart =
            startOfDay(now);

        const startDate =
            new Date(
                todayStart
            );

        startDate.setDate(

            startDate.getDate() -
            (
                days - 1
            )

        );

        const dailyData = {};

        for (
            let i = 0;
            i < days;
            i++
        ) {

            const date =
                new Date(
                    startDate
                );

            date.setDate(
                startDate.getDate() + i
            );

            const key =
                dateKey(date);

            dailyData[key] = {

                date: key,

                visits: 0,

                businessViews: 0,

                total: 0

            };

        }

        realEvents.forEach(
            function (event) {

                if (
                    !event.created_at
                ) {

                    return;

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

                    return;

                }

                if (
                    eventDate <
                    startDate
                ) {

                    return;

                }

                const key =
                    dateKey(
                        eventDate
                    );

                if (
                    !key ||
                    !dailyData[key]
                ) {

                    return;

                }

                const type =
                    eventType(event);

                dailyData[
                    key
                ].total++;

                if (
                    type === "page_view"
                ) {

                    dailyData[
                        key
                    ].visits++;

                }

                if (

                    type ===
                    "business_view" &&

                    event.business_id !==
                        null &&

                    event.business_id !==
                        undefined &&

                    event.business_id !== ""

                ) {

                    dailyData[
                        key
                    ].businessViews++;

                }

            }
        );

        return Object.values(
            dailyData
        );

    }

    // ============================================================
    // ÖZET
    // ============================================================

    function calculateSummary(
        data
    ) {

        return data.reduce(

            function (
                summary,
                item
            ) {

                summary.visits +=
                    Number(
                        item.visits
                    ) || 0;

                summary.businessViews +=
                    Number(
                        item.businessViews
                    ) || 0;

                summary.total +=
                    Number(
                        item.total
                    ) || 0;

                return summary;

            },

            {

                visits: 0,

                businessViews: 0,

                total: 0

            }

        );

    }

    // ============================================================
    // ANA İSTATİSTİKLERİ GÜNCELLE
    // ============================================================

    function updateTopStats(
        events
    ) {

        const realEvents =
            (
                Array.isArray(events)
                    ? events
                    : []
            ).filter(
                isRealEvent
            );

        const pageViews =
            realEvents.filter(
                function (event) {

                    return (
                        eventType(event) ===
                        "page_view"
                    );

                }
            ).length;

        const businessViews =
            realEvents.filter(
                function (event) {

                    return (

                        eventType(event) ===
                        "business_view" &&

                        event.business_id !==
                            null &&

                        event.business_id !==
                            undefined &&

                        event.business_id !== ""

                    );

                }
            ).length;

        const uniqueVisitorIds =
            realEvents
                .map(
                    function (event) {

                        return event.visitor_id;

                    }
                )
                .filter(
                    function (value) {

                        return (

                            value !==
                                null &&

                            value !==
                                undefined &&

                            value !== ""

                        );

                    }
                )
                .map(
                    function (value) {

                        return String(
                            value
                        );

                    }
                );

        const uniqueVisitors =
            new Set(
                uniqueVisitorIds
            ).size;

        const totalEvents =
            realEvents.length;

        // --------------------------------------------------------
        // Olası ID'ler
        // --------------------------------------------------------

        const ids = {

            events: [
                "statAnalyticsEvents",
                "statTotalEvents",
                "analyticsTotalEvents"
            ],

            visitors: [
                "statUniqueVisitors",
                "statVisitors",
                "analyticsUniqueVisitors"
            ],

            businessViews: [
                "statBusinessViews",
                "statBusinessView",
                "analyticsBusinessViews"
            ]

        };

        function setIds(
            list,
            value
        ) {

            list.forEach(
                function (id) {

                    const element =
                        document.getElementById(
                            id
                        );

                    if (
                        element
                    ) {

                        element.textContent =
                            value;

                    }

                }
            );

        }

        setIds(
            ids.events,
            totalEvents
        );

        setIds(
            ids.visitors,
            uniqueVisitors
        );

        setIds(
            ids.businessViews,
            businessViews
        );

        // --------------------------------------------------------
        // Sayfa görüntülenmesi
        // --------------------------------------------------------

        const pageViewElements =
            document.querySelectorAll(
                "[data-analytics-page-views]"
            );

        pageViewElements.forEach(
            function (element) {

                element.textContent =
                    pageViews;

            }
        );

        return {

            totalEvents:
                totalEvents,

            pageViews:
                pageViews,

            businessViews:
                businessViews,

            uniqueVisitors:
                uniqueVisitors

        };

    }

    // ============================================================
    // TARİH FİLTRE KUTUSU
    // ============================================================

    function renderDateFilter() {

        const dashboard =
            document.getElementById(
                "section-dashboard"
            );

        if (
            !dashboard
        ) {

            return;

        }

        let box =
            document.getElementById(
                "trabzonAnalyticsDateFilter"
            );

        if (
            !box
        ) {

            box =
                document.createElement(
                    "div"
                );

            box.id =
                "trabzonAnalyticsDateFilter";

            dashboard.appendChild(
                box
            );

        }

        const active =
            getCurrentRange();

        box.innerHTML = `

            <div style="

                background:#ffffff;

                border:1px solid #e7e9ee;

                border-radius:18px;

                padding:20px;

                margin-top:20px;

                margin-bottom:20px;

                box-shadow:
                    0 8px 30px
                    rgba(16,28,53,.05);

            ">

                <div style="

                    color:#101c35;

                    font-size:17px;

                    font-weight:800;

                ">

                    📅 Analytics Dönemi

                </div>

                <div style="

                    color:#70798b;

                    font-size:12px;

                    margin-top:4px;

                ">

                    İstatistikleri istediğin
                    tarih aralığına göre görüntüle

                </div>

                <div style="

                    display:flex;

                    flex-wrap:wrap;

                    gap:8px;

                    margin-top:16px;

                ">

                    ${createFilterButton(
                        "1",
                        "Bugün",
                        active
                    )}

                    ${createFilterButton(
                        "7",
                        "Son 7 Gün",
                        active
                    )}

                    ${createFilterButton(
                        "30",
                        "Son 30 Gün",
                        active
                    )}

                    ${createFilterButton(
                        "90",
                        "Son 90 Gün",
                        active
                    )}

                    ${createFilterButton(
                        "all",
                        "Tüm Zamanlar",
                        active
                    )}

                </div>

            </div>

        `;

        const buttons =
            box.querySelectorAll(
                "[data-trabzon-range]"
            );

        buttons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const range =
                            this.getAttribute(
                                "data-trabzon-range"
                            );

                        changeRange(
                            range
                        );

                    }
                );

            }
        );

    }

    // ============================================================
    // BUTON HTML
    // ============================================================

    function createFilterButton(
        range,
        label,
        active
    ) {

        const isActive =
            String(range) ===
            String(active);

        return `

            <button
                type="button"
                data-trabzon-range="${range}"
                style="

                    appearance:none;

                    border:1px solid
                        ${isActive
                            ? "#7b1830"
                            : "#e1e4ea"};

                    background:
                        ${isActive
                            ? "#7b1830"
                            : "#f6f7f9"};

                    color:
                        ${isActive
                            ? "#ffffff"
                            : "#182033"};

                    border-radius:999px;

                    padding:9px 15px;

                    font-size:12px;

                    font-weight:700;

                    cursor:pointer;

                "
            >

                ${label}

            </button>

        `;

    }

    // ============================================================
    // TARİH DEĞİŞTİR
    // ============================================================

    async function changeRange(
        range
    ) {

        const selected =
            String(
                range || "30"
            );

        // --------------------------------------------------------
        // Aktif aralığı kaydet
        // --------------------------------------------------------

        setCurrentRange(
            selected
        );

        // --------------------------------------------------------
        // TÜM VERİYİ AL
        // --------------------------------------------------------

        const allEvents =
            Array.isArray(
                window.__trabzonAnalyticsAllEvents
            )
                ? window.__trabzonAnalyticsAllEvents
                : [];

        // --------------------------------------------------------
        // Henüz veri yüklenmemişse
        // --------------------------------------------------------

        if (
            !allEvents.length
        ) {

            if (
                typeof window.loadAnalytics ===
                "function"
            ) {

                await window.loadAnalytics();

            }

            // loadAnalytics sonrasında tekrar al
            const loadedEvents =
                Array.isArray(
                    window.__trabzonAnalyticsAllEvents
                )
                    ? window.__trabzonAnalyticsAllEvents
                    : [];

            if (
                !loadedEvents.length
            ) {

                renderDateFilter();

                return;

            }

            await applyRangeToAll(
                loadedEvents,
                selected
            );

            return;

        }

        await applyRangeToAll(
            allEvents,
            selected
        );

    }

    // ============================================================
    // FİLTREYİ TÜM SİSTEME UYGULA
    // ============================================================

    async function applyRangeToAll(
        allEvents,
        range
    ) {

        setCurrentRange(
            range
        );

        const filtered =
            filterEvents(
                allEvents,
                range
            );

        // --------------------------------------------------------
        // Global veriler
        // --------------------------------------------------------

        window.__trabzonAnalyticsFilteredEvents =
            filtered;

        window.__trabzonAnalyticsChartEvents =
            filtered;

        window.allAnalyticsEvents =
            filtered;

        // --------------------------------------------------------
        // ÜST SAYILAR
        // --------------------------------------------------------

        updateTopStats(
            filtered
        );

        // --------------------------------------------------------
        // ANA ANALYTICS KUTUSU
        // --------------------------------------------------------

        if (
            typeof window.renderAnalyticsBox ===
            "function"
        ) {

            await window.renderAnalyticsBox(
                filtered
            );

        }

        // --------------------------------------------------------
        // Tarih filtresini tekrar çiz
        // --------------------------------------------------------

        renderDateFilter();

        // --------------------------------------------------------
        // Grafik
        // --------------------------------------------------------

        renderAnalyticsChart(
            filtered
        );

    }

    // ============================================================
    // GRAFİK
    // ============================================================

    function renderAnalyticsChart(
        suppliedEvents
    ) {

        const dashboardSection =
            document.getElementById(
                "section-dashboard"
            );

        if (
            !dashboardSection
        ) {

            return;

        }

        // Eski grafik
        const oldChart =
            document.getElementById(
                "adminAnalyticsChartBox"
            );

        if (
            oldChart
        ) {

            oldChart.remove();

        }

        let events;

        if (
            Array.isArray(
                suppliedEvents
            )
        ) {

            events =
                suppliedEvents;

        } else if (

            Array.isArray(
                window.__trabzonAnalyticsFilteredEvents
            )

        ) {

            events =
                window.__trabzonAnalyticsFilteredEvents;

        } else {

            events =
                [];

        }

        const data =
            prepareChartData(
                events
            );

        const summary =
            calculateSummary(
                data
            );

        const range =
            getCurrentRange();

        const rangeText =
            getRangeLabel(
                range
            );

        // ========================================================
        // KUTU
        // ========================================================

        const box =
            document.createElement(
                "div"
            );

        box.id =
            "adminAnalyticsChartBox";

        box.style.cssText = `

            margin-top:24px;

            background:#ffffff;

            border:1px solid #e7e9ee;

            border-radius:18px;

            padding:24px;

            box-shadow:
                0 8px 30px
                rgba(16,28,53,.06);

        `;

        box.innerHTML = `

            <div style="

                display:flex;

                justify-content:
                    space-between;

                align-items:
                    flex-start;

                gap:18px;

                flex-wrap:wrap;

            ">

                <div>

                    <div style="

                        font-size:22px;

                        font-weight:800;

                        color:#101c35;

                    ">

                        📈 Ziyaretçi Trendi

                    </div>

                    <div style="

                        margin-top:5px;

                        color:#70798b;

                        font-size:13px;

                    ">

                        ${rangeText}
                        dönemindeki gerçek
                        kullanıcı hareketleri

                    </div>

                </div>

                <div style="

                    background:#f6f7f9;

                    border:1px solid #e7e9ee;

                    color:#101c35;

                    border-radius:999px;

                    padding:8px 13px;

                    font-size:12px;

                    font-weight:700;

                ">

                    ${rangeText}

                </div>

            </div>

            <div style="

                display:grid;

                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(150px,1fr)
                    );

                gap:12px;

                margin-top:22px;

            ">

                <div style="

                    padding:15px;

                    border-radius:13px;

                    background:#f6f7f9;

                    border:1px solid #e7e9ee;

                ">

                    <div style="

                        font-size:12px;

                        color:#70798b;

                    ">

                        Siteye Giriş

                    </div>

                    <div style="

                        margin-top:5px;

                        font-size:24px;

                        font-weight:800;

                        color:#7b1830;

                    ">

                        ${summary.visits}

                    </div>

                </div>

                <div style="

                    padding:15px;

                    border-radius:13px;

                    background:#f6f7f9;

                    border:1px solid #e7e9ee;

                ">

                    <div style="

                        font-size:12px;

                        color:#70798b;

                    ">

                        İşletme Görüntülenmesi

                    </div>

                    <div style="

                        margin-top:5px;

                        font-size:24px;

                        font-weight:800;

                        color:#101c35;

                    ">

                        ${summary.businessViews}

                    </div>

                </div>

                <div style="

                    padding:15px;

                    border-radius:13px;

                    background:#f6f7f9;

                    border:1px solid #e7e9ee;

                ">

                    <div style="

                        font-size:12px;

                        color:#70798b;

                    ">

                        Toplam Gerçek Olay

                    </div>

                    <div style="

                        margin-top:5px;

                        font-size:24px;

                        font-weight:800;

                        color:#101c35;

                    ">

                        ${summary.total}

                    </div>

                </div>

            </div>

            <div style="

                display:flex;

                flex-wrap:wrap;

                gap:18px;

                margin-top:22px;

                margin-bottom:12px;

                font-size:13px;

                color:#70798b;

            ">

                <span>

                    <span style="

                        display:inline-block;

                        width:9px;

                        height:9px;

                        border-radius:50%;

                        background:#7b1830;

                        margin-right:6px;

                    "></span>

                    Siteye giriş

                </span>

                <span>

                    <span style="

                        display:inline-block;

                        width:9px;

                        height:9px;

                        border-radius:50%;

                        background:#5c1023;

                        margin-right:6px;

                    "></span>

                    İşletme görüntülenmesi

                </span>

                <span>

                    <span style="

                        display:inline-block;

                        width:9px;

                        height:9px;

                        border-radius:50%;

                        background:#101c35;

                        margin-right:6px;

                    "></span>

                    Toplam gerçek olay

                </span>

            </div>

            <div style="

                position:relative;

                width:100%;

                overflow-x:auto;

                overflow-y:hidden;

                border-top:
                    1px solid #eef0f4;

                padding-top:18px;

            ">

                <div
                    id="analyticsChartCanvasWrap"
                    style="

                        position:relative;

                        min-width:
                            ${
                                range === "90" ||
                                range === "all"
                                    ? "1100px"
                                    : "760px"
                            };

                        height:320px;

                    "
                >

                    <canvas
                        id="adminAnalyticsChartCanvas"
                        style="

                            display:block;

                            width:100%;

                            height:320px;

                        "
                    ></canvas>

                </div>

            </div>

            <div style="

                margin-top:14px;

                color:#70798b;

                font-size:12px;

            ">

                Test kayıtları grafiğe dahil edilmez.

            </div>

        `;

        dashboardSection.appendChild(
            box
        );

        drawAnalyticsChart(
            data
        );

    }

    // ============================================================
    // CANVAS GRAFİĞİ
    // ============================================================

    function drawAnalyticsChart(
        data
    ) {

        const canvas =
            document.getElementById(
                "adminAnalyticsChartCanvas"
            );

        const wrapper =
            document.getElementById(
                "analyticsChartCanvasWrap"
            );

        if (
            !canvas ||
            !wrapper
        ) {

            return;

        }

        const range =
            getCurrentRange();

        const width =
            Math.max(

                (
                    range === "90" ||
                    range === "all"
                )
                    ? 1100
                    : 760,

                wrapper.clientWidth ||
                760

            );

        const height =
            320;

        const dpr =
            window.devicePixelRatio ||
            1;

        canvas.width =
            width * dpr;

        canvas.height =
            height * dpr;

        canvas.style.width =
            width + "px";

        canvas.style.height =
            height + "px";

        const ctx =
            canvas.getContext(
                "2d"
            );

        if (
            !ctx
        ) {

            return;

        }

        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

        ctx.clearRect(
            0,
            0,
            width,
            height
        );

        const paddingLeft =
            48;

        const paddingRight =
            24;

        const paddingTop =
            22;

        const paddingBottom =
            48;

        const chartWidth =
            width -
            paddingLeft -
            paddingRight;

        const chartHeight =
            height -
            paddingTop -
            paddingBottom;

        // ========================================================
        // MAX
        // ========================================================

        let maxValue =
            0;

        data.forEach(
            function (item) {

                maxValue =
                    Math.max(

                        maxValue,

                        Number(
                            item.visits
                        ) || 0,

                        Number(
                            item.businessViews
                        ) || 0,

                        Number(
                            item.total
                        ) || 0

                    );

            }
        );

        if (
            maxValue <= 0
        ) {

            maxValue =
                5;

        } else if (
            maxValue <= 10
        ) {

            maxValue =
                Math.ceil(
                    maxValue / 5
                ) * 5;

        } else {

            maxValue =
                Math.ceil(
                    maxValue / 10
                ) * 10;

        }

        const pointCount =
            data.length;

        function getX(index) {

            if (
                pointCount <= 1
            ) {

                return (
                    paddingLeft +
                    chartWidth / 2
                );

            }

            return (

                paddingLeft +

                (
                    index /
                    (pointCount - 1)
                ) *
                chartWidth

            );

        }

        function getY(value) {

            return (

                paddingTop +

                chartHeight -

                (
                    (
                        Number(value) ||
                        0
                    ) /
                    maxValue
                ) *
                chartHeight

            );

        }

        // ========================================================
        // Y EKSENİ
        // ========================================================

        ctx.font =
            "12px Arial";

        ctx.textAlign =
            "right";

        ctx.textBaseline =
            "middle";

        for (
            let i = 0;
            i <= 5;
            i++
        ) {

            const value =
                (
                    maxValue / 5
                ) * i;

            const y =
                paddingTop +
                chartHeight -
                (
                    value /
                    maxValue
                ) *
                chartHeight;

            ctx.beginPath();

            ctx.moveTo(
                paddingLeft,
                y
            );

            ctx.lineTo(
                width -
                paddingRight,
                y
            );

            ctx.strokeStyle =
                "#eef0f4";

            ctx.lineWidth =
                1;

            ctx.stroke();

            ctx.fillStyle =
                "#70798b";

            ctx.fillText(

                String(
                    Math.round(
                        value
                    )
                ),

                paddingLeft -
                10,

                y

            );

        }

        // ========================================================
        // X EKSENİ
        // ========================================================

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "top";

        ctx.font =
            "11px Arial";

        ctx.fillStyle =
            "#70798b";

        let labelEvery =
            5;

        if (
            range === "1"
        ) {

            labelEvery =
                1;

        } else if (
            range === "7"
        ) {

            labelEvery =
                1;

        } else if (
            range === "30"
        ) {

            labelEvery =
                5;

        } else if (
            range === "90"
        ) {

            labelEvery =
                10;

        } else if (
            range === "all"
        ) {

            labelEvery =
                Math.max(

                    1,

                    Math.ceil(
                        data.length / 10
                    )

                );

        }

        data.forEach(
            function (
                item,
                index
            ) {

                if (

                    index === 0 ||

                    index ===
                        data.length - 1 ||

                    index %
                        labelEvery === 0

                ) {

                    ctx.fillText(

                        displayDate(
                            item.date
                        ),

                        getX(index),

                        height -
                        paddingBottom +
                        16

                    );

                }

            }
        );

        // ========================================================
        // ÇİZGİ
        // ========================================================

        function drawLine(
            key,
            lineColor,
            lineWidth
        ) {

            if (
                !data.length
            ) {

                return;

            }

            ctx.beginPath();

            data.forEach(
                function (
                    item,
                    index
                ) {

                    const x =
                        getX(index);

                    const y =
                        getY(
                            item[key]
                        );

                    if (
                        index === 0
                    ) {

                        ctx.moveTo(
                            x,
                            y
                        );

                    } else {

                        ctx.lineTo(
                            x,
                            y
                        );

                    }

                }
            );

            ctx.strokeStyle =
                lineColor;

            ctx.lineWidth =
                lineWidth;

            ctx.lineJoin =
                "round";

            ctx.lineCap =
                "round";

            ctx.stroke();

            data.forEach(
                function (
                    item,
                    index
                ) {

                    const x =
                        getX(index);

                    const y =
                        getY(
                            item[key]
                        );

                    ctx.beginPath();

                    ctx.arc(

                        x,

                        y,

                        (
                            range === "90" ||
                            range === "all"
                        )
                            ? 2.5
                            : 3.5,

                        0,

                        Math.PI * 2

                    );

                    ctx.fillStyle =
                        lineColor;

                    ctx.fill();

                }
            );

        }

        // ========================================================
        // ÇİZGİLER
        // ========================================================

        drawLine(
            "total",
            "#101c35",
            2
        );

        drawLine(
            "businessViews",
            "#5c1023",
            2
        );

        drawLine(
            "visits",
            "#7b1830",
            3
        );

        // ========================================================
        // VERİ YOK
        // ========================================================

        const hasData =
            data.some(
                function (item) {

                    return (

                        Number(
                            item.visits
                        ) > 0 ||

                        Number(
                            item.businessViews
                        ) > 0 ||

                        Number(
                            item.total
                        ) > 0

                    );

                }
            );

        if (
            !hasData
        ) {

            ctx.textAlign =
                "center";

            ctx.textBaseline =
                "middle";

            ctx.font =
                "14px Arial";

            ctx.fillStyle =
                "#70798b";

            ctx.fillText(

                "Bu tarih aralığında gerçek analytics verisi bulunmuyor.",

                width / 2,

                height / 2

            );

        }

    }

    // ============================================================
    // GLOBAL FONKSİYONLAR
    // ============================================================

    window.renderAnalyticsChart =
        renderAnalyticsChart;

    window.changeAnalyticsRange =
        changeRange;

    window.applyAnalyticsDateFilter =
        function (range) {

            const allEvents =
                Array.isArray(
                    window.__trabzonAnalyticsAllEvents
                )
                    ? window.__trabzonAnalyticsAllEvents
                    : [];

            if (
                !allEvents.length
            ) {

                return changeRange(
                    range
                );

            }

            return applyRangeToAll(
                allEvents,
                String(
                    range || "30"
                )
            );

        };

    // Eski sistemlerle uyumluluk
    window.refreshAnalytics =
        function () {

            return changeRange(
                getCurrentRange()
            );

        };

    // ============================================================
    // BAŞLANGIÇ
    // ============================================================

    function initAnalyticsChart() {

        // Varsayılan Son 30 Gün
        if (
            !window.__trabzonAnalyticsSelectedRange
        ) {

            setCurrentRange(
                "30"
            );

        }

        renderDateFilter();

        // Analytics verisi zaten yüklendiyse
        if (
            Array.isArray(
                window.__trabzonAnalyticsFilteredEvents
            ) &&
            window.__trabzonAnalyticsFilteredEvents.length
        ) {

            renderAnalyticsChart(
                window.__trabzonAnalyticsFilteredEvents
            );

        }

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
            function () {

                setTimeout(
                    initAnalyticsChart,
                    500
                );

            }
        );

    } else {

        setTimeout(
            initAnalyticsChart,
            500
        );

    }

    // ============================================================
    // RESIZE
    // ============================================================

    let resizeTimer =
        null;

    window.addEventListener(
        "resize",
        function () {

            clearTimeout(
                resizeTimer
            );

            resizeTimer =
                setTimeout(
                    function () {

                        const chart =
                            document.getElementById(
                                "adminAnalyticsChartBox"
                            );

                        if (
                            chart
                        ) {

                            renderAnalyticsChart();

                        }

                    },
                    200
                );

        }
    );

})();