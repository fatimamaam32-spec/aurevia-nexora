// ==========================================
// Aurevia Institute
// signup.js
// Complete Updated Production Version
// PART 1 OF 2
// ==========================================

import { supabase } from "./supabase.js";


// ==========================================
// ELEMENTS
// ==========================================

const signupForm =
    document.getElementById("signupForm");

const fullName =
    document.getElementById("fullName");

const phone =
    document.getElementById("phone");

const email =
    document.getElementById("email");

const password =
    document.getElementById("password");

const confirmPassword =
    document.getElementById("confirmPassword");

const transactionId =
    document.getElementById("transactionId");

const screenshot =
    document.getElementById("screenshot");

const message =
    document.getElementById("message");

const submitBtn =
    signupForm?.querySelector(
        'button[type="submit"]'
    );


// ==========================================
// PAYMENT ELEMENTS
// ==========================================

const paymentMethod =
    document.getElementById("paymentMethod");

const registrationFee =
    document.getElementById("registrationFee");

const paymentAccountTitle =
    document.getElementById("paymentAccountTitle");

const paymentNumber =
    document.getElementById("paymentNumber");


// ==========================================
// PASSWORD RULE ELEMENTS
// ==========================================

const ruleLength =
    document.getElementById("ruleLength");

const ruleUpper =
    document.getElementById("ruleUpper");

const ruleLower =
    document.getElementById("ruleLower");

const ruleNumber =
    document.getElementById("ruleNumber");

const ruleUnderscore =
    document.getElementById("ruleUnderscore");


// ==========================================
// REFERRAL SYSTEM
// ==========================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const referralCode =
    (
        urlParams.get("ref") || ""
    )
        .trim()
        .toUpperCase();

let referrerId = null;


// ==========================================
// PAYMENT SETTINGS
// ==========================================

let paymentSettings = {

    paymentMethod: "",
    registrationFee: "",
    paymentAccountTitle: "",
    paymentNumber: ""

};


// ==========================================
// SUBMIT LOCK
// ==========================================

let submitting = false;


// ==========================================
// MESSAGE HELPER
// ==========================================

function showMessage(
    text = "",
    color = "#7b1113"
) {

    if (!message) return;

    message.textContent =
        text;

    message.style.color =
        color;

}


// ==========================================
// LOADING BUTTON
// ==========================================

function loading(state) {

    if (!submitBtn) return;

    submitBtn.disabled =
        state;

    if (state) {

        submitBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Please Wait...';

    } else {

        submitBtn.innerHTML =
            '<i class="fa-solid fa-paper-plane"></i> Submit For Approval';

    }

}


// ==========================================
// PASSWORD RULE HELPER
// ==========================================

function updateRule(
    element,
    valid,
    text
) {

    if (!element) return;

    element.textContent =
        `${valid ? "✅" : "❌"} ${text}`;

    element.classList.toggle(
        "valid",
        valid
    );

}


// ==========================================
// PASSWORD VALIDATION
// ==========================================

function validatePassword(value) {

    const hasLength =
        value.length >= 8;

    const hasUpper =
        /[A-Z]/.test(value);

    const hasLower =
        /[a-z]/.test(value);

    const hasNumber =
        /[0-9]/.test(value);

    const hasUnderscore =
        /_/.test(value);


    updateRule(
        ruleLength,
        hasLength,
        "Minimum 8 Characters"
    );

    updateRule(
        ruleUpper,
        hasUpper,
        "One Uppercase Letter (A-Z)"
    );

    updateRule(
        ruleLower,
        hasLower,
        "One Lowercase Letter (a-z)"
    );

    updateRule(
        ruleNumber,
        hasNumber,
        "One Number (0-9)"
    );

    updateRule(
        ruleUnderscore,
        hasUnderscore,
        "One Underscore (_)"
    );


    return (

        hasLength &&
        hasUpper &&
        hasLower &&
        hasNumber &&
        hasUnderscore

    );

}


// ==========================================
// PASSWORD LIVE VALIDATION
// ==========================================

password?.addEventListener(
    "input",
    () => {

        validatePassword(
            password.value
        );


        if (
            confirmPassword &&
            confirmPassword.value
        ) {

            if (
                password.value !==
                confirmPassword.value
            ) {

                showMessage(
                    "Passwords do not match."
                );

            } else {

                showMessage(
                    "Passwords match.",
                    "#26734a"
                );

            }

        }

    }
);


