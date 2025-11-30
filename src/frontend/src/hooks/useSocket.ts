import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

const DEFAULT_SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || "http://localhost:9092";
const CONNECT_TIMEOUT_MS = 7000;

function timeoutPromise<T>(p: Promise<T>, ms: number) {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;
    if (typeof window === "undefined") return;

    let mounted = true;
    let createdSocket: Socket | null = null;

    (async () => {
      const urlsToTry = [DEFAULT_SOCKET_URL, window.location.origin].filter(Boolean);

      for (const url of urlsToTry) {
        if (!mounted) return;
        try {
          // create socket with a small connect timeout & fallback transports
          // Note: netty-socketio expects token as query parameter, not in auth object
          createdSocket = io(url, {
            transports: ["websocket", "polling"],
            query: { token },
            timeout: CONNECT_TIMEOUT_MS,
            // path: '/socket.io' // adjust if server uses custom path
          });

          // wait briefly for connect_error or connect event via a promise
          await timeoutPromise(
            new Promise<void>((resolve, reject) => {
              const onConnect = () => {
                cleanup();
                resolve();
              };
              const onError = (err: any) => {
                cleanup();
                reject(err || new Error("socket connect error"));
              };
              const cleanup = () => {
                try {
                  createdSocket?.off("connect", onConnect);
                  createdSocket?.off("connect_error", onError);
                  createdSocket?.off("error", onError);
                } catch {}
              };
              createdSocket?.on("connect", onConnect);
              createdSocket?.on("connect_error", onError);
              createdSocket?.on("error", onError);
            }),
            CONNECT_TIMEOUT_MS
          );

          // success
          break;
        } catch (err) {
          console.warn("Socket connect attempt failed for", url, err);
          // try next url
          try {
            // ensure createdSocket is closed if partially created
            if (createdSocket) {
              try { createdSocket.disconnect(); } catch {}
              createdSocket = null;
            }
          } catch {}
          continue;
        }
      }

      if (!mounted || !createdSocket) {
        console.warn("Could not establish socket connection to any candidate URL.");
        return;
      }

      socketRef.current = createdSocket;
      createdSocket.on("connect", () => console.log("Socket connected:", createdSocket?.id));
      createdSocket.on("disconnect", () => console.log("Socket disconnected"));
      createdSocket.on("connect_error", (err: any) => console.error("Socket connection error:", err));
    })();

    return () => {
      mounted = false;
      if (socketRef.current) {
        try { socketRef.current.disconnect(); } catch {}
      }
      socketRef.current = null;
    };
  }, [token]);

  return socketRef.current;
}

