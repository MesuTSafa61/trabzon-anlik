// ============================================================
// TRABZON ANLIK - ADMIN ANALYTICS
// Analytics sistemi
// Türkçe arayüz + gerçek işletme isimleri
// Tarih filtresi uyumlu sürüm
// ============================================================

function normalizeAnalyticsEventType(value) {
    return String(value || "").trim().toLowerCase();
}

// ============================================================
// ANALYTICS GLOBAL VERİ
// ============================================================

// Supabase'den gelen TÜM gerçek analytics kayıtları burada tutulur.
// Tarih filtresi değiştiğinde veri buradan tekrar filtrelenir.
window.__trabzonAnalyticsAllEvents = [];
window.__trabzonAnalyticsFilteredEvents = [];
window.__trabzonAnalyticsSelectedRange = "30";

// Eski sistemle uyumluluk
window.allAnalyticsEvents =
    Array.isArray(window.allAnalyticsEvents)
        ? window.allAnalyticsEvents
        : [];

// ============================================================
// SUPABASE
// ============================================================

const ANALYTICS_SUPABASE_URL =
    "https://yhunhkzsecppbnhjewrt.supabase.co";

const ANALYTICS_SUPABASE_KEY =
    "sb_publishable_0h5ycfDBJjgdf6bXlZ9OEg_K45u2b2v";

let analyticsBusinessNames = {};
let analyticsBusinessNamesLoading = false;

// ============================================================
// OLAY TÜRÜNÜ TÜRKÇELEŞTİR
// ============================================================

function getAnalyticsEventLabel(type) {

    const normalized =
        normalizeAnalyticsEventType(type);

    const labels = {

        "page_view":
            "Sayfa Görüntülenmesi",

        "business_view":
            "İşletme Görüntülenmesi",

        "business_click":
            "İşletme Tıklaması",

        "test_page_view":
            "Test Kaydı"
    };

    return (
        labels[normalized] ||
        "Diğer Etkileşim"
    );
}

// ============================================================
// İŞLETME ADINI GLOBAL LİSTELERDEN BUL
// ============================================================

function findAnalyticsBusinessInGlobals(businessId) {

    const sources = [

        window.allBusinesses,
        window.businesses,
        window.__allBusinesses,
        window.__trabzonBusinesses
    ];

    for (let i = 0; i < sources.length; i++) {

        const list = sources[i];

        if (!Array.isArray(list)) {
            continue;
        }

        const found =
            list.find(function (business) {

                return (
                    business &&
                    String(business.id) ===
                    String(businessId)
                );

            });

        if (
            found &&
            found.name
        ) {

            return String(found.name);
        }
    }

    return null;
}

// ============================================================
// İŞLETME İSİMLERİNİ SUPABASE'DEN YÜKLE
// ============================================================

async function loadAnalyticsBusinessNames(events) {

    if (!Array.isArray(events)) {
        return;
    }

    const ids = [];

    events.forEach(function (event) {

        const type =
            normalizeAnalyticsEventType(
                event.event_type
            );

        if (
            type !== "business_view" &&
            type !== "business_click"
        ) {
            return;
        }

        if (
            event.business_id === null ||
            event.business_id === undefined ||
            event.business_id === ""
        ) {
            return;
        }

        const id =
            String(event.business_id);

        if (!ids.includes(id)) {
            ids.push(id);
        }

    });

    if (!ids.length) {
        return;
    }

    // Önce global listeler
    ids.forEach(function (id) {

        if (analyticsBusinessNames[id]) {
            return;
        }

        const globalName =
            findAnalyticsBusinessInGlobals(id);

        if (globalName) {

            analyticsBusinessNames[id] =
                globalName;
        }

    });

    const missingIds =
        ids.filter(function (id) {

            return !analyticsBusinessNames[id];

        });

    if (!missingIds.length) {
        return;
    }

    if (analyticsBusinessNamesLoading) {
        return;
    }

    analyticsBusinessNamesLoading = true;

    try {

        const filter =
            missingIds.join(",");

        const url =
            ANALYTICS_SUPABASE_URL +
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
                            ANALYTICS_SUPABASE_KEY,

                        "Authorization":
                            "Bearer " +
                            ANALYTICS_SUPABASE_KEY,

                        "Content-Type":
                            "application/json"
                    }
                }
            );

        if (!response.ok) {

            throw new Error(
                "İşletme isimleri alınamadı: HTTP " +
                response.status
            );
        }

        const data =
            await response.json();

        if (Array.isArray(data)) {

            data.forEach(function (business) {

                if (
                    business &&
                    business.id !== null &&
                    business.id !== undefined &&
                    business.name
                ) {

                    analyticsBusinessNames[
                        String(business.id)
                    ] =
                        String(business.name);
                }

            });
        }

    } catch (error) {

        console.error(
            "Analytics işletme isimleri yüklenemedi:",
            error
        );

    } finally {

        analyticsBusinessNamesLoading =
            false;
    }
}