// ==========================================
// CONFIRM PASSWORD VALIDATION
// ==========================================

confirmPassword?.addEventListener(
    "input",
    () => {

        if (!confirmPassword.value) {

            showMessage("");
            return;

        }


        if (
            password.value !==
            confirmPassword.value
        ) {

            showMessage(
                "Passwords do not match."
            );

        } else {

            showMessage(
                "Passwords match.",
                "#26734a"
            );

        }

    }
);


// ==========================================
// PASSWORD TOGGLE
// ==========================================

function togglePassword(
    input,
    button
) {

    if (!input || !button) return;

    const showing =
        input.type === "password";


    input.type =
        showing
            ? "text"
            : "password";


    button.innerHTML =
        showing
            ? '<i class="fa-solid fa-eye-slash"></i>'
            : '<i class="fa-solid fa-eye"></i>';


    button.setAttribute(
        "aria-label",
        showing
            ? "Hide password"
            : "Show password"
    );

}


// ==========================================
// PASSWORD TOGGLE SETUP
// ==========================================

function setupPasswordToggle(
    buttonId,
    input
) {

    const button =
        document.getElementById(
            buttonId
        );

    if (!button || !input) return;


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            togglePassword(
                input,
                button
            );

        }
    );

}


setupPasswordToggle(
    "showPassword",
    password
);

setupPasswordToggle(
    "showConfirmPassword",
    confirmPassword
);


// ==========================================
// EMAIL VALIDATION
// ==========================================

function validateEmail(value) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(value);

}


// ==========================================
// PHONE VALIDATION
// ==========================================

function validatePhone(value) {

    const normalized =
        value.replace(
            /[\s-]/g,
            ""
        );

    return (

        /^03\d{9}$/.test(normalized) ||
        /^\+923\d{9}$/.test(normalized) ||
        /^00923\d{9}$/.test(normalized)

    );

}


// ==========================================
// SCREENSHOT VALIDATION
// ==========================================

function validateScreenshotFile(file) {

    if (!file) {

        throw new Error(
            "Please upload your payment screenshot."
        );

    }


    const allowedTypes = [

        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"

    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            "Only JPG, JPEG, PNG and WEBP images are allowed."
        );

    }


    const maxSize =
        5 * 1024 * 1024;


    if (
        file.size > maxSize
    ) {

        throw new Error(
            "Image size must be less than 5MB."
        );

    }


    return true;

}


// ==========================================
// SCREENSHOT CHANGE
// ==========================================

screenshot?.addEventListener(
    "change",
    () => {

        const file =
            screenshot.files?.[0];


        if (!file) return;


        try {

            validateScreenshotFile(
                file
            );

            showMessage(
                "Payment screenshot selected successfully.",
                "#26734a"
            );

        } catch (error) {

            console.error(
                "SCREENSHOT VALIDATION ERROR:",
                error
            );

            screenshot.value =
                "";

            showMessage(
                error.message,
                "#7b1113"
            );

        }

    }
);


// ==========================================
// LOAD PAYMENT SETTINGS
// ==========================================

