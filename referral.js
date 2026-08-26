(function () {
  "use strict";

  /*
  ============================================================
  AUREVIA DASHBOARD — SUPABASE JS
  ============================================================

  This file handles:
  - Supabase authentication
  - Logged-in user detection
  - Financial summary RPC
  - Profile / referral information
  - Dashboard UI updates
  - Referral link copy
  - Logout
  - Withdraw navigation

  IMPORTANT:
  Financial calculations are NOT performed here.

  Supabase RPC:
      get_user_financial_summary(uuid)

  is the source of truth.

  Expected RPC response:

  {
    user_id,
    approved_referrals,
    referral_commission,
    referral_earnings,
    reward_earnings,
    total_earnings,
    total_withdrawn,
    current_balance
  }

  ============================================================
  */

  const SUPABASE_URL =
    "https://vqfwtbksyykkbdrclglm.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_JFuzJm1HOIMkQgulRY-lw_w0zn4wot";

  const supabaseClient =
    window.supabase.createClient(
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


  /* ==========================================================
     DOM HELPER
     ========================================================== */

  const $ = (id) => document.getElementById(id);


  /* ==========================================================
     GLOBAL STATE
     ========================================================== */

  let currentUser = null;
  let toastTimer = null;
  let loadingDashboard = false;


  /* ==========================================================
     NUMBER / MONEY HELPERS
     ========================================================== */

  function safeNumber(value) {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    const number = Number(
      String(value)
        .replace(/,/g, "")
        .replace(/[^\d.-]/g, "")
    );

    return Number.isFinite(number)
      ? number
      : 0;
  }


  function formatMoney(value) {

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


  /* ==========================================================
     TOAST
     ========================================================== */

  function showToast(message) {

    const toast = $("toast");

    if (!toast) return;

    toast.textContent = String(message || "");

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

      toast.classList.remove("show");

    }, 2500);
  }


  /* ==========================================================
     DATA ERROR
     ========================================================== */

  function showDataError(message) {

    const box = $("dataError");
    const text = $("dataErrorText");

    if (!box || !text) return;

    text.textContent =
      message ||
      "Dashboard data could not be loaded.";

    box.classList.add("show");
  }


  function hideDataError() {

    const box = $("dataError");

    if (box) {
      box.classList.remove("show");
    }
  }


  /* ==========================================================
     UPDATE USER INFO
     ========================================================== */

  function updateUserInfo(profile) {

    const name =
      String(
        profile?.full_name ||
        profile?.name ||
        currentUser?.user_metadata?.full_name ||
        currentUser?.user_metadata?.name ||
        "Scholar"
      ).trim() || "Scholar";


    if ($("topName")) {
      $("topName").textContent = name;
    }


    if ($("welcomeTitle")) {

      $("welcomeTitle").textContent =
        "Welcome, " + name + "!";
    }


    const referralCode =
      String(
        profile?.referral_code || ""
      ).trim();


    if ($("referralCode")) {

      $("referralCode").textContent =
        referralCode
          ? "Your referral code: " + referralCode
          : "";
    }


    updateReferralLink(referralCode);
  }


  /* ==========================================================
     REFERRAL LINK
     ========================================================== */

  function updateReferralLink(referralCode) {

    const input = $("referralLink");

    if (!input) return;


    if (!referralCode) {

      input.value =
        "Referral link unavailable";

      return;
    }


    /*
      Change this URL if your actual signup page
      uses a different filename.
    */

    const baseUrl =
      window.location.origin;


    const referralUrl =
      baseUrl +
      "/signup.html?ref=" +
      encodeURIComponent(referralCode);


    input.value = referralUrl;
  }


  /* ==========================================================
     COPY REFERRAL LINK
     ========================================================== */

  async function copyReferral() {

    const input = $("referralLink");

    if (!input) return;


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

      await navigator.clipboard.writeText(value);

      showToast(
        "Referral link copied!"
      );

    } catch (error) {

      /*
        Fallback for older browsers.
      */

      try {

        input.select();

        input.setSelectionRange(
          0,
          input.value.length
        );

        document.execCommand("copy");

        showToast(
          "Referral link copied!"
        );

      } catch (fallbackError) {

        console.error(
          "Copy failed:",
          fallbackError
        );

        showToast(
          "Unable to copy link."
        );
      }
    }
  }


  /* ==========================================================
     UPDATE FINANCIAL DASHBOARD
     ========================================================== */

  function updateFinancialUI(summary) {

    const totalEarnings =
      safeNumber(
        summary?.total_earnings
      );


    const currentBalance =
      safeNumber(
        summary?.current_balance
      );


    /*
      Total Earnings
    */

    if ($("earningsAmount")) {

      $("earningsAmount").textContent =
        formatMoney(totalEarnings);
    }


    /*
      Current Balance
    */

    if ($("balanceAmount")) {

      $("balanceAmount").textContent =
        formatMoney(currentBalance);
    }


    if ($("availableAmount")) {

      $("availableAmount").textContent =
        formatMoney(currentBalance);
    }
  }


  /* ==========================================================
     LOAD PROFILE
     ========================================================== */

  async function loadProfile(userId) {

    const {
      data,
      error
    } = await supabaseClient

      .from("profiles")

      .select(
        `
        id,
        full_name,
        avatar_url,
        referral_code
        `
      )

      .eq("id", userId)

      .maybeSingle();


    if (error) {

      console.error(
        "Profile query error:",
        error
      );

      throw new Error(
        "Unable to load profile."
      );
    }


    return data || {};
  }


  /* ==========================================================
     LOAD FINANCIAL SUMMARY
     ========================================================== */

  async function loadFinancialSummary(userId) {

    /*
      IMPORTANT:

      No earnings calculation happens here.

      Supabase RPC is responsible for:

      - approved referrals
      - referral earnings
      - rewards
      - lifetime earnings
      - approved withdrawals
      - current balance
    */

    const {
      data,
      error
    } = await supabaseClient

      .rpc(
        "get_user_financial_summary",
        {
          p_user_id: userId
        }
      );


    if (error) {

      console.error(
        "Financial RPC error:",
        error
      );

      throw new Error(
        error.message ||
        "Unable to load financial summary."
      );
    }


    if (!data) {

      throw new Error(
        "Financial summary returned no data."
      );
    }


    return data;
  }


  /* ==========================================================
     MAIN DASHBOARD LOADER
     ========================================================== */

  async function loadDashboard() {

    if (loadingDashboard) {
      return;
    }


    loadingDashboard = true;

    hideDataError();


    try {

      /*
        ------------------------------------------------------
        1. GET CURRENT SESSION
        ------------------------------------------------------
      */

      const {
        data: sessionData,
        error: sessionError
      } =
        await supabaseClient.auth.getSession();


      if (sessionError) {
        throw sessionError;
      }


      const session =
        sessionData?.session;


      if (!session?.user) {

        window.location.replace(
          "login.html"
        );

        return;
      }


      currentUser =
        session.user;


      /*
        ------------------------------------------------------
        2. LOAD PROFILE
        ------------------------------------------------------
      */

      const profile =
        await loadProfile(
          currentUser.id
        );


      updateUserInfo(profile);


      /*
        ------------------------------------------------------
        3. LOAD FINANCIAL SUMMARY
        ------------------------------------------------------
      */

      const summary =
        await loadFinancialSummary(
          currentUser.id
        );


      /*
        ------------------------------------------------------
        4. UPDATE DASHBOARD
        ------------------------------------------------------
      */

      updateFinancialUI(
        summary
      );


      /*
        Optional debugging.
        Useful during testing.
      */

      console.log(
        "Aurevia financial summary:",
        summary
      );


    } catch (error) {

      console.error(
        "Dashboard loading error:",
        error
      );


      /*
        Safe fallback.
      */

      updateFinancialUI({
        total_earnings: 0,
        current_balance: 0
      });


      showDataError(
        "Supabase data could not be loaded. Please refresh and try again."
      );


      showToast(
        "Dashboard data could not be loaded."
      );


    } finally {

      loadingDashboard = false;
    }
  }


  /* ==========================================================
     LOGOUT
     ========================================================== */

  async function logout() {

    try {

      const {
        error
      } =
        await supabaseClient.auth.signOut();


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


  /* ==========================================================
     MENU
     ========================================================== */

  function openMenu() {

    const overlay =
      $("menuOverlay");

    if (!overlay) return;

    overlay.classList.add(
      "open"
    );

    document.body.classList.add(
      "no-scroll"
    );
  }


  function closeMenu() {

    const overlay =
      $("menuOverlay");

    if (!overlay) return;

    overlay.classList.remove(
      "open"
    );

    document.body.classList.remove(
      "no-scroll"
    );
  }


  /* ==========================================================
     EVENT LISTENERS
     ========================================================== */

  if ($("menuBtn")) {

    $("menuBtn").addEventListener(
      "click",
      openMenu
    );
  }


  if ($("closeMenu")) {

    $("closeMenu").addEventListener(
      "click",
      closeMenu
    );
  }


  if ($("menuOverlay")) {

    $("menuOverlay").addEventListener(
      "click",
      function (event) {

        if (
          event.target ===
          $("menuOverlay")
        ) {

          closeMenu();
        }
      }
    );
  }


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


  /* ==========================================================
     NOTIFICATIONS
     ========================================================== */

  if ($("notificationBtn")) {

    $("notificationBtn").addEventListener(
      "click",
      function () {

        showToast(
          "Notifications are ready."
        );
      }
    );
  }


  /* ==========================================================
     WITHDRAW
     ========================================================== */

  if ($("withdrawBtn")) {

    $("withdrawBtn").addEventListener(
      "click",
      function () {

        window.location.href =
          "withdraw.html";
      }
    );
  }


  /* ==========================================================
     COPY
     ========================================================== */

  if ($("copyReferral")) {

    $("copyReferral").addEventListener(
      "click",
      copyReferral
    );
  }


  /* ==========================================================
     LOGOUT
     ========================================================== */

  if ($("logoutBtn")) {

    $("logoutBtn").addEventListener(
      "click",
      logout
    );
  }


  /* ==========================================================
     AUTH STATE
     ========================================================== */

  supabaseClient.auth.onAuthStateChange(
    function (event, session) {

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
      }
    }
  );


  /* ==========================================================
     INITIAL LOAD
     ========================================================== */

  loadDashboard();

})();