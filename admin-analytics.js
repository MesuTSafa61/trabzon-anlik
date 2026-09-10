// ============================================================
// TRABZON ANLIK - ADMIN ANALYTICS
// Analytics sistemi
// ============================================================

function normalizeAnalyticsEventType(value) {
    return String(value || "").trim().toLowerCase();
}

// ============================================================
// ANALYTICS VERİLERİNİ YÜKLE
// ============================================================

async function loadAnalytics() {
    if (analyticsLoading) return;

    analyticsLoading = true;

    try {
        const events = await fetchAllAnalyticsEvents();

        // Test kayıtlarını gerçek istatistiklerden çıkar
        const productionEvents = events.filter((event) => {
            return normalizeAnalyticsEventType(event.event_type) !== "test_page_view";
        });

        allAnalyticsEvents = productionEvents;

        const totalEvents = productionEvents.length;

        // Siteye giriş = sadece page_view
        const siteEntries = productionEvents.filter((event) => {
            return normalizeAnalyticsEventType(event.event_type) === "page_view";
        }).length;

        // İşletme görüntülenmesi = sadece business_view + business_id
        const businessViews = productionEvents.filter((event) => {
            return (
                normalizeAnalyticsEventType(event.event_type) === "business_view" &&
                event.business_id !== null &&
                event.business_id !== undefined &&
                event.business_id !== ""
            );
        }).length;

        // Tekil ziyaretçi
        const visitorIds = productionEvents
            .map((event) => event.visitor_id)
            .filter((visitorId) => visitorId !== null && visitorId !== undefined && visitorId !== "");

        const uniqueVisitors = new Set(
            visitorIds.map((visitorId) => String(visitorId))
        ).size;

        // Tarih sınırları
        const now = new Date();

        const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        const last7DaysStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30DaysStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Bugünkü gerçek olaylar
        const todayEvents = productionEvents.filter((event) => {
            const date = new Date(event.created_at);

            return !Number.isNaN(date.getTime()) && date >= todayStart;
        }).length;

        // Son 7 gün
        const last7Days = productionEvents.filter((event) => {
            const date = new Date(event.created_at);

            return !Number.isNaN(date.getTime()) && date >= last7DaysStart;
        }).length;

        // Son 30 gün
        const last30Days = productionEvents.filter((event) => {
            const date = new Date(event.created_at);

            return !Number.isNaN(date.getTime()) && date >= last30DaysStart;
        }).length;

        // Mevcut dashboard alanlarını güncelle
        setText("statAnalyticsEvents", totalEvents);
        setText("statUniqueVisitors", uniqueVisitors);
        setText("statBusinessViews", businessViews);
        setText("statLast7Days", last7Days);

        // Profesyonel analytics kutusunu oluştur
        renderAnalyticsBox(productionEvents);

    } catch (error) {
        console.error("Analytics yükleme hatası:", error);

        if (typeof renderAnalyticsError === "function") {
            renderAnalyticsError(error);
        }
    } finally {
        analyticsLoading = false;
    }
}

// ============================================================
// ANALYTICS KUTUSU
// ============================================================