async function loadPaymentSettings() {

    try {

        const {
            data,
            error
        } = await supabase

            .from("site_settings")

            .select(
                "setting_key, setting_value"
            )

            .in(
                "setting_key",
                [

                    "payment_method",
                    "registration_fee",
                    "payment_account_title",
                    "payment_number"

                ]
            );


        if (error) {

            console.error(
                "PAYMENT SETTINGS ERROR:",
                error
            );

            throw error;

        }


        if (
            !data ||
            data.length === 0
        ) {

            throw new Error(
                "Payment details are not configured yet."
            );

        }


        const settings = {};


        data.forEach(
            row => {

                settings[
                    row.setting_key
                ] =
                    row.setting_value;

            }
        );


        paymentSettings = {

            paymentMethod:
                settings.payment_method || "",

            registrationFee:
                settings.registration_fee || "",

            paymentAccountTitle:
                settings.payment_account_title || "",

            paymentNumber:
                settings.payment_number || ""

        };


        if (

            !paymentSettings.paymentMethod ||
            !paymentSettings.registrationFee ||
            !paymentSettings.paymentAccountTitle ||
            !paymentSettings.paymentNumber

        ) {

            throw new Error(
                "Some payment details are missing."
            );

        }


        if (paymentMethod) {

            paymentMethod.textContent =
                paymentSettings.paymentMethod;

        }


        if (registrationFee) {

            const fee =
                Number(
                    paymentSettings.registrationFee
                );

            registrationFee.textContent =
                Number.isFinite(fee)
                    ? fee.toLocaleString("en-PK")
                    : paymentSettings.registrationFee;

        }


        if (paymentAccountTitle) {

            paymentAccountTitle.textContent =
                paymentSettings.paymentAccountTitle;

        }


        if (paymentNumber) {

            paymentNumber.textContent =
                paymentSettings.paymentNumber;

        }


        console.log(
            "PAYMENT SETTINGS LOADED:",
            paymentSettings
        );


        return paymentSettings;


    } catch (error) {

        console.error(
            "LOAD PAYMENT SETTINGS FAILED:",
            error
        );


        if (paymentMethod) {

            paymentMethod.textContent =
                "Unavailable";

        }

        if (registrationFee) {

            registrationFee.textContent =
                "Unavailable";

        }

        if (paymentAccountTitle) {

            paymentAccountTitle.textContent =
                "Unavailable";

        }

        if (paymentNumber) {

            paymentNumber.textContent =
                "Unavailable";

        }


        return null;

    }

}


// ==========================================
// RESOLVE REFERRAL CODE
// ==========================================

async function resolveReferralCode() {

    if (!referralCode) {

        referrerId = null;

        return null;

    }


    console.log(
        "VERIFYING REFERRAL CODE:",
        referralCode
    );


    const {
        data,
        error
    } = await supabase.rpc(
        "get_referrer_id",
        {

            p_referral_code:
                referralCode

        }
    );


    if (error) {

        console.error(
            "REFERRAL RPC ERROR:",
            error
        );

        throw new Error(
            "Unable to verify the referral code."
        );

    }


    if (!data) {

        throw new Error(
            "The referral link is invalid."
        );

    }


    referrerId =
        data;


    console.log(
        "REFERRER ID VERIFIED:",
        referrerId
    );


    return referrerId;

}


// ==========================================
// INITIALIZE REFERRAL
// ==========================================

async function initializeReferral() {

    if (!referralCode) {

        console.log(
            "NO REFERRAL CODE PROVIDED."
        );

        return;

    }


    try {

        await resolveReferralCode();


        if (referrerId) {

            showMessage(
                "Referral link verified successfully.",
                "#26734a"
            );

        }


    } catch (error) {

        console.error(
            "REFERRAL INITIALIZATION FAILED:",
            error
        );


        showMessage(
            error.message,
            "#7b1113"
        );

    }

}


// ==========================================
// INITIALIZE PAGE
// ==========================================

async function initializePage() {

    console.log(
        "Initializing Aurevia signup page..."
    );


    await loadPaymentSettings();

    await initializeReferral();


    console.log(
        "Aurevia signup page initialized successfully."
    );

}


initializePage();


// ==========================================
// SAFE FILE NAME HELPER
// ==========================================

function getSafeFileName(fileName) {

    return fileName
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );

}


// ==========================================
// UPLOAD PAYMENT SCREENSHOT
// ==========================================

async function uploadPaymentScreenshot(
    userId,
    file
) {

    if (!userId) {

        throw new Error(
            "User ID was not created."
        );

    }


    validateScreenshotFile(
        file
    );


    const safeFileName =
        getSafeFileName(
            file.name
        );


    const filePath =
        `signup-requests/${userId}/${Date.now()}-${safeFileName}`;


    console.log(
        "UPLOADING SCREENSHOT:",
        filePath
    );


    const {
        error: uploadError
    } = await supabase.storage

        .from(
            "payment-screenshots"
        )

        .upload(
            filePath,
            file,
            {

                cacheControl:
                    "3600",

                upsert:
                    false,

                contentType:
                    file.type

            }
        );


    if (uploadError) {

        console.error(
            "SCREENSHOT UPLOAD ERROR:",
            uploadError
        );

        throw new Error(
            `Payment screenshot upload failed: ${uploadError.message}`
        );

    }


    console.log(
        "SCREENSHOT UPLOADED SUCCESSFULLY:",
        filePath
    );


    const {
        data: publicUrlData
    } = supabase.storage

        .from(
            "payment-screenshots"
        )

        .getPublicUrl(
            filePath
        );


    const screenshotUrl =
        publicUrlData?.publicUrl;


    if (!screenshotUrl) {

        throw new Error(
            "Screenshot URL could not be generated."
        );

    }


    console.log(
        "SCREENSHOT PUBLIC URL:",
        screenshotUrl
    );


    return {

        filePath,
        screenshotUrl

    };

}
// ==========================================
// CREATE SIGNUP REQUEST
// ==========================================

