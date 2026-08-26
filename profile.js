// ==========================================
// Aurevia Institute
// profile.js
// Production Profile System
// Fixed Student Graduation Avatar
// Imperial Dark Red, Maroon, & Gold Theme
// ==========================================

import { supabase } from "./supabase.js";

// ==========================================
// Helpers
// ==========================================

const $ = (id) => document.getElementById(id);

const profileContent = $("profileContent");
const errorBox = $("errorBox");
const successBox = $("successBox");
const toastBox = $("toast");

let currentUser = null;
let currentProfile = null;


// ==========================================
// Messages & Notifications
// ==========================================

function showError(message) {
    if (!errorBox) return;

    errorBox.textContent = message;
    errorBox.hidden = false;

    if (successBox) {
        successBox.hidden = true;
    }
}


function showSuccess(message) {
    if (!successBox) return;

    successBox.textContent = message;
    successBox.hidden = false;

    if (errorBox) {
        errorBox.hidden = true;
    }
}


function clearMessages() {
    if (errorBox) {
        errorBox.hidden = true;
        errorBox.textContent = "";
    }

    if (successBox) {
        successBox.hidden = true;
        successBox.textContent = "";
    }
}


function toast(message) {
    if (!toastBox) return;

    toastBox.textContent = message;
    toastBox.classList.add("show");

    window.setTimeout(() => {
        toastBox.classList.remove("show");
    }, 1800);
}


// ==========================================
// Authentication
// ==========================================

async function getAuthenticatedUser() {

    const {
        data,
        error
    } = await supabase.auth.getUser();


    if (error) {
        console.error(
            "AUTH USER ERROR:",
            error
        );

        throw new Error(
            "Unable to verify your login session."
        );
    }


    const user = data?.user;


    if (!user) {
        window.location.replace(
            "login.html"
        );

        return null;
    }


    return user;
}


// ==========================================
// Get Profile
// ==========================================

async function getProfile(userId) {

    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select(`
            id,
            full_name,
            email,
            phone,
            status,
            role,
            referral_code
        `)
        .eq("id", userId)
        .maybeSingle();


    if (error) {
        console.error(
            "PROFILE FETCH ERROR:",
            error
        );

        throw new Error(
            "Your profile could not be loaded."
        );
    }


    return data;
}


// ==========================================
// Approved Account Check
// ==========================================

async function checkApprovedProfile(profile) {

    if (!profile) {
        throw new Error(
            "Your member profile could not be found. Please contact the administrator."
        );
    }


    const role =
        String(profile.role || "")
            .trim()
            .toLowerCase();


    const status =
        String(profile.status || "")
            .trim()
            .toLowerCase();


    // Admin goes to admin dashboard
    if (role === "admin") {
        window.location.replace(
            "admin.html"
        );

        return false;
    }


    // Only normal members allowed here
    if (
        role &&
        role !== "user"
    ) {
        throw new Error(
            "Your account role is not valid."
        );
    }


    // Only approved members
    if (status !== "approved") {
        await signOutAndLogin();

        return false;
    }


    return true;
}


// ==========================================
// Sign Out + Login
// ==========================================

async function signOutAndLogin() {

    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error(
            "SIGN OUT ERROR:",
            error
        );
    }


    window.location.replace(
        "login.html"
    );
}


// ==========================================
// Safe Text Format
// ==========================================

function safeText(value) {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return "Not available";
    }


    return String(value).trim();
}


// ==========================================
// Format Member ID
// ==========================================

function formatMemberId(id) {

    if (!id) {
        return "Not available";
    }


    const value = String(id);


    if (value.length <= 12) {
        return value;
    }


    return (
        value.slice(0, 8) +
        "..." +
        value.slice(-4)
    );
}


// ==========================================
// Generate Referral Code
// ==========================================

function generateReferralCode(
    name,
    userId
) {

    const namePart =
        String(name || "USER")
            .replace(
                /[^a-zA-Z]/g,
                ""
            )
            .toUpperCase()
            .slice(0, 4)
            .padEnd(4, "X");


    const idPart =
        String(userId || "")
            .replace(
                /-/g,
                ""
            )
            .toUpperCase()
            .slice(0, 6);


    return (
        "AUR-" +
        namePart +
        "-" +
        idPart
    );
}


// ==========================================
// Ensure Referral Code Exists
// ==========================================

