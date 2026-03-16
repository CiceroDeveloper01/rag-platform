import { render, screen } from "@testing-library/react";
import { LiveActivityFeed } from "./live-activity-feed";

vi.mock("../hooks/use-live-activity", () => ({
  useLiveActivity: vi.fn(),
}));

import { useLiveActivity } from "../hooks/use-live-activity";

describe("LiveActivityFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an empty state when there is no live activity", () => {
    vi.mocked(useLiveActivity).mockReturnValue({
      events: [],
      status: "connecting",
    });

    render(<LiveActivityFeed />);

    expect(screen.getByText("No live activity yet.")).toBeInTheDocument();
    expect(screen.getAllByText("Connecting...")).toHaveLength(2);
    expect(screen.getByText("No events yet")).toBeInTheDocument();
  });

  it("renders live events with status and summary", () => {
    vi.mocked(useLiveActivity).mockReturnValue({
      status: "live",
      events: [
        {
          executionId: 42,
          type: "response_sent",
          eventType: "response_sent",
          message: "Response sent",
          color: "cyan",
          icon: "send",
          severity: "success",
          channel: "EMAIL",
          timestamp: "2026-03-13T12:00:00.000Z",
          metadata: { dispatchAccepted: true },
        },
      ],
    });

    render(<LiveActivityFeed />);

    expect(screen.getAllByText("Live")).toHaveLength(2);
    expect(screen.getByText("Response sent")).toBeInTheDocument();
    expect(screen.getByText("EMAIL")).toBeInTheDocument();
    expect(screen.getByText("Latest event")).toBeInTheDocument();
    expect(screen.getAllByText("Response Sent").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getByText("success")).toBeInTheDocument();
  });
});
