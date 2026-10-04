/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * One handler for both form presets (appointment | contact).
 * Adapted from the provided reference handler per docs/REDESIGN-PLAN.md §2:
 *  - subject prefix: "Tampa Bay Family Clinic website:"
 *  - fallback phone: (813) 933-2880
 *  - field names aligned with the new Form component
 *    (name, email, phone, message, appointment_date, appointment_time, tbfc_form_source)
 *
 * Secrets are PENDING (see docs/PENDING-ITEMS.md). Until Mailgun env vars are
 * configured the endpoint returns a clean 503 so the client shows the
 * "call us" fallback instead of failing silently.
 */

interface Env {
  TURNSTILE_SECRET_KEY: string;
  MAILGUN_API_KEY: string;
  MAILGUN_DOMAIN: string;
  MAILGUN_FROM: string;
  MAILGUN_TO: string;
  /** Optional comma-separated list of BCC recipients. Empty/unset = no BCC. */
  MAILGUN_BCC?: string;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: JSON_HEADERS,
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Pre-flight: refuse cleanly if Mailgun env is not configured yet
    // (so verify-deploy can tell "needs cutover" apart from "broken").
    if (
      !context.env.MAILGUN_API_KEY ||
      !context.env.MAILGUN_DOMAIN ||
      !context.env.MAILGUN_FROM ||
      !context.env.MAILGUN_TO
    ) {
      return jsonError(
        'Contact form is not yet configured. Please call us at (813) 933-2880.',
        503
      );
    }

    const formData = await context.request.formData();

    const name = String(formData.get('name') || '').trim().slice(0, 100);
    const email = String(formData.get('email') || '').trim().slice(0, 200);
    const phone = String(formData.get('phone') || '').trim().slice(0, 40);
    const message = String(formData.get('message') || '').trim().slice(0, 5000);
    const appointmentDate = String(formData.get('appointment_date') || '').trim().slice(0, 40);
    const appointmentTime = String(formData.get('appointment_time') || '').trim().slice(0, 40);
    const source = String(formData.get('tbfc_form_source') || 'website').trim().slice(0, 100);

    if (!name || !email || !phone) {
      return jsonError('Please fill in every field.', 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError('Please enter a valid email address.', 400);
    }

    const isAppointment = Boolean(appointmentDate || appointmentTime);
    if (isAppointment && (!appointmentDate || !appointmentTime)) {
      return jsonError('Please choose both a desired date and a desired time.', 400);
    }
    if (!isAppointment && !message) {
      return jsonError('Please fill in every field.', 400);
    }

    // Verify Cloudflare Turnstile (skipped when the secret is not configured yet).
    const turnstileToken = formData.get('cf-turnstile-response');
    if (turnstileToken && context.env.TURNSTILE_SECRET_KEY) {
      const turnstileRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({
            secret: context.env.TURNSTILE_SECRET_KEY,
            response: turnstileToken,
          }),
        }
      );
      const turnstileData = (await turnstileRes.json()) as {
        success: boolean;
        'error-codes'?: string[];
      };
      if (!turnstileData.success) {
        console.warn('turnstile failed:', turnstileData['error-codes']);
        return jsonError('CAPTCHA verification failed. Please try again.', 400);
      }
    }

    // Parse optional comma-separated BCC list.
    const bccList = (context.env.MAILGUN_BCC ?? '')
      .split(',')
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);

    const subject = isAppointment
      ? `Tampa Bay Family Clinic website: Appointment request (${source})`
      : `Tampa Bay Family Clinic website: Contact message (${source})`;

    const text =
      `New website form submission\n\n` +
      `Source: ${source}\n` +
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Phone: ${phone}\n` +
      (isAppointment ? `Desired date: ${appointmentDate}\nDesired time: ${appointmentTime}\n` : '') +
      (message ? `\nMessage:\n${message}\n` : '');

    // Build Mailgun form body. URLSearchParams supports repeated keys via
    // append(), which is how Mailgun accepts multiple BCC recipients.
    const mailgunBody = new URLSearchParams();
    mailgunBody.set('from', context.env.MAILGUN_FROM);
    mailgunBody.set('to', context.env.MAILGUN_TO);
    for (const bcc of bccList) {
      mailgunBody.append('bcc', bcc);
    }
    mailgunBody.set('h:Reply-To', email);
    mailgunBody.set('subject', subject);
    mailgunBody.set('text', text);

    // Send email via Mailgun
    const mailgunRes = await fetch(
      `https://api.mailgun.net/v3/${context.env.MAILGUN_DOMAIN}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`api:${context.env.MAILGUN_API_KEY}`)}`,
        },
        body: mailgunBody,
      }
    );

    if (!mailgunRes.ok) {
      const body = await mailgunRes.text().catch(() => '');
      console.error(`Mailgun ${mailgunRes.status}: ${body}`);
      throw new Error('Mailgun send failed');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: JSON_HEADERS,
    });
  } catch (error) {
    console.error('contact handler failed:', error);
    return jsonError('Server error. Please try again or call us directly.', 500);
  }
};
