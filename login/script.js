/**
 * ═══════════════════════════════════════════════════════
 *  SUBIX ACCOUNTS — Central Auth Script
 *  accounts.subix.in  |  script.js
 *
 *  ⚠️  REPLACE the two placeholder values below with
 *      your actual Supabase Project URL and anon key
 *      before deploying.
 * ═══════════════════════════════════════════════════════
 */

// ── Configuration ─────────────────────────────────────
const SUPABASE_URL = "https://xrlqmngxxtbjxrkliypa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybHFtbmd4eHRianhya2xpeXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzI3MTUsImV4cCI6MjA4NzMwODcxNX0.qUBlRGyY8u-gUOkAjGvgKRrK36uzMuVMZj9Qs2zODQc";

// Post-login default redirect (can be overridden by ?next= param)
const DEFAULT_REDIRECT = "/";

// ── Init Supabase ──────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── DOM refs ───────────────────────────────────────────
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const signinBtn = document.getElementById("signin-btn");
const googleBtn = document.getElementById("google-btn");
const eyeToggle = document.getElementById("eye-toggle");
const eyeIcon = document.getElementById("eye-icon");

const errorToast = document.getElementById("error-toast");
const toastMsg = document.getElementById("toast-msg");
const successToast = document.getElementById("success-toast");
const successMsg = document.getElementById("success-msg");

const forgotLink = document.getElementById("forgot-link");
const modalBackdrop = document.getElementById("forgot-modal-backdrop");
const modalCloseBtn = document.getElementById("modal-close-btn");
const forgotForm = document.getElementById("forgot-form");
const fpEmailInput = document.getElementById("fp-email");
const fpSubmitBtn = document.getElementById("fp-submit-btn");
const fpToast = document.getElementById("fp-toast");
const fpToastMsg = document.getElementById("fp-toast-msg");

// ── Helpers ────────────────────────────────────────────

/** Show / hide the main error toast */
function showError(msg) {
    toastMsg.textContent = msg;
    errorToast.setAttribute("aria-hidden", "false");
    successToast.setAttribute("aria-hidden", "true");
    // Auto-dismiss after 6 s
    clearTimeout(showError._t);
    showError._t = setTimeout(() => errorToast.setAttribute("aria-hidden", "true"), 6000);
}

/** Show / hide the main success toast */
function showSuccess(msg) {
    successMsg.textContent = msg;
    successToast.setAttribute("aria-hidden", "false");
    errorToast.setAttribute("aria-hidden", "true");
    clearTimeout(showSuccess._t);
    showSuccess._t = setTimeout(() => successToast.setAttribute("aria-hidden", "true"), 6000);
}

/** Mark a button as loading / not loading */
function setLoading(btn, loading) {
    if (loading) {
        btn.classList.add("loading");
        btn.disabled = true;
    } else {
        btn.classList.remove("loading");
        btn.disabled = false;
    }
}

/** Mark input field as invalid */
function markInvalid(input) {
    input.classList.add("invalid");
    input.addEventListener("input", () => input.classList.remove("invalid"), { once: true });
}

/** Determine redirect URL from ?next= query param or fallback */
function getRedirectUrl() {
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    try {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");
        if (next) {
            const parsed = new URL(decodeURIComponent(next));
            // Whitelist subix.in subdomains, OR allow localhost if we are currently running on localhost
            if (
                parsed.hostname.endsWith(".subix.in") ||
                parsed.hostname === "subix.in" ||
                (isLocalDev && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"))
            ) {
                return parsed.href;
            }
        }
    } catch (_) { /* ignore */ }

    // Fallback redirect
    return DEFAULT_REDIRECT;
}

// ── Session Check on Load ──────────────────────────────
(async () => {
    try {
        const { data } = await sb.auth.getSession();
        if (data.session) {
            window.location.replace(getRedirectUrl());
        }
    } catch (e) {
        console.warn("Session check failed:", e.message);
    }
})();

// ── Auth State Listener ────────────────────────────────
sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
        if (window.location.hash.includes("access_token")) {
            window.history.replaceState(null, null, window.location.pathname + window.location.search);
        }
        showSuccess("Signed in! Redirecting…");
        setTimeout(() => window.location.replace(getRedirectUrl() || "/"), 800);
    }
});

