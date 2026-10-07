// The punch: little discs pop out of the thing you just pressed. Fired from click handlers on
// accept / apply / check-in / hire, never on a timer.
const COLOURS = ['#14B8A6', '#2DD4BF', '#0F766E', '#1A8754', '#E0A22E', '#5EEAD4'];

export function burstAt(element: Element | null, count = 14) {
    if (!element || typeof document === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = element.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    for (let i = 0; i < count; i += 1) {
        const dot = document.createElement('span');
        const size = 7 + Math.random() * 7;
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
        const distance = 46 + Math.random() * 64;
        Object.assign(dot.style, {
            position: 'fixed', left: `${cx - size / 2}px`, top: `${cy - size / 2}px`, width: `${size}px`, height: `${size}px`,
            borderRadius: '50%', background: COLOURS[i % COLOURS.length], pointerEvents: 'none', zIndex: '200',
        });
        document.body.appendChild(dot);
        dot.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance + 18}px) scale(.4)`, opacity: 0 },
        ], { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => dot.remove();
    }
}
