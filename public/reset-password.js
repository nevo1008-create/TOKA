const config = window.TOCA_AUTH_CONFIG;

const loadingMessage = document.querySelector('#loading-message');
const resetForm = document.querySelector('#reset-form');
const passwordInput = document.querySelector('#password');
const confirmPasswordInput = document.querySelector('#confirm-password');
const submitButton = document.querySelector('#submit-button');
const errorMessage = document.querySelector('#error-message');
const successMessage = document.querySelector('#success-message');
const returnLink = document.querySelector('#return-link');

const supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: true,
  },
});

if (config.appLoginUrl) {
  returnLink.href = config.appLoginUrl;
}

function showStatus(node, message) {
  node.textContent = message;
  node.classList.add('visible');
}

function hideStatus(node) {
  node.textContent = '';
  node.classList.remove('visible');
}

function showReturnLink() {
  if (!config.appLoginUrl) {
    return;
  }

  returnLink.classList.remove('hidden');
}

function clearUrlTokens() {
  window.history.replaceState({}, document.title, `${window.location.origin}/reset-password`);
}

async function prepareResetSession() {
  hideStatus(errorMessage);
  hideStatus(successMessage);

  const url = new URL(window.location.href);
  const urlError = url.searchParams.get('error_description');
  const code = url.searchParams.get('code');
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const hashError = hashParams.get('error_description');
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (urlError || hashError) {
    throw new Error(urlError || hashError);
  }

  if (code) {
    const { error } = await supabaseClient.auth.exchangeCodeForSession(code);

    if (error) {
      throw error;
    }

    clearUrlTokens();
  } else if (accessToken && refreshToken) {
    const { error } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw error;
    }

    clearUrlTokens();
  }

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    throw new Error('This reset link is missing or expired. Please request a new one.');
  }

  loadingMessage.classList.remove('visible');
  resetForm.classList.remove('hidden');
}

resetForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideStatus(errorMessage);
  hideStatus(successMessage);

  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (password.length < 8 || confirmPassword.length < 8) {
    showStatus(errorMessage, 'Password must contain at least 8 letters or numbers.');
    return;
  }

  if (password !== confirmPassword) {
    showStatus(errorMessage, 'Passwords do not match.');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Saving...';

  try {
    const { error } = await supabaseClient.auth.updateUser({ password });

    if (error) {
      throw error;
    }

    await supabaseClient.auth.signOut().catch(() => undefined);
    resetForm.classList.add('hidden');
    showStatus(successMessage, 'Your password was saved. You can now return to TOCA and log in.');
    showReturnLink();
  } catch (error) {
    showStatus(errorMessage, error instanceof Error ? error.message : 'Could not update your password.');
    submitButton.disabled = false;
    submitButton.textContent = 'Save new password';
  }
});

prepareResetSession().catch((error) => {
  loadingMessage.classList.remove('visible');
  showStatus(errorMessage, error instanceof Error ? error.message : 'Could not prepare this reset link.');
  showReturnLink();
});