// ── Email + Password Login ─────────────────────────────
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Basic front-end validation
    let valid = true;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        markInvalid(emailInput);
        valid = false;
    }
    if (!password || password.length < 6) {
        markInvalid(passwordInput);
        valid = false;
    }
    if (!valid) {
        showError("Please enter a valid email and password (min 6 characters).");
        return;
    }

    setLoading(signinBtn, true);

    try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });

        if (error) {
            // Friendly error messages
            const msg = error.message.includes("Invalid login credentials")
                ? "Incorrect email or password. Please try again."
                : error.message.includes("Email not confirmed")
                    ? "Please confirm your email before signing in."
                    : error.message;

            showError(msg);
            if (error.message.includes("credentials")) markInvalid(passwordInput);
        } else if (data.user) {
            showSuccess("Signed in! Redirecting…");
            setTimeout(() => window.location.replace(getRedirectUrl()), 800);
        }
    } catch (err) {
        showError("Something went wrong. Please try again.");
        console.error("Login error:", err);
    } finally {
        setLoading(signinBtn, false);
    }
});

// ── Google OAuth Login ─────────────────────────────────
googleBtn.addEventListener("click", async () => {
    setLoading(googleBtn, true);

    try {
        const { error } = await sb.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin + "/login",
                queryParams: {
                    access_type: "offline",
                    prompt: "select_account",
                },
            },
        });

        if (error) {
            showError("Google sign-in failed: " + error.message);
            setLoading(googleBtn, false);
        }
        // If no error, Supabase will redirect — keep button in loading state
    } catch (err) {
        showError("Something went wrong with Google login.");
        setLoading(googleBtn, false);
    }
});

// ── Password Visibility Toggle ─────────────────────────
const eyeOpenSvg = `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`;
const eyeCloseSvg = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;

eyeToggle.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    eyeIcon.innerHTML = isPassword ? eyeCloseSvg : eyeOpenSvg;
    eyeToggle.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
});

// ── Forgot Password Modal ──────────────────────────────

function openModal() {
    modalBackdrop.setAttribute("aria-hidden", "false");
    fpEmailInput.value = emailInput.value;     // pre-fill from login field
    fpToast.setAttribute("aria-hidden", "true");
    setTimeout(() => fpEmailInput.focus(), 80);
}

function closeModal() {
    modalBackdrop.setAttribute("aria-hidden", "true");
}

forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
});

modalCloseBtn.addEventListener("click", closeModal);

modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
});

forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = fpEmailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        fpToastMsg.textContent = "Please enter a valid email address.";
        fpToast.setAttribute("aria-hidden", "false");
        fpToast.style.setProperty("background", "rgba(255,0,0,0.1)");
        fpToast.style.setProperty("border-color", "rgba(255,0,0,0.25)");
        fpToast.style.setProperty("color", "#ff6b6b");
        return;
    }

    setLoading(fpSubmitBtn, true);
    fpToast.setAttribute("aria-hidden", "true");

    try {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + "/login/reset-password",
        });

        if (error) {
            fpToastMsg.textContent = error.message;
            fpToast.setAttribute("aria-hidden", "false");
            fpToast.style.setProperty("background", "rgba(255,0,0,0.1)");
            fpToast.style.setProperty("border-color", "rgba(255,0,0,0.25)");
            fpToast.style.setProperty("color", "#ff6b6b");
        } else {
            fpToastMsg.textContent = "Reset link sent! Check your inbox.";
            fpToast.setAttribute("aria-hidden", "false");
            fpToast.style.setProperty("background", "rgba(204,255,0,0.08)");
            fpToast.style.setProperty("border-color", "rgba(204,255,0,0.25)");
            fpToast.style.setProperty("color", "#ccff00");
            // Auto-close modal after 3s
            setTimeout(closeModal, 3000);
        }
    } catch (err) {
        fpToastMsg.textContent = "Something went wrong. Try again.";
        fpToast.setAttribute("aria-hidden", "false");
    } finally {
        setLoading(fpSubmitBtn, false);
    }
});

// ── Logout helper (callable from product pages) ────────
// Usage in LeadOS / HRMS:
//   import { signOut } from 'supabase'  — or just:
//   await sb.auth.signOut();
//   window.location.href = "https://subix.in/login";
//
// This function is exported on window so product iframes
// or same-domain scripts can call it:
window.subixSignOut = async () => {
    await sb.auth.signOut();
    window.location.replace("https://subix.in/login");
};
