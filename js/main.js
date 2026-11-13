// PHLV Placas Solares Huelva — main.js

document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  var navToggle = document.querySelector('.nav-toggle');
  var mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // FAQ accordion
  document.querySelectorAll('.accordion-trigger').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var expanded = btn.getAttribute('aria-expanded') === 'true';

      document.querySelectorAll('.accordion-trigger').forEach(function (other) {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          var otherPanel = document.getElementById(other.getAttribute('aria-controls'));
          if (otherPanel) otherPanel.style.maxHeight = null;
        }
      });

      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      if (panel) panel.style.maxHeight = expanded ? null : panel.scrollHeight + 'px';
    });
  });

  // Form validation + AJAX submit (Formspree)
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    var statusEl = document.getElementById(form.getAttribute('data-status-target'));

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var required = form.querySelectorAll('[required]');
      var missingFields = 0;
      var missingCheckbox = 0;
      var firstInvalid = null;
      required.forEach(function (field) {
        var isToggle = field.type === 'checkbox' || field.type === 'radio';
        var empty = isToggle ? !field.checked : !field.value.trim();
        var container = field.closest('.form-check');
        if (empty) {
          if (!firstInvalid) firstInvalid = field;
          if (isToggle) {
            missingCheckbox++;
            field.style.outline = '2px solid #c0392b';
            field.style.outlineOffset = '2px';
            if (container) container.style.color = '#c0392b';
          } else {
            missingFields++;
            field.style.borderColor = '#c0392b';
          }
        } else {
          field.style.borderColor = '';
          field.style.outline = '';
          field.style.outlineOffset = '';
          if (container) container.style.color = '';
        }
      });
      if (missingFields || missingCheckbox) {
        if (statusEl) {
          if (missingCheckbox && !missingFields) {
            statusEl.textContent = 'Debes aceptar la política de privacidad para enviar la solicitud.';
          } else if (missingCheckbox) {
            statusEl.textContent = 'Revisa los campos marcados en rojo y acepta la política de privacidad.';
          } else {
            statusEl.textContent = 'Revisa los campos marcados en rojo.';
          }
          statusEl.className = 'form-status form-status-error';
          statusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (firstInvalid) {
          try { firstInvalid.focus({ preventScroll: true }); } catch (e) { firstInvalid.focus(); }
        }
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'form-status';
      }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          response.json().then(function (data) {
            if (response.ok) {
              form.reset();
              if (statusEl) {
                statusEl.textContent = 'Solicitud enviada. Te responderemos en menos de 24h laborables.';
                statusEl.className = 'form-status form-status-success';
              }
            } else {
              var detail = (data && data.errors && data.errors.length)
                ? data.errors.map(function (er) { return er.message; }).join(' ')
                : (data && data.error) || ('HTTP ' + response.status);
              console.error('Formspree error:', detail, data);
              if (statusEl) {
                statusEl.textContent = 'No se ha podido enviar (' + detail + '). Prueba de nuevo o escríbenos por WhatsApp.';
                statusEl.className = 'form-status form-status-error';
              }
            }
          }).catch(function () {
            if (statusEl) {
              statusEl.textContent = response.ok
                ? 'Solicitud enviada. Te responderemos en menos de 24h laborables.'
                : 'No se ha podido enviar (HTTP ' + response.status + '). Prueba de nuevo o escríbenos por WhatsApp.';
              statusEl.className = 'form-status ' + (response.ok ? 'form-status-success' : 'form-status-error');
            }
            if (response.ok) form.reset();
          });
        })
        .catch(function (err) {
          console.error('Formspree fetch failed:', err);
          if (statusEl) {
            statusEl.textContent = 'No se ha podido conectar con el servidor. Prueba de nuevo o escríbenos por WhatsApp.';
            statusEl.className = 'form-status form-status-error';
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }
        });
    });
  });

  // WhatsApp widget
  var waFab = document.getElementById('wa-fab');
  var waPanel = document.getElementById('wa-panel');
  var waClose = document.getElementById('wa-panel-close');
  var waForm = document.getElementById('wa-form');

  function waToggle(open) {
    if (!waPanel || !waFab) return;
    if (open) {
      waPanel.removeAttribute('hidden');
      waFab.setAttribute('aria-expanded', 'true');
    } else {
      waPanel.setAttribute('hidden', '');
      waFab.setAttribute('aria-expanded', 'false');
    }
  }

  if (waFab) {
    waFab.addEventListener('click', function () {
      waToggle(waPanel.hasAttribute('hidden'));
    });
  }
  if (waClose) {
    waClose.addEventListener('click', function () { waToggle(false); });
  }
  if (waForm) {
    waForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = waForm.nombre.value.trim();
      var necesita = waForm.necesita.value;
      var zona = waForm.zona.value.trim();
      var mensaje = waForm.mensaje.value.trim();
      if (!nombre || !necesita) return;

      var lines = ['Hola, soy ' + nombre + '.', 'Necesito: ' + necesita + '.'];
      if (zona) lines.push('Zona: ' + zona + '.');
      if (mensaje) lines.push(mensaje);

      var text = encodeURIComponent(lines.join(' '));
      window.open('https://wa.me/34711579185?text=' + text, '_blank', 'noopener');
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href');
      if (targetId.length > 1) {
        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
});
