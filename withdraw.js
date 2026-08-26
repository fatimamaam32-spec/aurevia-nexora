/**
 * Aurevia Institute — Withdrawal System Controller
 *
 * IMPORTANT:
 * Financial values are now read from the same Supabase RPC
 * used by the Dashboard:
 *
 *   public.get_user_financial_summary(uuid)
 *
 * This keeps Dashboard and Withdraw page synchronized.
 *
 * Existing withdrawal triggers/functions are NOT replaced here.
 */

import { supabase } from './supabase.js';

let currentUser = null;
let currentBalance = 0;

const elements = {
  userDisplayName: document.getElementById('user-display-name'),
  statBalance: document.getElementById('stat-balance'),
  statTotalWithdrawn: document.getElementById('stat-total-withdrawn'),
  statPending: document.getElementById('stat-pending'),

  form: document.getElementById('withdraw-form'),
  registeredName: document.getElementById('registered-name'),
  paymentMethod: document.getElementById('payment-method'),
  groupBankName: document.getElementById('group-bank-name'),
  bankName: document.getElementById('bank-name'),
  labelAccountTitle: document.getElementById('label-account-title'),
  accountTitle: document.getElementById('account-title'),
  labelAccountNumber: document.getElementById('label-account-number'),
  accountNumber: document.getElementById('account-number'),
  withdrawAmount: document.getElementById('withdraw-amount'),
  btnSubmit: document.getElementById('btn-submit'),

  alertError: document.getElementById('alert-error'),
  alertErrorMsg: document.getElementById('alert-error-msg'),
  alertSuccess: document.getElementById('alert-success'),
  alertSuccessMsg: document.getElementById('alert-success-msg'),

  activityTbody: document.getElementById('activity-tbody')
};


/* ============================================================
   HELPERS
   ============================================================ */

function safeNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const num = Number(value);

  return Number.isFinite(num) ? num : 0;
}


