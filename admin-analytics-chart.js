// ============================================================
// TRABZON ANLIK - ANALYTICS GRAFİĞİ
// ============================================================
// Ana Analytics tarih filtresi ile tamamen uyumlu sürüm.
//
// Grafik artık kendi 7/30/90 filtresini kullanmaz.
// Ana filtre:
// Bugün / Son 7 Gün / Son 30 Gün / Son 90 Gün / Tüm Zamanlar
//
// Hangisi seçilirse grafik de aynı aralığı gösterir.
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
    // AKTİF TARİH ARALIĞINI AL
    // ============================================================

    function getCurrentRange() {

        return String(

            window.__trabzonAnalyticsSelectedRange ||

            "30"

        );

    }

    // ============================================================
    // GÜN SAYISINI BELİRLE
    // ============================================================

    function getRangeDays(range) {

        if (range === "1") {

            return 1;

        }

        if (range === "7") {

            return 7;

        }

        if (range === "30") {

            return 30;

        }

        if (range === "90") {

            return 90;

        }

        // Tüm zamanlar için
        // gerçek eventlerin gün aralığı
        return null;

    }

    // ============================================================
    // GRAFİK VERİSİNİ HAZIRLA
    // ============================================================

    function prepareChartData(events) {

        const realEvents = (

            Array.isArray(events)
                ? events
                : []

        ).filter(isRealEvent);

        const range =
            getCurrentRange();

        // ========================================================
        // TÜM ZAMANLAR
        // ========================================================

        if (range === "all") {

            if (!realEvents.length) {

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

                    const key =
                        dateKey(eventDate);

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

                        dailyData[key].visits++;

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
        // BELİRLİ GÜN ARALIĞI
        // ========================================================

        const days =
            getRangeDays(range);

        if (
            !days
        ) {

            return [];

        }

        const now =
            new Date();

        const startDate =
            startOfDay(

                new Date(

                    now.getFullYear(),

                    now.getMonth(),

                    now.getDate() -
                        (days - 1)

                )

            );

        const dailyData = {};

        // Günleri oluştur
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

        // Eventleri günlere dağıt
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
                    dateKey(eventDate);

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

                    dailyData[key].visits++;

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

    function calculateSummary(data) {

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
    // GRAFİK KUTUSUNU OLUŞTUR
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

        // --------------------------------------------------------
        // Eski grafik
        // --------------------------------------------------------

        const oldChart =
            document.getElementById(
                "adminAnalyticsChartBox"
            );

        if (
            oldChart
        ) {

            oldChart.remove();

        }

        // --------------------------------------------------------
        // Veri
        // --------------------------------------------------------

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

        } else if (

            Array.isArray(
                window.__trabzonAnalyticsAllEvents
            )

        ) {

            events =
                window.__trabzonAnalyticsAllEvents;

        } else {

            events = [];

        }

        // --------------------------------------------------------
        // Grafik verisi
        // --------------------------------------------------------

        const data =
            prepareChartData(
                events
            );

        const summary =
            calculateSummary(
                data
            );

        const activeRange =
            getCurrentRange();

        let rangeText =
            "Son 30 Gün";

        if (
            activeRange === "1"
        ) {

            rangeText =
                "Bugün";

        } else if (
            activeRange === "7"
        ) {

            rangeText =
                "Son 7 Gün";

        } else if (
            activeRange === "90"
        ) {

            rangeText =
                "Son 90 Gün";

        } else if (
            activeRange === "all"
        ) {

            rangeText =
                "Tüm Zamanlar";

        }

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

            <!-- ÖZET KARTLARI -->

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

            <!-- LEJANT -->

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

            <!-- GRAFİK -->

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
                            ${activeRange === "90"
                                ? "1100px"
                                : activeRange === "all"
                                    ? "1100px"
                                    : "760px"};

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

        // ========================================================
        // GRAFİĞİ ÇİZ
        // ========================================================

        drawAnalyticsChart(
            data
        );

    }

    // ============================================================
    // CANVAS
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

        // ========================================================
        // ÖLÇÜLER
        // ========================================================

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
        // MAX DEĞER
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

        // ========================================================
        // NOKTA KOORDİNATLARI
        // ========================================================

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

            const count =
                data.length;

            labelEvery =
                Math.max(
                    1,
                    Math.ceil(
                        count / 10
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

            // Noktalar
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
    // GLOBAL FONKSİYON
    // ============================================================

    window.renderAnalyticsChart =
        renderAnalyticsChart;

    // ============================================================
    // ESKİ HOOK YOK
    // ============================================================
    // ÖNEMLİ:
    //
    // Eski dosyada window.renderAnalyticsBox
    // sarılıyordu.
    //
    // Bu sürümde bunu YAPMIYORUZ.
    //
    // Böylece:
    //
    // admin-analytics.js
    //        ↓
    // admin-analytics-filter.js
    //        ↓
    // renderAnalyticsChart()
    //
    // şeklinde tek sistem çalışıyor.
    // ============================================================

    // ============================================================
    // SAYFA AÇILIŞI
    // ============================================================

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            setTimeout(
                function () {

                    if (
                        typeof window
                            .renderAnalyticsChart ===
                        "function"
                    ) {

                        renderAnalyticsChart();

                    }

                },
                700
            );

        }
    );

    // ============================================================
    // PENCERE BOYUTU
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