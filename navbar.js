// ==========================================
// Skill Course Academy
// navbar.js
// Production Role-Based Navigation
// ==========================================

import { supabase } from "./supabase.js";


// ==========================================
// Menu Helper
// ==========================================

function showMenu(id, show) {

    const element = document.getElementById(id);

    if (!element) return;

    if (show) {

        element.classList.remove("d-none");

        element.removeAttribute("aria-hidden");

    } else {

        element.classList.add("d-none");

        element.setAttribute("aria-hidden", "true");

    }

}


// ==========================================
// Reset All Menus
// ==========================================

function resetMenus() {

    // Public

    showMenu("menuHome", true);

    showMenu("menuLogin", false);

    showMenu("menuSignup", false);


    // Member

    showMenu("menuDashboard", false);

    showMenu("menuCourses", false);

    showMenu("menuReferral", false);

    showMenu("menuRewards", false);

    showMenu("menuCommunity", false);

    showMenu("menuAbout", false);

    showMenu("menuContact", false);


    // Admin

    showMenu("menuAdmin", false);


    // Logout

    showMenu("menuLogout", false);

}


// ==========================================
// Get Current Profile
// ==========================================

async function getCurrentProfile(userId) {

    if (!userId) return null;


    const {
        data: profile,
        error
    } = await supabase

        .from("profiles")

        .select(
            "id,full_name,email,role,status"
        )

        .eq(
            "id",
            userId
        )

        .maybeSingle();


    if (error) {

        console.error(
            "NAVBAR PROFILE ERROR:",
            error
        );

        return null;

    }


    return profile || null;

}


// ==========================================
// Update Navbar
// ==========================================

async function updateNavbar() {

    try {

        // Always start from clean state

        resetMenus();


        // ==========================================
        // Get Current Session
        // ==========================================

        const {
            data,
            error: sessionError
        } = await supabase.auth.getSession();


        if (sessionError) {

            console.error(
                "NAVBAR SESSION ERROR:",
                sessionError
            );

            showGuestMenus();

            return;

        }


        const session = data?.session;


        // ==========================================
        // GUEST
        // ==========================================

        if (!session) {

            showGuestMenus();

            return;

        }


        const user = session.user;


        if (!user?.id) {

            showGuestMenus();

            return;

        }


        // ==========================================
        // Get Profile
        // ==========================================

        const profile =
            await getCurrentProfile(user.id);


        // ==========================================
        // Profile Missing
        // ==========================================

        if (!profile) {

            console.warn(
                "NAVBAR: Profile not found."
            );

            showGuestMenus();

            return;

        }


        // Normalize values

        const role =
            String(profile.role || "")
                .trim()
                .toLowerCase();


        const status =
            String(profile.status || "")
                .trim()
                .toLowerCase();


        // ==========================================
        // ADMIN
        // ==========================================

        if (role === "admin") {

            showMenu(
                "menuAdmin",
                true
            );

            showMenu(
                "menuLogout",
                true
            );


            console.log(
                "NAVBAR: Admin mode enabled."
            );


            return;

        }


        // ==========================================
        // APPROVED USER
        // ==========================================

        if (
            role === "user" &&
            status === "approved"
        ) {

            showMenu(
                "menuDashboard",
                true
            );

            showMenu(
                "menuCourses",
                true
            );

            showMenu(
                "menuReferral",
                true
            );

            showMenu(
                "menuRewards",
                true
            );

            showMenu(
                "menuCommunity",
                true
            );

            showMenu(
                "menuAbout",
                true
            );

            showMenu(
                "menuContact",
                true
            );

            showMenu(
                "menuLogout",
                true
            );


            console.log(
                "NAVBAR: Approved user mode enabled."
            );


            return;

        }


        // ==========================================
        // PENDING / REJECTED
        // ==========================================

        if (
            role === "user" &&
            (
                status === "pending" ||
                status === "rejected"
            )
        ) {

            // Keep guest-style access

            showGuestMenus();


            console.log(
                "NAVBAR: User is not approved."
            );


            return;

        }


        // ==========================================
        // UNKNOWN ACCOUNT
        // ==========================================

        console.warn(
            "NAVBAR: Unknown role/status.",
            profile
        );


        showGuestMenus();

    }

    catch (error) {

        console.error(
            "NAVBAR UPDATE ERROR:",
            error
        );


        showGuestMenus();

    }

}


// ==========================================
// Guest Menus
// ==========================================

function showGuestMenus() {

    resetMenus();

    showMenu(
        "menuHome",
        true
    );

    showMenu(
        "menuLogin",
        true
    );

    showMenu(
        "menuSignup",
        true
    );

}


// ==========================================
// Logout
// ==========================================

async function logout() {

    try {

        const {
            error
        } = await supabase.auth.signOut();


        if (error) {

            console.error(
                "LOGOUT ERROR:",
                error
            );

            alert(
                "Unable to logout. Please try again."
            );

            return;

        }


        // Immediately return to public homepage

        window.location.replace(
            "index.html"
        );

    }

    catch (error) {

        console.error(
            "LOGOUT FAILED:",
            error
        );

        alert(
            "Something went wrong while logging out."
        );

    }

}


// ==========================================
// Attach Logout Event
// ==========================================

function attachLogoutButton() {

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutBtn) return;


    // Prevent duplicate listeners

    if (
        logoutBtn.dataset.listenerAttached === "true"
    ) {

        return;

    }


    logoutBtn.dataset.listenerAttached =
        "true";


    logoutBtn.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();

            await logout();

        }
    );

}


// ==========================================
// Initialize Navbar
// ==========================================

async function initializeNavbar() {

    await updateNavbar();

    attachLogoutButton();

}


// ==========================================
// DOM Ready
// ==========================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeNavbar
    );

} else {

    initializeNavbar();

}


// ==========================================
// Auth State Listener
// ==========================================

supabase.auth.onAuthStateChange(
    async (event) => {

        console.log(
            "AUTH STATE CHANGED:",
            event
        );


        // Give Supabase a moment to finish
        // updating the session before reading it.

        setTimeout(
            async () => {

                await updateNavbar();

                attachLogoutButton();

            },
            50
        );

    }
);


// ==========================================
// END navbar.js
// ==========================================