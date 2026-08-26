// ==========================================
// Aurevia Institute
// login.js
// Stable Production Login Controller
// ==========================================

import { supabase } from "./supabase.js";

// ==========================================
// Elements
// ==========================================

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");
const loginBtn = document.getElementById("loginBtn");
const showPassword = document.getElementById("showPassword");

// ==========================================
// Show / Hide Password
// ==========================================

if (showPassword && passwordInput) {

    showPassword.addEventListener("click", () => {

        const isPassword =
            passwordInput.type === "password";

        passwordInput.type =
            isPassword ? "text" : "password";

        showPassword.innerHTML =
            isPassword
                ? '<i class="fa-solid fa-eye-slash"></i>'
                : '<i class="fa-solid fa-eye"></i>';

        showPassword.setAttribute(
            "aria-label",
            isPassword
                ? "Hide password"
                : "Show password"
        );

    });

}

// ==========================================
// Message
// ==========================================

function showMessage(
    text,
    color = "#7b1113"
) {

    if (!message) return;

    message.textContent = text;
    message.style.color = color;

}

// ==========================================
// Loading
// ==========================================

function setLoading(state) {

    if (!loginBtn) return;

    loginBtn.disabled = state;

    if (state) {

        loginBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Please Wait...';

    } else {

        loginBtn.innerHTML =
            '<i class="fa-solid fa-right-to-bracket"></i> Login';

    }

}

// ==========================================
// Login
// ==========================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            showMessage("");
            setLoading(true);

            try {

                // ==========================================
                // Get Input
                // ==========================================

                const email =
                    String(emailInput?.value || "")
                        .trim()
                        .toLowerCase();

                const password =
                    String(passwordInput?.value || "");

                // ==========================================
                // Validation
                // ==========================================

                if (!email || !password) {

                    throw new Error(
                        "Please enter your email and password."
                    );

                }

                const emailPattern =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailPattern.test(email)) {

                    throw new Error(
                        "Please enter a valid email address."
                    );

                }

                showMessage(
                    "Logging in...",
                    "#2563eb"
                );

                // ==========================================
                // Supabase Login
                // ==========================================

                const authResult =
                    await supabase.auth.signInWithPassword({
                        email: email,
                        password: password
                    });

                const authError =
                    authResult?.error;

                const authData =
                    authResult?.data;

                if (authError) {

                    console.error(
                        "SUPABASE AUTH ERROR:",
                        authError
                    );

                    throw new Error(
                        getAuthErrorMessage(authError)
                    );

                }

                const user =
                    authData?.user;

                if (!user) {

                    throw new Error(
                        "Login failed. User account was not found."
                    );

                }

                console.log(
                    "Authenticated User:",
                    user.id
                );

                // ==========================================
                // Load Profile
                // ==========================================

                showMessage(
                    "Checking your account...",
                    "#2563eb"
                );

                const profileResult =
                    await supabase
                        .from("profiles")
                        .select(
                            "id,full_name,email,role,status"
                        )
                        .eq(
                            "id",
                            user.id
                        )
                        .maybeSingle();

                const profile =
                    profileResult?.data;

                const profileError =
                    profileResult?.error;

                if (profileError) {

                    console.error(
                        "PROFILE ERROR:",
                        profileError
                    );

                    await safeSignOut();

                    throw new Error(
                        "Unable to load your profile. Please try again."
                    );

                }

                if (!profile) {

                    console.error(
                        "PROFILE NOT FOUND:",
                        user.id
                    );

                    await safeSignOut();

                    throw new Error(
                        "Your profile was not found. Please contact the administrator."
                    );

                }

                console.log(
                    "User Profile:",
                    profile
                );

                // ==========================================
                // Normalize
                // ==========================================

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

                    showMessage(
                        "Admin login successful. Opening admin panel...",
                        "#16a34a"
                    );

                    window.location.replace(
                        "admin.html"
                    );

                    return;

                }

                // ==========================================
                // NORMAL USER
                // ==========================================

                if (role === "user") {

                    // ======================================
                    // APPROVED
                    // ======================================

                    if (status === "approved") {

                        showMessage(
                            "Login successful. Opening dashboard...",
                            "#16a34a"
                        );

                        window.location.replace(
                            "dashboard.html"
                        );

                        return;

                    }

                    // ======================================
                    // PENDING
                    // ======================================

                    if (status === "pending") {

                        await safeSignOut();

                        throw new Error(
                            "Your registration is still pending. Please wait for admin approval."
                        );

                    }

                    // ======================================
                    // REJECTED
                    // ======================================

                    if (status === "rejected") {

                        await safeSignOut();

                        throw new Error(
                            "Your registration request was rejected. Please contact the administrator."
                        );

                    }

                    // ======================================
                    // UNKNOWN STATUS
                    // ======================================

                    await safeSignOut();

                    throw new Error(
                        "Your account status is not valid. Please contact the administrator."
                    );

                }

                // ==========================================
                // UNKNOWN ROLE
                // ==========================================

                await safeSignOut();

                throw new Error(
                    "Your account role is not valid. Please contact the administrator."
                );

            } catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );

                showMessage(
                    "❌ " +
                    String(
                        error?.message ||
                        "Unable to login. Please try again."
                    ),
                    "#dc2626"
                );

                // IMPORTANT:
                // No Promise.finally() used here.
                setLoading(false);

            }

        }
    );

}

// ==========================================
// Safe Sign Out
// ==========================================

async function safeSignOut() {

    try {

        await supabase.auth.signOut();

    } catch (error) {

        console.warn(
            "Sign out warning:",
            error
        );

    }

}

// ==========================================
// Supabase Auth Errors
// ==========================================

function getAuthErrorMessage(error) {

    const errorMessage =
        String(error?.message || "")
            .toLowerCase();

    if (
        errorMessage.includes(
            "invalid login credentials"
        )
    ) {

        return "Incorrect email or password.";

    }

    if (
        errorMessage.includes(
            "email not confirmed"
        )
    ) {

        return "Please confirm your email address before logging in.";

    }

    if (
        errorMessage.includes(
            "too many requests"
        )
    ) {

        return "Too many login attempts. Please wait a little and try again.";

    }

    if (
        errorMessage.includes(
            "user not found"
        )
    ) {

        return "No account was found with this email address.";

    }

    if (
        errorMessage.includes(
            "network"
        )
    ) {

        return "Network error. Please check your internet connection.";

    }

    return (
        error?.message ||
        "Unable to login. Please try again."
    );

}

// ==========================================
// Loaded
// ==========================================

console.log(
    "Aurevia Institute Login JS Loaded Successfully."
);