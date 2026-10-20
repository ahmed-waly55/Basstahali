import { subjectBookingLink } from './subject-booking';

describe('Subject booking links', () => {
  it('encodes subject names as message text without changing the WhatsApp recipient', () => {
    const subject = 'Physics & Chemistry?text=other';
    const url = new URL(subjectBookingLink(subject));
    expect(url.origin + url.pathname).toBe('https://wa.me/971563306087');
    expect([...url.searchParams.keys()]).toEqual(['text']);
    expect(url.searchParams.get('text')).toContain(subject);
    expect(url.searchParams.get('text')).not.toContain('undefined');
    expect(url.searchParams.get('text')).not.toContain('null');
  });
});
