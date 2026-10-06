/* ============================================================
   Jeevitha Dasari — Portfolio
   Vanilla JavaScript (no frameworks, no external libraries)
   ------------------------------------------------------------
   1. Mobile hamburger menu toggle
   2. Smooth scrolling
   3. Scroll-reveal animations (IntersectionObserver)
   4. Active navigation link while scrolling
   5. Back-to-top button
   6. Dynamic footer year
   ============================================================ */

(function () {
    'use strict';

    /* ---------- Small helpers ---------- */

    // querySelector / querySelectorAll wrappers that always return arrays
    function qs(selector, scope) {
        return (scope || document).querySelector(selector);
    }

    function qsa(selector, scope) {
        return Array.prototype.slice.call(
            (scope || document).querySelectorAll(selector)
        );
    }

    // addEventListener that no-ops when the element is missing
    function on(element, event, handler, options) {
        if (element) {
            element.addEventListener(event, handler, options || false);
        }
    }

    // Respect the OS "reduce motion" setting
    var prefersReducedMotion = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    // Read the sticky nav height from CSS, fall back to 70px
    var navHeight = (function () {
        var raw = getComputedStyle(document.documentElement)
            .getPropertyValue('--nav-height');
        var parsed = parseInt(raw, 10);
        return isNaN(parsed) ? 70 : parsed;
    })();

    /* ---------- Cached elements (all optional) ---------- */

    var navbar = qs('#navbar');
    var navMenu = qs('#navMenu');
    var hamburger = qs('#hamburger');
    var backToTop = qs('#backToTop');
    var footerYear = qs('#footerYear');
    var scrollHint = qs('.scroll-indicator');
    var navLinks = qsa('.nav-link');
    var revealItems = qsa('.reveal');
    var sections = qsa('section[id]');

    /* ============================================================
       6. Dynamic footer year
       ============================================================ */
    (function setFooterYear() {
        if (!footerYear) return;
        footerYear.textContent = String(new Date().getFullYear());
    })();

    /* ============================================================
       1. Mobile hamburger menu toggle
       ============================================================ */
    var menuIsOpen = false;

    function setMenuState(open) {
        menuIsOpen = open;

        if (navMenu) navMenu.classList.toggle('active', open);
        if (hamburger) {
            hamburger.classList.toggle('active', open);
            hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        }

        // Stop the page from scrolling behind an open mobile menu
        document.body.style.overflow = open && isMobile() ? 'hidden' : '';
    }

    function isMobile() {
        return window.innerWidth <= 768;
    }

    on(hamburger, 'click', function () {
        setMenuState(!menuIsOpen);
    });

    // Close the menu after choosing a destination
    qsa('.nav-link').forEach(function (link) {
        on(link, 'click', function () {
            if (menuIsOpen) setMenuState(false);
        });
    });

    // Escape closes the menu
    on(document, 'keydown', function (event) {
        if (event.key === 'Escape' && menuIsOpen) {
            setMenuState(false);
            if (hamburger) hamburger.focus();
        }
    });

    // Clicking outside the open menu closes it
    on(document, 'click', function (event) {
        if (!menuIsOpen) return;
        var clickedInsideMenu =
            (navMenu && navMenu.contains(event.target)) ||
            (hamburger && hamburger.contains(event.target));
        if (!clickedInsideMenu) setMenuState(false);
    });

    // Reset state when resizing up to the desktop layout
    on(window, 'resize', function () {
        if (!isMobile() && menuIsOpen) setMenuState(false);
    });

    /* ============================================================
       2. Smooth scrolling
       ============================================================ */
    function scrollToTarget(target) {
        if (!target) return;

        var startY = window.pageYOffset;
        var targetY = target.getBoundingClientRect().top + startY - navHeight;

        // Clamp to the top/bottom of the document
        var maxY = document.documentElement.scrollHeight - window.innerHeight;
        targetY = Math.max(0, Math.min(targetY, maxY));

        var distance = targetY - startY;

        if (prefersReducedMotion || Math.abs(distance) < 2) {
            window.scrollTo(0, targetY);
            return;
        }

        var duration = Math.min(Math.abs(distance) * 0.5, 900);
        var startTime = null;

        function step(timestamp) {
            if (startTime === null) startTime = timestamp;

            var elapsed = timestamp - startTime;
            var progress = Math.min(elapsed / duration, 1);

            // easeInOutCubic
            var eased =
                progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            window.scrollTo(0, startY + distance * eased);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }

        window.requestAnimationFrame(step);
    }

    // Intercept in-page anchor clicks for consistent offset behaviour
    document.addEventListener('click', function (event) {
        var anchor = event.target.closest
            ? event.target.closest('a[href^="#"]')
            : null;

        if (!anchor) return;

        var hash = anchor.getAttribute('href');
        if (!hash || hash === '#') return;

        var id = hash.slice(1);
        var target = document.getElementById(id);
        if (!target) return;

        event.preventDefault();
        scrollToTarget(target);

        // Keep the URL in sync without triggering a jump
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', hash);
        }
    });

    /* ============================================================
       3. Scroll-reveal animations (IntersectionObserver)
       ============================================================ */
    (function initReveal() {
        if (!revealItems.length) return;

        // No IntersectionObserver support: show everything immediately
        if (!('IntersectionObserver' in window)) {
            revealItems.forEach(function (element) {
                element.classList.add('visible');
            });
            return;
        }

        // Stagger siblings so cards cascade instead of popping in together
        revealItems.forEach(function (element) {
            var siblings = element.parentElement
                ? Array.prototype.slice.call(element.parentElement.children)
                : [element];
            var index = siblings.indexOf(element);
            if (index > 0 && index < 5) {
                element.style.transitionDelay = index * 0.08 + 's';
            }
        });

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: '0px 0px -60px 0px'
            }
        );

        revealItems.forEach(function (element) {
            observer.observe(element);
        });
    })();

    /* ============================================================
       4 + 5. Scroll-driven UI: navbar state, active link,
              back-to-top visibility, scroll hint
       ============================================================ */
    function syncActiveLink() {
        // The line that decides which section is "current"
        var marker = window.pageYOffset + navHeight + 40;
        var currentId = sections.length ? sections[0].id : '';

        sections.forEach(function (section) {
            if (section.offsetTop <= marker) {
                currentId = section.id;
            }
        });

        // At the very bottom, always highlight the last section
        var atBottom =
            window.innerHeight + window.pageYOffset >=
            document.documentElement.scrollHeight - 2;

        if (atBottom && sections.length) {
            currentId = sections[sections.length - 1].id;
        }

        navLinks.forEach(function (link) {
            var isActive = link.getAttribute('data-section') === currentId;
            link.classList.toggle('active', isActive);

            if (isActive) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    // Throttle with requestAnimationFrame so scroll stays smooth
    var ticking = false;

    function onScroll() {
        var y = window.pageYOffset;

        if (navbar) {
            navbar.classList.toggle('scrolled', y > 20);
        }

        if (backToTop) {
            backToTop.classList.toggle('visible', y > 300);
        }

        if (scrollHint) {
            scrollHint.classList.toggle('hidden', y > 80);
        }

        syncActiveLink();

        ticking = false;
    }

    on(window, 'scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });

    // Run once on load so state matches the initial position
    onScroll();

    /* ---------- Back-to-top button ---------- */
    on(backToTop, 'click', function () {
        if (prefersReducedMotion) {
            window.scrollTo(0, 0);
            return;
        }

        var startY = window.pageYOffset;
        if (startY < 2) return;

        var duration = 600;
        var startTime = null;

        function step(timestamp) {
            if (startTime === null) startTime = timestamp;

            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);

            window.scrollTo(0, startY * (1 - eased));

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }

        window.requestAnimationFrame(step);
    });
})();