// CSS & JS injection khusus per layanan untuk memperindah tampilan WebView

// ============================================================
// MyUNPAM — Modernisasi tampilan akademik
// ============================================================
const MYUNPAM_INJECT_CSS = '(' + function() {
  function applyStyles() {
    var style = document.createElement('style');
    style.textContent = `
      * { -webkit-tap-highlight-color: transparent; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        background: #f0f2f5 !important;
        color: #1a1a2e !important;
        -webkit-font-smoothing: antialiased;
      }
      nav, .navbar, [class*="navbar"], header, .header,
      [class*="sidebar"], [class*="Sidebar"] {
        background: linear-gradient(135deg, #0d47a1, #1565c0, #1976d2) !important;
        border: none !important;
        box-shadow: 0 2px 12px rgba(13,71,161,0.3) !important;
      }
      nav a, .navbar a, .nav-link, .navbar-brand {
        color: #fff !important;
        font-weight: 600 !important;
      }
      .sidebar, .side-menu, [class*="sidebar"], [class*="menu"],
      .list-group, .nav-pills, .nav-stacked {
        background: #fff !important;
        border-radius: 16px !important;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
        margin: 8px !important;
      }
      .sidebar a, .side-menu a, .list-group-item, .nav-pills a,
      .nav-stacked a, [class*="menu"] a {
        color: #1a1a2e !important;
        padding: 14px 18px !important;
        border-bottom: 1px solid #f0f0f0 !important;
        border-left: none !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
      }
      .sidebar a:hover, .list-group-item:hover, .nav-pills a:hover,
      .sidebar a.active, .list-group-item.active, .nav-pills .active a {
        background: #e3f2fd !important;
        color: #0d47a1 !important;
        border-left: 4px solid #0d47a1 !important;
        font-weight: 700 !important;
      }
      .card, .panel, .panel-default, .panel-primary, .panel-info,
      .box, [class*="card"], [class*="panel"], .well {
        background: #fff !important;
        border: none !important;
        border-radius: 16px !important;
        box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
        margin-bottom: 12px !important;
        overflow: hidden;
      }
      .card-header, .panel-heading, [class*="card-header"],
      [class*="panel-heading"] {
        background: linear-gradient(135deg, #0d47a1, #1565c0) !important;
        color: #fff !important;
        border: none !important;
        padding: 16px 20px !important;
        font-weight: 700 !important;
        font-size: 15px !important;
        border-radius: 16px 16px 0 0 !important;
      }
      .card-body, .panel-body, [class*="card-body"], [class*="panel-body"] {
        padding: 16px 20px !important;
      }
      table {
        width: 100% !important;
        border-collapse: separate !important;
        border-spacing: 0 !important;
        border: none !important;
        border-radius: 12px !important;
        overflow: hidden !important;
        box-shadow: 0 1px 6px rgba(0,0,0,0.04) !important;
      }
      thead, thead tr, thead th {
        background: linear-gradient(135deg, #0d47a1, #1565c0) !important;
        color: #fff !important;
        font-weight: 700 !important;
        font-size: 12px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        padding: 12px 14px !important;
        border: none !important;
      }
      tbody tr:nth-child(even) { background: #f8f9ff !important; }
      tbody tr:hover { background: #e3f2fd !important; }
      td, tbody th {
        padding: 12px 14px !important;
        font-size: 13px !important;
        border: none !important;
        border-bottom: 1px solid #f0f0f0 !important;
        color: #333 !important;
      }
      .btn, button[class*="btn"], input[type="submit"], a.btn {
        border-radius: 10px !important;
        padding: 10px 20px !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        border: none !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1) !important;
      }
      .btn-primary, .btn-info {
        background: linear-gradient(135deg, #0d47a1, #1976d2) !important;
        color: #fff !important;
      }
      .btn-success {
        background: linear-gradient(135deg, #1b5e20, #2e7d32) !important;
        color: #fff !important;
      }
      .btn-danger, .btn-warning {
        background: linear-gradient(135deg, #e65100, #ef6c00) !important;
        color: #fff !important;
      }
      input[type="text"], input[type="password"], input[type="email"],
      input[type="number"], select, textarea, .form-control {
        border: 2px solid #e0e0e0 !important;
        border-radius: 10px !important;
        padding: 12px 16px !important;
        font-size: 14px !important;
        background: #fff !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      input:focus, select:focus, textarea:focus, .form-control:focus {
        border-color: #0d47a1 !important;
        box-shadow: 0 0 0 3px rgba(13,71,161,0.1) !important;
        outline: none !important;
      }
      .badge, .label, [class*="badge"] {
        border-radius: 20px !important;
        padding: 4px 12px !important;
        font-weight: 600 !important;
      }
      .alert { border-radius: 12px !important; border: none !important; }
      h1,h2,h3,h4,h5,h6 { color: #1a1a2e !important; font-weight: 700 !important; }
      canvas { border-radius: 12px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important; }
      select[name*="semester"], select[id*="semester"] {
        border: 2px solid #0d47a1 !important;
        color: #0d47a1 !important;
        font-weight: 600 !important;
      }
      @media (max-width: 768px) {
        .sidebar, [class*="sidebar"] { position: relative !important; width: 100% !important; }
        .content, .main-content, [class*="content"] { margin-left: 0 !important; padding: 8px !important; }
        table { font-size: 12px !important; }
        td, th { padding: 8px 10px !important; }
      }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-thumb { background: #c0c0c0; border-radius: 4px; }
    `;
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyStyles);
  } else { applyStyles(); }
  return true;
} + ')();';

