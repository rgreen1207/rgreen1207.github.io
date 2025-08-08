document.addEventListener('DOMContentLoaded', function() {
	// Animated counter for stats
	function animateCounter(element, target, duration = 2000) {
		let start = 0;
		const increment = target / (duration / 16);
		const timer = setInterval(() => {
			start += increment;
			if (start >= target) {
				clearInterval(timer);
			} else {
				// You can update the element's text here if needed
			}
		}, 16);
	}

	// Intersection Observer for animations
	const observerOptions = {
		threshold: 0.1,
		rootMargin: '0px 0px -50px 0px'
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('visible');
				observer.unobserve(entry.target);
			}
		});
	}, observerOptions);

	// Observe all elements with animations
	document.querySelectorAll('.fade-in, .stat-card').forEach(el => {
		observer.observe(el);
	});

	// Typing effect for tagline - FIXED VERSION
	const tagline = document.querySelector('.typing-effect');
	if (tagline) {
		const originalText = tagline.textContent;
		// Create invisible span to measure exact text dimensions
		const textMeasurer = document.createElement('span');
		textMeasurer.style.cssText = `
			visibility: hidden;
			position: absolute;
			white-space: nowrap;
			font-family: ${getComputedStyle(tagline).fontFamily};
			font-size: ${getComputedStyle(tagline).fontSize};
			font-style: ${getComputedStyle(tagline).fontStyle};
			font-weight: ${getComputedStyle(tagline).fontWeight};
			letter-spacing: ${getComputedStyle(tagline).letterSpacing};
		`;
		textMeasurer.textContent = originalText;
		document.body.appendChild(textMeasurer);
		// Lock dimensions before starting animation
		const exactHeight = textMeasurer.getBoundingClientRect().height;
		tagline.style.height = exactHeight + 'px';
		tagline.style.display = 'inline-block';
		tagline.style.overflow = 'hidden';
		tagline.style.whiteSpace = 'nowrap';
		// Clean up measurer
		document.body.removeChild(textMeasurer);
		// Clear text and start typing
		tagline.textContent = '';
		let i = 0;
		const typeWriter = () => {
			if (i < originalText.length) {
				tagline.textContent += originalText.charAt(i);
				i++;
				setTimeout(typeWriter, 50);
			} else {
				tagline.classList.remove('typing-effect');
			}
		};
		setTimeout(typeWriter, 1000);
	}

	// Enhanced hover effects
	document.querySelectorAll('.skill-tag').forEach(tag => {
		tag.addEventListener('mouseenter', function() {
			this.style.transform = 'scale(1.1) translateY(-3px) rotate(2deg)';
			this.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.4)';
		});
		tag.addEventListener('mouseleave', function() {
			this.style.transform = 'scale(1) translateY(0) rotate(0deg)';
			this.style.boxShadow = 'none';
		});
	});

	// Interactive profile image
	const profileImg = document.querySelector('.profile-img');
	if (profileImg) {
		const icons = ['fa-code', 'fa-rocket', 'fa-cog', 'fa-bolt', 'fa-database'];
		let currentIcon = 0;
		profileImg.addEventListener('click', function() {
			const icon = this.querySelector('i');
			if (icon) {
				currentIcon = (currentIcon + 1) % icons.length;
				icon.className = `fas ${icons[currentIcon]}`;
				this.style.transform = 'scale(1.2) rotate(360deg)';
				setTimeout(() => {
					this.style.transform = 'scale(1) rotate(0deg)';
				}, 500);
			}
		});
	}

	// Parallax effect for floating shapes
	let ticking = false;
	function updateShapes() {
		const scrolled = window.pageYOffset;
		const shapes = document.querySelectorAll('.shape');
		shapes.forEach((shape, index) => {
			const rate = scrolled * (0.5 + index * 0.1);
			shape.style.transform = `translate3d(0, ${rate}px, 0) rotate(${scrolled * 0.1}deg)`;
		});
		ticking = false;
	}
	function requestTick() {
		if (!ticking) {
			requestAnimationFrame(updateShapes);
			ticking = true;
		}
	}
	window.addEventListener('scroll', requestTick);

	// Dynamic background color based on scroll
	window.addEventListener('scroll', () => {
		const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
		if (maxScroll === 0) return;
		const scrollPercent = Math.min(1, window.scrollY / maxScroll);
		const hue = 250 + (scrollPercent * 60); // From purple to pink
		document.body.style.filter = `hue-rotate(${hue - 250}deg)`;
	});
});
