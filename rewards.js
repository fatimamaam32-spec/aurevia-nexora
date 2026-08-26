// ============================================================
// AUREVIA INSTITUTE - REWARDS
// COMPLETE DYNAMIC SUPABASE CONTROLLER
// ============================================================

import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
    "https://vqfwtbksyykkbdrclglm.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_JFuzjJm1HOIMkQgulRY-lw_w0zn4wot";


const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );


// ============================================================
// DOM HELPER
// ============================================================

const $ = (id) =>
    document.getElementById(id);


// ============================================================
// HELPERS
// ============================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function money(value) {

    const amount =
        Number(value || 0);

    return (
        "PKR " +
        amount.toLocaleString(
            "en-PK",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )
    );
}


function rewardTitle(type) {

    return String(type || "")
        .trim()
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );
}


function rewardIcon(type) {

    const icons = {

        star:
            "★",

        silver:
            "◆",

        gold:
            "✦",

        premium:
            "♛",

        platinum:
            "✧",

        diamond:
            "◇",

        elite:
            "♕"

    };


    return (
        icons[
            String(type || "")
                .trim()
                .toLowerCase()
        ] ||
        "◆"
    );
}


function setText(
    id,
    value
) {

    const element =
        $(id);


    if (element) {

        element.textContent =
            String(value ?? "");
    }
}


// ============================================================
// ERROR UI
// ============================================================

function showError(message) {

    console.error(
        "[REWARDS ERROR]",
        message
    );


    const rewards =
        $("rewards-list-container");


    if (rewards) {

        rewards.innerHTML = `

            <div style="
                padding:20px;
                text-align:center;
                color:#FCA5A5;
                font-size:13px;
            ">

                ${escapeHtml(message)}

            </div>

        `;
    }


    const activity =
        $("activity-tbody");


    if (activity) {

        activity.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        color:#FCA5A5;
                        padding:20px;
                    "
                >

                    ${escapeHtml(message)}

                </td>

            </tr>

        `;
    }
}


// ============================================================
// LOADING UI
// ============================================================

function showLoading() {

    const rewards =
        $("rewards-list-container");


    if (rewards) {

        rewards.innerHTML = `

            <div style="
                padding:25px;
                text-align:center;
                color:rgba(255,255,255,.65);
            ">

                Loading rewards...

            </div>

        `;
    }


    const activity =
        $("activity-tbody");


    if (activity) {

        activity.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        padding:20px;
                        color:rgba(255,255,255,.55);
                    "
                >

                    Loading activity...

                </td>

            </tr>

        `;
    }
}


// ============================================================
// AUTH
// ============================================================

async function getCurrentUser() {

    const {
        data,
        error
    } =
        await supabase.auth.getUser();


    if (error) {

        throw new Error(
            "Authentication error: " +
            error.message
        );
    }


    if (!data?.user) {

        window.location.replace(
            "login.html"
        );

        return null;
    }


    return data.user;
}


// ============================================================
// LOAD PROFILE
// ============================================================

async function loadProfile(userId) {

    const {
        data,
        error
    } =
        await supabase
            .from("profiles")
            .select(`
                id,
                balance,
                total_earnings,
                approved_referrals,
                total_referrals,
                reward_level
            `)
            .eq(
                "id",
                userId
            )
            .maybeSingle();


    if (error) {

        throw new Error(
            "Profile could not be loaded: " +
            error.message
        );
    }


    if (!data) {

        throw new Error(
            "Your profile was not found."
        );
    }


    return data;
}


// ============================================================
// LOAD REWARD CONFIGURATIONS
// ============================================================

async function loadRewardConfigs() {

    const {
        data,
        error
    } =
        await supabase
            .from("reward_configs")
            .select(`
                reward_type,
                required_referrals,
                amount,
                display_order,
                active
            `)
            .eq(
                "active",
                true
            )
            .order(
                "display_order",
                {
                    ascending: true
                }
            );


    if (error) {

        throw new Error(
            "Reward configuration error: " +
            error.message
        );
    }


    return Array.isArray(data)
        ? data
        : [];
}