// ============================================================
// Mentari (E-Learning)
// ============================================================
const MENTARI_INJECT_CSS = '(' + function() {
  function applyStyles() {
    var style = document.createElement('style');
    style.textContent = `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        background: #f0f4f0 !important;
      }
      .card, .panel, [class*="card"], [class*="course"] {
        border-radius: 14px !important; border: none !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.06) !important;
      }
      nav, .navbar, [class*="navbar"] {
        background: linear-gradient(135deg, #1b5e20, #2e7d32) !important;
        box-shadow: 0 2px 12px rgba(27,94,32,0.3) !important;
      }
      .btn-primary {
        background: linear-gradient(135deg, #1b5e20, #388e3c) !important;
        border: none !important; border-radius: 10px !important;
      }
      table thead { background: linear-gradient(135deg, #1b5e20, #2e7d32) !important; color: #fff !important; }
      thead th { color: #fff !important; border: none !important; }
      td { border-bottom: 1px solid #e8f5e9 !important; }
      input, select, textarea, .form-control {
        border-radius: 10px !important; border: 2px solid #e0e0e0 !important;
        padding: 10px 14px !important;
      }
      input:focus, select:focus { border-color: #1b5e20 !important; }
    `;
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyStyles);
  } else { applyStyles(); }
  return true;
} + ')();';

// ============================================================
// Event
// ============================================================
const EVENT_INJECT_CSS = '(' + function() {
  function applyStyles() {
    var style = document.createElement('style');
    style.textContent = `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        background: #fff8f0 !important;
      }
      .card, [class*="card"], [class*="event"] {
        border-radius: 14px !important; border: none !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.06) !important;
      }
      nav, .navbar {
        background: linear-gradient(135deg, #e65100, #ef6c00) !important;
        box-shadow: 0 2px 12px rgba(230,81,0,0.3) !important;
      }
      nav a, .navbar a, .nav-link { color: #fff !important; }
      .btn-primary {
        background: linear-gradient(135deg, #e65100, #f57c00) !important;
        border: none !important; border-radius: 10px !important;
        color: #fff !important;
      }
    `;
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyStyles);
  } else { applyStyles(); }
  return true;
} + ')();';

// ============================================================
// LINK-SI
// ============================================================
const LINKSI_INJECT_CSS = '(' + function() {
  function applyStyles() {
    var style = document.createElement('style');
    style.textContent = `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        background: #f5f0ff !important;
      }
      .card, [class*="card"] {
        border-radius: 14px !important; border: none !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.06) !important;
      }
      nav, .navbar {
        background: linear-gradient(135deg, #6a1b9a, #7b1fa2) !important;
      }
      .btn-primary {
        background: linear-gradient(135deg, #6a1b9a, #8e24aa) !important;
        border: none !important; border-radius: 10px !important;
      }
      input, select, textarea {
        border-radius: 10px !important; border: 2px solid #e0e0e0 !important;
        padding: 10px 14px !important;
      }
      input:focus, select:focus {
        border-color: #6a1b9a !important;
        box-shadow: 0 0 0 3px rgba(106,27,154,0.1) !important;
      }
    `;
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyStyles);
  } else { applyStyles(); }
  return true;
} + ')();';

// Map service key → injection script
export const SERVICE_INJECTIONS = {
  myunpam: MYUNPAM_INJECT_CSS,
  mentari: MENTARI_INJECT_CSS,
  event: EVENT_INJECT_CSS,
  linksi: LINKSI_INJECT_CSS,
};
