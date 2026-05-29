let isNightMode = false;
let engineAudioCtx = null;

const introOverlay   = document.getElementById('intro-overlay');
const navbar         = document.getElementById('navbar');
const themeToggle    = document.getElementById('themeToggle');
const liveClock      = document.getElementById('live-clock');
const engineBtn      = document.getElementById('engineBtn');
const hudCondition   = document.getElementById('hud-condition');
const lights         = [1,2,3,4,5].map(n => document.getElementById(`l${n}`));

window.addEventListener('DOMContentLoaded', () => {
  restoreTheme();
  runIntroSequence();
  startClock();
});

function runIntroSequence() {
  document.body.style.overflow = 'hidden';

  const lightOnDelay = 250;
  const totalOnTime  = 1400;
  const holdTime     = 800;
  const extinguishStep = 180;


  lights.forEach((light, i) => {
    setTimeout(() => light.classList.add('on'), i * lightOnDelay);
  });


  setTimeout(() => {
    lights.forEach((light, i) => {
      setTimeout(() => light.classList.remove('on'), i * extinguishStep);
    });


    const allOutTime = lights.length * extinguishStep + 300;
    setTimeout(() => {
      introOverlay.classList.add('fade-out');

      setTimeout(() => {
        introOverlay.style.display = 'none';
        document.body.style.overflow = '';
        navbar.classList.add('visible');
        revealHeroContent();
      }, 800);
    }, allOutTime);

  }, totalOnTime + holdTime);
}

function revealHeroContent() {
  document.querySelectorAll('#hero .reveal-up').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), i * 80);
  });
}

function startClock() {
  function tick() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  liveClock.textContent = formatter.format(now);
}
  tick();
  setInterval(tick, 1000);
}

function restoreTheme() {
  localStorage.removeItem('lights-out-manual');
  setNightMode(false, false);
}

function setNightMode(enabled, animate = true) {
  isNightMode = enabled;
  document.documentElement.setAttribute('data-theme', enabled ? 'night' : 'day');
  localStorage.setItem('lights-out-theme', enabled ? 'night' : 'day');
  if (hudCondition) {
    hudCondition.textContent = enabled ? 'NIGHT · DRY' : 'DAY · DRY';
  }
}

themeToggle.addEventListener('click', () => {
  setNightMode(!isNightMode);
});

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      updateActiveNav(id);


      if ((id === 'night-race' || id === 'finish') && !isNightMode) {
        setNightMode(true);
      }

      if ((id === 'hero' || id === 'paddock') && isNightMode) {

        if (!localStorage.getItem('lights-out-manual')) {
          setNightMode(false);
        }
      }
    }
  });
}, { threshold: 0.4 });

themeToggle.addEventListener('click', () => {
  localStorage.setItem('lights-out-manual', '1');
});

document.querySelectorAll('.section').forEach(s => sectionObserver.observe(s));

function updateActiveNav(activeId) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
  });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal-up').forEach(el => {

  if (!el.closest('#hero')) revealObserver.observe(el);
});

const telemObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.telem-fill').forEach(fill => {
        fill.classList.add('animate');
      });
      telemObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const telemBar = document.querySelector('.telemetry-bar');
if (telemBar) telemObserver.observe(telemBar);

function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = Math.floor(start);
    if (start >= target) clearInterval(timer);
  }, 16);
}

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('[data-count]').forEach(el => {
        animateCounter(el, parseInt(el.dataset.count));
      });
      statObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const statStrip = document.querySelector('.stat-strip');
if (statStrip) statObserver.observe(statStrip);

const raceLineObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate');
      raceLineObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const raceLineWrap = document.querySelector('.racing-line-wrap');
if (raceLineWrap) raceLineObserver.observe(raceLineWrap);

const sunsetObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const steps = entry.target.querySelectorAll('.timeline-step');
      steps.forEach((step, i) => {
        setTimeout(() => step.classList.add('active'), i * 350);
      });
      sunsetObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });

const timelineTrack = document.querySelector('.timeline-track');
if (timelineTrack) sunsetObserver.observe(timelineTrack);

engineBtn.addEventListener('click', () => {
  playEngineSound();
  engineBtn.classList.add('revving');
  setTimeout(() => engineBtn.classList.remove('revving'), 600);
});

function playEngineSound() {
  try {
    if (!engineAudioCtx) {
      engineAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = engineAudioCtx;


    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);


    const freqs = [80, 160, 320, 640, 55, 110];
    const oscs = freqs.map(freq => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = freq < 100 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 2.8, now + 1.2);
      oscGain.gain.setValueAtTime(0.04, now);
      oscGain.gain.exponentialRampToValueAtTime(0.12, now + 0.3);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.connect(oscGain);
      oscGain.connect(gainNode);
      osc.start(now);
      osc.stop(now + 1.5);
      return osc;
    });

    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);


    pulseGlow();
    launchCarAnimation();
  } catch (e) {
    console.log('Audio not available:', e);
  }
}

function pulseGlow() {
const hero = document.getElementById('hero');
hero.style.transition = 'box-shadow 0.1s';
hero.style.boxShadow = `inset 0 0 80px rgba(200, 49, 42, 0.25)`;
setTimeout(() => { hero.style.boxShadow = ''; }, 600);
}

function launchCarAnimation() {
const car = document.createElement('div');
car.className = 'f1-car-flyby';
car.style.top = `${25 + Math.random() * 50}%`;
car.innerHTML = `
  <svg viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="14" width="90" height="10" rx="5" fill="#cc1a1a"/>
    <rect x="20" y="10" width="50" height="8" rx="4" fill="#e02020"/>
    <rect x="30" y="6" width="30" height="6" rx="3" fill="#cc1a1a"/>
    <rect x="55" y="4" width="18" height="4" rx="2" fill="#aaa"/>
    <circle cx="18" cy="26" r="6" fill="#222" stroke="#555" stroke-width="1.5"/>
    <circle cx="18" cy="26" r="3" fill="#444"/>
    <circle cx="82" cy="26" r="6" fill="#222" stroke="#555" stroke-width="1.5"/>
    <circle cx="82" cy="26" r="3" fill="#444"/>
    <rect x="92" y="17" width="18" height="4" rx="2" fill="#cc1a1a"/>
    <rect x="0" y="17" width="6" height="4" rx="2" fill="#ff4444"/>
  </svg>
  <div class="car-trail"></div>
`;
document.body.appendChild(car);
setTimeout(() => car.remove(), 1800);
}

document.querySelectorAll('.night-card').forEach(card => {
  const accent = card.dataset.accent || '#ff3548';
  const glowEl = card.querySelector('.night-card-glow');
  if (glowEl) {
    glowEl.style.background = `radial-gradient(circle at 50% 0%, ${accent}18 0%, transparent 65%)`;
  }
  card.addEventListener('mouseenter', () => {
    card.style.borderColor = accent + '60';
    card.style.boxShadow = `0 0 30px ${accent}20`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.borderColor = '';
    card.style.boxShadow = '';
  });
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;


  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    heroContent.style.transform = `translateY(${scrollY * 0.25}px)`;
  }


  navbar.style.boxShadow = scrollY > 20
    ? '0 8px 32px rgba(0,0,0,0.12)'
    : '';
}, { passive: true });
