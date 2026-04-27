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

const capacity = Number(process.env.DESIGN_MCP_MAX_CONCURRENCY ?? 2);
export const engineSemaphore = new Semaphore(capacity);
