const USERNAME = 'LumiKitten';
const API_URL = `https://api.github.com/users/${USERNAME}/repos?per_page=100`;

const LANGUAGE_COLORS = {
    JavaScript: '#f0db4f',
    TypeScript: '#3178c6',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Python: '#3572A5',
    PowerShell: '#012456',
    default: '#d4a5a5'
};

function humanizeRepoName(name) {
    return name
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 }
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
        }
    }
    return 'just now';
}

function getPagesUrl(repo) {
    if (repo.name === `${USERNAME.toLowerCase()}.github.io`) {
        return `https://${USERNAME.toLowerCase()}.github.io/`;
    }
    return `https://${USERNAME.toLowerCase()}.github.io/${repo.name}/`;
}

const REPO_BRAND_COLORS = {
    'mysite': '#2e1065',
    'fetchquesttracker': '#0c0e0d',
    'swedishprivacyaudit': '#1a1410'
};

function createCard(repo) {
    const url = getPagesUrl(repo);
    const langColor = LANGUAGE_COLORS[repo.language] || LANGUAGE_COLORS.default;
    const brandColor = REPO_BRAND_COLORS[repo.name];

    const card = document.createElement('a');
    card.href = url;
    card.target = '_blank';
    card.rel = 'noopener';
    card.className = 'card';
    
    if (brandColor) {
        card.style.backgroundColor = brandColor;
        card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    }

    card.innerHTML = `
        <div class="card__header">
            <h3 class="card__title">${humanizeRepoName(repo.name)}</h3>
            <svg class="card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7V17"/>
            </svg>
        </div>
        ${repo.description ? `<p class="card__desc">${repo.description}</p>` : '<p class="card__desc" style="opacity: 0.5;">No description</p>'}
        <div class="card__meta">
            ${repo.language ? `
                <span class="card__lang">
                    <span class="card__lang-dot" style="background: ${langColor}"></span>
                    ${repo.language}
                </span>
            ` : ''}
            <span class="card__date">Updated ${timeAgo(repo.updated_at)}</span>
        </div>
    `;

    return card;
}

async function loadProjects() {
    const grid = document.getElementById('projects-grid');

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch');

        const repos = await response.json();

        const pagesRepos = repos
            .filter(repo => repo.has_pages && !repo.archived && repo.name !== 'gitpagehub')
            .sort((a, b) => {
                const PRIORITY = ['mysite', 'fetchquesttracker', 'swedishprivacyaudit'];
                const aIndex = PRIORITY.indexOf(a.name);
                const bIndex = PRIORITY.indexOf(b.name);

                // Check for hardcoded priority first
                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;

                // Then prioritize 'featured' topic
                const aFeatured = a.topics?.includes('featured') || false;
                const bFeatured = b.topics?.includes('featured') || false;
                
                if (aFeatured && !bFeatured) return -1;
                if (!aFeatured && bFeatured) return 1;
                
                // Then sort by last updated
                return new Date(b.updated_at) - new Date(a.updated_at);
            });

        grid.innerHTML = '';

        if (pagesRepos.length === 0) {
            grid.innerHTML = '<div class="empty"><p>No projects found.</p></div>';
            return;
        }

        pagesRepos.forEach(repo => {
            grid.appendChild(createCard(repo));
        });

    } catch (error) {
        console.error('Error loading projects:', error);
        grid.innerHTML = '<div class="empty"><p>Could not load projects. Please try again later.</p></div>';
    }
}

async function makeFaviconRound() {
    const favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = favicon.href;

    try {
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.arc(32, 32, 32, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 0, 0, 64, 64);

        favicon.href = canvas.toDataURL('image/png');
    } catch (e) {
        console.error('Could not round favicon:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    makeFaviconRound();
});
