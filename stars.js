const STAR_COUNT = 30;
const STAR_MIN_SIZE = 0.5;
const STAR_MAX_SIZE = 2;
const STAR_MIN_SPEED = 0.5;
const STAR_MAX_SPEED = 2;
const STAR_ANGLE = 45;
const STAR_ANGLE_VARIATION = 0;
const STAR_TRAIL_LENGTH = 8;
const STAR_TRAIL_ALPHA = 0.35;
const STAR_SHADOW_BLUR = 6;
const STAR_EXIT_MARGIN = 20;
const STAR_HEAD_ALPHA = 0.5;
const STAR_COLORS = [
    '255, 255, 255',
    '0, 255, 242',
    '0, 64, 255'
];

class Star {
    constructor(width, height, isInitial = false) {
        this.trail = [];
        this.reset(width, height, isInitial);
    }

    reset(width, height, isInitial) {
        this.size = STAR_MIN_SIZE + Math.random() * (STAR_MAX_SIZE - STAR_MIN_SIZE);
        const speed = STAR_MIN_SPEED + Math.random() * (STAR_MAX_SPEED - STAR_MIN_SPEED);
        const angle = (STAR_ANGLE + (Math.random() - 0.5) * STAR_ANGLE_VARIATION) * Math.PI / 180;

        this.dx = Math.cos(angle) * speed;
        this.dy = Math.sin(angle) * speed;
        this.trail = [];

        this.color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];

        if (isInitial) {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
        } else {
            if (Math.random() > 0.5) {
                this.x = Math.random() * width;
                this.y = this.dy > 0 ? -STAR_EXIT_MARGIN : height + STAR_EXIT_MARGIN;
            } else {
                this.x = this.dx > 0 ? -STAR_EXIT_MARGIN : width + STAR_EXIT_MARGIN;
                this.y = Math.random() * height;
            }
        }
    }

    update(width, height, deltaMultiplier) {
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > STAR_TRAIL_LENGTH) {
            this.trail.pop();
        }

        this.x += this.dx * deltaMultiplier;
        this.y += this.dy * deltaMultiplier;

        if (
            this.x > width + STAR_EXIT_MARGIN ||
            this.x < -STAR_EXIT_MARGIN ||
            this.y > height + STAR_EXIT_MARGIN ||
            this.y < -STAR_EXIT_MARGIN
        ) {
            this.reset(width, height, false);
        }
    }

    draw(ctx) {
        for (let j = this.trail.length - 1; j >= 0; j--) {
            const point = this.trail[j];
            const progress = j / this.trail.length;
            const alpha = (1 - progress) * STAR_TRAIL_ALPHA;
            const size = this.size * (1 - progress);

            ctx.beginPath();
            ctx.arc(point.x, point.y, Math.max(size, 0.2), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${alpha})`;
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${STAR_HEAD_ALPHA})`;

        ctx.shadowBlur = STAR_SHADOW_BLUR;
        ctx.shadowColor = `rgb(${this.color})`;
        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

document.querySelectorAll('.setStars').forEach(container => {
    if (container.querySelector('.stars-canvas')) return;

    // Проверяем, повешен ли класс глобально на body или html
    const isBody = container.tagName.toLowerCase() === 'body' || container.tagName.toLowerCase() === 'html';

    const canvas = document.createElement('canvas');
    canvas.classList.add('stars-canvas');
    const ctx = canvas.getContext('2d', { alpha: true });

    // Для body делаем fixed на фоне (чтобы не уезжал при скролле)
    // Для обычных блоков - absolute
    canvas.style.position = isBody ? 'fixed' : 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.borderRadius = 'inherit';
    canvas.style.zIndex = isBody ? '-1' : '0'; // Прячем за контент для body

    if (!isBody) {
        const computedStyle = window.getComputedStyle(container);
        // Оставляем relative для локальных div, иначе canvas "улетит" за их пределы.
        // Но мы УБРАЛИ overflow: hidden, чтобы больше не ломался скролл у div-заглушек!
        if (computedStyle.position === 'static') {
            container.style.position = 'relative';
        }
    }

    container.prepend(canvas);

    let width, height;

    // Функция обновления размеров
    const updateSize = () => {
        // Если это body, ориентируемся на размер окна, чтобы всегда покрывать видимую зону
        width = isBody ? window.innerWidth : container.clientWidth;
        height = isBody ? window.innerHeight : container.clientHeight;
    };

    updateSize();

    if (isBody) {
        window.addEventListener('resize', updateSize);
    } else {
        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(container);
    }

    const stars = Array.from({ length: STAR_COUNT }, () => new Star(width, height, true));

    let lastTime = 0;

    function animate(time) {
        if (!lastTime) lastTime = time;

        let deltaTime = time - lastTime;
        lastTime = time;

        if (deltaTime > 100) {
            deltaTime = 16.666;
        }

        const deltaMultiplier = deltaTime / 16.666;

        const dpr = window.devicePixelRatio || 1;
        const canvasWidth = Math.round(width * dpr);
        const canvasHeight = Math.round(height * dpr);

        if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        ctx.clearRect(0, 0, width, height);

        stars.forEach(star => {
            star.update(width, height, deltaMultiplier);
            star.draw(ctx);
        });

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
});