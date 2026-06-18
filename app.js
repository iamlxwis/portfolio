const catGrid = document.getElementById('cat-grid');
const dogGrid = document.getElementById('dog-grid');
const refreshCatsBtn = document.getElementById('refresh-cats');
const refreshDogsBtn = document.getElementById('refresh-dogs');

async function fetchCats() {
    try {
        catGrid.innerHTML = '<div class="loading-skeleton"></div><div class="loading-skeleton"></div><div class="loading-skeleton"></div>';
        const response = await fetch('https://api.thecatapi.com/v1/images/search?limit=6');
        const data = await response.json();
        catGrid.innerHTML = '';
        data.forEach(item => {
            const container = document.createElement('div');
            container.className = 'gallery-item';
            const img = document.createElement('img');
            img.src = item.url;
            img.alt = 'Cat';
            img.loading = 'lazy';
            container.appendChild(img);
            catGrid.appendChild(container);
        });
    } catch (error) {
        catGrid.innerHTML = '<p>Failed to load cat images. Please try again.</p>';
    }
}

async function fetchDogs() {
    try {
        dogGrid.innerHTML = '<div class="loading-skeleton"></div><div class="loading-skeleton"></div><div class="loading-skeleton"></div>';
        const response = await fetch('https://dog.ceo/api/breeds/image/random/6');
        const data = await response.json();
        dogGrid.innerHTML = '';
        data.message.forEach(url => {
            const container = document.createElement('div');
            container.className = 'gallery-item';
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Dog';
            img.loading = 'lazy';
            container.appendChild(img);
            dogGrid.appendChild(container);
        });
    } catch (error) {
        dogGrid.innerHTML = '<p>Failed to load dog images. Please try again.</p>';
    }
}

refreshCatsBtn.addEventListener('click', fetchCats);
refreshDogsBtn.addEventListener('click', fetchDogs);

document.addEventListener('DOMContentLoaded', () => {
    fetchCats();
    fetchDogs();
});
