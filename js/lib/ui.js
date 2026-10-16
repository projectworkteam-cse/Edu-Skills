// js/lib/ui.js - Non-blocking accessible UI components (V1-UX-01, V1-UX-02)
(function (root) {
  function escapeHTML(s) {
    return String(s || '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ── NON-BLOCKING TOAST NOTIFICATIONS ──────────────────────────────────────
  function getOrCreateToastContainer() {
    let container = document.getElementById('eduToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'eduToastContainer';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Notifications');
      container.setAttribute('aria-live', 'polite');
      container.style.cssText = [
        'position: fixed',
        'bottom: 24px',
        'left: 50%',
        'transform: translateX(-50%)',
        'z-index: 10000',
        'display: flex',
        'flex-direction: column',
        'gap: 8px',
        'align-items: center',
        'pointer-events: none',
        'max-width: 90vw',
        'width: max-content'
      ].join(';');
      document.body.appendChild(container);
    }
    return container;
  }

  function toast(message, type = 'info', duration = 3500) {
    if (typeof document === 'undefined') return;
    const container = getOrCreateToastContainer();
    const el = document.createElement('div');
    el.className = 'edu-toast edu-toast-' + type;
    el.setAttribute('role', 'status');

    const colors = {
      info: { bg: '#1e293b', border: '#334155', text: '#f8fafc', icon: 'ℹ️' },
      success: { bg: '#064e3b', border: '#059669', text: '#ecfdf5', icon: '✅' },
      warning: { bg: '#78350f', border: '#d97706', text: '#fffbeb', icon: '⚠️' },
      error: { bg: '#7f1d1d', border: '#dc2626', text: '#fef2f2', icon: '❌' }
    }[type] || { bg: '#1e293b', border: '#334155', text: '#f8fafc', icon: 'ℹ️' };

    el.style.cssText = [
      `background: ${colors.bg}`,
      `color: ${colors.text}`,
      `border: 1px solid ${colors.border}`,
      'padding: 10px 18px',
      'border-radius: 10px',
      'font-size: 13px',
      'font-weight: 500',
      'box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      'display: flex',
      'align-items: center',
      'gap: 10px',
      'pointer-events: auto',
      'opacity: 0',
      'transform: translateY(10px)',
      'transition: opacity 0.25s ease, transform 0.25s ease'
    ].join(';');

    el.innerHTML = `
      <span aria-hidden="true">${colors.icon}</span>
      <span>${escapeHTML(message)}</span>
      <button type="button" aria-label="Dismiss notification" style="background:none;border:none;color:${colors.text};opacity:0.7;cursor:pointer;font-size:14px;padding:0 0 0 8px;margin-left:auto;">&times;</button>
    `;

    const closeBtn = el.querySelector('button');
    const dismiss = () => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 250);
    };

    if (closeBtn) closeBtn.onclick = dismiss;
    container.appendChild(el);

    // Trigger enter animation
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }

  // ── ACCESSIBLE CONFIRM MODAL (FOCUS-TRAPPED, ESC CLOSES) ───────────────────
  function confirmDialog(options = {}) {
    const {
      title = 'Are you sure?',
      body = '',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      danger = false
    } = typeof options === 'string' ? { body: options } : options;

    return new Promise((resolve) => {
      if (typeof document === 'undefined') return resolve(true);

      const overlay = document.createElement('div');
      overlay.id = 'eduConfirmOverlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'eduConfirmTitle');
      overlay.setAttribute('aria-describedby', 'eduConfirmBody');

      overlay.style.cssText = [
        'position: fixed',
        'top: 0',
        'left: 0',
        'right: 0',
        'bottom: 0',
        'background: rgba(15, 23, 42, 0.55)',
        'backdrop-filter: blur(2px)',
        'z-index: 10001',
        'display: flex',
        'align-items: center',
        'justify-content: center',
        'padding: 16px',
        'opacity: 0',
        'transition: opacity 0.2s ease'
      ].join(';');

      const confirmBtnBg = danger
        ? 'background: #dc2626; color: #fff;'
        : 'background: linear-gradient(135deg, #4338ca, #6d28d9); color: #fff;';

      overlay.innerHTML = `
        <div class="edu-confirm-box" style="background:#ffffff;border-radius:14px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);width:100%;max-width:440px;overflow:hidden;border:1px solid #e2e8f0;transform:scale(0.96);transition:transform 0.2s ease;">
          <div style="padding:22px 24px 14px;">
            <h3 id="eduConfirmTitle" style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 8px;">${escapeHTML(title)}</h3>
            <p id="eduConfirmBody" style="font-size:13.5px;color:#475569;line-height:1.55;margin:0;">${escapeHTML(body)}</p>
          </div>
          <div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:10px;">
            <button type="button" id="eduConfirmCancel" style="padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;color:#475569;background:#ffffff;border:1px solid #cbd5e1;cursor:pointer;">${escapeHTML(cancelText)}</button>
            <button type="button" id="eduConfirmOk" style="padding:8px 18px;border-radius:8px;font-size:13px;font-weight:600;border:none;cursor:pointer;${confirmBtnBg}">${escapeHTML(confirmText)}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const box = overlay.querySelector('.edu-confirm-box');
      const cancelBtn = overlay.querySelector('#eduConfirmCancel');
      const okBtn = overlay.querySelector('#eduConfirmOk');
      const previousActive = document.activeElement;

      const cleanup = (confirmed) => {
        document.removeEventListener('keydown', onKeyDown);
        overlay.style.opacity = '0';
        if (box) box.style.transform = 'scale(0.96)';
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          if (previousActive && typeof previousActive.focus === 'function') previousActive.focus();
          resolve(confirmed);
        }, 180);
      };

      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cleanup(false);
          return;
        }
        if (e.key === 'Tab') {
          const focusable = [cancelBtn, okBtn];
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      document.addEventListener('keydown', onKeyDown);
      cancelBtn.onclick = () => cleanup(false);
      okBtn.onclick = () => cleanup(true);
      overlay.onclick = (e) => {
        if (e.target === overlay) cleanup(false);
      };

      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        if (box) box.style.transform = 'scale(1)';
        (danger ? cancelBtn : okBtn).focus();
      });
    });
  }

  const api = { toast, confirmDialog, escapeHTML };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EduUI = api;
})(typeof window !== 'undefined' ? window : globalThis);
