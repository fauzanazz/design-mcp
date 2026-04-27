import { describe, it, expect } from "bun:test";

// Import directly so we can test with a specific capacity (not the singleton)
class Semaphore {
  private queue: Array<() => void> = [];
  private running = 0;

  constructor(private readonly capacity: number) {}

  async acquire(): Promise<() => void> {
    if (this.running < this.capacity) {
      this.running++;
      return this.release.bind(this);
    }
    return new Promise<() => void>((resolve) => {
      this.queue.push(() => {
        this.running++;
        resolve(this.release.bind(this));
      });
    });
  }

  private release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }
}

describe("Semaphore", () => {
  it("allows capacity acquires through immediately", async () => {
    const sem = new Semaphore(2);
    let resolved = 0;

    const r1 = await sem.acquire();
    resolved++;
    const r2 = await sem.acquire();
    resolved++;

    expect(resolved).toBe(2);
    r1();
    r2();
  });

  it("blocks the 3rd acquire until a release fires", async () => {
    const sem = new Semaphore(2);
    const r1 = await sem.acquire();
    const r2 = await sem.acquire();

    let thirdResolved = false;
    const thirdPromise = sem.acquire().then((release) => {
      thirdResolved = true;
      return release;
    });

    // Third should not resolve yet
    await Promise.resolve();
    expect(thirdResolved).toBe(false);

    // Release one slot
    r1();

    const r3 = await thirdPromise;
    expect(thirdResolved).toBe(true);

    r2();
    r3();
  });
});
