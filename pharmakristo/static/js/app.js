// pharmakristo/static/js/app.js — shared client-side helpers for Flask templates

// Flash message auto-dismiss
document.querySelectorAll('.pk-flash').forEach(el => {
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .5s'; setTimeout(() => el.remove(), 500); }, 3000);
});
