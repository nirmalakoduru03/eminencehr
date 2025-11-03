(function () {
	const select = (q, el = document) => el.querySelector(q);
	const on = (el, evt, fn) => el && el.addEventListener(evt, fn);

	// Mobile nav toggle
	const navToggle = select('.nav-toggle');
	const navList = select('.nav-list');
	on(navToggle, 'click', () => {
		const expanded = navToggle.getAttribute('aria-expanded') === 'true';
		navToggle.setAttribute('aria-expanded', String(!expanded));
		navList.classList.toggle('open');
	});

	// Smooth scroll for same-page links
	document.querySelectorAll('a[href^="#"]')
		.forEach(link => {
			on(link, 'click', (e) => {
				const targetId = link.getAttribute('href');
				if (!targetId || targetId.length < 2) return;
				const target = document.getElementById(targetId.slice(1));
				if (target) {
					e.preventDefault();
					target.scrollIntoView({ behavior: 'smooth', block: 'start' });
					if (navList.classList.contains('open')) {
						navList.classList.remove('open');
						navToggle.setAttribute('aria-expanded', 'false');
					}
				}
			});
		});

	// Contact form submit handler (posts to /api/contact)
	const contactForm = document.getElementById('contact-form');
	const cfStatus = document.getElementById('cf-status');
	if (contactForm) {
		on(contactForm, 'submit', async (e) => {
			e.preventDefault();
			cfStatus.textContent = 'Sending...';
			const name = document.getElementById('cf-name').value.trim();
			const email = document.getElementById('cf-email').value.trim();
			const message = document.getElementById('cf-message').value.trim();
			const newsletter = document.getElementById('cf-newsletter').checked;
			try {
				const res = await fetch('/api/contact', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name, email, message: message || (newsletter ? 'Subscribe to newsletter' : '') })
				});
				const json = await res.json();
				if (res.ok && json.ok) {
					cfStatus.textContent = 'Message sent — we will contact you shortly.';
					contactForm.reset();
				} else {
					cfStatus.textContent = json && json.error ? json.error : 'Failed to send message.';
				}
			} catch (err) {
				cfStatus.textContent = 'Network error. Please try again.';
				console.error(err);
			}
		});
	}

	// Newsletter form (footer)
	const nlForm = document.getElementById('newsletter-form');
	if (nlForm) {
		on(nlForm, 'submit', async (e) => {
			e.preventDefault();
			const email = document.getElementById('nl-email').value.trim();
			if (!email) return;
			const btn = nlForm.querySelector('button');
			btn.disabled = true; btn.textContent = 'Saving...';
			try {
				const res = await fetch('/api/contact', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: 'Newsletter subscriber', email, message: 'Subscribe to newsletter' })
				});
				if (res.ok) {
					btn.textContent = 'Subscribed';
					nlForm.reset();
				} else {
					btn.textContent = 'Subscribe';
					console.warn('Newsletter signup failed');
				}
			} catch (err) {
				btn.textContent = 'Subscribe';
				console.error(err);
			}
			btn.disabled = false;
		});
	}

	// Reveal on scroll: observe elements with .reveal and add .visible when in view
	const revealObserver = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('visible');
				revealObserver.unobserve(entry.target);
			}
		});
	}, { threshold: 0.12 });

	document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

	// Inject hover CTA buttons into cards for quick action (accessible, links to contact)
	function createCardCTA(text) {
		const a = document.createElement('a');
		a.className = 'card-cta';
		a.href = '#contact';
		a.setAttribute('role', 'button');
		a.setAttribute('aria-label', text + ' — open contact form');
		a.textContent = text;
		return a;
	}

	// Add CTAs to different card types with context-aware labels
	const cards = document.querySelectorAll('.card');
	cards.forEach(c => {
		if (!c.querySelector('.card-cta')) {
			const cta = createCardCTA('Request Talent');
			c.appendChild(cta);
		}
	});

	// Remove any CTAs that may have been injected into sector cards — sectors should not show a hover CTA
	const sectors = document.querySelectorAll('.sector-card');
	sectors.forEach(s => {
		const existing = s.querySelectorAll('.card-cta');
		existing.forEach(el => el.remove());
	});

	const minis = document.querySelectorAll('.mini-post');
	minis.forEach(m => {
		if (!m.querySelector('.card-cta')) {
			const cta = createCardCTA('Learn more');
			m.appendChild(cta);
		}
	});

	// Theme switching: apply and persist theme (light, dark, classic)
	const THEME_KEY = 'eminence_theme';

	function applyTheme(name) {
		if (!name || name === 'light') {
			document.documentElement.removeAttribute('data-theme');
		} else {
			document.documentElement.setAttribute('data-theme', name);
		}
	}

	function initTheme() {
		const saved = localStorage.getItem(THEME_KEY);
		if (saved) {
			applyTheme(saved);
			selectThemeControl(saved);
			return;
		}
		// If no saved, respect prefers-color-scheme for dark default
		const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
		applyTheme(prefersDark ? 'dark' : 'light');
		selectThemeControl(prefersDark ? 'dark' : 'light');
	}

	function selectThemeControl(value) {
		const sel = document.getElementById('theme-select');
		if (sel) sel.value = value || 'light';
	}

	const themeSelect = document.getElementById('theme-select');
	if (themeSelect) {
		themeSelect.addEventListener('change', (e) => {
			const v = e.target.value;
			applyTheme(v);
			localStorage.setItem(THEME_KEY, v);
		});
	}

	// Theme icon buttons (sun/moon/classic) - keep select in sync
	const themeBtns = document.querySelectorAll('.theme-btn');
	function setActiveThemeButton(name) {
		themeBtns.forEach(b => {
			const t = b.getAttribute('data-theme');
			const pressed = t === name;
			b.setAttribute('aria-pressed', String(pressed));
			if (pressed) b.classList.add('active'); else b.classList.remove('active');
		});
	}

	if (themeBtns && themeBtns.length) {
		themeBtns.forEach(b => {
			on(b, 'click', (e) => {
				const t = b.getAttribute('data-theme');
				applyTheme(t);
				localStorage.setItem(THEME_KEY, t);
				// sync native select if present
				const sel = document.getElementById('theme-select');
				if (sel) sel.value = t;
				setActiveThemeButton(t);
			});
		});
	}

	initTheme();
	// ensure buttons reflect current theme on load
	const current = document.documentElement.getAttribute('data-theme') || 'light';
	setActiveThemeButton(current === 'light' ? 'light' : current);
})();


