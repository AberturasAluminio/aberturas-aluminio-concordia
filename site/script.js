// Único lugar para cambiar el número de WhatsApp del negocio.
// Formato: 54 + 9 + código de área + número, sin 0 ni 15.
const WHATSAPP_NUMBER = '5493454938829';
const WHATSAPP_DISPLAY = '+54 9 345 493 8829';

document.querySelectorAll('.js-wa').forEach((el) => {
  const message = el.getAttribute('data-wa-msg') || '';
  el.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
});

document.querySelectorAll('.js-wa-number').forEach((el) => {
  el.textContent = WHATSAPP_DISPLAY;
});
