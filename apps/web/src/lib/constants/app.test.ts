describe("app constants", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("uses default values when public env vars are not defined", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_PROMETHEUS_URL;
    delete process.env.NEXT_PUBLIC_GRAFANA_URL;
    delete process.env.NEXT_PUBLIC_APP_ENV;
    delete process.env.NEXT_PUBLIC_CHAT_STREAMING;

    const { env, appLinks } = await import("./app");

    expect(env.apiBaseUrl).toBe("http://localhost:3001");
    expect(env.prometheusUrl).toBe("http://localhost:9090");
    expect(env.grafanaUrl).toBe("http://localhost:3002");
    expect(env.appEnvironment).toBe("local");
    expect(env.chatStreamingEnabled).toBe(true);
    expect(appLinks.apiHealth).toBe("http://localhost:3001/health");
    expect(appLinks.apiMetrics).toBe("http://localhost:3001/metrics");
  });

  it("uses configured public env vars and disables chat streaming when requested", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com/";
    process.env.NEXT_PUBLIC_PROMETHEUS_URL = "https://prom.example.com";
    process.env.NEXT_PUBLIC_GRAFANA_URL = "https://graf.example.com";
    process.env.NEXT_PUBLIC_APP_ENV = "staging";
    process.env.NEXT_PUBLIC_CHAT_STREAMING = "false";

    const { env, appLinks } = await import("./app");

    expect(env.apiBaseUrl).toBe("https://api.example.com/");
    expect(env.prometheusUrl).toBe("https://prom.example.com");
    expect(env.grafanaUrl).toBe("https://graf.example.com");
    expect(env.appEnvironment).toBe("staging");
    expect(env.chatStreamingEnabled).toBe(false);
    expect(appLinks.apiHealth).toBe("https://api.example.com/health");
    expect(appLinks.apiMetrics).toBe("https://api.example.com/metrics");
    expect(appLinks.prometheus).toBe("https://prom.example.com");
    expect(appLinks.grafana).toBe("https://graf.example.com");
  });
});
