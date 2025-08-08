    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Animated counter for stats
            function animateCounter(element, target, duration = 2000) {
                let start = 0;
                const increment = target / (duration / 16);
                const timer = setInterval(() => {
                    start += increment;
                    if (start >= target) {
                        element.textContent = target.toLocaleString();
                        clearInterval(timer);
                    } else {
                        element.textContent = Math.floor(start).toLocaleString();
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
                        
                        // Animate stats when they become visible
                        if (entry.target.classList.contains('stat-card')) {
                            const numberElement = entry.target.querySelector('.stat-number');
                            const target = parseInt(numberElement.dataset.target);
                            setTimeout(() => {
                                animateCounter(numberElement, target);
                            }, Math.random() * 500);
                        }
                        
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            // Observe all elements with animations
            document.querySelectorAll('.fade-in, .stat-card').forEach(el => {
                observer.observe(el);
            });

            // Typing effect for tagline
            const tagline = document.querySelector('.typing-effect');
            const originalText = tagline.textContent;
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
            const icons = ['fa-code', 'fa-rocket', 'fa-cog', 'fa-bolt', 'fa-database'];
            let currentIcon = 0;
            
            profileImg.addEventListener('click', function() {
                const icon = this.querySelector('i');
                currentIcon = (currentIcon + 1) % icons.length;
                icon.className = `fas ${icons[currentIcon]}`;
                this.style.transform = 'scale(1.2) rotate(360deg)';
                setTimeout(() => {
                    this.style.transform = 'scale(1) rotate(0deg)';
                }, 500);
            });

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
                const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
                const hue = 250 + (scrollPercent * 60); // From purple to pink
                document.body.style.filter = `hue-rotate(${hue - 250}deg)`;
            });
        });
    </script>
