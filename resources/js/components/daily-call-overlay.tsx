import { useCallback, useEffect, useRef, useState } from "react";
import Daily from "@daily-co/daily-js";
import type { DailyCall } from "@daily-co/daily-js";
import { Button } from "@/components/ui/button.tsx";
import { ExternalLink, Loader2, Phone, Users, Video } from "lucide-react";

export type DailyCallSession = {
  id: number;
  callType: "audio" | "video" | "conference";
  roomCode?: string;
  dailyRoomUrl?: string | null;
  title?: string | null;
};

type DailyCallOverlayProps = {
  call: DailyCallSession;
  partnerName?: string;
  onEnd: () => void;
};

type JoinPayload = { token: string; roomUrl: string; callType: string };

async function fetchCallToken(callId: number): Promise<JoinPayload> {
  const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "";
  const response = await fetch(`/dashboard/calls/${callId}/token`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "X-CSRF-TOKEN": csrf,
    },
    credentials: "same-origin",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error((payload as { message?: string }).message ?? "Could not join the call.");
  }

  return response.json() as Promise<JoinPayload>;
}

function buildDailyJoinUrl(roomUrl: string, token: string): string {
  const url = new URL(roomUrl);
  url.searchParams.set("t", token);
  return url.toString();
}

function canUseEmbeddedDaily(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;

  const browser = Daily.supportedBrowser();
  return browser.supported !== false;
}

function insecureContextMessage(): string {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Your site is served over HTTP. Browsers block camera and microphone on non-HTTPS pages. The call will open in a secure Daily.co tab instead.";
  }

  const browser = Daily.supportedBrowser();
  if (browser.supported === false) {
    return `${browser.name ?? "This browser"} does not support WebRTC calls. Try Chrome, Firefox, or Safari.`;
  }

  return "WebRTC is not available in this browser.";
}

export function DailyCallOverlay({ call, partnerName, onEnd }: DailyCallOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<DailyCall | null>(null);
  const popupRef = useRef<Window | null>(null);
  const [status, setStatus] = useState<"connecting" | "joined" | "popup" | "error">("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  const label = call.callType === "conference"
    ? "Conference call"
    : call.callType === "video"
      ? "Video call"
      : "Audio call";

  const openPopup = useCallback((url: string) => {
    const popup = window.open(
      url,
      `scholaros-daily-call-${call.id}`,
      "width=1280,height=800,noopener,noreferrer",
    );

    if (!popup) {
      setStatus("error");
      setErrorMessage("Pop-up blocked. Allow pop-ups for this site, or open the call link below.");
      return false;
    }

    popupRef.current = popup;
    setStatus("popup");
    setInfoMessage(insecureContextMessage());
    return true;
  }, [call.id]);

  useEffect(() => {
    let cancelled = false;
    let frame: DailyCall | null = null;
    let popupTimer: number | undefined;

    async function joinCall() {
      try {
        const payload = await fetchCallToken(call.id);
        if (cancelled) return;

        const secureJoinUrl = buildDailyJoinUrl(payload.roomUrl, payload.token);
        setJoinUrl(secureJoinUrl);

        if (!canUseEmbeddedDaily()) {
          openPopup(secureJoinUrl);
          return;
        }

        if (!containerRef.current) return;

        frame = Daily.createFrame(containerRef.current, {
          showLeaveButton: true,
          showFullscreenButton: true,
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "0",
            borderRadius: "0",
          },
        });

        callFrameRef.current = frame;

        frame.on("left-meeting", () => {
          if (!cancelled) onEnd();
        });

        frame.on("error", (event) => {
          if (cancelled) return;

          const message = event?.errorMsg ?? "Call connection failed.";
          if (/webrtc not supported|suppressed/i.test(message)) {
            frame?.destroy().catch(() => undefined);
            callFrameRef.current = null;
            openPopup(secureJoinUrl);
            return;
          }

          setStatus("error");
          setErrorMessage(message);
        });

        await frame.join({ url: payload.roomUrl, token: payload.token });
        if (!cancelled) setStatus("joined");
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(error instanceof Error ? error.message : "Could not join the call.");
        }
      }
    }

    void joinCall();

    popupTimer = window.setInterval(() => {
      if (popupRef.current?.closed) {
        popupRef.current = null;
        if (!cancelled) onEnd();
      }
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(popupTimer);
      if (frame) {
        void frame.destroy();
      }
      callFrameRef.current = null;
    };
  }, [call.id, onEnd]);

  const handleEnd = () => {
    setEnding(true);
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
      popupRef.current = null;
    }
    if (callFrameRef.current) {
      void callFrameRef.current.leave().finally(onEnd);
      return;
    }
    onEnd();
  };

  const handleReopen = () => {
    if (joinUrl) {
      openPopup(joinUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 text-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            {call.callType === "video" ? <Video className="h-5 w-5" /> : call.callType === "conference" ? <Users className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{partnerName ?? call.title ?? "Call in progress"}</p>
            <p className="text-xs text-slate-300">{label}{call.roomCode ? ` · ${call.roomCode}` : ""}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="rounded-full cursor-pointer shrink-0"
          disabled={ending}
          onClick={handleEnd}
        >
          <Phone className="h-4 w-4 mr-2 rotate-[135deg]" />
          {ending ? "Leaving…" : "Leave"}
        </Button>
      </div>

      <div className="relative flex-1 min-h-0 bg-black">
        {status === "connecting" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <p className="text-sm text-slate-300">Connecting to Daily.co…</p>
          </div>
        )}

        {status === "popup" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white gap-4 p-6 text-center">
            <p className="text-lg font-semibold">Call opened in a new tab</p>
            <p className="text-sm text-slate-300 max-w-lg">{infoMessage}</p>
            <p className="text-sm text-slate-400 max-w-lg">
              Keep this window open while you are on the call. When you finish, click Leave here to end the session for everyone.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button type="button" variant="secondary" className="cursor-pointer" onClick={handleReopen}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Reopen call
              </Button>
              {joinUrl && (
                <Button type="button" variant="outline" className="cursor-pointer" asChild>
                  <a href={joinUrl} target="_blank" rel="noopener noreferrer">
                    Open call link
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white gap-4 p-6 text-center">
            <p className="text-lg font-semibold">Unable to join call</p>
            <p className="text-sm text-slate-300 max-w-md">{errorMessage}</p>
            {joinUrl && (
              <Button type="button" variant="secondary" className="cursor-pointer" asChild>
                <a href={joinUrl} target="_blank" rel="noopener noreferrer">
                  Open call in Daily.co
                </a>
              </Button>
            )}
            <Button type="button" variant="outline" className="cursor-pointer" onClick={handleEnd}>
              Close
            </Button>
          </div>
        )}

        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
