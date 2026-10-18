/* ============================================================
   VíaDomótica — persistent header navigation
   Header/footer stay mounted; only #pageContent is replaced.
   ============================================================ */

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

(function () {
    'use strict';

    var VALID_PAGES = ['index.html', 'servicios.html', 'proyectos.html', 'contacto.html'];
    var currentPage = getPageFromLocation();
    var projectModal = null;

    function basename(pathname) {
        var parts = pathname.split('/');
        return parts[parts.length - 1] || 'index.html';
    }

    function getPageFromLocation() {
        if (location.protocol === 'file:' && location.hash) {
            var hashPage = location.hash.replace(/^#/, '');
            if (VALID_PAGES.indexOf(hashPage) !== -1) return hashPage;
        }

        var file = basename(location.pathname);
        return VALID_PAGES.indexOf(file) !== -1 ? file : 'index.html';
    }

    function getPageFromHref(href) {
        try {
            var url = new URL(href, location.href);
            if (url.origin !== location.origin && location.protocol !== 'file:') return null;
            var file = basename(url.pathname);
            return VALID_PAGES.indexOf(file) !== -1 ? file : null;
        } catch (e) {
            return null;
        }
    }

    function updateActiveNav(page) {
        document.querySelectorAll('.nav-menu a[href]').forEach(function (link) {
            var linkPage = getPageFromHref(link.getAttribute('href'));
            link.classList.toggle('active', linkPage === page);
        });
    }

    function updateHead(page) {
        var data = window.VIA_PAGES && window.VIA_PAGES[page];
        if (!data) return;

        if (data.title) document.title = data.title;

        var desc = document.querySelector('meta[name="description"]');
        if (desc && data.description) desc.setAttribute('content', data.description);

        var canonical = document.querySelector('link[rel="canonical"]');
        if (canonical && data.canonical) canonical.setAttribute('href', data.canonical);

        var ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl && data.canonical) ogUrl.setAttribute('content', data.canonical);

        var ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && data.title) ogTitle.setAttribute('content', data.title);

        var ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && data.description) ogDesc.setAttribute('content', data.description);
    }

    function closeMobileMenu() {
        var menu = document.getElementById('navMenu');
        var toggle = document.getElementById('menuToggle');
        if (menu) menu.classList.remove('active');
        if (toggle) toggle.classList.remove('open');
    }

    function closeProjectModal(immediate) {
        if (!projectModal) return;

        var modal = projectModal;
        projectModal = null;
        modal.classList.remove('is-visible');

        function removeModal() {
            if (modal.parentNode) modal.remove();
            document.body.classList.remove('project-modal-open');
        }

        if (immediate) {
            removeModal();
        } else {
            setTimeout(removeModal, 400);
        }
    }

    function initProjectCards() {
        document.querySelectorAll('#pageContent .project-card').forEach(function (card) {
            if (card.dataset.projectBound === '1') return;
            card.dataset.projectBound = '1';
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');

            function openCard() {
                closeProjectModal(true);

                projectModal = document.createElement('div');
                projectModal.className = 'project-card-modal';
                projectModal.setAttribute('role', 'dialog');
                projectModal.setAttribute('aria-modal', 'true');

                var expandedCard = card.cloneNode(true);
                expandedCard.classList.remove('fade-in', 'visible');
                expandedCard.classList.add('project-card-modal-card');
                expandedCard.removeAttribute('tabindex');
                expandedCard.removeAttribute('role');

                var closeButton = document.createElement('button');
                closeButton.className = 'project-card-modal-close';
                closeButton.type = 'button';
                closeButton.setAttribute('aria-label', 'Close');
                closeButton.innerHTML = '&times;';

                expandedCard.appendChild(closeButton);
                projectModal.appendChild(expandedCard);
                document.body.appendChild(projectModal);
                document.body.classList.add('project-modal-open');

                function fitProjectCardToViewport() {
                    expandedCard.style.transform = 'none';

                    var availableWidth = window.innerWidth - 48;
                    var availableHeight = window.innerHeight - 48;
                    var rect = expandedCard.getBoundingClientRect();

                    var scale = Math.min(
                        1,
                        availableWidth / rect.width,
                        availableHeight / rect.height
                    );

                    expandedCard.style.transform = 'scale(' + scale + ')';
                }

                requestAnimationFrame(function () {
                    fitProjectCardToViewport();
                    requestAnimationFrame(function () {
                        if (projectModal) projectModal.classList.add('is-visible');
                    });
                });

                closeButton.addEventListener('click', function (event) {
                    event.stopPropagation();
                    closeProjectModal(false);
                });

                var modalImage = expandedCard.querySelector('.project-img');
                if (modalImage) {
                    modalImage.style.cursor = 'pointer';
                    modalImage.addEventListener('click', function (event) {
                        event.stopPropagation();
                        closeProjectModal(false);
                    });
                }

                projectModal.addEventListener('click', function (event) {
                    if (event.target === projectModal) closeProjectModal(false);
                });

                closeButton.focus();
            }

            card.addEventListener('click', openCard);
            card.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openCard();
                }
            });
        });
    }

    function initHomeServiceCards() {
        document.querySelectorAll('#pageContent .service-card').forEach(function (card) {
            if (card.dataset.serviceBound === '1') return;

            var link = card.querySelector('.service-link');
            if (!link) return;

            card.dataset.serviceBound = '1';
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'link');

            card.addEventListener('click', function (event) {
                if (event.target.closest('a, button, input, select, textarea')) return;

                var page = getPageFromHref(link.href);
                if (page) {
                    event.preventDefault();
                    navigateTo(page, true);
                }
            });

            card.addEventListener('keydown', function (event) {
                if (event.key !== 'Enter' && event.key !== ' ') return;

                var page = getPageFromHref(link.href);
                if (page) {
                    event.preventDefault();
                    navigateTo(page, true);
                }
            });
        });
    }

    function initContactForm() {
        var form = document.getElementById('contactForm');
        if (!form || form.dataset.contactBound === '1') return;
        form.dataset.contactBound = '1';

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var n = document.getElementById('cf-name').value.trim();
            var p = document.getElementById('cf-phone').value.trim();
            var typeSelect = document.getElementById('cf-type');
            var t = typeSelect.options[typeSelect.selectedIndex].textContent.trim();
            var m = document.getElementById('cf-msg').value.trim();
            var lang = window.currentLang || 'es';

            var texts = {
                es: '¡Hola VíaDomótica! Soy ' + (n || '—') + (p ? '\nTeléfono: ' + p : '') + '\nServicio: ' + t + (m ? '\nMensaje: ' + m : ''),
                en: 'Hello VíaDomótica! My name is ' + (n || '—') + (p ? '\nPhone: ' + p : '') + '\nService: ' + t + (m ? '\nMessage: ' + m : ''),
                ru: 'Здравствуйте, VíaDomótica! Меня зовут ' + (n || '—') + (p ? '\nТелефон: ' + p : '') + '\nУслуга: ' + t + (m ? '\nСообщение: ' + m : '')
            };

            window.open(
                'https://wa.me/34624345153?text=' + encodeURIComponent(texts[lang] || texts.es),
                '_blank'
            );
        });
    }

    function initDynamicContent() {
        document.querySelectorAll('#pageContent .fade-in').forEach(function (el) {
            el.classList.add('visible');
        });

        initProjectCards();
        initHomeServiceCards();
        initContactForm();
    }

    function renderPage(page) {
        if (!window.VIA_PAGES || !window.VIA_PAGES[page]) return false;

        var content = document.getElementById('pageContent');
        if (!content) return false;

        closeProjectModal(true);
        content.innerHTML = window.VIA_PAGES[page].html;
        currentPage = page;

        updateHead(page);
        updateActiveNav(page);
        closeMobileMenu();

        if (typeof window.setLanguage === 'function') {
            window.setLanguage(window.currentLang || 'es');
        }

        initDynamicContent();
        window.scrollTo(0, 0);
        updateScrollUi();

        return true;
    }

    function navigateTo(page, addHistory) {
        if (VALID_PAGES.indexOf(page) === -1) return;

        if (page === currentPage) {
            window.scrollTo(0, 0);
            closeMobileMenu();
            return;
        }

        if (!renderPage(page)) {
            location.href = page;
            return;
        }

        if (addHistory) {
            try {
                if (location.protocol === 'file:') {
                    history.pushState({ viaPage: page }, '', '#' + page);
                } else {
                    history.pushState({ viaPage: page }, '', page);
                }
            } catch (e) {
                // The page has already been changed; URL update is non-critical locally.
            }
        }
    }

    /* ---------- Persistent mobile menu ---------- */
    var toggle = document.getElementById('menuToggle');
    var menu = document.getElementById('navMenu');

    if (toggle && menu) {
        toggle.addEventListener('click', function () {
            menu.classList.toggle('active');
            toggle.classList.toggle('open');
        });
    }

    /* ---------- Persistent header / back-to-top ---------- */
    var navbar = document.getElementById('navbar');
    var backToTop = document.getElementById('backToTop');
    var scrollFramePending = false;

    function updateScrollUi() {
        var y = window.scrollY;
        if (navbar) navbar.classList.toggle('scrolled', y > 40);
        if (backToTop) backToTop.classList.toggle('visible', y > 500);
        scrollFramePending = false;
    }

    window.addEventListener('scroll', function () {
        if (scrollFramePending) return;
        scrollFramePending = true;
        requestAnimationFrame(updateScrollUi);
    }, { passive: true });

    if (backToTop) {
        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ---------- All internal page links use content swap ---------- */
    document.addEventListener('click', function (event) {
        if (event.defaultPrevented) return;
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        var link = event.target.closest('a[href]');
        if (!link) return;
        if (link.target === '_blank' || link.hasAttribute('download')) return;

        var page = getPageFromHref(link.getAttribute('href'));
        if (!page) return;

        event.preventDefault();
        navigateTo(page, true);
    });

    window.addEventListener('popstate', function (event) {
        var page = event.state && event.state.viaPage
            ? event.state.viaPage
            : getPageFromLocation();

        if (VALID_PAGES.indexOf(page) !== -1) {
            renderPage(page);
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeProjectModal(false);
    });

    /* Initial page */
    updateActiveNav(currentPage);
    initDynamicContent();
    updateScrollUi();

    try {
        history.replaceState({ viaPage: currentPage }, '', location.href);
    } catch (e) {}
})();