// ============================================================
// LOAD DIRECT REFERRAL STATS
//
// IMPORTANT:
//
// We count actual APPROVED referrals.
//
// reward_consumed is only used if your database
// really maintains that field correctly.
//
// The reward usage table is used as the main
// fallback for consumed referrals.
// ============================================================

async function loadDirectReferralStats(userId) {

    const {
        data,
        error
    } =
        await supabase
            .from("referrals")
            .select(`
                id,
                status,
                reward_consumed,
                created_at
            `)
            .eq(
                "user_id",
                userId
            );


    if (error) {

        console.warn(
            "[REWARDS] Direct referrals query failed:",
            error.message
        );

        return null;
    }


    const referrals =
        Array.isArray(data)
            ? data
            : [];


    const approved =
        referrals.filter(
            referral =>
                String(
                    referral?.status || ""
                )
                    .trim()
                    .toLowerCase() ===
                "approved"
        );


    const consumed =
        approved.filter(
            referral =>
                referral?.reward_consumed === true
        );


    const available =
        Math.max(
            approved.length -
            consumed.length,
            0
        );


    return {

        totalApproved:
            approved.length,

        consumed:
            consumed.length,

        available:
            available,

        source:
            "referrals"

    };
}


// ============================================================
// LOAD CONSUMED REFERRAL COUNT
//
// reward_referral_usage should contain one row
// for every referral consumed by a reward.
// ============================================================

async function loadConsumedReferralCount(userId) {

    const {
        data,
        count,
        error
    } =
        await supabase
            .from("reward_referral_usage")
            .select(
                "id",
                {
                    count: "exact",
                    head: false
                }
            )
            .eq(
                "user_id",
                userId
            );


    if (error) {

        console.warn(
            "[REWARDS] Usage query failed:",
            error.message
        );

        return null;
    }


    if (
        typeof count ===
        "number"
    ) {

        return count;
    }


    return Array.isArray(data)
        ? data.length
        : 0;
}


// ============================================================
// LOAD REFERRAL POOL
//
// IMPORTANT SYSTEM:
//
// Example:
//
// Approved referrals = 15
//
// Reward #1 used    = 5
// Reward #2 used    = 10
//
// Total consumed    = 15
// Available         = 0
//
// If later another 5 approved referrals arrive:
//
// Total approved    = 20
// Consumed          = 15
// Available         = 5
//
// A reward can then unlock again.
//
// This supports repeated reward unlocking.
// ============================================================

async function loadReferralPool(
    userId,
    profile
) {

    const profileApproved =
        Math.max(
            Number(
                profile?.approved_referrals || 0
            ),
            0
        );


    const usageConsumed =
        await loadConsumedReferralCount(
            userId
        );


    const direct =
        await loadDirectReferralStats(
            userId
        );


    // --------------------------------------------------------
    // Use actual referrals table if available
    // --------------------------------------------------------

    if (direct) {

        const totalApproved =
            Math.max(
                Number(
                    direct.totalApproved || 0
                ),
                profileApproved
            );


        // Prefer usage table for consumed referrals because
        // repeated reward unlocks are tracked there.
        const consumed =
            usageConsumed !== null
                ? Math.max(
                    Number(usageConsumed || 0),
                    0
                )
                : Math.max(
                    Number(
                        direct.consumed || 0
                    ),
                    0
                );


        const available =
            Math.max(
                totalApproved -
                consumed,
                0
            );


        const result = {

            totalApproved:
                totalApproved,

            consumed:
                consumed,

            available:
                available,

            source:
                usageConsumed !== null
                    ? "referrals + reward_referral_usage"
                    : "referrals"

        };


        console.log(
            "[REWARDS] Referral pool:",
            result
        );


        return result;
    }


    // --------------------------------------------------------
    // FALLBACK:
    //
    // profiles.approved_referrals
    // minus
    // reward_referral_usage
    // --------------------------------------------------------

    const consumed =
        Math.max(
            Number(
                usageConsumed || 0
            ),
            0
        );


    const available =
        Math.max(
            profileApproved -
            consumed,
            0
        );


    const result = {

        totalApproved:
            profileApproved,

        consumed:
            consumed,

        available:
            available,

        source:
            "profile + reward_referral_usage"

    };


    console.log(
        "[REWARDS] Referral fallback:",
        result
    );


    return result;
}


