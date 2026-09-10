// ============================================================
// TRABZON ANLIK - ANALYTICS GRAFİĞİ
// Günlük gerçek ziyaret / görüntülenme grafiği
// ============================================================

(function () {
    "use strict";

    function analyticsChartEventType(event) {
        return String(event?.event_type || "").trim().toLowerCase();
    }

    function analyticsChartDateKey(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function analyticsChartDisplayDate(dateKey) {
        const parts = String(dateKey).split("-");

        if (parts.length !== 3) {
            return dateKey;
        }

        return `${parts[2]}.${parts[1]}`;
    }

    function analyticsChartStartOfDay(date) {
        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );
    }

    // ========================================================
    // Grafik alanını oluştur
    // ========================================================

    function renderAnalyticsChart() {
        const dashboardSection = document.getElementById("section-dashboard");

        if (!dashboardSection) {
            return;
        }

        // Önceki grafik varsa kaldır
        const oldChart = document.getElementById("adminAnalyticsChartBox");

        if (oldChart) {
            oldChart.remove();
        }

        const events = Array.isArray(window.allAnalyticsEvents)
            ? window.allAnalyticsEvents
            : [];

        // Test olaylarını tamamen dışarıda bırak
        const realEvents = events.filter((event) => {
            return analyticsChartEventType(event) !== "test_page_view";
        });

        const now = new Date();

        // Son 30 gün
        const startDate = analyticsChartStartOfDay(
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 29
            )
        );

        // Son 30 günün tüm günlerini oluştur
        const dailyData = {};

        for (let i = 0; i < 30; i++) {
            const date = new Date(startDate);

            date.setDate(startDate.getDate() + i);

            const key = analyticsChartDateKey(date);

            dailyData[key] = {
                date: key,
                visits: 0,
                businessViews: 0,
                total: 0
            };
        }

        // Olayları günlere dağıt
        realEvents.forEach((event) => {
            const eventDate = new Date(event.created_at);

            if (Number.isNaN(eventDate.getTime())) {
                return;
            }

            if (eventDate < startDate) {
                return;
            }

            const key = analyticsChartDateKey(eventDate);

            if (!key || !dailyData[key]) {
                return;
            }

            dailyData[key].total++;

            const type = analyticsChartEventType(event);

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

        const chartData = Object.values(dailyData).map((item) => {
            return {
                date: analyticsChartDisplayDate(item.date),
                visits: item.visits,
                businessViews: item.businessViews,
                total: item.total
            };
        });

        // ====================================================
        // Grafik kutusu
        // ====================================================

        const box = document.createElement("div");

        box.id = "adminAnalyticsChartBox";

        box.style.cssText = `
            margin-top: 24px;
            background: #ffffff;
            border: 1px solid #e7e9ee;
            border-radius: 18px;
            padding: 24px;
            box-shadow: 0 8px 30px rgba(16, 28, 53, 0.06);
        `;

        box.innerHTML = `
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:15px;
                flex-wrap:wrap;
                margin-bottom:20px;
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
                        Son 30 gündeki gerçek kullanıcı hareketleri
                    </div>
                </div>

                <div style="
                    padding:7px 12px;
                    border-radius:999px;
                    background:#f6f7f9;
                    border:1px solid #e7e9ee;
                    color:#70798b;
                    font-size:12px;
                    font-weight:700;
                ">
                    Son 30 gün
                </div>
            </div>

            <div style="
                display:flex;
                flex-wrap:wrap;
                gap:18px;
                margin-bottom:18px;
                font-size:13px;
                color:#70798b;
            ">
                <span>
                    ● Siteye giriş
                </span>

                <span>
                    ● İşletme görüntülenme
                </span>

                <span>
                    ● Toplam gerçek olay
                </span>
            </div>

            <div style="
                position:relative;
                width:100%;
                min-height:320px;
                overflow-x:auto;
                overflow-y:hidden;
                border-top:1px solid #eef0f4;
                padding-top:18px;
            ">
                <div id="analyticsChartCanvasWrap" style="
                    position:relative;
                    min-width:760px;
                    height:300px;
                ">
                    <canvas
                        id="adminAnalyticsChartCanvas"
                        style="
                            display:block;
                            width:100%;
                            height:300px;
                        "
                    ></canvas>
                </div>
            </div>

            <div style="
                margin-top:14px;
                color:#70798b;
                font-size:12px;
            ">
                Grafik yalnızca gerçek analytics kayıtlarını gösterir.
            </div>
        `;

        dashboardSection.appendChild(box);

        drawAnalyticsChart(chartData);

        // Pencere boyutu değiştiğinde yeniden çiz
        if (!window.__trabzonAnalyticsResizeBound) {
            window.__trabzonAnalyticsResizeBound = true;

            window.addEventListener("resize", function () {
                const currentEvents = Array.isArray(window.allAnalyticsEvents)
                    ? window.allAnalyticsEvents
                    : [];

                if (currentEvents.length) {
                    renderAnalyticsChart();
                }
            });
        }
    }

    // ========================================================
    // Canvas grafik çizimi
    // ========================================================

    function drawAnalyticsChart(data) {
        const canvas = document.getElementById(
            "adminAnalyticsChartCanvas"
        );

        if (!canvas) {
            return;
        }

        const wrapper = document.getElementById(
            "analyticsChartCanvasWrap"
        );

        if (!wrapper) {
            return;
        }

        const width = Math.max(
            760,
            wrapper.clientWidth || 760
        );

        const height = 300;

        const devicePixelRatioValue =
            window.devicePixelRatio || 1;

        canvas.width = width * devicePixelRatioValue;
        canvas.height = height * devicePixelRatioValue;

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        const ctx = canvas.getContext("2d");

        if (!ctx) {
            return;
        }

        ctx.scale(
            devicePixelRatioValue,
            devicePixelRatioValue
        );

        ctx.clearRect(0, 0, width, height);

        // ----------------------------------------------------
        // Grafik ölçüleri
        // ----------------------------------------------------

        const paddingLeft = 45;
        const paddingRight = 20;
        const paddingTop = 20;
        const paddingBottom = 42;

        const chartWidth =
            width - paddingLeft - paddingRight;

        const chartHeight =
            height - paddingTop - paddingBottom;

        // ----------------------------------------------------
        // Maksimum değer
        // ----------------------------------------------------

        let maxValue = 0;

        data.forEach((item) => {
            maxValue = Math.max(
                maxValue,
                Number(item.visits) || 0,
                Number(item.businessViews) || 0,
                Number(item.total) || 0
            );
        });

        if (maxValue < 1) {
            maxValue = 1;
        }

        // Daha okunabilir eksen
        maxValue = Math.ceil(maxValue / 5) * 5;

        if (maxValue === 0) {
            maxValue = 5;
        }

        // ----------------------------------------------------
        // Yatay çizgiler
        // ----------------------------------------------------

        ctx.font = "12px Arial";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        for (let i = 0; i <= 5; i++) {
            const value = (maxValue / 5) * i;

            const y =
                paddingTop +
                chartHeight -
                (value / maxValue) * chartHeight;

            ctx.beginPath();
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(
                width - paddingRight,
                y
            );

            ctx.strokeStyle = "#eef0f4";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = "#70798b";

            ctx.fillText(
                String(Math.round(value)),
                paddingLeft - 10,
                y
            );
        }

        // ----------------------------------------------------
        // X ekseni
        // ----------------------------------------------------

        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#70798b";
        ctx.font = "11px Arial";

        const pointCount = data.length;

        function getX(index) {
            if (pointCount <= 1) {
                return paddingLeft + chartWidth / 2;
            }

            return (
                paddingLeft +
                (index / (pointCount - 1)) *
                    chartWidth
            );
        }

        function getY(value) {
            return (
                paddingTop +
                chartHeight -
                ((Number(value) || 0) / maxValue) *
                    chartHeight
            );
        }

        // Her 5 günde bir tarih etiketi
        data.forEach((item, index) => {
            if (
                index === 0 ||
                index === data.length - 1 ||
                index % 5 === 0
            ) {
                const x = getX(index);

                ctx.fillText(
                    item.date,
                    x,
                    height - paddingBottom + 14
                );
            }
        });

        // ----------------------------------------------------
        // Çizgi yardımcı fonksiyonu
        // ----------------------------------------------------

        function drawLine(dataKey, lineColor, lineWidth) {
            ctx.beginPath();

            data.forEach((item, index) => {
                const x = getX(index);
                const y = getY(item[dataKey]);

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
                const y = getY(item[dataKey]);

                ctx.beginPath();
                ctx.arc(x, y, 3.5, 0, Math.PI * 2);

                ctx.fillStyle = lineColor;
                ctx.fill();
            });
        }

        // ----------------------------------------------------
        // Üç veri serisi
        // ----------------------------------------------------

        drawLine(
            "total",
            "#101c35",
            2
        );

        drawLine(
            "visits",
            "#7b1830",
            3
        );

        drawLine(
            "businessViews",
            "#5c1023",
            2
        );
    }

    // ========================================================
    // Admin analytics kutusu oluşturulduktan sonra grafiği
    // otomatik ekle
    // ========================================================

    function installAnalyticsChartHook() {
        if (
            typeof window.renderAnalyticsBox !== "function" ||
            window.__trabzonAnalyticsChartHookInstalled
        ) {
            return;
        }

        window.__trabzonAnalyticsChartHookInstalled = true;

        const originalRenderAnalyticsBox =
            window.renderAnalyticsBox;

        window.renderAnalyticsBox = function (events) {
            originalRenderAnalyticsBox(events);

            setTimeout(function () {
                renderAnalyticsChart();
            }, 0);
        };
    }

    // ========================================================
    // Script yüklendiğinde hook kur
    // ========================================================

    installAnalyticsChartHook();

    // Analytics dosyası sonradan yüklenirse tekrar dene
    document.addEventListener(
        "DOMContentLoaded",
        function () {
            installAnalyticsChartHook();

            setTimeout(function () {
                if (
                    Array.isArray(window.allAnalyticsEvents) &&
                    window.allAnalyticsEvents.length
                ) {
                    renderAnalyticsChart();
                }
            }, 500);
        }
    );

})();