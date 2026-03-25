/**
 * willcall — Component Library
 * Render helpers for the design system.
 * Each function returns an HTML string.
 *
 * Usage:
 *   container.innerHTML = WC.Button({ label: 'Search', variant: 'primary' });
 *   container.innerHTML = WC.ShowItem({ artist: 'Radiohead', date: 'Jun 8, 2024', venue: 'MSG', thumbUrl: '...' });
 */

window.WC = (function () {
  /* ---- helpers ---- */
  function esc(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function cls(base, mods) {
    var out = base;
    if (!mods) return out;
    for (var k in mods) {
      if (mods[k]) out += ' ' + k;
    }
    return out;
  }

  function attrs(obj) {
    if (!obj) return '';
    var out = '';
    for (var k in obj) {
      if (obj[k] != null) out += ' ' + k + '="' + esc(String(obj[k])) + '"';
    }
    return out;
  }

  /* ===========================================================
     BUTTON
     props: { label, variant?, size?, full?, disabled?, busy?, icon?, href?, id?, dataAttrs? }
     variant: 'primary' (default) | 'ghost' | 'add' | 'text'
     size:    'sm' | 'lg'
     =========================================================== */
  function Button(props) {
    var p = props || {};
    var v = p.variant || 'primary';
    var classes = cls('wc-btn wc-btn--' + v, {
      'wc-btn--sm': p.size === 'sm',
      'wc-btn--lg': p.size === 'lg',
      'wc-btn--full': p.full
    });
    var tag = p.href ? 'a' : 'button';
    var extra = '';
    if (p.href) extra += ' href="' + esc(p.href) + '"';
    if (p.disabled) extra += ' disabled';
    if (p.busy) extra += ' aria-busy="true"';
    if (p.id) extra += ' id="' + esc(p.id) + '"';
    if (p.dataAttrs) extra += attrs(p.dataAttrs);

    var inner = '';
    if (p.busy) inner += '<span class="wc-btn__spinner"></span>';
    if (p.icon) inner += p.icon;
    inner += '<span>' + esc(p.label) + '</span>';

    return '<' + tag + ' class="' + classes + '"' + extra + '>' + inner + '</' + tag + '>';
  }

  /* ===========================================================
     INPUT — Invisible Field
     props: { placeholder?, id?, name?, type?, value?, error?, disabled?, autocomplete? }
     =========================================================== */
  function Input(props) {
    var p = props || {};
    var inputCls = cls('wc-input', { 'wc-input--error': !!p.error });
    var extra = '';
    if (p.id) extra += ' id="' + esc(p.id) + '"';
    if (p.name) extra += ' name="' + esc(p.name) + '"';
    if (p.disabled) extra += ' disabled';
    if (p.autocomplete) extra += ' autocomplete="' + esc(p.autocomplete) + '"';
    if (p.value) extra += ' value="' + esc(p.value) + '"';

    var html = '<div class="wc-field">';
    html += '<input type="' + esc(p.type || 'text') + '" class="' + inputCls + '"';
    html += ' placeholder="' + esc(p.placeholder || '') + '"' + extra + '>';
    if (p.error) html += '<div class="wc-field__error">' + esc(p.error) + '</div>';
    html += '</div>';
    return html;
  }

  /* ===========================================================
     CARD
     props: { content, flush?, interactive?, id? }
     =========================================================== */
  function Card(props) {
    var p = props || {};
    var classes = cls('wc-card', {
      'wc-card--flush': p.flush,
      'wc-card--interactive': p.interactive
    });
    var extra = '';
    if (p.id) extra = ' id="' + esc(p.id) + '"';
    return '<div class="' + classes + '"' + extra + '>' + (p.content || '') + '</div>';
  }

  /* ===========================================================
     SHOW ITEM
     props: { artist, date?, venue?, thumbUrl?, actions? }
     =========================================================== */
  function ShowItem(props) {
    var p = props || {};
    var thumb = p.thumbUrl
      ? '<img src="' + esc(p.thumbUrl) + '" alt="' + esc(p.artist) + '" loading="lazy">'
      : '<span class="wc-avatar__initials">' + esc((p.artist || '?').charAt(0)) + '</span>';

    var html = '<div class="wc-show">';
    html += '<div class="wc-show__thumb">' + thumb + '</div>';
    html += '<div class="wc-show__info">';
    html += '<div class="wc-show__artist">' + esc(p.artist) + '</div>';
    if (p.date) html += '<div class="wc-show__date">' + esc(p.date) + '</div>';
    if (p.venue) html += '<div class="wc-show__venue">\uD83D\uDCCD ' + esc(p.venue) + '</div>';
    html += '</div>';
    if (p.actions) html += '<div class="wc-show__actions">' + p.actions + '</div>';
    html += '</div>';
    return html;
  }

  /* ===========================================================
     STATS BAR
     props: { items: [{ value, label }] }
     =========================================================== */
  function StatsBar(props) {
    var p = props || {};
    var items = p.items || [];
    var html = '<div class="wc-stats">';
    for (var i = 0; i < items.length; i++) {
      if (i > 0) html += '<div class="wc-stats__divider"></div>';
      html += '<div class="wc-stats__cell">';
      html += '<div class="wc-stats__value">' + esc(String(items[i].value)) + '</div>';
      html += '<div class="wc-stats__label">' + esc(items[i].label) + '</div>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  /* ===========================================================
     AVATAR
     props: { name?, imgUrl?, size?, editable?, upload? }
     size: 'sm' | 'lg' | 'upload' (default: 44px)
     =========================================================== */
  function Avatar(props) {
    var p = props || {};
    var classes = cls('wc-avatar', {
      'wc-avatar--sm': p.size === 'sm',
      'wc-avatar--lg': p.size === 'lg',
      'wc-avatar--upload': p.upload,
      'wc-avatar--editable': p.editable
    });

    var inner = '';
    if (p.imgUrl) {
      inner = '<img src="' + esc(p.imgUrl) + '" alt="' + esc(p.name || '') + '">';
    } else if (p.upload) {
      inner = '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">'
        + '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>'
        + '<circle cx="12" cy="13" r="4"/></svg>';
    } else {
      var initials = (p.name || '?').split(' ').map(function (w) { return w.charAt(0); }).join('').substring(0, 2);
      inner = '<span class="wc-avatar__initials">' + esc(initials) + '</span>';
    }

    return '<div class="' + classes + '">' + inner + '</div>';
  }

  /* ===========================================================
     TAG / CHIP
     props: { label, active?, interactive?, icon? }
     =========================================================== */
  function Tag(props) {
    var p = props || {};
    var classes = cls('wc-tag', {
      'wc-tag--interactive': p.interactive,
      'wc-tag--active': p.active
    });
    var html = '<span class="' + classes + '">';
    if (p.icon) html += p.icon;
    html += esc(p.label);
    html += '</span>';
    return html;
  }

  /* ===========================================================
     TABS — Segmented Control
     props: { tabs: [{ label, id }], activeId }
     =========================================================== */
  function Tabs(props) {
    var p = props || {};
    var tabs = p.tabs || [];
    var html = '<div class="wc-tabs" role="tablist">';
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      var sel = t.id === p.activeId;
      html += '<button class="wc-tabs__tab" role="tab"';
      html += ' aria-selected="' + sel + '"';
      html += ' data-tab="' + esc(t.id) + '"';
      html += '>' + esc(t.label) + '</button>';
    }
    html += '</div>';
    return html;
  }

  /* ===========================================================
     SECTION HEADER
     props: { title, count?, action?, actionLabel? }
     =========================================================== */
  function SectionHeader(props) {
    var p = props || {};
    var html = '<div class="wc-section">';
    html += '<div class="wc-section__title">' + esc(p.title) + '</div>';
    if (p.count != null) {
      html += '<span class="wc-section__count">' + esc(String(p.count)) + '</span>';
    }
    if (p.actionLabel) {
      html += '<button class="wc-section__action">' + esc(p.actionLabel) + '</button>';
    }
    html += '</div>';
    return html;
  }

  /* ===========================================================
     EMPTY STATE
     props: { title?, desc?, icon? }
     =========================================================== */
  function EmptyState(props) {
    var p = props || {};
    var html = '<div class="wc-empty">';
    if (p.icon) html += '<div class="wc-empty__icon">' + p.icon + '</div>';
    if (p.title) html += '<div class="wc-empty__title">' + esc(p.title) + '</div>';
    if (p.desc) html += '<div class="wc-empty__desc">' + esc(p.desc) + '</div>';
    html += '</div>';
    return html;
  }

  /* ===========================================================
     BADGE
     props: { label, variant? }
     variant: 'default' | 'dark' | 'success'
     =========================================================== */
  function Badge(props) {
    var p = props || {};
    var v = p.variant || 'default';
    return '<span class="wc-badge wc-badge--' + esc(v) + '">' + esc(p.label) + '</span>';
  }

  /* ===========================================================
     SPINNER
     props: { size?, white? }
     size: 'sm' | 'lg'
     =========================================================== */
  function Spinner(props) {
    var p = props || {};
    var classes = cls('wc-spinner', {
      'wc-spinner--sm': p.size === 'sm',
      'wc-spinner--lg': p.size === 'lg',
      'wc-spinner--white': p.white
    });
    return '<div class="' + classes + '"></div>';
  }

  /* ===========================================================
     COLOR SWATCH
     props: { colors: string[], selectedColor?, name? }
     =========================================================== */
  function Swatches(props) {
    var p = props || {};
    var colors = p.colors || [];
    var html = '<div class="wc-swatches"' + (p.name ? ' data-name="' + esc(p.name) + '"' : '') + '>';
    for (var i = 0; i < colors.length; i++) {
      var sel = colors[i] === p.selectedColor;
      html += '<div class="wc-swatch' + (sel ? ' active' : '') + '"';
      html += ' data-color="' + esc(colors[i]) + '"';
      html += ' aria-selected="' + sel + '"';
      html += ' style="background:' + esc(colors[i]) + '"';
      html += ' role="option" tabindex="0"></div>';
    }
    html += '</div>';
    return html;
  }

  /* ===========================================================
     SHEET / MODAL
     props: { id, title, body }
     =========================================================== */
  function Sheet(props) {
    var p = props || {};
    var html = '';
    html += '<div class="wc-sheet-overlay" data-sheet="' + esc(p.id) + '"></div>';
    html += '<div class="wc-sheet" id="' + esc(p.id) + '">';
    html += '<div class="wc-sheet__header">';
    html += '<div class="wc-sheet__title">' + esc(p.title) + '</div>';
    html += '<button class="wc-sheet__close" data-close-sheet="' + esc(p.id) + '">';
    html += '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    html += '</button>';
    html += '</div>';
    html += '<div class="wc-sheet__body">' + (p.body || '') + '</div>';
    html += '</div>';
    return html;
  }

  /* ---- Sheet open/close helpers ---- */
  function openSheet(id) {
    var sheet = document.getElementById(id);
    var overlay = document.querySelector('[data-sheet="' + id + '"]');
    if (sheet) sheet.classList.add('open');
    if (overlay) overlay.classList.add('open');
  }

  function closeSheet(id) {
    var sheet = document.getElementById(id);
    var overlay = document.querySelector('[data-sheet="' + id + '"]');
    if (sheet) sheet.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  /* ---- Delegated close listener for sheets ---- */
  document.addEventListener('click', function (e) {
    var closeBtn = e.target.closest('[data-close-sheet]');
    if (closeBtn) {
      closeSheet(closeBtn.getAttribute('data-close-sheet'));
      return;
    }
    var overlay = e.target.closest('.wc-sheet-overlay');
    if (overlay && overlay.classList.contains('open')) {
      var sheetId = overlay.getAttribute('data-sheet');
      if (sheetId) closeSheet(sheetId);
    }
  });

  /* ---- Public API ---- */
  return {
    Button: Button,
    Input: Input,
    Card: Card,
    ShowItem: ShowItem,
    StatsBar: StatsBar,
    Avatar: Avatar,
    Tag: Tag,
    Tabs: Tabs,
    SectionHeader: SectionHeader,
    EmptyState: EmptyState,
    Badge: Badge,
    Spinner: Spinner,
    Swatches: Swatches,
    Sheet: Sheet,
    openSheet: openSheet,
    closeSheet: closeSheet
  };
})();