// ============================================================
// İŞLETME ADINI GETİR
// ============================================================

function getAnalyticsBusinessName(businessId) {

    if (
        businessId === null ||
        businessId === undefined ||
        businessId === ""
    ) {

        return "-";
    }

    const id =
        String(businessId);

    if (
        analyticsBusinessNames[id]
    ) {

        return analyticsBusinessNames[id];
    }

    const globalName =
        findAnalyticsBusinessInGlobals(id);

    if (globalName) {

        analyticsBusinessNames[id] =
            globalName;

        return globalName;
    }

    return "İşletme adı yükleniyor";
}

// ============================================================
// HTML GÜVENLİĞİ
// ============================================================

function analyticsEscapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ============================================================
// TARİH FİLTRESİ YARDIMCISI
// ============================================================

function getAnalyticsFilteredEvents(
    events,
    range
) {

    if (!Array.isArray(events)) {
        return [];
    }

    const realEvents =
        events.filter(function (event) {

            return (
                event &&
                normalizeAnalyticsEventType(
                    event.event_type
                ) !== "test_page_view"
            );

        });

    const selectedRange =
        String(
            range ||
            window.__trabzonAnalyticsSelectedRange ||
            "30"
        );

    if (selectedRange === "all") {
        return realEvents;
    }

    const days =
        Number(selectedRange);

    if (!Number.isFinite(days)) {
        return realEvents;
    }

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
// ANALYTICS İSTATİSTİKLERİNİ HESAPLA
// ============================================================

function calculateAnalyticsStats(events) {

    const productionEvents =
        Array.isArray(events)
            ? events.filter(function (event) {

                return (
                    event &&
                    normalizeAnalyticsEventType(
                        event.event_type
                    ) !== "test_page_view"
                );

            })
            : [];

    const totalEvents =
        productionEvents.length;

    // --------------------------------------------------------
    // Siteye giriş
    // --------------------------------------------------------

    const siteEntries =
        productionEvents.filter(function (event) {

            return (
                normalizeAnalyticsEventType(
                    event.event_type
                ) === "page_view"
            );

        }).length;

    // --------------------------------------------------------
    // İşletme görüntülenmesi
    // --------------------------------------------------------

    const businessViews =
        productionEvents.filter(function (event) {

            return (
                normalizeAnalyticsEventType(
                    event.event_type
                ) === "business_view" &&

                event.business_id !== null &&
                event.business_id !== undefined &&
                event.business_id !== ""
            );

        }).length;

    // --------------------------------------------------------
    // Tekil ziyaretçi
    // --------------------------------------------------------

    const visitorIds =
        productionEvents
            .map(function (event) {

                return event.visitor_id;

            })
            .filter(function (visitorId) {

                return (
                    visitorId !== null &&
                    visitorId !== undefined &&
                    visitorId !== ""
                );

            });

    const uniqueVisitors =
        new Set(
            visitorIds.map(function (visitorId) {

                return String(visitorId);

            })
        ).size;

    // --------------------------------------------------------
    // Bugün
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

    const todayEvents =
        productionEvents.filter(function (event) {

            const date =
                new Date(
                    event.created_at
                );

            return (
                !Number.isNaN(
                    date.getTime()
                ) &&
                date >= todayStart
            );

        }).length;

    // --------------------------------------------------------
    // Son 7 gün
    // --------------------------------------------------------

    const last7DaysStart =
        new Date(
            now.getTime() -
            7 * 24 * 60 * 60 * 1000
        );

    const last7Days =
        productionEvents.filter(function (event) {

            const date =
                new Date(
                    event.created_at
                );

            return (
                !Number.isNaN(
                    date.getTime()
                ) &&
                date >= last7DaysStart
            );

        }).length;

    // --------------------------------------------------------
    // Son 30 gün
    // --------------------------------------------------------

    const last30DaysStart =
        new Date(
            now.getTime() -
            30 * 24 * 60 * 60 * 1000
        );

    const last30Days =
        productionEvents.filter(function (event) {

            const date =
                new Date(
                    event.created_at
                );

            return (
                !Number.isNaN(
                    date.getTime()
                ) &&
                date >= last30DaysStart
            );

        }).length;

    return {

        totalEvents:
            totalEvents,

        siteEntries:
            siteEntries,

        businessViews:
            businessViews,

        uniqueVisitors:
            uniqueVisitors,

        todayEvents:
            todayEvents,

        last7Days:
            last7Days,

        last30Days:
            last30Days
    };
}

// ============================================================
// ÜST İSTATİSTİKLERİ GÜNCELLE
// ============================================================

function updateAnalyticsDashboardStats(events) {

    const stats =
        calculateAnalyticsStats(events);

    setText(
        "statAnalyticsEvents",
        stats.totalEvents
    );

    setText(
        "statUniqueVisitors",
        stats.uniqueVisitors
    );

    setText(
        "statBusinessViews",
        stats.businessViews
    );

    setText(
        "statLast7Days",
        stats.last7Days
    );

    return stats;
}

// ============================================================
// ANALYTICS FİLTRESİNİ UYGULA
// ============================================================

async function applyAnalyticsDateFilter(
    range
) {

    const allEvents =
        Array.isArray(
            window.__trabzonAnalyticsAllEvents
        )
            ? window.__trabzonAnalyticsAllEvents
            : [];

    window.__trabzonAnalyticsSelectedRange =
        String(range || "30");

    const filteredEvents =
        getAnalyticsFilteredEvents(
            allEvents,
            window.__trabzonAnalyticsSelectedRange
        );

    window.__trabzonAnalyticsFilteredEvents =
        filteredEvents;

    // Eski sistemle uyumluluk
    window.allAnalyticsEvents =
        filteredEvents;

    // Üst istatistikleri anında değiştir
    updateAnalyticsDashboardStats(
        filteredEvents
    );

    // Ana analytics kutusunu yeniden çiz
    await renderAnalyticsBox(
        filteredEvents
    );

    // Grafik de aynı filtrelenmiş veriyi kullansın
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

    // Yeni chart sistemlerinde kullanılmak üzere
    window.__trabzonAnalyticsChartEvents =
        filteredEvents;

    return filteredEvents;
}

// Global erişim
window.applyAnalyticsDateFilter =
    applyAnalyticsDateFilter;

window.getAnalyticsFilteredEvents =
    getAnalyticsFilteredEvents;

window.updateAnalyticsDashboardStats =
    updateAnalyticsDashboardStats;

// ============================================================
// ANALYTICS VERİLERİNİ YÜKLE
// ============================================================

async function loadAnalytics() {

    if (analyticsLoading) {
        return;
    }

    analyticsLoading = true;

    try {

        const events =
            await fetchAllAnalyticsEvents();

        // --------------------------------------------------------
        // Test kayıtlarını çıkar
        // --------------------------------------------------------

        const productionEvents =
            events.filter(function (event) {

                return (
                    normalizeAnalyticsEventType(
                        event.event_type
                    ) !== "test_page_view"
                );

            });

        // ========================================================
        // ÇOK ÖNEMLİ:
        // TÜM GERÇEK VERİYİ FİLTRESİZ ŞEKİLDE SAKLA
        // ========================================================

        window.__trabzonAnalyticsAllEvents =
            productionEvents.slice();

        window.allAnalyticsEvents =
            productionEvents.slice();

        // İlk açılışta mevcut seçili filtre
        const selectedRange =
            window.__trabzonAnalyticsSelectedRange ||
            "30";

        const filteredEvents =
            getAnalyticsFilteredEvents(
                productionEvents,
                selectedRange
            );

        window.__trabzonAnalyticsFilteredEvents =
            filteredEvents;

        // İşletme isimlerini önceden yükle
        await loadAnalyticsBusinessNames(
            productionEvents
        );

        // --------------------------------------------------------
        // ÜST İSTATİSTİKLER
        // --------------------------------------------------------

        updateAnalyticsDashboardStats(
            filteredEvents
        );

        // --------------------------------------------------------
        // ANA ANALYTICS KUTUSU
        // --------------------------------------------------------

        await renderAnalyticsBox(
            filteredEvents
        );

    } catch (error) {

        console.error(
            "Analytics yükleme hatası:",
            error
        );

        if (
            typeof renderAnalyticsError ===
            "function"
        ) {

            renderAnalyticsError(
                error
            );
        }

    } finally {

        analyticsLoading =
            false;
    }
}

// ============================================================
// ANALYTICS KUTUSU
// ============================================================

async function renderAnalyticsBox(events) {

    const dashboardSection =
        document.getElementById(
            "section-dashboard"
        );

    if (!dashboardSection) {
        return;
    }

    const oldBox =
        document.getElementById(
            "adminAnalyticsBox"
        );

    if (oldBox) {
        oldBox.remove();
    }

    const productionEvents =
        (
            Array.isArray(events)
                ? events
                : []
        ).filter(function (event) {

            return (
                normalizeAnalyticsEventType(
                    event.event_type
                ) !== "test_page_view"
            );

        });

    // --------------------------------------------------------
    // İşletme isimleri
    // --------------------------------------------------------

    await loadAnalyticsBusinessNames(
        productionEvents
    );

    // --------------------------------------------------------
    // TEMEL İSTATİSTİKLER
    // --------------------------------------------------------

    const stats =
        calculateAnalyticsStats(
            productionEvents
        );

    const totalEvents =
        stats.totalEvents;

    const siteEntries =
        stats.siteEntries;

    const businessViews =
        stats.businessViews;

    const uniqueVisitors =
        stats.uniqueVisitors;

    const todayEvents =
        stats.todayEvents;

    const last7Days =
        stats.last7Days;

    const last30Days =
        stats.last30Days;

    // ========================================================
    // OLAY TÜRLERİ
    // ========================================================

    const eventTypeCounts = {};

    productionEvents.forEach(function (event) {

        const type =
            normalizeAnalyticsEventType(
                event.event_type
            );

        if (!type) {
            return;
        }

        eventTypeCounts[type] =
            (
                eventTypeCounts[type] || 0
            ) + 1;

    });

    const eventTypeEntries =
        Object.entries(
            eventTypeCounts
        ).sort(function (a, b) {

            return b[1] - a[1];

        });

    // ========================================================
    // EN ÇOK GÖRÜNTÜLENEN İŞLETMELER
    // ========================================================

    const businessCounts = {};

    productionEvents.forEach(function (event) {

        const type =
            normalizeAnalyticsEventType(
                event.event_type
            );

        if (
            type !== "business_view" ||
            event.business_id === null ||
            event.business_id === undefined ||
            event.business_id === ""
        ) {

            return;
        }

        const businessId =
            String(
                event.business_id
            );

        businessCounts[businessId] =
            (
                businessCounts[businessId] || 0
            ) + 1;

    });

    const businessEntries =
        Object.entries(
            businessCounts
        )
        .sort(function (a, b) {

            return b[1] - a[1];

        })
        .slice(0, 10);

    // ========================================================
    // SON OLAYLAR
    // ========================================================

    const recentEvents =
        productionEvents
            .slice()
            .sort(function (a, b) {

                return (
                    new Date(
                        b.created_at
                    ) -
                    new Date(
                        a.created_at
                    )
                );

            })
            .slice(0, 10);

    // ========================================================
    // HTML KUTUSU
    // ========================================================

    const box =
        document.createElement(
            "div"
        );

    box.id =
        "adminAnalyticsBox";

    box.style.cssText = `
        margin-top:28px;
        background:#ffffff;
        border:1px solid #e7e9ee;
        border-radius:18px;
        padding:24px;
        box-shadow:0 8px 30px rgba(16,28,53,0.06);
    `;

    // ========================================================
    // İSTATİSTİK KARTLARI
    // ========================================================

    const statsHtml = `

        <div style="
            display:grid;
            grid-template-columns:
                repeat(auto-fit,minmax(150px,1fr));
            gap:14px;
            margin-top:20px;
        ">

            <div class="analytics-stat-card">

                <div class="analytics-stat-label">
                    Toplam Gerçek Olay
                </div>

                <div class="analytics-stat-number">
                    ${totalEvents}
                </div>

            </div>

            <div class="analytics-stat-card">

                <div class="analytics-stat-label">
                    Siteye Giriş
                </div>

                <div class="
                    analytics-stat-number
                    analytics-stat-burgundy
                ">
                    ${siteEntries}
                </div>

            </div>

            <div class="analytics-stat-card">

                <div class="analytics-stat-label">
                    İşletme Görüntülenmesi
                </div>

                <div class="analytics-stat-number">
                    ${businessViews}
                </div>

            </div>

            <div class="analytics-stat-card">

                <div class="analytics-stat-label">
                    Tekil Ziyaretçi
                </div>

                <div class="analytics-stat-number">
                    ${uniqueVisitors}
                </div>

            </div>

            <div class="analytics-stat-card">

                <div class="analytics-stat-label">
                    Bugün
                </div>

                <div class="analytics-stat-number">
                    ${todayEvents}
                </div>

            </div>

            <div class="analytics-stat-card">

                <div class="analytics-stat-label">
                    Son 7 Gün
                </div>

                <div class="analytics-stat-number">
                    ${last7Days}
                </div>

            </div>

            <div class="analytics-stat-card">

                <div class="analytics-stat-label">
                    Son 30 Gün
                </div>

                <div class="analytics-stat-number">
                    ${last30Days}
                </div>

            </div>

        </div>
    `;

    // ========================================================
    // OLAY TÜRLERİ
    // ========================================================

    const eventTypesHtml =
        eventTypeEntries.length

            ? eventTypeEntries.map(
                function ([type, count]) {

                    return `

                        <div style="
                            display:flex;
                            justify-content:
                                space-between;
                            align-items:center;
                            gap:12px;
                            padding:11px 0;
                            border-bottom:
                                1px solid #eef0f4;
                        ">

                            <span style="
                                color:#182033;
                                font-size:13px;
                            ">
                                ${analyticsEscapeHtml(
                                    getAnalyticsEventLabel(
                                        type
                                    )
                                )}
                            </span>

                            <strong style="
                                color:#101c35;
                            ">
                                ${count}
                            </strong>

                        </div>
                    `;
                }
            ).join("")

            : `

                <div style="
                    color:#70798b;
                    padding:12px 0;
                ">
                    Henüz gerçek analytics olayı
                    bulunmuyor.
                </div>
            `;

    // ========================================================
    // EN ÇOK GÖRÜNTÜLENEN İŞLETMELER
    // ========================================================

    const topBusinessesHtml =
        businessEntries.length

            ? businessEntries.map(
                function (
                    [businessId, count],
                    index
                ) {

                    const businessName =
                        getAnalyticsBusinessName(
                            businessId
                        );

                    return `

                        <div style="
                            display:flex;
                            align-items:center;
                            justify-content:
                                space-between;
                            gap:12px;
                            padding:13px 0;
                            border-bottom:
                                1px solid #eef0f4;
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
                                    font-size:13px;
                                    font-weight:700;
                                    overflow:hidden;
                                    text-overflow:
                                        ellipsis;
                                    white-space:nowrap;
                                ">
                                    ${analyticsEscapeHtml(
                                        businessName
                                    )}
                                </span>

                            </div>

                            <strong style="
                                color:#7b1830;
                                white-space:nowrap;
                                font-size:12px;
                            ">
                                ${count}
                                görüntülenme
                            </strong>

                        </div>
                    `;
                }
            ).join("")

            : `

                <div style="
                    color:#70798b;
                    padding:12px 0;
                ">
                    Henüz işletme görüntülenmesi
                    bulunmuyor.
                </div>
            `;

    // ========================================================
    // SON ANALYTICS KAYITLARI
    // ========================================================

    const recentEventsHtml =
        recentEvents.length

            ? recentEvents.map(
                function (event) {

                    const type =
                        normalizeAnalyticsEventType(
                            event.event_type
                        );

                    const date =
                        new Date(
                            event.created_at
                        );

                    const dateText =
                        Number.isNaN(
                            date.getTime()
                        )
                            ? "-"
                            : date.toLocaleString(
                                "tr-TR"
                            );

                    const businessText =
                        event.business_id !== null &&
                        event.business_id !== undefined &&
                        event.business_id !== ""
                            ? getAnalyticsBusinessName(
                                event.business_id
                            )
                            : "-";

                    return `

                        <div style="
                            display:grid;
                            grid-template-columns:
                                minmax(140px,1fr)
                                minmax(150px,1.5fr)
                                minmax(130px,1fr);
                            gap:12px;
                            padding:12px 0;
                            border-bottom:
                                1px solid #eef0f4;
                            font-size:13px;
                        ">

                            <strong style="
                                color:#182033;
                            ">
                                ${analyticsEscapeHtml(
                                    getAnalyticsEventLabel(
                                        type
                                    )
                                )}
                            </strong>

                            <span style="
                                color:#70798b;
                                overflow:hidden;
                                text-overflow:
                                    ellipsis;
                                white-space:nowrap;
                            ">
                                ${analyticsEscapeHtml(
                                    businessText
                                )}
                            </span>

                            <span style="
                                color:#70798b;
                                text-align:right;
                            ">
                                ${analyticsEscapeHtml(
                                    dateText
                                )}
                            </span>

                        </div>
                    `;
                }
            ).join("")

            : `

                <div style="
                    color:#70798b;
                    padding:12px 0;
                ">
                    Henüz kayıt bulunmuyor.
                </div>
            `;

    // ========================================================
    // AKTİF FİLTRE METNİ
    // ========================================================

    const activeRange =
        String(
            window.__trabzonAnalyticsSelectedRange ||
            "30"
        );

    let activeRangeText =
        "Son 30 Gün";

    if (activeRange === "1") {
        activeRangeText =
            "Bugün";
    } else if (activeRange === "7") {
        activeRangeText =
            "Son 7 Gün";
    } else if (activeRange === "90") {
        activeRangeText =
            "Son 90 Gün";
    } else if (activeRange === "all") {
        activeRangeText =
            "Tüm Zamanlar";
    }

    // ========================================================
    // ANA HTML
    // ========================================================

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
                    📊 Site İstatistikleri
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
                display:flex;
                align-items:center;
                gap:8px;
                flex-wrap:wrap;
            ">

                <div style="
                    background:#f6f7f9;
                    color:#101c35;
                    border:1px solid #e7e9ee;
                    border-radius:999px;
                    padding:7px 12px;
                    font-size:12px;
                    font-weight:700;
                ">
                    ${activeRangeText}
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

        </div>

        ${statsHtml}

        <div style="
            display:grid;
            grid-template-columns:
                repeat(auto-fit,minmax(260px,1fr));
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

        <div style="
            margin-top:28px;
        ">

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

    dashboardSection.appendChild(
        box
    );

    // ========================================================
    // İSİMLER SONRADAN GELİRSE TEKRAR RENDER
    // ========================================================

    setTimeout(
        function () {

            const currentBox =
                document.getElementById(
                    "adminAnalyticsBox"
                );

            if (!currentBox) {
                return;
            }

            if (
                businessEntries.length > 0
            ) {

                const hasLoadingName =
                    businessEntries.some(
                        function (
                            [businessId]
                        ) {

                            return (
                                getAnalyticsBusinessName(
                                    businessId
                                ) ===
                                "İşletme adı yükleniyor"
                            );

                        }
                    );

                if (hasLoadingName) {

                    loadAnalyticsBusinessNames(
                        productionEvents
                    ).then(function () {

                        renderAnalyticsBox(
                            productionEvents
                        );

                    });

                }

            }

        },
        500
    );
}

// ============================================================
// MOBİL UYUMLULUK
// ============================================================

const analyticsResponsiveStyle =
    document.createElement(
        "style"
    );

analyticsResponsiveStyle.id =
    "trabzonAnalyticsResponsiveStyle";

analyticsResponsiveStyle.textContent = `

    .analytics-stat-card {
        background:#f6f7f9;
        border:1px solid #e7e9ee;
        border-radius:14px;
        padding:18px;
    }

    .analytics-stat-label {
        font-size:13px;
        color:#70798b;
    }

    .analytics-stat-number {
        font-size:28px;
        font-weight:800;
        color:#101c35;
        margin-top:6px;
    }

    .analytics-stat-burgundy {
        color:#7b1830;
    }

    @media (max-width:600px) {

        #adminAnalyticsBox {
            padding:16px !important;
            border-radius:15px !important;
        }

        #adminAnalyticsBox h3 {
            font-size:16px !important;
        }

        #adminAnalyticsBox
        [style*="grid-template-columns:minmax(140px"] {
            grid-template-columns:1fr !important;
        }

        #adminAnalyticsBox
        [style*="text-align:right"] {
            text-align:left !important;
        }

    }

`;

if (
    !document.getElementById(
        "trabzonAnalyticsResponsiveStyle"
    )
) {

    document.head.appendChild(
        analyticsResponsiveStyle
    );
}

// ============================================================
// GLOBAL FONKSİYONLAR
// ============================================================

window.loadAnalytics =
    loadAnalytics;

window.renderAnalyticsBox =
    renderAnalyticsBox;

window.getAnalyticsEventLabel =
    getAnalyticsEventLabel;

window.getAnalyticsBusinessName =
    getAnalyticsBusinessName;

window.calculateAnalyticsStats =
    calculateAnalyticsStats;