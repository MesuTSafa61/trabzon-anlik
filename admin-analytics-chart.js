// ============================================================
// TRABZON ANLIK - ANALYTICS GRAFİĞİ
// Profesyonel günlük ziyaret / işletme görüntülenme grafiği
// ============================================================

(function () {
    "use strict";

    // ============================================================
    // YARDIMCI FONKSİYONLAR
    // ============================================================

    function eventType(event) {
        return String(event?.event_type || "")
            .trim()
            .toLowerCase();
    }

    function isRealEvent(event) {
        return eventType(event) !== "test_page_view";
    }

    function dateKey(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function displayDate(key, days) {
        const parts = String(key).split("-");

        if (parts.length !== 3) {
            return key;
        }

        if (days >= 90) {
            return `${parts[2]}.${parts[1]}`;
        }

        return `${parts[2]}.${parts[1]}`;
    }

    function startOfDay(date) {
        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ============================================================
    // AKTİF GÜN SAYISI
    // ============================================================

    let analyticsChartDays = 30;

    // ============================================================
    // VERİYİ HAZIRLA
    // ============================================================

    function prepareChartData(events, days) {
        const realEvents = (Array.isArray(events) ? events : [])
            .filter(isRealEvent);

        const now = new Date();

        const startDate = startOfDay(
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - (days - 1)
            )
        );

        const dailyData = {};

        // Günleri oluştur
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);

            date.setDate(startDate.getDate() + i);

            const key = dateKey(date);

            dailyData[key] = {
                date: key,
                visits: 0,
                businessViews: 0,
                total: 0
            };
        }

        // Olayları dağıt
        realEvents.forEach((event) => {
            const eventDate = new Date(event.created_at);

            if (Number.isNaN(eventDate.getTime())) {
                return;
            }

            if (eventDate < startDate) {
                return;
            }

            const key = dateKey(eventDate);

            if (!key || !dailyData[key]) {
                return;
            }

            const type = eventType(event);

            dailyData[key].total++;

            if (type === "page_view") {
                dailyData[key].visits++;
            }

            if (
                type === "business_view" &&
                event.business_id !== null &&
                event.business_id !== undefined &&
                event.business_id !== ""
            ) {
                dailyData[key].businessViews++;
            }
        });

        return Object.values(dailyData);
    }

    // ============================================================
    // İSTATİSTİK ÖZETİ
    // ============================================================

    function calculateSummary(data) {
        return data.reduce(
            (summary, item) => {
                summary.visits += Number(item.visits) || 0;
                summary.businessViews +=
                    Number(item.businessViews) || 0;
                summary.total += Number(item.total) || 0;

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
    // GRAFİĞİ OLUŞTUR
    // ============================================================

    function renderAnalyticsChart() {
        const dashboardSection =
            document.getElementById("section-dashboard");

        if (!dashboardSection) {
            return;
        }

        const oldChart =
            document.getElementById("adminAnalyticsChartBox");

        if (oldChart) {
            oldChart.remove();
        }

        const events = Array.isArray(window.allAnalyticsEvents)
            ? window.allAnalyticsEvents
            : [];

        const data = prepareChartData(
            events,
            analyticsChartDays
        );

        const summary = calculateSummary(data);

        // ========================================================
        // KUTU
        // ========================================================

        const box = document.createElement("div");

        box.id = "adminAnalyticsChartBox";

        box.style.cssText = `
            margin-top:24px;
            background:#ffffff;
            border:1px solid #e7e9ee;
            border-radius:18px;
            padding:24px;
            box-shadow:0 8px 30px rgba(16,28,53,.06);
        `;

        box.innerHTML = `
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
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
                        Gerçek kullanıcı hareketlerinin günlük analizi
                    </div>
                </div>

                <div id="analyticsChartPeriodButtons"
                    style="
                        display:flex;
                        gap:6px;
                        flex-wrap:wrap;
                    "
                >

                    <button
                        type="button"
                        data-days="7"
                        style="
                            border:1px solid #e7e9ee;
                            background:${analyticsChartDays === 7 ? "#7b1830" : "#ffffff"};
                            color:${analyticsChartDays === 7 ? "#ffffff" : "#182033"};
                            border-radius:9px;
                            padding:8px 13px;
                            font-size:12px;
                            font-weight:700;
                            cursor:pointer;
                        "
                    >
                        7 Gün
                    </button>

                    <button
                        type="button"
                        data-days="30"
                        style="
                            border:1px solid #e7e9ee;
                            background:${analyticsChartDays === 30 ? "#7b1830" : "#ffffff"};
                            color:${analyticsChartDays === 30 ? "#ffffff" : "#182033"};
                            border-radius:9px;
                            padding:8px 13px;
                            font-size:12px;
                            font-weight:700;
                            cursor:pointer;
                        "
                    >
                        30 Gün
                    </button>

                    <button
                        type="button"
                        data-days="90"
                        style="
                            border:1px solid #e7e9ee;
                            background:${analyticsChartDays === 90 ? "#7b1830" : "#ffffff"};
                            color:${analyticsChartDays === 90 ? "#ffffff" : "#182033"};
                            border-radius:9px;
                            padding:8px 13px;
                            font-size:12px;
                            font-weight:700;
                            cursor:pointer;
                        "
                    >
                        90 Gün
                    </button>

                </div>
            </div>

            <!-- ÖZET KARTLARI -->

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(auto-fit,minmax(150px,1fr));
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
                border-top:1px solid #eef0f4;
                padding-top:18px;
            ">

                <div id="analyticsChartCanvasWrap"
                    style="
                        position:relative;
                        min-width:${analyticsChartDays >= 90 ? "1100px" : "760px"};
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
                Test kayıtları ve geçersiz analytics olayları grafiğe dahil edilmez.
            </div>
        `;

        dashboardSection.appendChild(box);

        // ========================================================
        // FİLTRE BUTONLARI
        // ========================================================

        const buttons =
            box.querySelectorAll(
                "#analyticsChartPeriodButtons button"
            );

        buttons.forEach((button) => {
            button.addEventListener("click", function () {
                const days =
                    Number(this.dataset.days);

                if (![7, 30, 90].includes(days)) {
                    return;
                }

                analyticsChartDays = days;

                renderAnalyticsChart();
            });
        });

        drawAnalyticsChart(data);
    }

    // ============================================================
    // CANVAS GRAFİĞİ
    // ============================================================

    function drawAnalyticsChart(data) {
        const canvas =
            document.getElementById(
                "adminAnalyticsChartCanvas"
            );

        const wrapper =
            document.getElementById(
                "analyticsChartCanvasWrap"
            );

        if (!canvas || !wrapper) {
            return;
        }

        const width = Math.max(
            analyticsChartDays >= 90 ? 1100 : 760,
            wrapper.clientWidth || 760
        );

        const height = 320;

        const dpr =
            window.devicePixelRatio || 1;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        const ctx = canvas.getContext("2d");

        if (!ctx) {
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

        const paddingLeft = 48;
        const paddingRight = 24;
        const paddingTop = 22;
        const paddingBottom = 48;

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

        let maxValue = 0;

        data.forEach((item) => {
            maxValue = Math.max(
                maxValue,
                Number(item.visits) || 0,
                Number(item.businessViews) || 0,
                Number(item.total) || 0
            );
        });

        if (maxValue <= 0) {
            maxValue = 5;
        } else {
            const step =
                maxValue <= 10
                    ? 5
                    : maxValue <= 50
                        ? 10
                        : 10;

            maxValue =
                Math.ceil(maxValue / step) * step;
        }

        // ========================================================
        // NOKTA KOORDİNATLARI
        // ========================================================

        const pointCount = data.length;

        function getX(index) {
            if (pointCount <= 1) {
                return (
                    paddingLeft +
                    chartWidth / 2
                );
            }

            return (
                paddingLeft +
                (index /
                    (pointCount - 1)) *
                    chartWidth
            );
        }

        function getY(value) {
            return (
                paddingTop +
                chartHeight -
                ((Number(value) || 0) /
                    maxValue) *
                    chartHeight
            );
        }

        // ========================================================
        // Y EKSENİ
        // ========================================================

        ctx.font = "12px Arial";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        for (let i = 0; i <= 5; i++) {
            const value =
                (maxValue / 5) * i;

            const y =
                paddingTop +
                chartHeight -
                (value / maxValue) *
                    chartHeight;

            ctx.beginPath();

            ctx.moveTo(
                paddingLeft,
                y
            );

            ctx.lineTo(
                width - paddingRight,
                y
            );

            ctx.strokeStyle =
                "#eef0f4";

            ctx.lineWidth = 1;

            ctx.stroke();

            ctx.fillStyle =
                "#70798b";

            ctx.fillText(
                String(Math.round(value)),
                paddingLeft - 10,
                y
            );
        }

        // ========================================================
        // X EKSENİ
        // ========================================================

        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.font = "11px Arial";
        ctx.fillStyle = "#70798b";

        let labelEvery = 5;

        if (analyticsChartDays === 7) {
            labelEvery = 1;
        } else if (analyticsChartDays === 30) {
            labelEvery = 5;
        } else if (analyticsChartDays === 90) {
            labelEvery = 10;
        }

        data.forEach((item, index) => {
            if (
                index === 0 ||
                index === data.length - 1 ||
                index % labelEvery === 0
            ) {
                ctx.fillText(
                    displayDate(
                        item.date,
                        analyticsChartDays
                    ),
                    getX(index),
                    height -
                        paddingBottom +
                        16
                );
            }
        });

        // ========================================================
        // ÇİZGİ ÇİZ
        // ========================================================

        function drawLine(
            key,
            lineColor,
            lineWidth
        ) {
            if (!data.length) {
                return;
            }

            ctx.beginPath();

            data.forEach((item, index) => {
                const x = getX(index);
                const y = getY(item[key]);

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.strokeStyle = lineColor;
            ctx.lineWidth = lineWidth;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";

            ctx.stroke();

            // Noktalar
            data.forEach((item, index) => {
                const x = getX(index);
                const y = getY(item[key]);

                ctx.beginPath();

                ctx.arc(
                    x,
                    y,
                    analyticsChartDays === 90
                        ? 2.5
                        : 3.5,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    lineColor;

                ctx.fill();
            });
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
        // VERİ YOKSA MESAJ
        // ========================================================

        const hasData =
            data.some((item) => {
                return (
                    item.visits > 0 ||
                    item.businessViews > 0 ||
                    item.total > 0
                );
            });

        if (!hasData) {
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "14px Arial";
            ctx.fillStyle = "#70798b";

            ctx.fillText(
                "Bu tarih aralığında gerçek analytics verisi bulunmuyor.",
                width / 2,
                height / 2
            );
        }
    }

    // ============================================================
    // ANALYTICS KUTUSUNA HOOK
    // ============================================================

    function installAnalyticsChartHook() {
        if (
            typeof window.renderAnalyticsBox !==
                "function" ||
            window.__trabzonAnalyticsChartHookInstalled
        ) {
            return;
        }

        window.__trabzonAnalyticsChartHookInstalled =
            true;

        const originalRenderAnalyticsBox =
            window.renderAnalyticsBox;

        window.renderAnalyticsBox =
            function (events) {
                originalRenderAnalyticsBox(events);

                setTimeout(() => {
                    renderAnalyticsChart();
                }, 0);
            };
    }

    // ============================================================
    // SAYFA YÜKLENDİĞİNDE
    // ============================================================

    installAnalyticsChartHook();

    document.addEventListener(
        "DOMContentLoaded",
        function () {
            installAnalyticsChartHook();

            setTimeout(() => {
                if (
                    Array.isArray(
                        window.allAnalyticsEvents
                    )
                ) {
                    renderAnalyticsChart();
                }
            }, 500);
        }
    );

    // ============================================================
    // PENCERE BOYUTU
    // ============================================================

    let resizeTimer = null;

    window.addEventListener(
        "resize",
        function () {
            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(() => {
                const chart =
                    document.getElementById(
                        "adminAnalyticsChartBox"
                    );

                if (chart) {
                    renderAnalyticsChart();
                }
            }, 200);
        }
    );

})();