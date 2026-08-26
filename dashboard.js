"use strict";

/*
===========================================================
 AUREVIA DASHBOARD
 Dynamic Supabase Dashboard JavaScript
===========================================================

 HTML:
   dashboard.html

 JS:
   scripts/dashboard.js

 Supabase:
   - profiles
   - get_user_financial_summary(uuid)

 Financial values come from the Supabase RPC.

 Profile name comes from:
   profiles.full_name

 IMPORTANT:
 This script does NOT query profiles.name.
===========================================================
*/


/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
  "https://vqfwtbksyykkbdrclglm.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_JFuzjJm1HOIMkQgulRY-lw_w0zn4wot";


const supabaseClient = window.supabase.createClient(
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


/* =========================================================
   DOM HELPER
========================================================= */

function $(id) {
  return document.getElementById(id);
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(message) {

  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


/* =========================================================
   ERROR BOX
========================================================= */

function showDataError(message) {

  const box = $("dataError");
  const text = $("dataErrorText");

  if (!box || !text) return;

  text.textContent = message;

  box.classList.add("show");
}


function hideDataError() {

  const box = $("dataError");

  if (!box) return;

  box.classList.remove("show");
}


/* =========================================================
   NUMBER FORMAT
========================================================= */

function safeNumber(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const number = Number(
    String(value).replace(/,/g, "")
  );

  return Number.isFinite(number) ? number : 0;
}


/* =========================================================
   MONEY FORMAT
========================================================= */

function money(value) {

  const amount = safeNumber(value);

  return (
    "PKR " +
    amount.toLocaleString("en-PK", {
      minimumFractionDigits:
        Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2
    })
  );
}


/* =========================================================
   SET DASHBOARD VALUES
========================================================= */

function setDashboardValues(data) {

  const name =
    String(data.name || "Scholar").trim() ||
    "Scholar";

  const balance =
    safeNumber(data.balance);

  const totalEarnings =
    safeNumber(data.totalEarnings);

  const referralCode =
    String(data.referralCode || "").trim();


  /* -------------------------
     User name
  ------------------------- */

  if ($("topName")) {
    $("topName").textContent = name;
  }

  if ($("welcomeTitle")) {
    $("welcomeTitle").textContent =
      "Welcome, " + name + "!";
  }


  /* -------------------------
     Current balance
  ------------------------- */

  if ($("balanceAmount")) {
    $("balanceAmount").textContent =
      money(balance);
  }

  if ($("availableAmount")) {
    $("availableAmount").textContent =
      money(balance);
  }


  /* -------------------------
     Lifetime earnings
  ------------------------- */

  if ($("earningsAmount")) {
    $("earningsAmount").textContent =
      money(totalEarnings);
  }


  /* -------------------------
     Referral link
  ------------------------- */

  const referralInput =
    $("referralLink");

  const referralCodeElement =
    $("referralCode");


  if (referralCode) {

    if (referralCodeElement) {

      referralCodeElement.textContent =
        "Your referral code: " +
        referralCode;
    }


    /*
      Change this URL if your signup page
      has a different filename.
    */

    const referralUrl =
      window.location.origin +
      "/register.html?ref=" +
      encodeURIComponent(referralCode);


    if (referralInput) {
      referralInput.value =
        referralUrl;
    }

  } else {

    if (referralInput) {
      referralInput.value =
        "Referral link unavailable";
    }

    if (referralCodeElement) {
      referralCodeElement.textContent = "";
    }
  }
}


/* =========================================================
   GET CURRENT USER
========================================================= */

async function getCurrentUser() {

  const {
    data,
    error
  } = await supabaseClient.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data || !data.user) {
    throw new Error(
      "No authenticated user found."
    );
  }

  return data.user;
}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile(userId) {

  /*
    IMPORTANT:

    We intentionally use select("*")
    instead of:

      select("name")

    because your actual table uses:

      full_name

    This also makes the page safer if
    additional profile columns exist.
  */

  const {
    data,
    error
  } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();


  if (error) {
    throw error;
  }


  if (!data) {

    throw new Error(
      "Profile record was not found."
    );
  }


  return data;
}


/* =========================================================
   LOAD FINANCIAL SUMMARY
========================================================= */

async function loadFinancialSummary(userId) {

  /*
    Financial calculations are controlled by
    Supabase RPC.

    We do NOT calculate:

      referrals × commission

    inside JavaScript.
  */

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_user_financial_summary",
    {
      p_user_id: userId
    }
  );


  if (error) {
    throw error;
  }


  if (!data) {

    throw new Error(
      "Financial summary was not returned by Supabase."
    );
  }


  return data;
}


/* =========================================================
   LOAD DASHBOARD
========================================================= */

let dashboardLoading = false;


async function loadDashboard() {

  if (dashboardLoading) {
    return;
  }

  dashboardLoading = true;

  hideDataError();


  try {

    /* ---------------------------------
       1. Get logged-in user
    --------------------------------- */

    const user =
      await getCurrentUser();


    /* ---------------------------------
       2. Load profile
    --------------------------------- */

    const profile =
      await loadProfile(user.id);


    /*
      YOUR COLUMN IS:

        full_name

      NOT:

        name
    */

    const fullName =
      profile.full_name ||
      "Scholar";


    /*
      Referral code is read safely.

      If referral_code exists,
      it will be used.

      If it doesn't exist,
      dashboard will simply show
      referral link unavailable.
    */

    const referralCode =
      profile.referral_code ||
      profile.referralCode ||
      "";


    /* ---------------------------------
       3. Load financial summary
    --------------------------------- */

    const financial =
      await loadFinancialSummary(user.id);


    /* ---------------------------------
       4. Read Supabase RPC values
    --------------------------------- */

    const totalEarnings =
      safeNumber(
        financial.total_earnings
      );


    const currentBalance =
      safeNumber(
        financial.current_balance
      );


    /* ---------------------------------
       5. Update dashboard
    --------------------------------- */

    setDashboardValues({

      name: fullName,

      balance: currentBalance,

      totalEarnings: totalEarnings,

      referralCode: referralCode

    });


    /* ---------------------------------
       6. Debug information
    --------------------------------- */

    console.log(
      "Aurevia Dashboard Financial Summary:",
      financial
    );


  } catch (error) {

    console.error(
      "Aurevia Dashboard Error:",
      error
    );


    /*
      Safe fallback.
    */

    setDashboardValues({

      name: "Scholar",

      balance: 0,

      totalEarnings: 0,

      referralCode: ""

    });


    showDataError(
      error?.message ||
      "Supabase data could not be loaded."
    );


    showToast(
      "Dashboard data could not be loaded."
    );


  } finally {

    dashboardLoading = false;

  }
}


/* =========================================================
   COPY REFERRAL LINK
========================================================= */

async function copyReferralLink() {

  const input =
    $("referralLink");

  if (!input) {
    return;
  }


  const value =
    input.value;


  if (
    !value ||
    value === "Referral link unavailable"
  ) {

    showToast(
      "Referral link is not available."
    );

    return;
  }


  try {

    await navigator.clipboard.writeText(
      value
    );

    showToast(
      "Referral link copied."
    );

  } catch (error) {

    /*
      Fallback for older browsers.
    */

    input.select();

    input.setSelectionRange(
      0,
      99999
    );

    document.execCommand("copy");

    showToast(
      "Referral link copied."
    );
  }
}


/* =========================================================
   MENU
========================================================= */

function openMenu() {

  const overlay =
    $("menuOverlay");

  if (!overlay) {
    return;
  }

  overlay.classList.add("open");

  document.body.classList.add(
    "no-scroll"
  );
}


function closeMenu() {

  const overlay =
    $("menuOverlay");

  if (!overlay) {
    return;
  }

  overlay.classList.remove("open");

  document.body.classList.remove(
    "no-scroll"
  );
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

  try {

    const {
      error
    } = await supabaseClient.auth.signOut();


    if (error) {
      throw error;
    }


    window.location.replace(
      "login.html"
    );


  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

    showToast(
      "Logout failed. Please try again."
    );
  }
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {


    /* ---------------------------------
       Menu button
    --------------------------------- */

    const menuBtn =
      $("menuBtn");

    if (menuBtn) {

      menuBtn.addEventListener(
        "click",
        openMenu
      );
    }


    /* ---------------------------------
       Close menu
    --------------------------------- */

    const closeMenuBtn =
      $("closeMenu");

    if (closeMenuBtn) {

      closeMenuBtn.addEventListener(
        "click",
        closeMenu
      );
    }


    /* ---------------------------------
       Overlay click
    --------------------------------- */

    const menuOverlay =
      $("menuOverlay");

    if (menuOverlay) {

      menuOverlay.addEventListener(
        "click",
        function (event) {

          if (
            event.target ===
            menuOverlay
          ) {

            closeMenu();
          }
        }
      );
    }


    /* ---------------------------------
       Escape key
    --------------------------------- */

    document.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key === "Escape"
        ) {

          closeMenu();
        }
      }
    );


    /* ---------------------------------
       Notification
    --------------------------------- */

    const notificationBtn =
      $("notificationBtn");

    if (notificationBtn) {

      notificationBtn.addEventListener(
        "click",
        function () {

          showToast(
            "Notifications are ready."
          );

        }
      );
    }


    /* ---------------------------------
       Withdraw
    --------------------------------- */

    const withdrawBtn =
      $("withdrawBtn");

    if (withdrawBtn) {

      withdrawBtn.addEventListener(
        "click",
        function () {

          window.location.href =
            "withdraw.html";

        }
      );
    }


    /* ---------------------------------
       Copy referral
    --------------------------------- */

    const copyReferral =
      $("copyReferral");

    if (copyReferral) {

      copyReferral.addEventListener(
        "click",
        copyReferralLink
      );
    }


    /* ---------------------------------
       Logout
    --------------------------------- */

    const logoutBtn =
      $("logoutBtn");

    if (logoutBtn) {

      logoutBtn.addEventListener(
        "click",
        logoutUser
      );
    }


    /* ---------------------------------
       Initial dashboard load
    --------------------------------- */

    loadDashboard();

  }
);


/* =========================================================
   AUTH STATE CHANGE
========================================================= */

supabaseClient.auth.onAuthStateChange(
  function (event, session) {

    console.log(
      "Supabase Auth Event:",
      event
    );


    if (
      event === "SIGNED_OUT"
    ) {

      window.location.replace(
        "login.html"
      );

      return;
    }


    if (
      event === "SIGNED_IN" &&
      session?.user
    ) {

      loadDashboard();

      return;
    }


    if (
      event === "TOKEN_REFRESHED" &&
      session?.user
    ) {

      /*
        Token refresh does not require
        a full dashboard reload.
      */

      return;
    }

  }
);