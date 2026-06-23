declare module 'redlock' {
  export interface Lock {
    release(): Promise<void>;
  }

  export interface RedlockOptions {
    driftFactor?: number;
    retryCount?: number;
    retryDelay?: number;
    retryJitter?: number;
  }

  export interface AcquireOptions {
    retryCount?: number;
    retryDelay?: number;
    retryJitter?: number;
  }

  export default class Redlock {
    constructor(clients: unknown[], settings?: RedlockOptions);
    acquire(resources: string[], duration: number, settings?: AcquireOptions): Promise<Lock>;
  }
}