function formatPKR(value) {
  const num = safeNumber(value);

  return `PKR ${num.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}


function maskAccountNumber(accStr) {
  if (!accStr) return '—';

  const cleanStr = String(accStr).trim();

  if (cleanStr.length <= 4) {
    return cleanStr;
  }

  return `***** ${cleanStr.slice(-4)}`;
}


/* ============================================================
   ALERTS
   ============================================================ */

function showError(message) {
  elements.alertSuccess.style.display = 'none';

  elements.alertErrorMsg.textContent =
    message || 'Something went wrong.';

  elements.alertError.style.display = 'flex';
}


function showSuccess(message) {
  elements.alertError.style.display = 'none';

  elements.alertSuccessMsg.textContent =
    message || 'Success.';

  elements.alertSuccess.style.display = 'flex';
}


function clearAlerts() {
  elements.alertError.style.display = 'none';
  elements.alertSuccess.style.display = 'none';
}


/* ============================================================
   FORM VALIDATION
   ============================================================ */

function validateForm() {
  clearAlerts();

  const rawVal = elements.withdrawAmount.value.trim();
  const amount = parseFloat(rawVal);

  const title = elements.accountTitle.value.trim();
  const num = elements.accountNumber.value.trim();

  const method = elements.paymentMethod.value;
  const bank = elements.bankName.value.trim();

  let isValid = true;

  /*
   * Amount required
   */
  if (rawVal === '') {
    isValid = false;
  }

  /*
   * Minimum withdrawal
   */
  else if (isNaN(amount) || amount < 500) {
    isValid = false;

    showError(
      'Minimum Withdrawal Amount — The minimum amount you can withdraw is PKR 500.'
    );
  }

  /*
   * Available balance check
   *
   * IMPORTANT:
   * currentBalance comes from get_user_financial_summary()
   */
  else if (amount > currentBalance) {
    isValid = false;

    showError(
      'Insufficient Balance — You do not have enough available balance to withdraw this amount.'
    );
  }

  /*
   * Account information
   */
  if (!title || !num) {
    isValid = false;
  }

  if (method === 'Bank Account' && !bank) {
    isValid = false;
  }

  elements.btnSubmit.disabled = !isValid;

  return isValid;
}


/* ============================================================
   AUTH INITIALIZATION
   ============================================================ */

async function init() {
  try {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      window.location.href = 'login.html';
      return;
    }

    currentUser = session.user;

    await loadDashboardData();

    setupEventListeners();

  } catch (error) {
    console.error('Initialization error:', error);

    showError(
      error?.message ||
      'Unable to verify account authorization.'
    );
  }
}


/* ============================================================
   FINANCIAL SUMMARY
   ============================================================ */

/**
 * IMPORTANT:
 *
 * DO NOT read profiles.balance here.
 *
 * Dashboard and Withdraw page must use the same financial source.
 *
 * RPC:
 * public.get_user_financial_summary(uuid)
 *
 * Expected response:
 *
 * {
 *   user_id,
 *   approved_referrals,
 *   referral_commission,
 *   referral_earnings,
 *   reward_earnings,
 *   total_earnings,
 *   total_withdrawn,
 *   current_balance
 * }
 */
async function getFinancialSummary() {

  const {
    data,
    error
  } = await supabase.rpc(
    'get_user_financial_summary',
    {
      p_user_id: currentUser.id
    }
  );

  if (error) {
    console.error(
      'Financial summary RPC error:',
      error
    );

    throw error;
  }

  if (!data) {
    throw new Error(
      'Financial summary was not returned by Supabase.'
    );
  }

  return data;
}


/* ============================================================
   LOAD DASHBOARD / WITHDRAW PAGE DATA
   ============================================================ */

async function loadDashboardData() {

  try {

    /*
     * Get profile only for name / registered name.
     *
     * balance and total_earnings are intentionally NOT used.
     */
    const {
      data: profile,
      error: profileError
    } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', currentUser.id)
      .single();

    if (profileError) {
      throw profileError;
    }


    /*
     * SAME FINANCIAL RPC AS DASHBOARD
     */
    const summary = await getFinancialSummary();


    /*
     * Financial values
     */
    currentBalance = safeNumber(
      summary.current_balance
    );

    const totalWithdrawn = safeNumber(
      summary.total_withdrawn
    );


    /*
     * Pending withdrawals are still calculated
     * from withdraw_requests.
     */
    const {
      data: pendingRequests,
      error: pendingError
    } = await supabase
      .from('withdraw_requests')
      .select('amount')
      .eq('user_id', currentUser.id)
      .eq('status', 'pending');

    if (pendingError) {
      console.warn(
        'Pending withdrawal query error:',
        pendingError
      );
    }

    const pendingTotal =
      pendingRequests
        ? pendingRequests.reduce(
            (sum, item) =>
              sum + safeNumber(item.amount),
            0
          )
        : 0;


    /*
     * User name
     */
    const displayName =
      profile?.full_name ||
      currentUser.email ||
      'Member';


    elements.userDisplayName.textContent =
      displayName;

    elements.registeredName.value =
      profile?.full_name || '';


    /*
     * IMPORTANT:
     *
     * This is now the SAME current balance
     * that Dashboard displays.
     */
    elements.statBalance.textContent =
      formatPKR(currentBalance);


    /*
     * Total approved/deducted withdrawals
     */
    elements.statTotalWithdrawn.textContent =
      formatPKR(totalWithdrawn);


    /*
     * Pending withdrawal requests
     */
    elements.statPending.textContent =
      formatPKR(pendingTotal);


    await loadRecentActivity();

    validateForm();

  } catch (error) {

    console.error(
      'Failed to load withdrawal dashboard:',
      error
    );

    /*
     * Never silently show an incorrect balance.
     */
    currentBalance = 0;

    elements.statBalance.textContent =
      formatPKR(0);

    showError(
      error?.message ||
      'Failed to fetch account financial information.'
    );
  }
}


/* ============================================================
   WITHDRAWAL HISTORY
   ============================================================ */

async function loadRecentActivity() {

  const {
    data: requests,
    error
  } = await supabase
    .from('withdraw_requests')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', {
      ascending: false
    });


  if (
    error ||
    !requests ||
    requests.length === 0
  ) {

    elements.activityTbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          No withdrawal activity found.
        </td>
      </tr>
    `;

    return;
  }


  elements.activityTbody.innerHTML =
    requests.map(item => {

      const dateFormatted =
        new Date(
          item.created_at
        ).toLocaleString('en-PK', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });


      const statusLower =
        String(
          item.status || 'pending'
        ).toLowerCase();


      const statusClass =
        statusLower === 'approved'
          ? 'badge-approved'
          : statusLower === 'rejected'
          ? 'badge-rejected'
          : 'badge-pending';


      const accountDetails =
        (
          item.payment_method === 'Bank Account' ||
          item.payment_method === 'Bank Transfer'
        )
          ? `${item.bank_name || 'Bank'} (${maskAccountNumber(item.account_number)})`
          : maskAccountNumber(
              item.account_number
            );


      return `
        <tr>

          <td>
            ${dateFormatted}
          </td>

          <td>
            <strong>
              ${item.payment_method || '—'}
            </strong>
          </td>

          <td>
            ${accountDetails}
          </td>

          <td>
            <strong>
              ${formatPKR(item.amount)}
            </strong>
          </td>

          <td>
            <span class="badge ${statusClass}">
              ${item.status || 'pending'}
            </span>
          </td>

        </tr>
      `;

    }).join('');
}


