// ==========================================
// Aurevia Institute
// referrals.js
// Complete Dynamic Supabase Referral System
// ==========================================

import {
    supabase,
    getCurrentSession
} from "./supabase.js";


// ==========================================
// DOM ELEMENTS
// ==========================================

const referralCodeEl =
    document.getElementById("referralCode");

const copyCodeBtn =
    document.getElementById("copyCodeBtn");

const referralLinkEl =
    document.getElementById("referralLink");

const copyLinkBtn =
    document.getElementById("copyLinkBtn");

const shareBtn =
    document.getElementById("shareBtn");

const linkMessageEl =
    document.getElementById("linkMessage");

const totalReferralsEl =
    document.getElementById("totalReferrals");

const approvedReferralsEl =
    document.getElementById("approvedReferrals");

const pendingReferralsEl =
    document.getElementById("pendingReferrals");

const totalEarningsEl =
    document.getElementById("totalEarnings");

const listEarningsEl =
    document.getElementById("listEarnings");

const referralListEl =
    document.getElementById("referralList");

const currentYearEl =
    document.getElementById("currentYear");


// ==========================================
// STATE
// ==========================================

let currentUser = null;
let currentReferralCode = "";


// ==========================================
// FORMAT MONEY
// ==========================================

function formatPKR(amount) {

    const value =
        Number(amount || 0);

    return `PKR ${value.toLocaleString(
        "en-PK",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    )}`;
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// NORMALIZE STATUS
// ==========================================

function normalizeStatus(status) {

    return String(status || "")
        .trim()
        .toLowerCase();
}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "Date unavailable";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString(
        "en-PK",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(
    message,
    type = "info"
) {

    if (!linkMessageEl) {
        return;
    }

    linkMessageEl.textContent =
        message;

    linkMessageEl.className =
        `message ${type}`;

    setTimeout(() => {

        if (
            linkMessageEl.textContent ===
            message
        ) {

            linkMessageEl.textContent =
                "";

            linkMessageEl.className =
                "message";
        }

    }, 3000);
}


// ==========================================
// COPY TEXT
// ==========================================

async function copyText(
    text,
    message
) {

    if (!text) {

        showMessage(
            "Nothing available to copy.",
            "error"
        );

        return;
    }

    try {

        await navigator.clipboard.writeText(
            text
        );

        showMessage(
            message,
            "success"
        );

    } catch (error) {

        console.error(
            "Clipboard error:",
            error
        );

        try {

            const textarea =
                document.createElement("textarea");

            textarea.value =
                text;

            textarea.style.position =
                "fixed";

            textarea.style.left =
                "-9999px";

            textarea.style.opacity =
                "0";

            document.body.appendChild(
                textarea
            );

            textarea.focus();
            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();

            showMessage(
                message,
                "success"
            );

        } catch (fallbackError) {

            console.error(
                "Copy fallback error:",
                fallbackError
            );

            showMessage(
                "Unable to copy.",
                "error"
            );
        }
    }
}


// ==========================================
// LOAD CURRENT USER
// ==========================================

async function loadCurrentUser() {

    try {

        const session =
            await getCurrentSession();

        if (!session?.user) {
            return null;
        }

        return session.user;

    } catch (error) {

        console.error(
            "Current user error:",
            error
        );

        return null;
    }
}


// ==========================================
// LOAD REFERRAL CODE
// ==========================================

async function loadReferralCode() {

    if (!referralCodeEl) {
        return;
    }

    referralCodeEl.textContent =
        "Loading...";

    try {

        if (!currentUser) {

            referralCodeEl.textContent =
                "Login required";

            return;
        }


        const {
            data,
            error
        } =
            await supabase
                .from("profiles")
                .select("referral_code")
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        const code =
            String(
                data?.referral_code || ""
            ).trim();


        if (!code) {

            referralCodeEl.textContent =
                "Code unavailable";

            if (referralLinkEl) {

                referralLinkEl.value =
                    "";
            }

            return;
        }


        currentReferralCode =
            code;

        referralCodeEl.textContent =
            code;


        const url =
            new URL(
                "signup.html",
                window.location.href
            );

        url.searchParams.set(
            "ref",
            code
        );


        if (referralLinkEl) {

            referralLinkEl.value =
                url.href;
        }

    } catch (error) {

        console.error(
            "Referral code loading error:",
            error
        );

        referralCodeEl.textContent =
            "Unable to load";

        if (referralLinkEl) {

            referralLinkEl.value =
                "";
        }

        showMessage(
            "Unable to load referral code.",
            "error"
        );
    }
}


// ==========================================
// UPDATE REFERRAL STATS
// ==========================================

function updateReferralStats(
    total,
    approved,
    pending,
    earnings
) {

    if (totalReferralsEl) {

        totalReferralsEl.textContent =
            Number(total || 0).toLocaleString();
    }


    if (approvedReferralsEl) {

        approvedReferralsEl.textContent =
            Number(approved || 0).toLocaleString();
    }


    if (pendingReferralsEl) {

        pendingReferralsEl.textContent =
            Number(pending || 0).toLocaleString();
    }


    const formattedEarnings =
        formatPKR(earnings);


    if (totalEarningsEl) {

        totalEarningsEl.textContent =
            formattedEarnings;
    }


    if (listEarningsEl) {

        listEarningsEl.textContent =
            formattedEarnings;
    }
}


// ==========================================
// LOAD ALL REFERRAL DATA
//
// SOURCE OF TRUTH:
// public.referrals
//
// Total referrals:
// COUNT(all rows)
//
// Approved referrals:
// COUNT(status = approved)
//
// Pending referrals:
// COUNT(not approved)
//
// Total earnings:
// SUM(commission of approved rows)
//
// NO HARD-CODED COMMISSION
// NO earning_history dependency
// ==========================================

async function loadReferralData() {

    if (!currentUser) {
        return [];
    }

    try {

        const {
            data,
            error
        } =
            await supabase
                .from("referrals")
                .select(`
                    id,
                    user_id,
                    referred_user_id,
                    commission,
                    status,
                    created_at,
                    reward_consumed
                `)
                .eq(
                    "user_id",
                    currentUser.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {
            throw error;
        }


        const referrals =
            Array.isArray(data)
                ? data
                : [];


        // ======================================
        // TOTAL REFERRALS
        // ======================================

        const total =
            referrals.length;


        // ======================================
        // APPROVED REFERRALS
        // ======================================

        const approvedRows =
            referrals.filter(
                referral =>
                    normalizeStatus(
                        referral?.status
                    ) === "approved"
            );


        const approved =
            approvedRows.length;


        // ======================================
        // PENDING / NON-APPROVED REFERRALS
        // ======================================

        const pending =
            referrals.filter(
                referral =>
                    normalizeStatus(
                        referral?.status
                    ) !== "approved"
            ).length;


        // ======================================
        // ACTUAL REFERRAL EARNINGS
        //
        // Example:
        //
        // 15 approved referrals
        // each commission = 400
        //
        // 400 + 400 + ...
        // 15 times
        //
        // = PKR 6,000
        //
        // Commission is read directly
        // from each referrals.commission row.
        //
        // ======================================

        const totalEarnings =
            approvedRows.reduce(
                (
                    sum,
                    referral
                ) => {

                    return (
                        sum +
                        Number(
                            referral?.commission || 0
                        )
                    );

                },
                0
            );


        // ======================================
        // UPDATE TOP STAT CARDS
        // ======================================

        updateReferralStats(
            total,
            approved,
            pending,
            totalEarnings
        );


        // ======================================
        // RENDER REFERRAL EARNING LIST
        // ======================================

        renderReferralList(
            approvedRows
        );


        console.log(
            "Referral data loaded:",
            {
                total,
                approved,
                pending,
                totalEarnings
            }
        );


        return referrals;

    } catch (error) {

        console.error(
            "Referral data loading error:",
            error
        );


        updateReferralStats(
            0,
            0,
            0,
            0
        );


        renderReferralList(
            []
        );


        return [];
    }
}


// ==========================================
// RENDER REFERRAL EARNING CARDS
//
// Shows each APPROVED referral
// and its actual commission
// ==========================================

function renderReferralList(
    approvedReferrals
) {

    if (!referralListEl) {
        return;
    }


    if (
        !Array.isArray(approvedReferrals) ||
        !approvedReferrals.length
    ) {

        referralListEl.innerHTML = `

            <div class="earning-empty-state">

                <i class="fa-solid fa-coins"></i>

                <p>
                    No approved referral earnings yet.
                </p>

            </div>

        `;

        return;
    }


    referralListEl.innerHTML =
        approvedReferrals
            .map(
                referral => {

                    const commission =
                        Number(
                            referral?.commission || 0
                        );


                    const date =
                        formatDate(
                            referral?.created_at
                        );


                    return `

                        <div class="referral-earning-card">

                            <div class="earning-card-left">

                                <div class="earning-icon">

                                    <i class="fa-solid fa-user-check"></i>

                                </div>


                                <div class="earning-card-info">

                                    <strong>
                                        Approved Referral
                                    </strong>

                                    <span>
                                        Referral commission credited
                                    </span>

                                    <small>
                                        ${escapeHTML(date)}
                                    </small>

                                </div>

                            </div>


                            <div class="earning-card-amount">

                                +${escapeHTML(
                                    formatPKR(
                                        commission
                                    )
                                )}

                            </div>

                        </div>

                    `;

                }
            )
            .join("");
}


// ==========================================
// COPY REFERRAL CODE
// ==========================================

if (copyCodeBtn) {

    copyCodeBtn.addEventListener(
        "click",
        async () => {

            if (!currentReferralCode) {

                showMessage(
                    "Referral code is not ready.",
                    "error"
                );

                return;
            }


            await copyText(
                currentReferralCode,
                "Referral code copied!"
            );

        }
    );
}


// ==========================================
// COPY REFERRAL LINK
// ==========================================

if (copyLinkBtn) {

    copyLinkBtn.addEventListener(
        "click",
        async () => {

            const link =
                referralLinkEl?.value?.trim();


            if (!link) {

                showMessage(
                    "Referral link is not ready.",
                    "error"
                );

                return;
            }


            await copyText(
                link,
                "Referral link copied!"
            );

        }
    );
}


// ==========================================
// SHARE REFERRAL LINK
// ==========================================

if (shareBtn) {

    shareBtn.addEventListener(
        "click",
        async () => {

            const link =
                referralLinkEl?.value?.trim();


            if (!link) {

                showMessage(
                    "Referral link is not ready.",
                    "error"
                );

                return;
            }


            const shareData = {

                title:
                    "Join Aurevia Institute",

                text:
                    "Join Aurevia Institute using my referral link.",

                url:
                    link
            };


            try {

                if (navigator.share) {

                    await navigator.share(
                        shareData
                    );

                } else {

                    await copyText(
                        link,
                        "Referral link copied!"
                    );
                }

            } catch (error) {

                if (
                    error?.name !==
                    "AbortError"
                ) {

                    console.error(
                        "Share error:",
                        error
                    );

                    await copyText(
                        link,
                        "Referral link copied!"
                    );
                }
            }

        }
    );
}


// ==========================================
// RESET LOGGED OUT STATE
// ==========================================

function resetReferralPage() {

    currentReferralCode =
        "";


    if (referralCodeEl) {

        referralCodeEl.textContent =
            "Login required";
    }


    if (referralLinkEl) {

        referralLinkEl.value =
            "";
    }


    updateReferralStats(
        0,
        0,
        0,
        0
    );


    if (referralListEl) {

        referralListEl.innerHTML = `

            <div class="earning-empty-state">

                <i class="fa-solid fa-lock"></i>

                <p>
                    Please login to view your referrals.
                </p>

            </div>

        `;
    }
}


// ==========================================
// LOAD PAGE DATA
// ==========================================

async function refreshReferralPage() {

    if (!currentUser) {

        resetReferralPage();

        return;
    }


    await Promise.all([

        loadReferralCode(),

        loadReferralData()

    ]);
}


// ==========================================
// INITIALIZE
// ==========================================

async function initializeReferralPage() {

    try {

        if (currentYearEl) {

            currentYearEl.textContent =
                new Date().getFullYear();
        }


        currentUser =
            await loadCurrentUser();


        if (!currentUser) {

            resetReferralPage();

            return;
        }


        await refreshReferralPage();


        console.log(
            "Aurevia Referral System loaded successfully."
        );

    } catch (error) {

        console.error(
            "Referral page initialization error:",
            error
        );

        resetReferralPage();
    }
}


// ==========================================
// AUTH STATE CHANGE
// ==========================================

supabase.auth.onAuthStateChange(
    (
        event,
        session
    ) => {

        setTimeout(
            async () => {

                if (
                    event === "SIGNED_IN" ||
                    event === "TOKEN_REFRESHED"
                ) {

                    currentUser =
                        session?.user || null;


                    if (currentUser) {

                        await refreshReferralPage();
                    }
                }


              if (
                    event === "SIGNED_OUT"
                ) {

                    currentUser =
                        null;

                    resetReferralPage();
                }

            },
            0
        );
    }
);


// ==========================================
// START
// ==========================================

initializeReferralPage();


// ==========================================
// END
// ==========================================