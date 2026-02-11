const BLOCKED_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
  "Enter",
  "KeyF",
  "KeyA",
  "KeyB",
  "KeyR",
]);

export class InputState {
  private readonly pressed = new Set<string>();
  private readonly justPressed = new Set<string>();
  private readonly onKeyDown: (event: KeyboardEvent) => void;
  private readonly onKeyUp: (event: KeyboardEvent) => void;

  constructor(target: Window) {
    this.onKeyDown = (event) => {
      if (BLOCKED_KEYS.has(event.code)) {
        event.preventDefault();
      }
      if (!this.pressed.has(event.code)) {
        this.justPressed.add(event.code);
      }
      this.pressed.add(event.code);
    };
    this.onKeyUp = (event) => {
      if (BLOCKED_KEYS.has(event.code)) {
        event.preventDefault();
      }
      this.pressed.delete(event.code);
    };
    target.addEventListener("keydown", this.onKeyDown, { passive: false });
    target.addEventListener("keyup", this.onKeyUp, { passive: false });
  }

  isDown(code: string): boolean {
    return this.pressed.has(code);
  }

  consumePress(code: string): boolean {
    if (!this.justPressed.has(code)) {
      return false;
    }
    this.justPressed.delete(code);
    return true;
  }

  endFrame(): void {
    this.justPressed.clear();
  }

  destroy(target: Window): void {
    target.removeEventListener("keydown", this.onKeyDown);
    target.removeEventListener("keyup", this.onKeyUp);
  }
}
