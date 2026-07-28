export function shapeIconSVG(shape, color, size) {
  const s = size || 20;
  switch (shape) {
    case 'ring':
      return `<svg width="${s + 2}" height="${s + 2}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="${color}" stroke-width="3"></circle></svg>`;
    case 'diamond':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" fill="${color}" transform="rotate(45 12 12)"></rect></svg>`;
    case 'circle':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="${color}"></circle></svg>`;
    case 'square':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="${color}"></rect></svg>`;
    case 'cross':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="9.5" y="3" width="5" height="18" rx="1.5" fill="${color}"></rect><rect x="3" y="9.5" width="18" height="5" rx="1.5" fill="${color}"></rect></svg>`;
    default:
      return '';
  }
}

export function checkLogoSVG(color, size) {
  const s = size || 20;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="${color}" stroke-width="2.2"></circle><path d="M8.5 12.5l2.2 2.2 4.8-5.4" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
}

export function whatsappSVG(color, size) {
  const s = size || 18;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8 1-.1.2-.3.2-.5.1-1.4-.6-2.3-1.4-3.1-2.8-.1-.2-.1-.4.1-.5.2-.2.5-.5.6-.7.1-.2 0-.4-.1-.6-.1-.2-.6-1.4-.8-1.9-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.1s.9 2.5 1.1 2.7c1.3 1.7 2.6 2.6 4.6 3.3.6.2 1.1.3 1.4.2.4-.1 1.2-.5 1.4-1 .2-.5.2-.9.1-1-.1-.1-.2-.1-.4-.2Z"/></svg>`;
}

export function quoteSVG(color) {
  return `<svg width="24" height="24" viewBox="0 0 24 24" style="margin-bottom:12px"><path d="M7 10c0-2.8 2.2-5 5-5v3c-1.1 0-2 .9-2 2h2v5H7v-5Zm9 0c0-2.8 2.2-5 5-5v3c-1.1 0-2 .9-2 2h2v5h-5v-5Z" fill="${color}"/></svg>`;
}
