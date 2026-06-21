import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAIProvider, resetAIProviderCache } from "./provider-factory";

// Mock the provider modules
vi.mock("./providers/nvidia", () => {
  return {
    NvidiaProvider: class {
      readonly name = "nvidia";
      chat = vi.fn().mockRejectedValue(new Error("NVIDIA NIM Error"));
      stream = vi.fn();
      embed = vi.fn();
    },
  };
});

vi.mock("./providers/gemini", () => {
  return {
    GeminiProvider: class {
      readonly name = "gemini";
      chat = vi.fn().mockResolvedValue({
        content: "Hello from Gemini Fallback",
        confidence: 0.95,
        tokensUsed: 120,
        model: "gemini-1.5-flash",
        finishReason: "stop",
      });
      stream = vi.fn();
      embed = vi.fn();
    },
  };
});

describe("AI Provider Factory with Fallback Logic", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    resetAIProviderCache();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should successfully fall back to Gemini when Nvidia fails", async () => {
    process.env.AI_PROVIDER = "nvidia";
    process.env.NVIDIA_API_KEY = "mock-nvidia-key";
    process.env.GEMINI_API_KEY = "mock-gemini-key";

    const provider = getAIProvider();
    expect(provider.name).toBe("nvidia");

    const response = await provider.chat({
      messages: [{ role: "user", content: "hi" }],
    });

    expect(response.content).toBe("Hello from Gemini Fallback");
    expect(response.model).toBe("gemini/gemini-1.5-flash");
    expect(response.confidence).toBe(0.95);
  });

  it("should fail when all configured providers throw errors", async () => {
    process.env.AI_PROVIDER = "nvidia";
    process.env.NVIDIA_API_KEY = "mock-nvidia-key";
    
    // Clear other provider keys to ensure no fallback succeeds
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    const provider = getAIProvider();
    
    await expect(
      provider.chat({
        messages: [{ role: "user", content: "hi" }],
      })
    ).rejects.toThrow("All providers failed");
  });
});
