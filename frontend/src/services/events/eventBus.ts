type EventCallback = (payload: any) => void;

export class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    // Return an unsubscribe function
    return () => {
      const list = this.listeners.get(eventType);
      if (list) {
        this.listeners.set(
          eventType,
          list.filter((cb) => cb !== callback)
        );
      }
    };
  }

  publish(eventType: string, payload: any): void {
    const list = this.listeners.get(eventType);
    if (list) {
      list.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[EventBus] Error in subscriber for event ${eventType}:`, err);
        }
      });
    }
  }
}

export const eventBus = new EventBus();
export default eventBus;
