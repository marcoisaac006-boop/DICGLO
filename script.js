// Función para cargar el contenido desde GitHub JSON
async function loadContent() {
  const response = await fetch('https://raw.githubusercontent.com/tu-usuario/pdf-content-repo/main/content.json');
  const contentData = await response.json();
  const contentElement = document.getElementById('content');
  contentData.forEach(section => {
    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('section');
    sectionDiv.innerHTML = `<h2>${section.title}</h2><p>${section.text.replace(/\n/g, '<br>')}</p>`; // Reemplaza saltos de línea por <br> para mantener formato
    contentElement.appendChild(sectionDiv);
  });
}

// Función de búsqueda (igual que antes)
function searchContent() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    const title = section.querySelector('h2').textContent.toLowerCase();
    const text = section.querySelector('p').textContent.toLowerCase();
    if (title.includes(query) || text.includes(query)) {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  });
}

// Cargar al iniciar
window.onload = loadContent;






