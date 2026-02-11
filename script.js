document.addEventListener('DOMContentLoaded', () => {
    // Select elements (handle potential nulls since these classes might not exist on all pages)
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.getElementById('mobileMenu');

    // Only proceed if mobile elements exist
    if (mobileToggle && mobileMenu) {

        // Populate mobile menu with links from desktop nav, if empty
        const desktopLinks = document.querySelector('.nav-links:not(.mobile-menu)');
        if (desktopLinks && mobileMenu.children.length === 0) {
            mobileMenu.innerHTML = desktopLinks.innerHTML;
        }

        // Toggle functionality
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');

            // Optional: Toggle icon
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                if (mobileMenu.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }

    // Ticker animation clone (if ticker exists)
    const tickerWrap = document.querySelector('.ticker-wrap .container');
    if (tickerWrap) {
        const clone = tickerWrap.cloneNode(true);
        tickerWrap.parentElement.appendChild(clone);

        // Add basic infinite scroll logic via CSS animation in JS for simplicity or rely on CSS
        // For this "Gen Z" vibe, let's add a quicker, smoother marquee style via CSS injection
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-100%); }
            }
            .ticker-wrap { display: flex; gap: 4rem; width: 100%; max-width: 100%; overflow: hidden; }
            .ticker-wrap > div { flex-shrink: 0; animation: marquee 20s linear infinite; padding-right: 4rem; }
        `;
        document.head.appendChild(style);
    }

    // Scroll Reveal Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-zoom, .process-card, .card').forEach(el => {
        // Add default reveal class if none present
        if (!el.classList.contains('reveal') && !el.classList.contains('reveal-left') && !el.classList.contains('reveal-right') && !el.classList.contains('reveal-zoom')) {
            el.classList.add('reveal');
        }
        observer.observe(el);
    });
});
