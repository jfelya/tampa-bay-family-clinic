/**
 * Form controller — one component, two presets (appointment | contact).
 * - Client-side validation with inline field errors (aria-invalid + messages)
 * - Lazy-loads Cloudflare Turnstile when the form scrolls into view
 * - POSTs FormData to /api/contact (Cloudflare Pages Function)
 * - Inline success message + reset; friendly error with phone fallback
 */

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void }
  ) => string;
  reset: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d\s.-]{7,}$/;

function setFieldError(form: HTMLFormElement, field: HTMLElement, message: string | null) {
  const id = field.getAttribute('id') || '';
  const errorEl = form.querySelector<HTMLElement>(`[data-error-for="${id}"]`);
  if (message) {
    field.setAttribute('aria-invalid', 'true');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  } else {
    field.setAttribute('aria-invalid', 'false');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  }
}

function validateField(form: HTMLFormElement, field: HTMLElement): boolean {
  const value = (field as HTMLInputElement).value.trim();
  const required = field.hasAttribute('required');
  const type = (field as HTMLInputElement).type;

  if (required && !value) {
    setFieldError(form, field, form.dataset.msgRequired || 'This field is required.');
    return false;
  }
  if (type === 'email' && value && !EMAIL_RE.test(value)) {
    setFieldError(form, field, form.dataset.msgEmail || 'Please enter a valid email address.');
    return false;
  }
  if (type === 'tel' && value && !PHONE_RE.test(value)) {
    setFieldError(form, field, form.dataset.msgPhone || 'Please enter a valid phone number.');
    return false;
  }
  setFieldError(form, field, null);
  return true;
}

function loadTurnstile(form: HTMLFormElement) {
  const container = form.querySelector<HTMLElement>('[data-turnstile]');
  if (!container || container.dataset.loaded === 'true') return;
  const sitekey = form.dataset.turnstileSitekey;
  if (!sitekey) return;

  container.dataset.loaded = 'true';

  const render = () => {
    if (!window.turnstile || container.dataset.rendered === 'true') return;
    container.dataset.rendered = 'true';
    form.dataset.turnstileRendered = 'true';
    container.innerHTML = '';
    const widgetId = window.turnstile.render(container, {
      sitekey,
      callback: (token: string) => {
        form.dataset.turnstileToken = token;
      },
      'expired-callback': () => {
        form.dataset.turnstileToken = '';
      },
    });
    form.dataset.turnstileWidget = widgetId;
  };

  if (window.turnstile) {
    render();
    return;
  }

  const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile-script]');
  if (existing) {
    existing.addEventListener('load', render);
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.defer = true;
  script.dataset.turnstileScript = 'true';
  script.addEventListener('load', render);
  document.head.appendChild(script);
}

function initForm(form: HTMLFormElement) {
  if (form.dataset.initialized === 'true') return;
  form.dataset.initialized = 'true';

  const fields = Array.from(
    form.querySelectorAll<HTMLElement>('input:not([type="hidden"]), textarea, select')
  );
  const status = form.querySelector<HTMLElement>('[data-form-status]');
  const submit = form.querySelector<HTMLButtonElement>('[data-form-submit]');
  const submitLabel = submit?.innerHTML;
  let submitting = false;

  fields.forEach((field) => {
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(form, field);
    });
    field.addEventListener('blur', () => {
      if ((field as HTMLInputElement).value) validateField(form, field);
    });
  });

  // Lazy-load Turnstile when the form approaches the viewport.
  const container = form.querySelector<HTMLElement>('[data-turnstile]');
  if (container && form.dataset.turnstileSitekey) {
    if (!('IntersectionObserver' in window)) {
      loadTurnstile(form);
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadTurnstile(form);
              observer.disconnect();
            }
          });
        },
        { rootMargin: '300px' }
      );
      observer.observe(form);
    }
  }

  const showStatus = (message: string, kind: 'success' | 'error') => {
    if (!status) return;
    status.textContent = message;
    status.classList.remove('hidden');
    status.dataset.kind = kind;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;

    let firstInvalid: HTMLElement | null = null;
    fields.forEach((field) => {
      if (!validateField(form, field) && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      (firstInvalid as HTMLElement).focus();
      return;
    }

    // Placeholder mode: Mailgun is not configured yet. Validate, report the
    // placeholder message, and reset — no network request.
    if (form.dataset.mode === 'placeholder') {
      showStatus(
        form.dataset.msgPlaceholder || 'Placeholder mode: the form works — no email is sent yet.',
        'success'
      );
      console.info('[form] placeholder submission', Object.fromEntries(new FormData(form)));
      form.reset();
      fields.forEach((field) => setFieldError(form, field, null));
      return;
    }

    if (form.dataset.turnstileRendered === 'true' && !form.dataset.turnstileToken) {
      showStatus(form.dataset.msgCaptcha || 'Please complete the CAPTCHA verification.', 'error');
      return;
    }

    submitting = true;
    if (submit) {
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      submit.textContent = form.dataset.msgSending || 'Sending…';
    }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const data = (await response.json().catch(() => ({}))) as { success?: boolean };
      if (!response.ok || !data.success) throw new Error('request-failed');

      showStatus(form.dataset.msgSuccess || 'Thank you! Your message was sent.', 'success');
      form.reset();
      fields.forEach((field) => setFieldError(form, field, null));
      if (form.dataset.turnstileRendered === 'true' && window.turnstile) {
        window.turnstile.reset(form.dataset.turnstileWidget);
      }
      form.dataset.turnstileToken = '';
    } catch {
      showStatus(form.dataset.msgError || 'Something went wrong. Please call us.', 'error');
    } finally {
      submitting = false;
      if (submit) {
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
        if (submitLabel) submit.innerHTML = submitLabel;
      }
    }
  });
}

export function initForms() {
  document.querySelectorAll<HTMLFormElement>('[data-form]').forEach(initForm);
}

/**
 * Smooth-scroll to the page's own appointment form and focus the first field,
 * so visitors can start typing immediately. Falls back to the default link
 * behavior (e.g. contact page) when the page has no form.
 */
export function initAppointmentJump() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll<HTMLAnchorElement>('a[href="#appointment"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.getElementById('appointment');
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      const field = target.querySelector<HTMLElement>(
        'input:not([type="hidden"]), select, textarea'
      );
      if (field) {
        window.setTimeout(() => field.focus({ preventScroll: true }), reduce ? 0 : 450);
      }
      history.replaceState(null, '', '#appointment');
    });
  });
}
