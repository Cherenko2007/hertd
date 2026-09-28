const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Винные оттенки (от темного бордового до яркого рубинового)
const WINE_SHADES = [
    '#4A0E17', // Темный бордо
    '#6B1421', // Винный
    '#8B1C2F', // Рубиновый
    '#A8283F', // Яркий винный
    '#C43D54'  // Светлый акцент
];

const HEART_SCALE = 14; // Размер сердца
const PARTICLE_COUNT = 180; // Количество частиц

let particles = [];
let phase = 'assemble'; // Фазы: 'assemble' (сборка), 'hold' (пауза), 'disassemble' (разлет)
let phaseTimer = 0;

// Функция для получения координат сердца (параметрическое уравнение)
function getHeartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x: x * HEART_SCALE, y: -y * HEART_SCALE }; // Инвертируем Y для Canvas
}

// Класс частицы
class Particle {
    constructor(isBurst = false) {
        this.isBurst = isBurst;
        this.reset(isBurst);
    }

    reset(isBurst) {
        if (isBurst) {
            // Для взрыва при клике
            this.x = width / 2; // Временное значение, перезапишется при клике
            this.y = height / 2;
            this.angle = Math.random() * Math.PI * 2;
            this.speed = Math.random() * 5 + 2;
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
            this.life = 1.0;
            this.decay = Math.random() * 0.02 + 0.01;
        } else {
            // Обычные частицы сердца
            this.x = Math.random() * width;
            this.y = height + Math.random() * 200; // Начинаем снизу
            this.vx = 0;
            this.vy = 0;
            
            // Определяем целевую точку на сердце
            const t = Math.random() * Math.PI * 2;
            const point = getHeartPoint(t);
            this.targetX = width / 2 + point.x;
            this.targetY = height / 2 + point.y;
            
            this.size = Math.random() * 2 + 1;
            this.color = WINE_SHADES[Math.floor(Math.random() * WINE_SHADES.length)];
            this.alpha = Math.random() * 0.5 + 0.5;
        }
    }

    update() {
        if (this.isBurst) {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.98; // Затухание скорости
            this.vy *= 0.98;
            this.life -= this.decay;
            return;
        }

        if (phase === 'assemble') {
            // Плавное движение к цели
            this.x += (this.targetX - this.x) * 0.05;
            this.y += (this.targetY - this.y) * 0.05;
        } else if (phase === 'disassemble') {
            // Разлет частиц
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.99;
            this.vy *= 0.99;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.isBurst 
            ? `rgba(196, 61, 84, ${this.life})` // Цвет для взрыва
            : this.color;
        ctx.globalAlpha = this.isBurst ? 1 : this.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Инициализация частиц
function init() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }
}

// Всплеск при клике
canvas.addEventListener('click', (e) => {
    const burstParticles = [];
    for (let i = 0; i < 50; i++) {
        const p = new Particle(true);
        p.x = e.clientX;
        p.y = e.clientY;
        burstParticles.push(p);
    }
    particles.push(...burstParticles);
});

// Главный цикл анимации
function animate() {
    // Эффект шлейфа (полупрозрачный черный прямоугольник)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, width, height);

    // Логика переключения фаз
    phaseTimer++;
    if (phaseTimer > 200 && phase === 'assemble') {
        phase = 'hold';
        phaseTimer = 0;
        // Даем частицам случайный импульс для разлета
        particles.forEach(p => {
            if (!p.isBurst) {
                p.vx = (Math.random() - 0.5) * 10;
                p.vy = (Math.random() - 0.5) * 10;
            }
        });
    } else if (phaseTimer > 100 && phase === 'hold') {
        phase = 'disassemble';
        phaseTimer = 0;
    } else if (phaseTimer > 150 && phase === 'disassemble') {
        phase = 'assemble';
        phaseTimer = 0;
        init(); // Пересоздаем частицы для новой сборки
    }

    // Обновление и отрисовка
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