async function ensureReferralCode(
    profile
) {

    if (
        profile.referral_code &&
        String(
            profile.referral_code
        ).trim()
    ) {
        return String(
            profile.referral_code
        ).trim();
    }


    const newCode =
        generateReferralCode(
            profile.full_name,
            profile.id
        );


    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .update({
            referral_code: newCode
        })
        .eq(
            "id",
            profile.id
        )
        .select(
            "referral_code"
        )
        .maybeSingle();


    if (error) {
        console.error(
            "REFERRAL CODE UPDATE ERROR:",
            error
        );

        throw new Error(
            "Your referral code could not be created."
        );
    }


    return (
        data?.referral_code ||
        newCode
    );
}


// ==========================================
// Fixed Ultra-Premium Scholar Avatar setup
// ==========================================

function keepDefaultStudentAvatar() {

    const avatar = $("avatarImage");

    if (!avatar) return;

    avatar.setAttribute(
        "role",
        "img"
    );

    avatar.setAttribute(
        "aria-label",
        "Aurevia Institute graduation student avatar"
    );

    // Dynamic shimmer effect on interaction
    avatar.addEventListener("touchstart", () => {
        avatar.style.transform = "scale(1.03)";
        avatar.style.transition = "transform 0.2s ease";
    }, { passive: true });

    avatar.addEventListener("touchend", () => {
        avatar.style.transform = "scale(1)";
    }, { passive: true });
}


// ==========================================
// Render Profile Data to DOM
// ==========================================

function renderProfile(
    profile,
    user,
    referralCode
) {

    const name =
        profile.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Member";


    // Profile Name (Header Section)
    if ($("profileName")) {
        $("profileName").textContent = safeText(name);
    }

    // Full Name (Personal Info)
    if ($("fullName")) {
        $("fullName").textContent = safeText(name);
    }

    // Email Address
    if ($("email")) {
        $("email").textContent = safeText(
            profile.email || user.email
        );
    }

    // Phone Number
    if ($("phone")) {
        $("phone").textContent = safeText(
            profile.phone
        );
    }

    // Member ID
    if ($("memberId")) {
        $("memberId").textContent = formatMemberId(
            profile.id
        );
    }

    // Account Status
    if ($("accountStatus")) {
        $("accountStatus").textContent = "APPROVED";
    }

    // Referral Code
    if ($("referralCode")) {
        $("referralCode").textContent = safeText(
            referralCode
        );
    }

    // Maintain Fixed Scholar Avatar
    keepDefaultStudentAvatar();

    // Display Main Content Section
    if (profileContent) {
        profileContent.hidden = false;
    }
}


// ==========================================
// Copy Referral Code Action
// ==========================================

async function copyReferralCode() {

    const element = $("referralCode");

    if (!element) return;

    const code = element.textContent.trim();

    if (
        !code ||
        code === "Not available"
    ) {
        toast("Referral code is not available");
        return;
    }


    try {
        await navigator.clipboard.writeText(code);
        toast("Referral code copied");
    } catch (error) {
        console.error(
            "COPY ERROR:",
            error
        );

        // Fallback Strategy
        const textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand("copy");
            toast("Referral code copied");
        } catch {
            toast("Copy is not available");
        }

        textarea.remove();
    }
}


// Bind Copy Event Listener
const copyReferralBtn = $("copyReferral");

if (copyReferralBtn) {
    copyReferralBtn.addEventListener(
        "click",
        copyReferralCode
    );
}


// ==========================================
// Initialize Profile Module
// ==========================================

async function initProfile() {

    clearMessages();

    try {
        // Step 1: Authentication Check
        currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return;
        }

        // Step 2: Fetch Profile Record
        currentProfile = await getProfile(currentUser.id);

        if (!currentProfile) {
            showError(
                "Your member profile could not be found. Please contact the administrator."
            );
            return;
        }

        // Step 3: Check Approval & Role
        const approved = await checkApprovedProfile(currentProfile);

        if (!approved) {
            return;
        }

        // Step 4: Ensure Referral Code Exists
        const referralCode = await ensureReferralCode(currentProfile);
        currentProfile.referral_code = referralCode;

        // Step 5: Render User UI
        renderProfile(
            currentProfile,
            currentUser,
            referralCode
        );

    } catch (error) {
        console.error(
            "AUREVIA PROFILE ERROR:",
            error
        );

        showError(
            error?.message ||
            "Unable to load your profile. Please try again."
        );
    }
}


// ==========================================
// Auth State Event Listener
// ==========================================

supabase.auth.onAuthStateChange(
    (event) => {
        if (event === "SIGNED_OUT") {
            window.location.replace(
                "login.html"
            );
        }
    }
);


// ==========================================
// Execute Initialization
// ==========================================

initProfile();

// ==========================================
// END profile.js
// ==========================================