function renderAnalyticsBox(events) {
    const dashboardSection = document.getElementById("section-dashboard");

    if (!dashboardSection) return;

    const oldBox = document.getElementById("adminAnalyticsBox");

    if (oldBox) {
        oldBox.remove();
    }

    const productionEvents = (Array.isArray(events) ? events : []).filter((event) => {
        return normalizeAnalyticsEventType(event.event_type) !== "test_page_view";
    });

    const totalEvents = productionEvents.length;

    const siteEntries = productionEvents.filter((event) => {
        return normalizeAnalyticsEventType(event.event_type) === "page_view";
    }).length;

    const businessViews = productionEvents.filter((event) => {
        return (
            normalizeAnalyticsEventType(event.event_type) === "business_view" &&
            event.business_id !== null &&
            event.business_id !== undefined &&
            event.business_id !== ""
        );
    }).length;

    const visitorIds = productionEvents
        .map((event) => event.visitor_id)
        .filter((visitorId) => visitorId !== null && visitorId !== undefined && visitorId !== "");

    const uniqueVisitors = new Set(
        visitorIds.map((visitorId) => String(visitorId))
    ).size;

    const now = new Date();

    const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    const last7DaysStart = new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    const last30DaysStart = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const todayEvents = productionEvents.filter((event) => {
        const date = new Date(event.created_at);

        return !Number.isNaN(date.getTime()) && date >= todayStart;
    }).length;

    const last7Days = productionEvents.filter((event) => {
        const date = new Date(event.created_at);

        return !Number.isNaN(date.getTime()) && date >= last7DaysStart;
    }).length;

    const last30Days = productionEvents.filter((event) => {
        const date = new Date(event.created_at);

        return !Number.isNaN(date.getTime()) && date >= last30DaysStart;
    }).length;

    // --------------------------------------------------------
    // Olay türleri
    // --------------------------------------------------------

    const eventTypeCounts = {};

    productionEvents.forEach((event) => {
        const type = normalizeAnalyticsEventType(event.event_type);

        if (!type) return;

        eventTypeCounts[type] = (eventTypeCounts[type] || 0) + 1;
    });

    const eventTypeEntries = Object.entries(eventTypeCounts)
        .sort((a, b) => b[1] - a[1]);

    // --------------------------------------------------------
    // En çok görüntülenen işletmeler
    // Sadece business_view sayılır.
    // --------------------------------------------------------

    const businessCounts = {};

    productionEvents.forEach((event) => {
        const type = normalizeAnalyticsEventType(event.event_type);

        if (
            type !== "business_view" ||
            event.business_id === null ||
            event.business_id === undefined ||
            event.business_id === ""
        ) {
            return;
        }

        const businessId = String(event.business_id);

        businessCounts[businessId] = (businessCounts[businessId] || 0) + 1;
    });

    const businessEntries = Object.entries(businessCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    // --------------------------------------------------------
    // İşletme isimlerini bulmaya çalış
    // --------------------------------------------------------

    let businessList = [];

    if (Array.isArray(window.allBusinesses)) {
        businessList = window.allBusinesses;
    } else if (Array.isArray(window.businesses)) {
        businessList = window.businesses;
    }

    function getBusinessName(businessId) {
        const business = businessList.find((item) => {
            return String(item.id) === String(businessId);
        });

        if (business && business.name) {
            return business.name;
        }

        return `İşletme #${businessId}`;
    }

    // --------------------------------------------------------
    // Son olaylar
    // --------------------------------------------------------

    const recentEvents = productionEvents
        .slice()
        .sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        })
        .slice(0, 10);

    // --------------------------------------------------------
    // HTML
    // --------------------------------------------------------

    const box = document.createElement("div");

    box.id = "adminAnalyticsBox";

    box.style.cssText = `
        margin-top: 28px;
        background: #ffffff;
        border: 1px solid #e7e9ee;
        border-radius: 18px;
        padding: 24px;
        box-shadow: 0 8px 30px rgba(16, 28, 53, 0.06);
    `;

    const statsHtml = `
        <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
            gap:14px;
            margin-top:20px;
        ">

            <div style="
                background:#f6f7f9;
                border:1px solid #e7e9ee;
                border-radius:14px;
                padding:18px;
            ">
                <div style="font-size:13px;color:#70798b;">
                    Toplam Gerçek Olay
                </div>
                <div style="
                    font-size:28px;
                    font-weight:800;
                    color:#101c35;
                    margin-top:6px;
                ">
                    ${totalEvents}
                </div>
            </div>

            <div style="
                background:#f6f7f9;
                border:1px solid #e7e9ee;
                border-radius:14px;
                padding:18px;
            ">
                <div style="font-size:13px;color:#70798b;">
                    Siteye Giriş
                </div>
                <div style="
                    font-size:28px;
                    font-weight:800;
                    color:#7b1830;
                    margin-top:6px;
                ">
                    ${siteEntries}
                </div>
            </div>

            <div style="
                background:#f6f7f9;
                border:1px solid #e7e9ee;
                border-radius:14px;
                padding:18px;
            ">
                <div style="font-size:13px;color:#70798b;">
                    İşletme Görüntülenme
                </div>
                <div style="
                    font-size:28px;
                    font-weight:800;
                    color:#101c35;
                    margin-top:6px;
                ">
                    ${businessViews}
                </div>
            </div>

            <div style="
                background:#f6f7f9;
                border:1px solid #e7e9ee;
                border-radius:14px;
                padding:18px;
            ">
                <div style="font-size:13px;color:#70798b;">
                    Tekil Ziyaretçi
                </div>
                <div style="
                    font-size:28px;
                    font-weight:800;
                    color:#101c35;
                    margin-top:6px;
                ">
                    ${uniqueVisitors}
                </div>
            </div>

            <div style="
                background:#f6f7f9;
                border:1px solid #e7e9ee;
                border-radius:14px;
                padding:18px;
            ">
                <div style="font-size:13px;color:#70798b;">
                    Bugün
                </div>
                <div style="
                    font-size:28px;
                    font-weight:800;
                    color:#101c35;
                    margin-top:6px;
                ">
                    ${todayEvents}
                </div>
            </div>

            <div style="
                background:#f6f7f9;
                border:1px solid #e7e9ee;
                border-radius:14px;
                padding:18px;
            ">
                <div style="font-size:13px;color:#70798b;">
                    Son 7 Gün
                </div>
                <div style="
                    font-size:28px;
                    font-weight:800;
                    color:#101c35;
                    margin-top:6px;
                ">
                    ${last7Days}
                </div>
            </div>

            <div style="
                background:#f6f7f9;
                border:1px solid #e7e9ee;
                border-radius:14px;
                padding:18px;
            ">
                <div style="font-size:13px;color:#70798b;">
                    Son 30 Gün
                </div>
                <div style="
                    font-size:28px;
                    font-weight:800;
                    color:#101c35;
                    margin-top:6px;
                ">
                    ${last30Days}
                </div>
            </div>

        </div>
    `;

    const eventTypesHtml = eventTypeEntries.length
        ? eventTypeEntries.map(([type, count]) => `
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:12px;
                padding:11px 0;
                border-bottom:1px solid #eef0f4;
            ">
                <span style="color:#182033;">
                    ${type}
                </span>
                <strong style="color:#101c35;">
                    ${count}
                </strong>
            </div>
        `).join("")
        : `
            <div style="color:#70798b;padding:12px 0;">
                Henüz gerçek analytics olayı bulunmuyor.
            </div>
        `;

    const topBusinessesHtml = businessEntries.length
        ? businessEntries.map(([businessId, count], index) => `
            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:12px;
                padding:13px 0;
                border-bottom:1px solid #eef0f4;
            ">
                <div style="
                    display:flex;
                    align-items:center;
                    gap:12px;
                    min-width:0;
                ">
                    <span style="
                        width:30px;
                        height:30px;
                        min-width:30px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        border-radius:50%;
                        background:#f6f7f9;
                        color:#101c35;
                        font-weight:800;
                    ">
                        ${index + 1}
                    </span>

                    <span style="
                        color:#182033;
                        overflow:hidden;
                        text-overflow:ellipsis;
                        white-space:nowrap;
                    ">
                        ${getBusinessName(businessId)}
                    </span>
                </div>

                <strong style="
                    color:#7b1830;
                    white-space:nowrap;
                ">
                    ${count} görüntülenme
                </strong>
            </div>
        `).join("")
        : `
            <div style="color:#70798b;padding:12px 0;">
                Henüz işletme görüntülenmesi bulunmuyor.
            </div>
        `;

    const recentEventsHtml = recentEvents.length
        ? recentEvents.map((event) => {
            const type = normalizeAnalyticsEventType(event.event_type);

            const date = new Date(event.created_at);

            const dateText = Number.isNaN(date.getTime())
                ? "-"
                : date.toLocaleString("tr-TR");

            const businessText =
                event.business_id !== null &&
                event.business_id !== undefined &&
                event.business_id !== ""
                    ? getBusinessName(event.business_id)
                    : "-";

            return `
                <div style="
                    display:grid;
                    grid-template-columns:minmax(100px,1fr) minmax(120px,1.5fr) minmax(130px,1fr);
                    gap:12px;
                    padding:12px 0;
                    border-bottom:1px solid #eef0f4;
                    font-size:13px;
                ">
                    <strong style="color:#182033;">
                        ${type}
                    </strong>

                    <span style="
                        color:#70798b;
                        overflow:hidden;
                        text-overflow:ellipsis;
                    ">
                        ${businessText}
                    </span>

                    <span style="
                        color:#70798b;
                        text-align:right;
                    ">
                        ${dateText}
                    </span>
                </div>
            `;
        }).join("")
        : `
            <div style="color:#70798b;padding:12px 0;">
                Henüz kayıt bulunmuyor.
            </div>
        `;

    box.innerHTML = `
        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            flex-wrap:wrap;
        ">
            <div>
                <div style="
                    font-size:22px;
                    font-weight:800;
                    color:#101c35;
                ">
                    📊 Site Analitikleri
                </div>

                <div style="
                    margin-top:5px;
                    color:#70798b;
                    font-size:13px;
                ">
                    Gerçek kullanıcı hareketleri
                </div>
            </div>

            <div style="
                background:#f6f7f9;
                color:#101c35;
                border:1px solid #e7e9ee;
                border-radius:999px;
                padding:7px 12px;
                font-size:12px;
                font-weight:700;
            ">
                ${totalEvents} gerçek olay
            </div>
        </div>

        ${statsHtml}

        <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
            gap:24px;
            margin-top:28px;
        ">

            <div>
                <h3 style="
                    margin:0 0 12px;
                    color:#101c35;
                    font-size:17px;
                ">
                    Olay Türleri
                </h3>

                <div>
                    ${eventTypesHtml}
                </div>
            </div>

            <div>
                <h3 style="
                    margin:0 0 12px;
                    color:#101c35;
                    font-size:17px;
                ">
                    En Çok Görüntülenen İşletmeler
                </h3>

                <div>
                    ${topBusinessesHtml}
                </div>
            </div>

        </div>

        <div style="margin-top:28px;">

            <h3 style="
                margin:0 0 12px;
                color:#101c35;
                font-size:17px;
            ">
                Son Analytics Kayıtları
            </h3>

            <div style="
                overflow-x:auto;
            ">
                ${recentEventsHtml}
            </div>

        </div>
    `;

    dashboardSection.appendChild(box);
}

// ============================================================
// MOBİL UYUM
// ============================================================

const analyticsResponsiveStyle = document.createElement("style");

analyticsResponsiveStyle.textContent = `
    @media (max-width: 600px) {
        #adminAnalyticsBox {
            padding: 16px !important;
            border-radius: 15px !important;
        }

        #adminAnalyticsBox h3 {
            font-size: 16px !important;
        }

        #adminAnalyticsBox [style*="grid-template-columns:minmax(100px"] {
            grid-template-columns: 1fr !important;
        }

        #adminAnalyticsBox [style*="text-align:right"] {
            text-align: left !important;
        }
    }
`;

document.head.appendChild(analyticsResponsiveStyle);