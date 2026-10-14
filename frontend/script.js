const API_URL = 'https://rishit-2008--image-generator-model-generate.modal.run';
const API_KEY = 'ak-QJrbfT0G2V2h3sfS627aRm';

const promptInput = document.getElementById('prompt');
const generateButton = document.getElementById('generate');
const loadingDiv = document.getElementById('loading');
const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxPrompt = document.getElementById('lightbox-prompt');


window.addEventListener('load', () => {
    const saved = JSON.parse(localStorage.getItem('imageGallery')) || [];
    saved.forEach(({ base64, prompt, duration }) => {
        addImageToGallery(base64, prompt, duration, false);
    });
});

generateButton.addEventListener('click', generateImage);

promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') generateImage();
});

async function generateImage() {
    const userPrompt = promptInput.value.trim();
    if (!userPrompt) {
        showToast('Please enter a prompt', 'error');
        return;
    }

    generateButton.disabled = true;
    loadingDiv.style.display = 'block';

    const startTime = Date.now();

    try {
        const response = await fetch(
            API_URL + '?prompt=' + encodeURIComponent(userPrompt) + '&api_key=' + encodeURIComponent(API_KEY)
        );
        if (!response.ok) {
            const e = await response.json().catch(() => ({}));
            throw new Error(e.error || 'Server error: ' + response.status);
        }

        const data = await response.json();
        if (!data.image) throw new Error('No image returned');

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        addImageToGallery(data.image, userPrompt, duration);
        promptInput.value = '';
        showToast(`Generated in ${duration}s`, 'success');
    } catch (err) {
        showToast(err.message || 'Failed to generate image. Please try again.', 'error');
        console.error('Error:', err);
    } finally {
        generateButton.disabled = false;
        loadingDiv.style.display = 'none';
    }
}

function addImageToGallery(imageData, promptText, duration, save = true) {
    const container = document.createElement('div');
    container.className = 'image-container';

    const img = document.createElement('img');
    img.src = imageData;
    img.alt = promptText;
    img.className = 'generated-image';
    img.addEventListener('click', () => openLightbox(imageData, promptText));

    const p = document.createElement('p');
    p.className = 'prompt-text';
    p.textContent = promptText;

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    if (duration) {
        const timer = document.createElement('span');
        timer.className = 'timer-badge';
        timer.textContent = duration + 's';
        actions.appendChild(timer);
    }

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'action-btn download-btn';
    downloadBtn.title = 'Download';
    downloadBtn.innerHTML = '&#8595;';
    downloadBtn.addEventListener('click', () => downloadImage(imageData, promptText));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.title = 'Delete';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', () => {
        container.remove();
        deleteImageFromStorage(imageData);
    });

    actions.appendChild(downloadBtn);
    actions.appendChild(deleteBtn);

    container.appendChild(img);
    container.appendChild(p);
    container.appendChild(actions);
    gallery.insertBefore(container, gallery.firstChild);

    if (save) saveImageToStorage(imageData, promptText, duration);
}

function openLightbox(imageData, promptText) {
    lightboxImg.src = imageData;
    lightboxPrompt.textContent = promptText;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    document.getElementById('lightbox-download').onclick = () => downloadImage(imageData, promptText);
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
});

document.getElementById('lightbox-close').addEventListener('click', closeLightbox);


function downloadImage(imageData, promptText) {
    const filename = promptText.slice(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.jpg';
    const a = document.createElement('a');
    a.href = imageData;
    a.download = filename;
    a.click();
}


function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.getElementById('toast-container').appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}

function saveImageToStorage(imageData, promptText, duration) {
    const saved = JSON.parse(localStorage.getItem('imageGallery')) || [];
    saved.push({ base64: imageData, prompt: promptText, duration });
    localStorage.setItem('imageGallery', JSON.stringify(saved));
}

function deleteImageFromStorage(imageData) {
    const saved = JSON.parse(localStorage.getItem('imageGallery')) || [];
    const updated = saved.filter(item => item.base64 !== imageData);
    localStorage.setItem('imageGallery', JSON.stringify(updated));
}
