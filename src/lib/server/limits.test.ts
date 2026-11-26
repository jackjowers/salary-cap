import { describe, expect, it } from "vitest";
import { MemoryCache, MemoryRateLimiter } from "./limits";

describe("MemoryRateLimiter", () => {
  it("allows up to max per window, then blocks until the oldest hit expires", async () => {
    let t = 0;
    const rl = new MemoryRateLimiter(2, 1000, () => t);
    expect((await rl.take("a")).ok).toBe(true);
    t = 100;
    expect((await rl.take("a")).ok).toBe(true);
    const blocked = await rl.take("a");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(1);
    expect((await rl.take("b")).ok).toBe(true);
    t = 1000;
    expect((await rl.take("a")).ok).toBe(true);
  });
});

describe("MemoryCache", () => {
  it("expires entries after the TTL", async () => {
    let t = 0;
    const c = new MemoryCache<number>(1000, 10, () => t);
    await c.set("k", 1);
    expect(await c.get("k")).toBe(1);
    t = 1000;
    expect(await c.get("k")).toBeUndefined();
  });

  it("evicts the oldest entry when full", async () => {
    const c = new MemoryCache<number>(1000, 2);
    await c.set("a", 1);
    await c.set("b", 2);
    await c.set("c", 3);
    expect(await c.get("a")).toBeUndefined();
    expect(await c.get("c")).toBe(3);
  });
});
