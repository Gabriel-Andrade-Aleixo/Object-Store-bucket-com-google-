(() => {
  const fileInput = document.querySelector('input[type="file"]');
  const primaryCheckbox = document.querySelector('input[name="makeFirstPrimary"]');
  const preview = document.querySelector('#image-preview');

  if (!fileInput || !preview) return;

  let objectUrls = [];

  function clearObjectUrls() {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls = [];
  }

  function updatePrimaryHighlight() {
    const firstItem = preview.querySelector('.image-preview-item');
    if (!firstItem) return;

    const isPrimary = Boolean(primaryCheckbox?.checked);
    firstItem.classList.toggle('is-primary', isPrimary);
    firstItem.querySelector('.image-preview-badge').hidden = !isPrimary;
  }

  function renderPreview() {
    clearObjectUrls();
    preview.replaceChildren();

    const files = Array.from(fileInput.files || []);
    preview.classList.toggle('has-images', files.length > 0);

    if (files.length === 0) return;

    const count = document.createElement('p');
    count.className = 'image-preview-count';
    count.textContent = `${files.length} ${files.length === 1 ? 'imagem selecionada' : 'imagens selecionadas'}`;
    preview.append(count);

    files.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      objectUrls.push(url);

      const item = document.createElement('figure');
      item.className = 'image-preview-item';

      const image = document.createElement('img');
      image.src = url;
      image.alt = `Pré-visualização de ${file.name}`;

      const fileName = document.createElement('span');
      fileName.textContent = file.name;
      fileName.title = file.name;

      item.append(image, fileName);

      if (index === 0) {
        const badge = document.createElement('span');
        badge.className = 'image-preview-badge';
        badge.textContent = 'Capa';
        badge.hidden = true;
        item.append(badge);
      }

      preview.append(item);
    });

    updatePrimaryHighlight();
  }

  fileInput.addEventListener('change', renderPreview);
  primaryCheckbox?.addEventListener('change', updatePrimaryHighlight);
  window.addEventListener('pagehide', clearObjectUrls);
})();
