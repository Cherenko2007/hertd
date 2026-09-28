const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');

let width, height;
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Винные оттенки (от темного до яркого рубинового)
const WINE_SHADES = [
    '#4A0E17', '#6B1421', '#8B1C2F', '#A8283F', '#C43D54', '#E05B71'
];

const PARTICLE_COUNT = 6000; // Много частиц!
const HEART_SCALE = 12;
const FOCAL_LENGTH = 600; // Для 3D-проекции

let particles = [];
let rotationY = 0; // Угол вращения всего сердца
let phase = 'assemble'; // Фазы: 'assemble', 'hold', 'disassemble'
let phaseTimer = 0;

// Функция 2D-уравнения сердца
function getHeartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x: x * HEART_SCALE, y: -y * HEART_SCALE };
}

class Particle {
    constructor(isBurst = false) {
        this.isBurst = isBurst;
        if (isBurst) {
            // Для взрыва при клике
            this.x = width / 2;
            this.y = height / 2;
            this.z = 0;
            this.vx = (Math.random() - 0.5) * 20;
            this.vy = (Math.random() - 0.5) * 20;
            this.vz = (Math.random() - 0.5) * 20;
            this.life = 1.0;
            this.decay = Math.random() * 0.02 + 0.01;
            this.color = WINE_SHADES[Math.floor(Math.random() * WINE_SHADES.length)];
            this.size = Math.random() * 3 + 1;
        } else {
            // Для обычных частиц
            this.reset();
        }
    }

    reset() {
        const t = Math.random() * Math.PI * 2;
        const point = getHeartPoint(t);
        
        // Создаем объем (3D облако) с помощью шума
        const noise = 25; 
        this.baseX = point.x + (Math.random() - 0.5) * noise;
        this.baseY = point.y + (Math.random() - 0.5) * noise;
        this.baseZ = (Math.random() - 0.5) * 40; // Глубина сердца
        
        // Начальная позиция (разбросаны далеко)
        this.x = (Math.random() - 0.5) * width * 2;
        this.y = (Math.random() - 0.5) * height * 2;
        this.z = (Math.random() - 0.5) * 1000;
        
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        
        this.size = Math.random() * 2.5 + 1;
        this.color = WINE_SHADES[Math.floor(Math.random() * WINE_SHADES.length)];
        this.alpha = Math.random() * 0.5 + 0.5;
    }

    update() {
        if (this.isBurst) {
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;
            this.vx *= 0.96;
            this.vy *= 0.96;
            this.vz *= 0.96;
            this.life -= this.decay;
            return;
        }

        if (phase === 'assemble') {
            this.x += (this.baseX - this.x) * 0.04;
            this.y += (this.baseY - this.y) * 0.04;
            this.z += (this.baseZ - this.z) * 0.04;
        } else if (phase === 'disassemble') {
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;
            this.vx *= 0.98;
            this.vy *= 0.98;
            this.vz *= 0.98;
        }
    }

    draw() {
        // 3D вращение вокруг оси Y
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        
        const rotX = this.x * cosY - this.z * sinY;
        const rotZ = this.x * sinY + this.z * cosY;
        
        // Перспективная проекция
        const scale = FOCAL_LENGTH / (FOCAL_LENGTH + rotZ);
        const screenX = width / 2 + rotX * scale;
        const screenY = height / 2 + this.y * scale;
        const size = this.size * scale;
        const alpha = this.isBurst ? this.life : this.alpha * scale;

        if (size > 0.1 && alpha > 0.01) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.fill();
        }
    }
}

function init() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }
}

// Клик - взрыв частиц
canvas.addEventListener('click', (e) => {
    const burstParticles = [];
    for (let i = 0; i < 100; i++) {
        const p = new Particle(true);
        p.x = e.clientX;
        p.y = e.clientY;
        burstParticles.push(p);
    }
    particles.push(...burstParticles);
});

function animate() {
    // Эффект шлейфа (полупрозрачный черный прямоугольник)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);
    
    // Вращение всего сердца
    rotationY += 0.008;

    // Логика смены фаз
    phaseTimer++;
    if (phaseTimer > 250 && phase === 'assemble') {
        phase = 'hold';
        phaseTimer = 0;
        // Даем импульс для разлета
        particles.forEach(p => {
            if (!p.isBurst) {
                p.vx = (Math.random() - 0.5) * 15;
                p.vy = (Math.random() - 0.5) * 15;
                p.vz = (Math.random() - 0.5) * 15;
            }
        });
    } else if (phaseTimer > 100 && phase === 'hold') {
        phase = 'disassemble';
        phaseTimer = 0;
    } else if (phaseTimer > 200 && phase === 'disassemble') {
        phase = 'assemble';
        phaseTimer = 0;
        init(); // Пересоздаем частицы для новой сборки
    }

    // Отрисовка всех частиц
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();

        // Удаляем погасшие частицы взрыва
        if (p.isBurst && p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

init();
animate();
