function initGallery() {
  const galleryImages = [...document.querySelectorAll('.class-gallery img')];
  const photoViewer = document.getElementById('photoViewer');

  if (!photoViewer) return;

  const viewerImage = document.getElementById('photoViewerImage');
  const photoCounter = document.getElementById('photoCounter');
  const photoCaption = document.getElementById('photoCaption');
  const closeButton = document.getElementById('closePhotoViewer');
  let activeImageIndex = 0;
  let lastTrigger = null;

  const showPhoto = (index) => {
    if (!galleryImages.length) return;
    activeImageIndex = (index + galleryImages.length) % galleryImages.length;
    const image = galleryImages[activeImageIndex];
    const title = image.dataset.title || 'Foto kelas';
    const caption = image.dataset.caption || image.alt || 'Foto kelas MI.25.R1';
    viewerImage.src = image.src;
    viewerImage.alt = image.alt;
    photoCaption.textContent = `${title} — ${caption}`;
    photoCounter.textContent = `${activeImageIndex + 1} / ${galleryImages.length}`;
  };

  galleryImages.forEach((image, index) => {
    if (image.dataset.galleryBound === 'true') return;
    image.dataset.galleryBound = 'true';
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', `Buka ${image.alt}`);
    image.onclick = () => {
      lastTrigger = image;
      showPhoto(index);
      photoViewer.showModal();
      closeButton.focus();
    };
    image.onkeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        image.click();
      }
    };
  });

  document.getElementById('previousPhoto')?.addEventListener('click', () => showPhoto(activeImageIndex - 1));
  document.getElementById('nextPhoto')?.addEventListener('click', () => showPhoto(activeImageIndex + 1));
  closeButton?.addEventListener('click', () => photoViewer.close());
  photoViewer.addEventListener('click', (event) => {
    if (event.target === photoViewer) photoViewer.close();
  });
  photoViewer.addEventListener('close', () => lastTrigger?.focus());
  photoViewer.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showPhoto(activeImageIndex - 1);
    if (event.key === 'ArrowRight') showPhoto(activeImageIndex + 1);
  });
}

window.refreshGallery = initGallery;

const revealSections = document.querySelectorAll('.class-section');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealSections.forEach((section) => {
    section.classList.add('will-reveal');
    revealObserver.observe(section);
  });
} else {
  revealSections.forEach((section) => section.classList.add('is-visible'));
}

initGallery();
