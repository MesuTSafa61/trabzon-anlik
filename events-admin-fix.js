// ============================================================
// TRABZON ANLIK - ETKİNLİK YÖNETİMİ MOBİL / URL FIX
// ============================================================

(function () {
    "use strict";

    // ============================================================
    // URL DÜZELTME
    // ============================================================

    function normalizeUrl(value) {
        if (!value) {
            return "";
        }

        let url = value.trim();

        if (!url) {
            return "";
        }

        if (!/^https?:\/\//i.test(url)) {
            url = "https://" + url;
        }

        return url;
    }

    function fixUrlInput() {
        const input = document.getElementById(
            "eventTicketUrl"
        );

        if (!input) {
            return;
        }

        input.setAttribute(
            "type",
            "text"
        );

        input.setAttribute(
            "inputmode",
            "url"
        );

        input.setAttribute(
            "autocomplete",
            "url"
        );

        input.setAttribute(
            "placeholder",
            "ornek.com veya https://ornek.com"
        );

        if (input.dataset.urlFixApplied === "true") {
            return;
        }

        input.dataset.urlFixApplied = "true";

        input.addEventListener(
            "blur",
            function () {
                input.value = normalizeUrl(
                    input.value
                );
            }
        );
    }

    // ============================================================
    // MOBİL TARİH / SAAT
    // ============================================================

    function addMobileStyles() {
        if (
            document.getElementById(
                "eventsAdminMobileFix"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "eventsAdminMobileFix";

        style.textContent = `
            /* =====================================================
               ETKİNLİK MODAL - GENEL
               ===================================================== */

            .event-admin-modal {
                width: min(
                    920px,
                    calc(100vw - 32px)
                ) !important;

                max-width: 920px !important;

                box-sizing: border-box;
            }

            .event-admin-modal *,
            .event-admin-modal *::before,
            .event-admin-modal *::after {
                box-sizing: border-box;
            }

            .event-admin-modal
            .edit-form-grid {
                min-width: 0;
                width: 100%;
            }

            .event-admin-modal
            .edit-form-grid > div {
                min-width: 0;
            }

            .event-admin-modal
            input,
            .event-admin-modal
            select,
            .event-admin-modal
            textarea {
                width: 100%;
                max-width: 100%;
                min-width: 0;
            }

            /* =====================================================
               TARİH / SAAT INPUTLARI
               ===================================================== */

            .event-admin-modal
            input[type="date"],
            .event-admin-modal
            input[type="time"] {
                width: 100%;
                min-width: 0;
                max-width: 100%;
                display: block;
                box-sizing: border-box;
            }

            /* =====================================================
               MOBİL
               ===================================================== */

            @media (max-width: 700px) {

                .event-admin-modal {
                    width: calc(100vw - 20px) !important;
                    max-width: calc(100vw - 20px) !important;
                    margin: 10px auto;
                }

                .event-admin-modal
                .modal-body {
                    padding: 16px;
                    overflow-x: hidden;
                }

                .event-admin-modal
                .edit-form-grid {
                    grid-template-columns: minmax(0, 1fr) !important;
                    gap: 14px;
                }

                .event-admin-modal
                .edit-form-grid > div {
                    width: 100%;
                    min-width: 0;
                }

                .event-admin-modal
                input[type="date"],
                .event-admin-modal
                input[type="time"] {
                    width: 100% !important;
                    min-width: 0 !important;
                    max-width: 100% !important;
                    font-size: 16px;
                }

                .event-admin-modal
                input,
                .event-admin-modal
                select,
                .event-admin-modal
                textarea {
                    font-size: 16px;
                }

                .event-admin-modal
                .modal-footer {
                    display: flex;
                    gap: 10px;
                }

                .event-admin-modal
                .modal-footer button {
                    flex: 1;
                    min-width: 0;
                }
            }

            @media (max-width: 420px) {

                .event-admin-modal {
                    width: calc(100vw - 12px) !important;
                    max-width: calc(100vw - 12px) !important;
                }

                .event-admin-modal
                .modal-body {
                    padding: 12px;
                }

                .event-admin-modal
                input[type="date"],
                .event-admin-modal
                input[type="time"] {
                    font-size: 16px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // ============================================================
    // MODAL AÇILDIĞINDA FIXLERİ UYGULA
    // ============================================================

    function applyFixes() {
        addMobileStyles();
        fixUrlInput();
    }

    // ============================================================
    // URL'Yİ KAYDETME ÖNCESİ NORMALİZE ET
    // ============================================================

    function patchSave() {
        if (
            typeof window.saveEvent ===
            "function"
        ) {
            return;
        }

        const original =
            window.saveEvent;

        if (
            typeof original !==
            "function"
        ) {
            return;
        }
    }

    // ============================================================
    // DOM OBSERVER
    // ============================================================

    function startObserver() {
        const observer =
            new MutationObserver(
                function () {
                    const modal =
                        document.getElementById(
                            "eventAdminModal"
                        );

                    if (modal) {
                        applyFixes();
                    }
                }
            );

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
    }

    // ============================================================
    // KAYDET BUTONUNA URL NORMALİZASYONU
    // ============================================================

    function attachSaveHandler() {
        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "#eventModalSave"
                    );

                if (!button) {
                    return;
                }

                const input =
                    document.getElementById(
                        "eventTicketUrl"
                    );

                if (
                    input &&
                    input.value.trim()
                ) {
                    input.value =
                        normalizeUrl(
                            input.value
                        );
                }
            },
            true
        );
    }

    // ============================================================
    // BAŞLAT
    // ============================================================

    function init() {
        addMobileStyles();
        startObserver();
        attachSaveHandler();

        setTimeout(
            applyFixes,
            300
        );

        setTimeout(
            applyFixes,
            1000
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init
        );
    } else {
        init();
    }

})();