import { act, renderHook, waitFor } from "@testing-library/react";
import { useRefreshableQuery } from "./use-refreshable-query";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("useRefreshableQuery", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads data successfully on the initial request", async () => {
    const loader = vi.fn().mockResolvedValue({ total: 1 });

    const { result } = renderHook(() =>
      useRefreshableQuery({
        loader,
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(loader).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ total: 1 });
    expect(result.current.error).toBeNull();
  });

  it("uses the fallback message when the loader rejects with a non-Error value", async () => {
    const loader = vi.fn().mockRejectedValue("unexpected failure");

    const { result } = renderHook(() =>
      useRefreshableQuery({
        loader,
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe(
      "Nao foi possivel carregar os dados do omnichannel.",
    );
  });

  it("prevents overlapping refresh requests while a request is already in flight", async () => {
    const initial = createDeferred<{ total: number }>();
    const loader = vi
      .fn<() => Promise<{ total: number }>>()
      .mockImplementationOnce(() => initial.promise);

    const { result } = renderHook(() =>
      useRefreshableQuery({
        loader,
      }),
    );

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      void result.current.refetch();
      void result.current.refetch();
    });

    expect(loader).toHaveBeenCalledTimes(1);

    await act(async () => {
      initial.resolve({ total: 1 });
      await initial.promise;
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual({ total: 1 });
  });

  it("supports polling refreshes when a refresh interval is configured", async () => {
    vi.useFakeTimers();

    const loader = vi
      .fn<() => Promise<{ total: number }>>()
      .mockResolvedValue({ total: 1 });

    const { result } = renderHook(() =>
      useRefreshableQuery({
        loader,
        refreshIntervalMs: 1000,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(loader).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(loader).toHaveBeenCalledTimes(2);
    expect(result.current.isRefreshing).toBe(false);
  });
});