async function createSignupRequest({

    nameValue,
    phoneValue,
    emailValue,
    transactionValue,
    screenshotUrl,
    userId

}) {

    console.log(
        "CREATING SIGNUP REQUEST..."
    );


    const requestPayload = {

        full_name:
            nameValue,

        email:
            emailValue,

        phone:
            phoneValue,

        transaction_id:
            transactionValue,

        payment_method:
            paymentSettings.paymentMethod,

        screenshot_url:
            screenshotUrl,

        referral_code:
            referralCode || null,

        referred_by:
            referrerId || null,

        user_id:
            userId,

        status:
            "pending"

    };


    console.log(
        "SIGNUP REQUEST PAYLOAD:",
        requestPayload
    );


    const {
        data: requestData,
        error: requestError
    } = await supabase

        .from(
            "signup_requests"
        )

        .insert(
            requestPayload
        )

        .select()

        .single();


    if (requestError) {

        console.error(
            "SIGNUP REQUEST INSERT ERROR:",
            requestError
        );

        throw new Error(
            `Registration request failed: ${requestError.message}`
        );

    }


    if (!requestData) {

        throw new Error(
            "Signup request was not created in Supabase."
        );

    }


    console.log(
        "SIGNUP REQUEST CREATED SUCCESSFULLY:",
        requestData
    );


    return requestData;

}


// ==========================================
// CREATE AUTH USER
// ==========================================

async function createAuthUser({

    nameValue,
    phoneValue,
    emailValue,
    passwordValue

}) {

    console.log(
        "CREATING SUPABASE AUTH USER..."
    );


    const {
        data: authData,
        error: authError
    } = await supabase.auth.signUp({

        email:
            emailValue,

        password:
            passwordValue,

        options: {

            data: {

                full_name:
                    nameValue,

                phone:
                    phoneValue

            }

        }

    });


    if (authError) {

        console.error(
            "AUTH SIGNUP ERROR:",
            authError
        );


        const authMessage =
            authError.message || "";


        if (

            /already registered|already exists|user already/i
                .test(
                    authMessage
                )

        ) {

            throw new Error(
                "This email is already registered. Please use Login instead."
            );

        }


        throw new Error(
            authMessage ||
            "Unable to create your account."
        );

    }


    const userId =
        authData?.user?.id;


    if (!userId) {

        console.error(
            "AUTH DATA:",
            authData
        );

        throw new Error(
            "Account was not created properly. User ID is missing."
        );

    }


    console.log(
        "AUTH USER CREATED:",
        userId
    );


    return {

        userId,
        authData

    };

}


// ==========================================
// RESET FORM UI
// ==========================================

function resetSignupForm() {

    signupForm?.reset();


    updateRule(
        ruleLength,
        false,
        "Minimum 8 Characters"
    );

    updateRule(
        ruleUpper,
        false,
        "One Uppercase Letter (A-Z)"
    );

    updateRule(
        ruleLower,
        false,
        "One Lowercase Letter (a-z)"
    );

    updateRule(
        ruleNumber,
        false,
        "One Number (0-9)"
    );

    updateRule(
        ruleUnderscore,
        false,
        "One Underscore (_)"
    );

}


// ==========================================
// FORM SUBMIT
// ==========================================

signupForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (submitting) {

            console.log(
                "SIGNUP ALREADY IN PROGRESS."
            );

            return;

        }


        submitting =
            true;


        loading(
            true
        );


        showMessage(
            ""
        );


        try {


            // ==================================
            // GET FORM VALUES
            // ==================================

            const nameValue =
                fullName?.value
                    ?.trim() || "";


            const phoneValue =
                phone?.value
                    ?.trim() || "";


            const emailValue =
                email?.value
                    ?.trim()
                    ?.toLowerCase() || "";


            const passwordValue =
                password?.value || "";


            const confirmValue =
                confirmPassword?.value || "";


            const transactionValue =
                transactionId?.value
                    ?.trim() || "";


            const imageFile =
                screenshot?.files?.[0];


            console.log(
                "STARTING SIGNUP PROCESS FOR:",
                emailValue
            );


            // ==================================
            // REQUIRED FIELDS
            // ==================================

            if (

                !nameValue ||
                !phoneValue ||
                !emailValue ||
                !passwordValue ||
                !confirmValue ||
                !transactionValue ||
                !imageFile

            ) {

                throw new Error(
                    "Please fill all required fields."
                );

            }


            // ==================================
            // PAYMENT SETTINGS CHECK
            // ==================================

            if (

                !paymentSettings.paymentMethod ||
                !paymentSettings.registrationFee ||
                !paymentSettings.paymentAccountTitle ||
                !paymentSettings.paymentNumber

            ) {

                throw new Error(
                    "Payment details are currently unavailable. Please refresh the page and try again."
                );

            }


            // ==================================
            // EMAIL VALIDATION
            // ==================================

            if (
                !validateEmail(
                    emailValue
                )
            ) {

                throw new Error(
                    "Please enter a valid email address."
                );

            }


            // ==================================
            // PHONE VALIDATION
            // ==================================

            if (
                !validatePhone(
                    phoneValue
                )
            ) {

                throw new Error(
                    "Please enter a valid Pakistani phone number."
                );

            }


            // ==================================
            // PASSWORD VALIDATION
            // ==================================

            if (
                !validatePassword(
                    passwordValue
                )
            ) {

                throw new Error(
                    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one underscore."
                );

            }


            // ==================================
            // CONFIRM PASSWORD
            // ==================================

            if (
                passwordValue !==
                confirmValue
            ) {

                throw new Error(
                    "Passwords do not match."
                );

            }


            // ==================================
            // SCREENSHOT VALIDATION
            // ==================================

            validateScreenshotFile(
                imageFile
            );


            // ==================================
            // REFERRAL VERIFICATION
            // ==================================

            if (
                referralCode &&
                !referrerId
            ) {

                await resolveReferralCode();

            }


            // ==================================
            // STEP 1: CREATE AUTH USER
            // ==================================

            const {
                userId
            } = await createAuthUser({

                nameValue,
                phoneValue,
                emailValue,
                passwordValue

            });


            // ==================================
            // STEP 2: UPLOAD SCREENSHOT
            // ==================================

            const {
                screenshotUrl
            } = await uploadPaymentScreenshot(

                userId,
                imageFile

            );


            // ==================================
            // STEP 3: INSERT INTO
            // signup_requests TABLE
            // ==================================

            const requestData =
                await createSignupRequest({

                    nameValue,
                    phoneValue,
                    emailValue,
                    transactionValue,
                    screenshotUrl,
                    userId

                });


            // ==================================
            // SUCCESS STATUS CHECK
            // ==================================

            console.log(
                "REQUEST STATUS:",
                requestData.status
            );


            // ==================================
            // SUCCESS MESSAGE
            // ==================================

            showMessage(

                "Registration request submitted successfully. Your account is pending approval.",

                "#26734a"

            );


            console.log(
                "=================================="
            );

            console.log(
                "AUREVIA SIGNUP COMPLETED SUCCESSFULLY"
            );

            console.log(
                "USER ID:",
                userId
            );

            console.log(
                "REQUEST:",
                requestData
            );

            console.log(
                "=================================="
            );


            // ==================================
            // RESET FORM
            // ==================================

            resetSignupForm();


        } catch (error) {


            console.error(
                "=================================="
            );

            console.error(
                "AUREVIA SIGNUP ERROR:",
                error
            );

            console.error(
                "=================================="
            );


            showMessage(

                error?.message ||

                "Something went wrong. Please try again.",

                "#7b1113"

            );


        } finally {


            // ==================================
            // UNLOCK SUBMIT BUTTON
            // ==================================

            submitting =
                false;


            loading(
                false
            );


        }

    }
);


// ==========================================
// DEBUG
// ==========================================

console.log(
    "=========================================="
);

console.log(
    "Aurevia Institute Signup JS Loaded Successfully."
);

console.log(
    "Referral Code:",
    referralCode || "None"
);

console.log(
    "Supabase Signup Request System Ready."
);

console.log(
    "=========================================="
);