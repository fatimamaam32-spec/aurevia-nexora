// =====================================
// Skill Course Academy
// script.js
// =====================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("Skill Course Academy Loaded Successfully ✅");

    // Navbar Active Link
    const currentPage = window.location.pathname.split("/").pop();

    document.querySelectorAll(".nav-link").forEach(link => {

        const href = link.getAttribute("href");

        if (href === currentPage) {
            link.classList.add("active");
        }

    });

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function (e) {

            e.preventDefault();

            const target = document.querySelector(this.getAttribute("href"));

            if (target) {
                target.scrollIntoView({
                    behavior: "smooth"
                });
            }

        });

    });

    // Buttons Animation
    document.querySelectorAll(".btn").forEach(button => {

        button.addEventListener("mouseenter", function () {
            this.style.transform = "scale(1.03)";
        });

        button.addEventListener("mouseleave", function () {
            this.style.transform = "scale(1)";
        });

    });

    console.log("script.js Running Successfully 🚀");

});