// ============================================================
// LOAD REWARD HISTORY
//
// ALL reward rows are counted.
//
// Status "unlocked" is a VALID reward.
//
// Status "approved" is also a VALID reward.
//
// We do NOT exclude unlocked rewards.
// This fixes the duplicate/repeated reward system.
// ============================================================

async function loadRewardHistory(userId) {

    const {
        data,
        error
    } =
        await supabase
            .from("rewards")
            .select(`
                id,
                reward_type,
                amount,
                status,
                created_at,
                referrals_used
            `)
            .eq(
                "user_id",
                userId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        throw new Error(
            "Reward history error: " +
            error.message
        );
    }


    return Array.isArray(data)
        ? data
        : [];
}


// ============================================================
// CALCULATE TOTAL REWARD EARNINGS
//
// "unlocked" MUST be counted.
//
// "approved" MUST be counted.
//
// Any reward row with a positive amount is counted,
// unless it is explicitly cancelled/rejected.
// ============================================================

function calculateRewardEarnings(history) {

    const excludedStatuses = [

        "cancelled",
        "canceled",
        "rejected",
        "failed",
        "revoked"

    ];


    return history.reduce(
        (
            sum,
            reward
        ) => {

            const status =
                String(
                    reward?.status || ""
                )
                    .trim()
                    .toLowerCase();


            if (
                excludedStatuses.includes(
                    status
                )
            ) {

                return sum;
            }


            return (
                sum +
                Number(
                    reward?.amount || 0
                )
            );

        },
        0
    );
}


// ============================================================
// UPDATE TOP STATS
// ============================================================

function updateStats(
    profile,
    history
) {

    const totalRewards =
        calculateRewardEarnings(
            history
        );


    // --------------------------------------------------------
    // Total reward earnings
    //
    // Example:
    //
    // 500 unlocked
    // 500 unlocked
    // 500 unlocked
    // 500 approved
    // 1200 approved
    //
    // Total = 3200
    // --------------------------------------------------------

    setText(
        "stat-total-earnings",
        money(totalRewards)
    );


    // --------------------------------------------------------
    // Count all valid reward rows
    // --------------------------------------------------------

    const validCount =
        history.filter(
            reward => {

                const status =
                    String(
                        reward?.status || ""
                    )
                        .trim()
                        .toLowerCase();


                return ![
                    "cancelled",
                    "canceled",
                    "rejected",
                    "failed",
                    "revoked"
                ].includes(status);

            }
        ).length;


    setText(
        "stat-unlocked-count",
        validCount
    );


    // Optional IDs if present in HTML

    setText(
        "reward-total-amount",
        money(totalRewards)
    );


    setText(
        "total-reward-earnings",
        money(totalRewards)
    );


    setText(
        "reward-count",
        validCount
    );
}


// ============================================================
// UPDATE APPROVED REFERRAL PROGRESS
// ============================================================

function updateProgress(
    referralPool,
    configs
) {

    const available =
        Math.max(
            Number(
                referralPool?.available || 0
            ),
            0
        );


    const totalApproved =
        Math.max(
            Number(
                referralPool?.totalApproved || 0
            ),
            0
        );


    const consumed =
        Math.max(
            Number(
                referralPool?.consumed || 0
            ),
            0
        );


    // --------------------------------------------------------
    // Highest configured target
    // --------------------------------------------------------

    const targets =
        configs
            .map(
                reward =>
                    Number(
                        reward?.required_referrals || 0
                    )
            )
            .filter(
                target =>
                    target > 0
            );


    const maxTarget =
        targets.length
            ? Math.max(...targets)
            : 100;


    // --------------------------------------------------------
    // Available referrals for NEXT reward
    // --------------------------------------------------------

    setText(
        "text-approved-count",
        available
    );


    setText(
        "pin-number",
        available
    );


    setText(
        "available-referrals-count",
        available
    );


    setText(
        "current-approved-referrals",
        available
    );


    // --------------------------------------------------------
    // Total approved referrals
    // --------------------------------------------------------

    setText(
        "total-approved-referrals",
        totalApproved
    );


    // --------------------------------------------------------
    // Consumed referrals
    // --------------------------------------------------------

    setText(
        "consumed-referrals-count",
        consumed
    );


    // --------------------------------------------------------
    // Max target
    // --------------------------------------------------------

    setText(
        "pool-max-target",
        maxTarget
    );


    // --------------------------------------------------------
    // Progress percentage
    // --------------------------------------------------------

    const percentage =
        maxTarget > 0
            ? Math.min(
                (
                    available /
                    maxTarget
                ) * 100,
                100
            )
            : 0;


    const bar =
        $("main-progress-bar");


    if (bar) {

        bar.style.width =
            percentage + "%";
    }


    const pin =
        $("main-progress-pin");


    if (pin) {

        pin.style.left =
            percentage + "%";
    }
}


