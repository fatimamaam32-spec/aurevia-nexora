/* =========================================
   AUREVIA INSTITUTE
   COMMUNITY.JS
   UI INTERACTIONS + CLICK EFFECTS
   SUPABASE DATA IS HANDLED BY COMMUNITY.HTML
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    "use strict";

    /* =========================================
       COMMUNITY GRID
    ========================================= */

    const wrapper =
        document.querySelector("#platforms-wrapper");

    if (!wrapper) {
        console.error(
            "Aurevia Community Error: #platforms-wrapper was not found."
        );
        return;
    }


    /* =========================================
       CARD OBSERVER
       Works with dynamically loaded Supabase cards
    ========================================= */

    function initializeCards() {

        const cards =
            wrapper.querySelectorAll(".platform-card");

        if (!cards.length) return;


        /* =========================================
           CARD LOAD ANIMATION
        ========================================= */

        cards.forEach(function (card, index) {

            if (card.dataset.uiReady === "true") return;

            card.dataset.uiReady = "true";

            card.style.opacity = "0";
            card.style.transform = "translateY(15px)";

            card.style.transition =
                "opacity 0.45s ease, transform 0.45s ease, box-shadow 0.25s ease";


            setTimeout(function () {

                card.style.opacity = "1";

                card.style.transform =
                    "translateY(0)";

            }, 80 + (index * 80));


            /* =========================================
               CARD ACCESSIBILITY
            ========================================= */

            card.setAttribute("tabindex", "0");


            /* =========================================
               CARD KEYBOARD EFFECT
            ========================================= */

            card.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        const button =
                            card.querySelector(".btn-action");

                        if (button) {

                            event.preventDefault();

                            button.click();

                        }

                    }

                }
            );

        });


        /* =========================================
           BUTTON EFFECTS
        ========================================= */

        const buttons =
            wrapper.querySelectorAll(".btn-action");


        buttons.forEach(function (button) {

            if (button.dataset.uiReady === "true") return;

            button.dataset.uiReady = "true";


            /* =========================================
               PRESS EFFECT
            ========================================= */

            button.addEventListener(
                "pointerdown",
                function () {

                    button.style.transform =
                        "scale(0.96)";

                    button.style.transition =
                        "transform 0.12s ease, box-shadow 0.12s ease";

                    button.style.boxShadow =
                        "0 3px 10px rgba(163, 12, 36, 0.35)";

                }
            );


            /* =========================================
               RELEASE EFFECT
            ========================================= */

            function releaseButton() {

                button.style.transform = "";

                button.style.boxShadow = "";

            }


            button.addEventListener(
                "pointerup",
                releaseButton
            );

            button.addEventListener(
                "pointercancel",
                releaseButton
            );

            button.addEventListener(
                "pointerleave",
                releaseButton
            );


            /* =========================================
               RIPPLE EFFECT
            ========================================= */

            button.addEventListener(
                "click",
                function (event) {

                    const rect =
                        button.getBoundingClientRect();

                    const ripple =
                        document.createElement("span");

                    const size =
                        Math.max(
                            rect.width,
                            rect.height
                        );

                    ripple.style.position =
                        "absolute";

                    ripple.style.width =
                        size + "px";

                    ripple.style.height =
                        size + "px";

                    ripple.style.left =
                        (event.clientX - rect.left - size / 2) + "px";

                    ripple.style.top =
                        (event.clientY - rect.top - size / 2) + "px";

                    ripple.style.borderRadius =
                        "50%";

                    ripple.style.background =
                        "rgba(255,255,255,0.18)";

                    ripple.style.transform =
                        "scale(0)";

                    ripple.style.pointerEvents =
                        "none";

                    ripple.style.animation =
                        "aureviaRipple 0.55s ease-out forwards";


                    const currentPosition =
                        getComputedStyle(button).position;

                    if (currentPosition === "static") {

                        button.style.position =
                            "relative";

                    }


                    button.style.overflow =
                        "hidden";


                    button.appendChild(ripple);


                    setTimeout(function () {

                        ripple.remove();

                    }, 600);

                }
            );


            /* =========================================
               HOVER ICON EFFECT
            ========================================= */

            const arrow =
                button.querySelector("i");


            if (arrow) {

                button.addEventListener(
                    "mouseenter",
                    function () {

                        arrow.style.transform =
                            "translateX(4px)";

                    }
                );


                button.addEventListener(
                    "mouseleave",
                    function () {

                        arrow.style.transform =
                            "";

                    }
                );

            }

        });


        /* =========================================
           EXTERNAL LINK SAFETY
        ========================================= */

        wrapper
            .querySelectorAll('a[target="_blank"]')
            .forEach(function (link) {

                link.setAttribute(
                    "rel",
                    "noopener noreferrer"
                );

            });

    }


    /* =========================================
       RIPPLE ANIMATION
    ========================================= */

    if (!document.getElementById("aurevia-community-effects")) {

        const style =
            document.createElement("style");

        style.id =
            "aurevia-community-effects";

        style.textContent = `

            @keyframes aureviaRipple {

                0% {
                    transform: scale(0);
                    opacity: 0.7;
                }

                100% {
                    transform: scale(2.5);
                    opacity: 0;
                }

            }

            .platform-card:focus-visible {
                outline: 2px solid #d4a94f;
                outline-offset: 3px;
            }

            .btn-action:focus-visible {
                outline: 2px solid #fce8bd;
                outline-offset: 3px;
            }

            .btn-action i {
                transition:
                    transform 0.25s ease;
            }

        `;

        document.head.appendChild(style);

    }


    /* =========================================
       INITIALIZE EXISTING CARDS
    ========================================= */

    initializeCards();


    /* =========================================
       WATCH SUPABASE-DYNAMIC CARDS
       
       Jab Supabase cards ko HTML mein render karega,
       ye automatically effects apply karega.
    ========================================= */

    const observer =
        new MutationObserver(function () {

            initializeCards();

        });


    observer.observe(
        wrapper,
        {
            childList: true,
            subtree: true
        }
    );


    /* =========================================
       PAGE READY
    ========================================= */

    console.log(
        "Aurevia Institute Community UI loaded successfully."
    );

});