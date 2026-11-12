/**
 * Cyber Scramble Text Decoder
 * Animates text decoding with random technical and ASCII glyphs.
 */
export class ScrambleText {
  constructor(chars = '!<>-_\\/[]{}—=+*^?#________0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    this.chars = chars;
    this.queue = [];
    this.frame = 0;
    this.frameRequest = null;
    this.update = this.update.bind(this);
  }

  scramble(element, newText = null, duration = 40) {
    const oldText = element.innerText;
    const targetText = newText !== null ? newText : oldText;
    const length = Math.max(oldText.length, targetText.length);

    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = targetText[i] || '';
      const start = Math.floor(Math.random() * (duration * 0.4));
      const end = start + Math.floor(Math.random() * (duration * 0.6));
      this.queue.push({ from, to, start, end, char: '' });
    }

    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.element = element;
    this.update();
  }

  update() {
    let output = '';
    let complete = 0;

    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
        }
        output += `<span class="scramble-glyph">${char}</span>`;
      } else {
        output += from;
      }
    }

    this.element.innerHTML = output;

    if (complete !== this.queue.length) {
      this.frame++;
      this.frameRequest = requestAnimationFrame(this.update);
    }
  }

  static initAll(selector = '[data-scramble-text]') {
    const elements = document.querySelectorAll(selector);
    const scramblers = new Map();

    elements.forEach(el => {
      const scrambler = new ScrambleText();
      scramblers.set(el, scrambler);

      el.addEventListener('pointerenter', () => {
        scrambler.scramble(el, el.getAttribute('data-original-text') || el.innerText);
      });

      // Save initial text for reliable repeatability
      if (!el.getAttribute('data-original-text')) {
        el.setAttribute('data-original-text', el.innerText.trim());
      }
    });

    return scramblers;
  }
}