// ============================================================
// RENDER REWARD CARDS
// ============================================================

function renderRewards(
    configs,
    available
) {

    const container =
        $("rewards-list-container");


    if (!container) {

        console.error(
            "rewards-list-container not found."
        );

        return;
    }


    if (!configs.length) {

        container.innerHTML = `

            <div style="
                text-align:center;
                padding:25px;
                color:#FCA5A5;
            ">

                No active rewards configured.

            </div>

        `;

        return;
    }


    container.innerHTML =
        configs
            .map(
                reward => {

                    const type =
                        String(
                            reward?.reward_type || ""
                        )
                            .trim()
                            .toLowerCase();


                    const required =
                        Math.max(
                            Number(
                                reward?.required_referrals || 0
                            ),
                            0
                        );


                    const amount =
                        Number(
                            reward?.amount || 0
                        );


                    const eligible =
                        required > 0 &&
                        available >= required;


                    const remaining =
                        Math.max(
                            required -
                            available,
                            0
                        );


                    let buttonText =
                        "UNLOCK";


                    if (!eligible) {

                        buttonText =
                            remaining > 0
                                ? `${remaining} MORE`
                                : "LOCKED";
                    }


                    return `

                        <div
                            class="tier-row"
                            data-reward-type="${escapeHtml(type)}"
                        >

                            <div class="tier-logo-wrapper">

                                <div class="tier-logo">

                                    ${escapeHtml(
                                        rewardIcon(type)
                                    )}

                                </div>

                            </div>


                            <div class="tier-info">

                                <div class="tier-title">

                                    ${escapeHtml(
                                        rewardTitle(type)
                                    )}

                                </div>


                                <div class="tier-req">

                                    ${required}
                                    approved referrals

                                </div>

                            </div>


                            <div class="tier-amount">

                                ${escapeHtml(
                                    money(amount)
                                )}

                            </div>


                            <div class="tier-action">

                                <button
                                    type="button"
                                    class="reward-unlock-btn"
                                    data-reward-type="${escapeHtml(type)}"
                                    ${
                                        eligible
                                            ? ""
                                            : "disabled"
                                    }
                                >

                                    ${escapeHtml(
                                        buttonText
                                    )}

                                </button>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            ".reward-unlock-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        unlockReward(button)
                );

            }
        );
}


// ============================================================
// UNLOCK REWARD
// ============================================================

async function unlockReward(button) {

    const rewardType =
        String(
            button?.dataset?.rewardType || ""
        )
            .trim()
            .toLowerCase();


    if (!rewardType) {

        return;
    }


    const originalText =
        button.textContent;


    button.disabled =
        true;


    button.textContent =
        "UNLOCKING...";


    try {

        const user =
            await getCurrentUser();


        if (!user) {

            return;
        }


        const {
            data,
            error
        } =
            await supabase.rpc(
                "unlock_reward",
                {
                    p_reward_type:
                        rewardType
                }
            );


        if (error) {

            throw new Error(
                error.message
            );
        }


        console.log(
            "[REWARDS] Unlock response:",
            data
        );


        if (!data) {

            throw new Error(
                "No response received from reward system."
            );
        }


        if (
            data.success !== true
        ) {

            throw new Error(
                data.message ||
                "Reward could not be unlocked."
            );
        }


        alert(
            `${rewardTitle(
                rewardType
            )} reward unlocked successfully!`
        );


        // Reload everything from database

        await loadPage();


    } catch (error) {

        console.error(
            "[REWARDS] Unlock failed:",
            error
        );


        alert(
            error?.message ||
            "Unable to unlock reward."
        );


        button.disabled =
            false;


        button.textContent =
            originalText;
    }
}


// ============================================================
// RENDER REWARD HISTORY
// ============================================================

function renderHistory(history) {

    const tbody =
        $("activity-tbody");


    if (!tbody) {

        return;
    }


    if (!history.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        color:rgba(255,255,255,.55);
                        padding:20px;
                    "
                >

                    No rewards unlocked yet.

                </td>

            </tr>

        `;

        return;
    }


    tbody.innerHTML =
        history
            .map(
                item => {

                    const date =
                        item?.created_at
                            ? new Date(
                                item.created_at
                            ).toLocaleString(
                                "en-PK",
                                {
                                    dateStyle:
                                        "medium",
                                    timeStyle:
                                        "short"
                                }
                            )
                            : "—";


                    return `

                        <tr>

                            <td>

                                ${escapeHtml(
                                    rewardTitle(
                                        item?.reward_type
                                    )
                                )}

                            </td>


                            <td>

                                ${Number(
                                    item?.referrals_used || 0
                                )}

                            </td>


                            <td>

                                ${escapeHtml(
                                    money(
                                        item?.amount
                                    )
                                )}

                            </td>


                            <td>

                                ${escapeHtml(
                                    date
                                )}

                            </td>


                            <td
                                style="
                                    text-align:right;
                                "
                            >

                                ${escapeHtml(
                                    item?.status ||
                                    "unlocked"
                                )}

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");
}


// ============================================================
// LOAD COMPLETE PAGE
//
// THIS FUNCTION WAS MISSING IN YOUR OLD CODE.
// ============================================================

async function loadPage() {

    try {

        showLoading();


        // ----------------------------------------------------
        // AUTH
        // ----------------------------------------------------

        const user =
            await getCurrentUser();


        if (!user) {

            return;
        }


        console.log(
            "[REWARDS] Loading user:",
            user.id
        );


        // ----------------------------------------------------
        // LOAD PROFILE
        // ----------------------------------------------------

        const profile =
            await loadProfile(
                user.id
            );


        // ----------------------------------------------------
        // LOAD DATABASE DATA IN PARALLEL
        // ----------------------------------------------------

        const [
            configs,
            history
        ] =
            await Promise.all([

                loadRewardConfigs(),

                loadRewardHistory(
                    user.id
                )

            ]);


        // ----------------------------------------------------
        // LOAD CURRENT REFERRAL POOL
        // ----------------------------------------------------

        const referralPool =
            await loadReferralPool(
                user.id,
                profile
            );


        console.log(
            "[REWARDS] Profile:",
            profile
        );


        console.log(
            "[REWARDS] Reward history:",
            history
        );


        console.log(
            "[REWARDS] Referral pool:",
            referralPool
        );


        // ----------------------------------------------------
        // UPDATE PAGE
        // ----------------------------------------------------

        updateStats(
            profile,
            history
        );


        updateProgress(
            referralPool,
            configs
        );


        renderRewards(
            configs,
            referralPool.available
        );


        renderHistory(
            history
        );


        console.log(
            "[REWARDS] Page loaded successfully."
        );

    } catch (error) {

        console.error(
            "[REWARDS] Page load failed:",
            error
        );


        showError(
            error?.message ||
            "Unable to load rewards."
        );
    }
}


// ============================================================
// AUTH STATE CHANGES
// ============================================================

supabase.auth.onAuthStateChange(
    (
        event,
        session
    ) => {

        console.log(
            "[REWARDS] Auth event:",
            event
        );


        if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED"
        ) {

            if (session?.user) {

                loadPage();

            }

        }


        if (
            event === "SIGNED_OUT"
        ) {

            window.location.replace(
                "login.html"
            );

        }

    }
);


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadPage();

    }
);


// ============================================================
// END
// ============================================================