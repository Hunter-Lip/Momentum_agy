/* ==========================================================================
   MOMENTUM — CORE JAVASCRIPT & PHYSICS SIMULATOR
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Systems
    initTheme();
    initCursorFollower();
    initBackgroundCanvas();
    initSandboxCanvas();
    initScrollReveal();
    initTiltCards();
    initGeneralScroll();
    initLiveClock();
});

/* ==========================================================================
   1. THEME MANAGEMENT
   ========================================================================== */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('momentum-theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-theme');
        if (isDark) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
            localStorage.setItem('momentum-theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
            localStorage.setItem('momentum-theme', 'dark');
        }
        // Notify canvases to redraw background colors
        window.dispatchEvent(new CustomEvent('themechanged'));
    });
}

/* ==========================================================================
   2. INTERACTIVE CURSOR FOLLOWER (Inertia & Scaling)
   ========================================================================== */
function initCursorFollower() {
    const follower = document.getElementById('cursor-follower');
    const dot = document.getElementById('cursor-dot');
    
    if (!follower || !dot) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let followerX = mouseX;
    let followerY = mouseY;
    
    // Tracking velocity of mouse for dynamic scaling
    let prevMouseX = mouseX;
    let prevMouseY = mouseY;
    let velocity = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Instant position for the core dot
        dot.style.left = `${mouseX}px`;
        dot.style.top = `${mouseY}px`;
    });

    // Interpolation loop (Lerp) for smooth lagging trailing effect
    function animateCursor() {
        // Friction/drag coefficient: 0.12 (lagging behind)
        const dx = mouseX - followerX;
        const dy = mouseY - followerY;
        
        followerX += dx * 0.12;
        followerY += dy * 0.12;
        
        follower.style.left = `${followerX}px`;
        follower.style.top = `${followerY}px`;
        
        // Calculate mouse movement speed (momentum) to warp cursor slightly
        const speedX = mouseX - prevMouseX;
        const speedY = mouseY - prevMouseY;
        const speed = Math.sqrt(speedX * speedX + speedY * speedY);
        
        // Smooth out velocity changes
        velocity += (speed - velocity) * 0.1;
        
        // Slight scale warp based on speed
        const scaleVal = 1 + Math.min(velocity * 0.015, 0.4);
        follower.style.transform = `translate(-50%, -50%) scale(${scaleVal})`;
        
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover state selectors
    const hoverElements = 'a, button, input, [data-preset], .tilt-card, .project-row, [data-tilt], .toggle-container';
    
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(hoverElements)) {
            document.body.classList.add('link-hover');
        }
        if (e.target.closest('#sandbox-canvas')) {
            document.body.classList.add('drag-hover');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(hoverElements) && !e.target.relatedTarget?.closest(hoverElements)) {
            document.body.classList.remove('link-hover');
        }
        if (e.target.closest('#sandbox-canvas') && !e.target.relatedTarget?.closest('#sandbox-canvas')) {
            document.body.classList.remove('drag-hover');
        }
    });
}

/* ==========================================================================
   3. BACKGROUND FLOW FIELD CANVAS (Atmospheric Visual)
   ========================================================================== */
function initBackgroundCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 120;
    
    // Track mouse coordinate globally
    let mouse = { x: null, y: null, radius: 150 };
    
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    // Particle blueprint
    class BackgroundParticle {
        constructor() {
            this.reset();
            // Random initial placement
            this.x = Math.random() * width;
            this.y = Math.random() * height;
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            // Slow, drifting velocities
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.size = Math.random() * 1.5 + 0.5;
            this.alpha = Math.random() * 0.15 + 0.05;
            this.speedFactor = Math.random() * 0.01 + 0.005;
        }

        update(time) {
            // Apply vector flow field (mathematical drift based on time)
            // Creates smooth wave forms
            const angle = (this.y * 0.003 + time * 0.0002) * Math.PI * 2;
            this.vx += Math.cos(angle) * this.speedFactor;
            this.vy += Math.sin(angle) * this.speedFactor;
            
            // Limit speed
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > 1.2) {
                this.vx = (this.vx / speed) * 1.2;
                this.vy = (this.vy / speed) * 1.2;
            }
            
            this.x += this.vx;
            this.y += this.vy;

            // Push away from mouse
            if (mouse.x !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    // Move particle away
                    this.x += (dx / dist) * force * 1.8;
                    this.y += (dy / dist) * force * 1.8;
                }
            }

            // Boundary wrap around
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }

        draw() {
            const isDark = document.body.classList.contains('dark-theme');
            ctx.fillStyle = isDark ? `rgba(182, 137, 255, ${this.alpha * 0.85})` : `rgba(112, 0, 255, ${this.alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Populate particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new BackgroundParticle());
    }

    // Reset Hero System Button
    const resetBtn = document.getElementById('hero-reset-particles');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            particles.forEach(p => p.reset());
            // Flash cursor effect
            const follower = document.getElementById('cursor-follower');
            if (follower) {
                follower.style.transform = 'translate(-50%, -50%) scale(3)';
                setTimeout(() => follower.style.transform = 'translate(-50%, -50%) scale(1)', 400);
            }
        });
    }

    // Main animation loop
    function animate(time) {
        ctx.clearRect(0, 0, width, height);
        
        particles.forEach(particle => {
            particle.update(time);
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

/* ==========================================================================
   4. PHYSICS SANDBOX SIMULATOR (Interactive Playground)
   ========================================================================== */
function initSandboxCanvas() {
    const canvas = document.getElementById('sandbox-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Viewport resizing
    let width = canvas.width = canvas.parentElement.clientWidth;
    let height = canvas.height = canvas.parentElement.clientHeight;

    // Parameters (read from DOM controls)
    const countSlider = document.getElementById('param-particles');
    const speedSlider = document.getElementById('param-speed');
    const gravitySlider = document.getElementById('param-gravity');
    const frictionSlider = document.getElementById('param-friction');
    const radiusSlider = document.getElementById('param-radius');
    const trailsToggle = document.getElementById('param-trails');
    const linksToggle = document.getElementById('param-links');
    
    // Metric elements
    const tensionMetric = document.getElementById('metric-tension');
    const velocityMetric = document.getElementById('metric-velocity');
    const fpsCounter = document.getElementById('fps-counter');

    // Values setup
    let maxParticles = parseInt(countSlider.value);
    let maxSpeed = parseFloat(speedSlider.value);
    let gravityWell = parseFloat(gravitySlider.value);
    let friction = parseFloat(frictionSlider.value);
    let influenceRadius = parseFloat(radiusSlider.value);
    let showTrails = trailsToggle.checked;
    let drawLinks = linksToggle.checked;
    let currentPreset = 'orbit';

    const particles = [];
    
    // Track mouse relative to canvas
    let mouse = {
        x: null,
        y: null,
        pressed: false,
        prevX: null,
        prevY: null,
        vx: 0,
        vy: 0
    };

    // Calculate canvas offset correctly
    function updateMousePos(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
        mouse.x = clientX - rect.left;
        mouse.y = clientY - rect.top;
        
        if (mouse.prevX !== null) {
            mouse.vx = mouse.x - mouse.prevX;
            mouse.vy = mouse.y - mouse.prevY;
        }
    }

    canvas.addEventListener('mousemove', (e) => {
        updateMousePos(e.clientX, e.clientY);
    });

    canvas.addEventListener('mousedown', (e) => {
        mouse.pressed = true;
        updateMousePos(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
        mouse.pressed = false;
    });

    canvas.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
        mouse.pressed = false;
        mouse.vx = 0;
        mouse.vy = 0;
    });

    // Touch support for mobile sandbox interaction
    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
        }
    });
    canvas.addEventListener('touchstart', (e) => {
        mouse.pressed = true;
        if (e.touches.length > 0) {
            updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
        }
    });
    canvas.addEventListener('touchend', () => {
        mouse.pressed = false;
        mouse.x = null;
        mouse.y = null;
    });

    window.addEventListener('resize', () => {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
        if (currentPreset === 'grid') {
            rebuildGrid();
        }
    });

    // Particle blueprints
    class PhysicsParticle {
        constructor(x, y, isGrid = false, homeX = 0, homeY = 0) {
            this.x = x;
            this.y = y;
            this.homeX = homeX;
            this.homeY = homeY;
            this.isGrid = isGrid;
            
            // Random movement velocity
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.size = Math.random() * 2 + 0.8;
            this.mass = Math.random() * 1.5 + 0.5;
            this.colorAlpha = Math.random() * 0.4 + 0.3;
        }

        update() {
            if (this.isGrid) {
                // RESTORING FORCE (Inertial Grid Spring physics)
                const springK = 0.05; // Spring constant
                const damping = 1 - friction;
                
                const ax = (this.homeX - this.x) * springK;
                const ay = (this.homeY - this.y) * springK;
                
                this.vx = (this.vx + ax) * damping;
                this.vy = (this.vy + ay) * damping;
                
                // Mouse interaction in Grid preset
                if (mouse.x !== null) {
                    const dx = this.x - mouse.x;
                    const dy = this.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < influenceRadius) {
                        const force = (influenceRadius - dist) / influenceRadius;
                        // Determine attract or repel based on gravity well slider
                        const direction = gravityWell >= 0 ? -1 : 1;
                        const strength = Math.abs(gravityWell) * 15;
                        
                        this.vx += (dx / dist) * force * strength * direction;
                        this.vy += (dy / dist) * force * strength * direction;
                        
                        // Extra mouse drag force: transfer mouse velocity to particles!
                        if (mouse.pressed) {
                            this.vx += mouse.vx * force * 0.15;
                            this.vy += mouse.vy * force * 0.15;
                        }
                    }
                }
                
                this.x += this.vx;
                this.y += this.vy;
                
            } else {
                // STANDARD KINETIC PHYSICS (Drifting Flow & Gravity Wells)
                const drag = 1 - friction;
                this.vx *= drag;
                this.vy *= drag;

                // Mouse interaction
                if (mouse.x !== null) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < influenceRadius) {
                        const force = (influenceRadius - dist) / influenceRadius;
                        // Force acceleration = (Force * Constant) / Mass
                        const accel = (force * gravityWell * 2.8) / this.mass;
                        
                        // Gravity pulls in or repels
                        this.vx += (dx / dist) * accel;
                        this.vy += (dy / dist) * accel;
                        
                        // If mouse clicked and dragged: warp speed!
                        if (mouse.pressed) {
                            const warpStrength = mouse.vx * mouse.vx + mouse.vy * mouse.vy;
                            if (warpStrength > 0.5) {
                                this.vx += mouse.vx * force * 0.18;
                                this.vy += mouse.vy * force * 0.18;
                            }
                        }
                    }
                }

                // Add minor random drift noise so they never fully stand still
                this.vx += (Math.random() - 0.5) * 0.05;
                this.vy += (Math.random() - 0.5) * 0.05;

                // Limit max velocity speed limit
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (speed > maxSpeed) {
                    this.vx = (this.vx / speed) * maxSpeed;
                    this.vy = (this.vy / speed) * maxSpeed;
                }

                this.x += this.vx;
                this.y += this.vy;

                // Boundary bounce physics with damping
                if (this.x < 0) {
                    this.x = 0;
                    this.vx *= -0.8;
                }
                if (this.x > width) {
                    this.x = width;
                    this.vx *= -0.8;
                }
                if (this.y < 0) {
                    this.y = 0;
                    this.vy *= -0.8;
                }
                if (this.y > height) {
                    this.y = height;
                    this.vy *= -0.8;
                }
            }
        }

        draw() {
            const isDark = document.body.classList.contains('dark-theme');
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            const ratio = Math.min(speed / 8, 1);
            if (isDark) {
                if (ratio < 0.5) {
                    const r = Math.round(121 + (255 - 121) * (ratio * 2));
                    const g = Math.round(40 + (0 - 40) * (ratio * 2));
                    const b = Math.round(202 + (127 - 202) * (ratio * 2));
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.colorAlpha * 1.2})`;
                } else {
                    const r = Math.round(255 + (0 - 255) * ((ratio - 0.5) * 2));
                    const g = Math.round(0 + (240 - 0) * ((ratio - 0.5) * 2));
                    const b = Math.round(127 + (255 - 127) * ((ratio - 0.5) * 2));
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.colorAlpha * 1.2})`;
                }
            } else {
                if (ratio < 0.5) {
                    const r = Math.round(112 + (255 - 112) * (ratio * 2));
                    const g = 0;
                    const b = Math.round(255 + (127 - 255) * (ratio * 2));
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.colorAlpha * 1.1})`;
                } else {
                    const r = 255;
                    const g = Math.round(0 + (145 - 0) * ((ratio - 0.5) * 2));
                    const b = Math.round(127 + (0 - 127) * ((ratio - 0.5) * 2));
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.colorAlpha * 1.1})`;
                }
            }
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Build Particles
    function rebuildParticles() {
        particles.length = 0;
        for (let i = 0; i < maxParticles; i++) {
            particles.push(new PhysicsParticle(
                Math.random() * width,
                Math.random() * height
            ));
        }
    }

    function rebuildGrid() {
        particles.length = 0;
        // Arrange maxParticles into a columns/rows grid
        const cols = Math.floor(Math.sqrt(maxParticles * (width / height)));
        const rows = Math.floor(maxParticles / cols);
        const actualCount = cols * rows;
        
        const cellW = width / (cols + 1);
        const cellH = height / (rows + 1);
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const homeX = cellW * (c + 1);
                const homeY = cellH * (r + 1);
                particles.push(new PhysicsParticle(
                    homeX + (Math.random() - 0.5) * 8, // slight initial offset
                    homeY + (Math.random() - 0.5) * 8,
                    true,
                    homeX,
                    homeY
                ));
            }
        }
    }

    // Setup initial orbit system
    rebuildParticles();

    /* --- Control Panel Events --- */

    // Range Sliders Input Handling
    countSlider.addEventListener('input', (e) => {
        maxParticles = parseInt(e.target.value);
        document.getElementById('val-particles').textContent = maxParticles;
        if (currentPreset === 'grid') {
            rebuildGrid();
        } else {
            // Resize pool
            if (particles.length < maxParticles) {
                while(particles.length < maxParticles) {
                    particles.push(new PhysicsParticle(Math.random() * width, Math.random() * height));
                }
            } else {
                particles.length = maxParticles;
            }
        }
    });

    speedSlider.addEventListener('input', (e) => {
        maxSpeed = parseFloat(e.target.value);
        document.getElementById('val-speed').textContent = maxSpeed;
    });

    gravitySlider.addEventListener('input', (e) => {
        gravityWell = parseFloat(e.target.value);
        document.getElementById('val-gravity').textContent = gravityWell;
    });

    frictionSlider.addEventListener('input', (e) => {
        friction = parseFloat(e.target.value);
        document.getElementById('val-friction').textContent = friction;
    });

    radiusSlider.addEventListener('input', (e) => {
        influenceRadius = parseFloat(e.target.value);
        document.getElementById('val-radius').textContent = influenceRadius;
    });

    trailsToggle.addEventListener('change', (e) => {
        showTrails = e.target.checked;
    });

    linksToggle.addEventListener('change', (e) => {
        drawLinks = e.target.checked;
    });

    // Presets
    const presetButtons = document.querySelectorAll('.btn-preset');
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            presetButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const preset = btn.getAttribute('data-preset');
            applyPreset(preset);
        });
    });

    function applyPreset(preset) {
        currentPreset = preset;
        switch(preset) {
            case 'orbit':
                gravityWell = 0.14;
                friction = 0.02;
                maxSpeed = 4.5;
                influenceRadius = 180;
                showTrails = true;
                drawLinks = false;
                break;
            case 'fluid':
                gravityWell = 0.06;
                friction = 0.08;
                maxSpeed = 2.0;
                influenceRadius = 140;
                showTrails = true;
                drawLinks = false;
                break;
            case 'repulsion':
                gravityWell = -0.15;
                friction = 0.025;
                maxSpeed = 7.0;
                influenceRadius = 220;
                showTrails = false;
                drawLinks = true;
                break;
            case 'grid':
                gravityWell = -0.18; // repel grid
                friction = 0.05;
                maxSpeed = 5.0;
                influenceRadius = 150;
                showTrails = false;
                drawLinks = true;
                break;
        }

        // Sync inputs
        gravitySlider.value = gravityWell;
        document.getElementById('val-gravity').textContent = gravityWell;
        frictionSlider.value = friction;
        document.getElementById('val-friction').textContent = friction;
        speedSlider.value = maxSpeed;
        document.getElementById('val-speed').textContent = maxSpeed;
        radiusSlider.value = influenceRadius;
        document.getElementById('val-radius').textContent = influenceRadius;
        trailsToggle.checked = showTrails;
        linksToggle.checked = drawLinks;

        if (preset === 'grid') {
            rebuildGrid();
        } else {
            // Convert any active grid particles back to normal drift
            particles.forEach(p => {
                p.isGrid = false;
            });
            // Resize pool if count is off
            if (particles.length !== maxParticles) {
                rebuildParticles();
            }
        }
    }

    // Reset Engine button
    document.getElementById('sandbox-reset').addEventListener('click', () => {
        applyPreset('orbit');
        rebuildParticles();
    });

    // Theme changes redraw triggers
    window.addEventListener('themechanged', () => {
        // Redraw canvas clean color on theme change
        ctx.clearRect(0, 0, width, height);
    });

    // Real-time calculation helpers for metrics
    let lastTime = performance.now();
    let frameCount = 0;
    let avgFps = 60;

    function renderEngine(now) {
        // Calculate Frame Rate
        frameCount++;
        if (now - lastTime >= 1000) {
            avgFps = Math.round((frameCount * 1000) / (now - lastTime));
            frameCount = 0;
            lastTime = now;
            fpsCounter.textContent = `${avgFps} FPS`;
        }

        // Draw background overlay based on Trails settings
        const isDark = document.body.classList.contains('dark-theme');
        if (showTrails) {
            // Sleek fading trails using alpha transparent cover
            ctx.fillStyle = isDark ? 'rgba(5, 5, 5, 0.08)' : 'rgba(250, 250, 250, 0.08)';
            ctx.fillRect(0, 0, width, height);
        } else {
            ctx.clearRect(0, 0, width, height);
        }

        let totalVelocity = 0;
        let tensionPoints = 0;

        // Render constraints links
        if (drawLinks) {
            ctx.lineWidth = 0.5;
            // Adaptive search: links drawn between nearby neighbors
            const linkDist = 45;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distSqr = dx * dx + dy * dy;
                    if (distSqr < linkDist * linkDist) {
                        const dist = Math.sqrt(distSqr);
                        const alpha = (1 - dist / linkDist) * 0.15;
                        ctx.strokeStyle = isDark ? `rgba(0, 240, 255, ${alpha * 1.5})` : `rgba(112, 0, 255, ${alpha * 1.2})`;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                        tensionPoints++;
                    }
                }
            }
        }

        // Render particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
            
            const speedSqr = particle.vx * particle.vx + particle.vy * particle.vy;
            totalVelocity += Math.sqrt(speedSqr);
        });

        // Update real-time metric counters
        const avgVelocity = totalVelocity / particles.length;
        const normalizedTension = Math.min((tensionPoints / particles.length) * 0.25, 10).toFixed(2);
        
        velocityMetric.textContent = avgVelocity.toFixed(2);
        tensionMetric.textContent = normalizedTension;

        requestAnimationFrame(renderEngine);
    }
    requestAnimationFrame(renderEngine);
}

/* ==========================================================================
   5. SCROLL-DRIVEN WORD REVEAL (The Manifesto)
   ========================================================================== */
function initScrollReveal() {
    const textElement = document.getElementById('reveal-manifesto');
    if (!textElement) return;

    const originalText = textElement.textContent.trim();
    // Split text into words, filter out extra white spaces
    const words = originalText.split(/\s+/);
    
    // Clear and build wrapper span elements
    textElement.innerHTML = '';
    
    const wordSpans = words.map(word => {
        const span = document.createElement('span');
        span.textContent = word + ' ';
        textElement.appendChild(span);
        return span;
    });

    // Custom scroll tracker for the Manifesto Section
    const section = document.querySelector('.manifesto-section');
    
    function revealWords() {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        
        // Calculate scroll bounds: starts entering bottom, finishes exiting top
        const viewportHeight = window.innerHeight;
        
        // Progress: 0 when top of section meets bottom of viewport, 1 when section is scrolled past
        const startTrigger = rect.top - viewportHeight;
        const totalHeight = rect.height + viewportHeight;
        let progress = -startTrigger / rect.height;
        
        // Offset values to make reveal feel centered and organic
        progress = Math.max(0, Math.min(1, progress * 1.5 - 0.2));
        
        // Calculate index limit
        const activeCount = Math.floor(progress * wordSpans.length);
        
        wordSpans.forEach((span, index) => {
            if (index < activeCount) {
                span.classList.add('active');
            } else {
                span.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', revealWords);
    window.addEventListener('resize', revealWords);
    revealWords(); // Initial call
}

/* ==========================================================================
   6. 3D INERTIA TILT CARDS (Showcase Hover Effects)
   ========================================================================== */
function initTiltCards() {
    const cards = document.querySelectorAll('[data-tilt]');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const mouseX = e.clientX - rect.left; // x coordinate relative to card
            const mouseY = e.clientY - rect.top;  // y coordinate relative to card
            
            // Set mouse variables for glow radial shader
            card.style.setProperty('--mouse-x', `${mouseX}px`);
            card.style.setProperty('--mouse-y', `${mouseY}px`);
            
            // Core calculations for rotation
            const width = rect.width;
            const height = rect.height;
            const centerX = width / 2;
            const centerY = height / 2;
            
            // Maximum angle of tilt: 10 degrees
            const maxTilt = 10;
            
            const rotateX = -((mouseY - centerY) / centerY) * maxTilt;
            const rotateY = ((mouseX - centerX) / centerX) * maxTilt;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            // Reset rotations smoothly
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            card.style.setProperty('--mouse-x', '-999px');
            card.style.setProperty('--mouse-y', '-999px');
        });
    });
}

/* ==========================================================================
   7. GENERAL INTERACTION (Scroll shrink headers, Back to top)
   ========================================================================== */
function initGeneralScroll() {
    const header = document.querySelector('.main-header');
    
    // Add scrolled styling on header
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Back to top click action
    const btnBackTop = document.getElementById('btn-back-to-top');
    if (btnBackTop) {
        btnBackTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/* ==========================================================================
   8. DYNAMIC FOOTER TIMEZONE CLOCK
   ========================================================================== */
function initLiveClock() {
    const clockEl = document.getElementById('live-clock');
    if (!clockEl) return;
    
    function updateClock() {
        const now = new Date();
        try {
            const options = {
                timeZone: 'Europe/Zurich', // Swiss timezone
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            };
            const timeStr = new Intl.DateTimeFormat('en-GB', options).format(now);
            clockEl.textContent = `${timeStr} CET`;
        } catch (e) {
            clockEl.textContent = now.toLocaleTimeString();
        }
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

