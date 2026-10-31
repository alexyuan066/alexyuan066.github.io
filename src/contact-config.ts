/** Public contact data only. Blank or invalid values do not produce links. */
export function parseContactConfig(input: unknown) {
  const config = input !== null && typeof input === 'object'
    ? input as Record<string, unknown>
    : {};
  const text = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null;
  const https = (value: unknown) => {
    const candidate = text(value);
    if (!candidate) return null;
    try {
      const url = new URL(candidate);
      return url.protocol === 'https:' && !url.username && !url.password ? candidate : null;
    } catch { return null; }
  };

  const rawEmail = text(config.email);
  const email = rawEmail && /^[^\s@?&#:<>]+@[^\s@?&#:<>]+\.[^\s@?&#:<>]+$/.test(rawEmail) ? rawEmail : null;
  const rawPhone = text(config.phone);
  const digits = rawPhone?.replace(/[^\d+]/g, '') ?? '';
  const phone = rawPhone && /^\+?\d{7,15}$/.test(digits) ? rawPhone : null;
  const rawResume = text(config.resume);
  const localResume = rawResume && /^\/(?!\/)[^\\\s?#]+\.pdf$/i.test(rawResume) ? rawResume : null;

  return {
    email,
    emailHref: email ? `mailto:${email}` : null,
    phone,
    phoneHref: phone ? `tel:${digits}` : null,
    linkedIn: https(config.linkedIn),
    resume: localResume ?? https(rawResume),
  };
}