/* ============================================================
   PAYMENT METHOD FIELDS
   ============================================================ */

function updateFormFields() {

  const method =
    elements.paymentMethod.value;


  if (method === 'Bank Account') {

    elements.groupBankName.style.display =
      'block';

    elements.labelAccountTitle.textContent =
      'ACCOUNT TITLE';

    elements.accountTitle.placeholder =
      'Enter bank account title';

    elements.labelAccountNumber.textContent =
      'ACCOUNT NUMBER / IBAN';

    elements.accountNumber.placeholder =
      'Enter bank account number or IBAN';

  } else {

    elements.groupBankName.style.display =
      'none';

    elements.bankName.value = '';

    elements.labelAccountTitle.textContent =
      `${method.toUpperCase()} ACCOUNT TITLE`;

    elements.accountTitle.placeholder =
      `Enter ${method} account title`;

    elements.labelAccountNumber.textContent =
      `${method.toUpperCase()} NUMBER`;

    elements.accountNumber.placeholder =
      '03XXXXXXXXX';
  }


  validateForm();
}


/* ============================================================
   WITHDRAWAL SUBMISSION
   ============================================================ */

async function handleSubmit(event) {

  event.preventDefault();

  /*
   * Always validate against the latest
   * RPC balance before submitting.
   */
  try {

    const latestSummary =
      await getFinancialSummary();

    currentBalance =
      safeNumber(
        latestSummary.current_balance
      );

  } catch (error) {

    console.error(
      'Latest balance check failed:',
      error
    );

    showError(
      'Unable to verify your latest available balance. Please try again.'
    );

    return;
  }


  /*
   * Validate using latest balance
   */
  if (!validateForm()) {
    return;
  }


  const selectedMethod =
    elements.paymentMethod.value;

  const bankNameVal =
    elements.bankName.value.trim();

  const accountTitleVal =
    elements.accountTitle.value.trim();

  const accountNumberVal =
    elements.accountNumber.value.trim();

  const amountVal =
    parseFloat(
      elements.withdrawAmount.value
    );


  elements.btnSubmit.disabled = true;

  elements.btnSubmit.innerHTML =
    `<i class="fa-solid fa-spinner fa-spin"></i> Processing Request...`;


  try {

    /*
     * IMPORTANT:
     *
     * We still insert into withdraw_requests.
     *
     * Your existing Supabase trigger/function
     * handles balance deduction immediately.
     */
    const payload = {

      user_id: currentUser.id,

      payment_method:
        selectedMethod,

      account_title:
        accountTitleVal,

      account_number:
        accountNumberVal,

      bank_name:
        selectedMethod === 'Bank Account'
          ? bankNameVal
          : null,

      amount:
        amountVal,

      status:
        'pending'
    };


    const {
      error: insertError
    } = await supabase
      .from('withdraw_requests')
      .insert([payload]);


    if (insertError) {
      throw insertError;
    }


    showSuccess(
      'Your withdrawal request has been submitted successfully and is currently under review.'
    );


    /*
     * Clear form
     */
    elements.withdrawAmount.value = '';

    elements.accountTitle.value = '';

    elements.accountNumber.value = '';

    elements.bankName.value = '';


    /*
     * IMPORTANT:
     *
     * Reload financial summary after submission.
     *
     * This allows the page to immediately show
     * the updated balance after your existing
     * withdrawal trigger deducts the amount.
     */
    await loadDashboardData();


  } catch (error) {

    console.error(
      'Submission failed:',
      error
    );

    showError(
      error?.message ||
      'Failed to submit withdrawal request.'
    );

  } finally {

    validateForm();

    elements.btnSubmit.innerHTML =
      `<i class="fa-solid fa-paper-plane"></i> SUBMIT WITHDRAWAL REQUEST`;
  }
}


/* ============================================================
   EVENT LISTENERS
   ============================================================ */

function setupEventListeners() {

  elements.paymentMethod.addEventListener(
    'change',
    updateFormFields
  );


  elements.withdrawAmount.addEventListener(
    'input',
    validateForm
  );


  elements.accountTitle.addEventListener(
    'input',
    validateForm
  );


  elements.accountNumber.addEventListener(
    'input',
    validateForm
  );


  elements.bankName.addEventListener(
    'input',
    validateForm
  );


  elements.form.addEventListener(
    'submit',
    handleSubmit
  );


  updateFormFields();
}


/* ============================================================
   START
   ============================================================ */

document.addEventListener(
  'DOMContentLoaded',
  init
);