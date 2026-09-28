const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');

let width, height;
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Винные оттенки (от темного до яркого)
const WINE_SHADES = [
    '#4A0E17', '#6B1421', '#8B1C2F', '#A8283F', '#C43D54', '#E05B71'
];

const PARTICLE_COUNT = 8000; // Много частиц для объема
const HEART_SCALE = 12;
const FOCAL_LENGTH = 800; // Перспектива для 3D-эффекта

let particles = [];
let autoExplodeTimer = 0;

// Функция 2D-уравнения сердца
function getHeartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x: x * HEART_SCALE, y: -y * HEART_SCALE };
}

class Particle {
    constructor() {
        // Целевые координаты (где частица должна быть в сердце)
        const t = Math.random() * Math.PI * 2;
        const point = getHeartPoint(t);
        
        // Добавляем объем (шум по X, Y и глубину по Z)
        this.targetX = point.x + (Math.random() - 0.5) * 25;
        this.targetY = point.y + (Math.random() - 0.5) * 25;
        this.targetZ = (Math.random() - 0.5) * 60; // Глубина сердца
        
        // Текущая позиция (начинаем с разброса, чтобы они слетались)
        this.x = (Math.random() - 0.5) * width * 2;
        this.y = (Math.random() - 0.5) * height * 2;
        this.z = (Math.random() - 0.5) * 1000;
        
        // Скорость для физики пружины
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        
        // Внешний вид
        this.size = Math.random() * 2.5 + 0.5;
        this.color = WINE_SHADES[Math.floor(Math.random() * WINE_SHADES.length)];
        this.alpha = Math.random() * 0.6 + 0.4;
    }

    update() {
        // Физика пружины: частица стремится к своей цели
        const spring = 0.04; // Жесткость пружины
        const friction = 0.85; // Трение
        
        this.vx += (this.targetX - this.x) * spring;
        this.vy += (this.targetY - this.y) * spring;
        this.vz += (this.targetZ - this.z) * spring;
        
        this.vx *= friction;
        this.vy *= friction;
        this.vz *= friction;
        
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
    }

    // Метод для взрыва (разлета)
    explode(power = 1) {
        this.vx += (Math.random() - 0.5) * 40 * power;
        this.vy += (Math.random() - 0.5) * 40 * power;
        this.vz += (Math.random() - 0.5) * 40 * power;
    }

    draw() {
        // 3D-проекция на 2D-экран (без вращения!)
        const scale = FOCAL_LENGTH / (FOCAL_LENGTH + this.z);
        const screenX = width / 2 + this.x * scale;
        const screenY = height / 2 + this.y * scale;
        const size = this.size * scale;
        const alpha = this.alpha * scale;

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

// Взрыв при клике
canvas.addEventListener('click', (e) => {
    particles.forEach(p => {
        p.explode(1.5); // Мощный разлет
    });
});

function animate() {
    // Эффект шлейфа (полупрозрачный черный прямоугольник)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);

    // Автоматический взрыв каждые ~4 секунды (60 fps * 4 = 240 кадров)
    autoExplodeTimer++;
    if (autoExplodeTimer > 240) {
        particles.forEach(p => p.explode(1));
        autoExplodeTimer = 0;
    }

    // Обновление и отрисовка всех частиц
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.update();
        p.draw();
    }
    
    // Сброс прозрачности для следующего кадра
    ctx.globalAlpha = 1;

    requestAnimationFrame(animate);
}

init();
animate();
