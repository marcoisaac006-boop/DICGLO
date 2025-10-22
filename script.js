// script.js (completo)
// 2025 - Versión final solicitada por el usuario
document.addEventListener('DOMContentLoaded', () => {

  // --- Referencias DOM ---
  const creditsBtn = document.getElementById('creditsBtn');
  const backBtn = document.getElementById('backBtn');
  const mainContent = document.getElementById('mainContent');
  const creditsSection = document.getElementById('creditsSection');
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  const closeBtns = document.querySelectorAll('.close-btn');
  const backToTop = document.getElementById('backToTop');

  // --- FUNCIONES AUXILIARES ---

  // Normaliza y transforma "APELLIDO, NOMBRES" -> "Nombres Apellido"
  function formatName(raw) {
    if (!raw) return '';
    const parts = raw.split(',').map(p => p.trim());
    if (parts.length === 1) {
      // no tiene coma, solo capitalizamos palabras
      return titleCase(parts[0]);
    }
    const surname = parts[0];
    const given = parts.slice(1).join(' ');
    return `${titleCase(given)} ${titleCase(surname)}`.replace(/\s+/g, ' ').trim();
  }

  // Convierte "JUAN PÉREZ" -> "Juan Pérez" manteniendo acentos
  function titleCase(str) {
    return str
      .toLowerCase()
      .split(/\s+/)
      .map(w => w ? w[0].toUpperCase() + w.slice(1) : '')
      .join(' ');
  }

  // Extrae la "clave de orden" (apellido, la parte antes de la coma si existe)
  function surnameSortKey(raw) {
    if (!raw) return '';
    const beforeComma = raw.split(',')[0].trim();
    // usamos toLowerCase para estabilidad, pero la comparación final usa localeCompare
    return beforeComma;
  }

  // Fade-in simple (inline styles, no CSS adicional necesario)
  function fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;
    // For layout / accessibility: ensure it's visible (not display:none)
    if (getComputedStyle(element).display === 'none') element.style.display = 'block';
    // small timeout to trigger transition
    requestAnimationFrame(() => {
      element.style.opacity = '1';
    });
  }

  // --- Acordeón (comportamiento exclusivo - cierra otros cuando abres uno) ---
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      const content = item.querySelector('.accordion-content');
      const icon = header.querySelector('.icon');

      const isOpen = content.style.display === 'block';

      // Cerrar todos
      document.querySelectorAll('.accordion-item').forEach(ai => {
        const c = ai.querySelector('.accordion-content');
        const h = ai.querySelector('.accordion-header');
        const i = h ? h.querySelector('.icon') : null;
        if (c && c !== content) {
          c.style.display = 'none';
          if (i) i.textContent = '+';
        }
      });

      if (isOpen) {
        content.style.display = 'none';
        if (icon) icon.textContent = '+';
      } else {
        content.style.display = 'block';
        if (icon) icon.textContent = '−';
        // asegurar que el botón Cerrar interno funcione (por si fue re-renderizado)
        const internalClose = content.querySelectorAll('.close-btn');
        internalClose.forEach(btn => {
          if (!btn._closeBound) {
            btn.addEventListener('click', () => {
              content.style.display = 'none';
              if (icon) icon.textContent = '+';
            });
            btn._closeBound = true;
          }
        });
      }
    });
  });

  // --- Botones "Cerrar" dentro de contenidos (por seguridad) ---
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.parentElement;
      if (!content) return;
      const header = content.previousElementSibling;
      const icon = header ? header.querySelector('.icon') : null;
      content.style.display = 'none';
      if (icon) icon.textContent = '+';
    });
  });

  // --- Mostrar / ocultar sección créditos (manteniendo main oculto) ---
  creditsBtn.addEventListener('click', () => {
    // ocultar main y mostrar credits
    if (!creditsSection) return;
    mainContent.classList.add('hidden');
    creditsSection.classList.remove('hidden');
    creditsSection.setAttribute('aria-hidden', 'false');
    creditsBtn.setAttribute('aria-expanded', 'true');

    // desplazar y animar
    creditsSection.scrollIntoView({ behavior: 'smooth' });
    fadeIn(creditsSection, 250);
  });

  backBtn.addEventListener('click', () => {
    creditsSection.classList.add('hidden');
    creditsSection.setAttribute('aria-hidden', 'true');
    creditsBtn.setAttribute('aria-expanded', 'false');
    mainContent.classList.remove('hidden');
    mainContent.scrollIntoView({ behavior: 'smooth' });
  });

  // --- Volver arriba (botón) ---
  window.addEventListener('scroll', () => {
    if (!backToTop) return;
    if (window.scrollY > 200) {
      backToTop.style.display = 'block';
    } else {
      backToTop.style.display = 'none';
    }
  });

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // -------------------------------
  // Créditos dinámicos - los nombres que me diste (limpieza, dedupe, orden)
  // -------------------------------

  // Lista original (tal como en tu HTML / mensaje previo)
  const rawCredits = [
    "PAREDES TENAZOA, DANNY STEPHANIE",
    "ARÉVALO PIÑA, MAYLALIN",
    "SAAVEDRA GÓMEZ, FLOR DAYAN",
    "CRUZ SÁNCHEZ, JACKNER JAIR",
    "PINCHI PAREDES, MARCO ISAAC",
    "SAAVEDRA GÓMEZ, FLOR DAYAN" // duplicado intencional en el origen
  ];

  // 1) Normalizar entrada (trim) y eliminar duplicados (ignora mayúsculas/acentos para detectar duplicados)
  const seen = new Map();
  rawCredits.forEach(r => {
    const key = r.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!seen.has(key)) seen.set(key, r.trim());
  });
  const uniqueRaw = Array.from(seen.values());

  // 2) Ordenar por apellido (parte antes de la coma). Usamos localeCompare en español y sensibilidad base (ignora acentos)
  uniqueRaw.sort((a, b) => {
    return surnameSortKey(a).localeCompare(surnameSortKey(b), 'es', { sensitivity: 'base' });
  });

  // 3) Renderizar en creditsSection
  function renderCreditsList(listOfRaw) {
    // limpiar cualquier contenido previo (por si)
    // mantén intactos otros nodos (ej. image), pero remover antiguas listas dinámicas
    const existing = creditsSection.querySelector('.credits-list-dynamic');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.className = 'credits-list-dynamic';
    container.style.display = 'block';
    container.style.padding = '8px 12px';

    listOfRaw.forEach(rawName => {
      const displayName = formatName(rawName); // "Nombres Apellidos"
      const wrapper = document.createElement('div');
      wrapper.className = 'credit-row';
      wrapper.style.margin = '6px 0';
      // construimos un pequeño bloque accesible
      wrapper.innerHTML = `
        <h3 style="margin:0;font-size:1rem;font-weight:700">${displayName}</h3>
      `;
      container.appendChild(wrapper);
    });

    // Inserta antes del botón "Volver" si existe, si no, al final
    // Para seguridad: no duplicar imagen u otros elementos
    const insertBeforeNode = backBtn || null;
    if (insertBeforeNode && insertBeforeNode.parentElement === creditsSection) {
      creditsSection.insertBefore(container, insertBeforeNode);
    } else {
      creditsSection.appendChild(container);
    }

    // animación de aparición
    fadeIn(container, 220);
  }

  // Llamada inicial para preparar la lista (no la muestra/oculta; la sección sigue controlada por tus botones)
  renderCreditsList(uniqueRaw);

  // ---- FIN de script principal ----
});
