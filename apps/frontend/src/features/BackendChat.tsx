import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { errorMessage, request } from "../api/client";
import { useIntegrationCopy } from "../integrationCopy";

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  sentAt: string;
}
function validMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const message = value as Message;
  return (
    Number.isSafeInteger(message.id) &&
    Number.isSafeInteger(message.senderId) &&
    Number.isSafeInteger(message.receiverId) &&
    typeof message.message === "string" &&
    typeof message.sentAt === "string"
  );
}

export function useBackendChat(
  identity: { senderId: number; receiverId: number } | null,
) {
  const labels = useIntegrationCopy();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const activeIdentity = useRef(identity);
  activeIdentity.current = identity;
  const socket = useRef<Socket | null>(null);
  const sendLock = useRef(false);
  const addMessage = (message: Message) =>
    setMessages((current) =>
      [...current.filter((item) => item.id !== message.id), message].sort(
        (a, b) => a.sentAt.localeCompare(b.sentAt) || a.id - b.id,
      ),
    );

  useEffect(() => {
    setMessages([]);
    setText("");
    setSending(false);
    setError("");
    setConnected(false);
    setLoading(false);
    if (!identity) return;
    const controller = new AbortController();
    let active = true;
    setMessages([]);
    setText("");
    setSending(false);
    setError("");
    setConnected(false);
    setLoading(true);
    const fetchHistory = () =>
      request<unknown>(
        `chat/conversation/${identity.senderId}/${identity.receiverId}`,
        { signal: controller.signal },
      )
        .then((value) => {
          if (!Array.isArray(value) || !value.every(validMessage))
            throw new Error("Invalid chat response");
          if (active)
            setMessages((current) =>
              [
                ...new Map(
                  [...value, ...current].map((message) => [
                    message.id,
                    message,
                  ]),
                ).values(),
              ].sort((a, b) => a.sentAt.localeCompare(b.sentAt) || a.id - b.id),
            );
        })
        .catch((error) => {
          if (active) setError(errorMessage(error));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    void fetchHistory();
    const client = io({ autoConnect: false });
    socket.current = client;
    client.on("connect", () => {
      client
        .timeout(10000)
        .emit(
          "join",
          { userId: identity.senderId },
          (error: Error | null, ack: { status?: string }) => {
            if (!active) return;
            if (error || ack?.status !== "joined") {
              setError(error?.message ?? labels.error);
              return;
            }
            setConnected(true);
            void fetchHistory();
          },
        );
    });
    client.on("disconnect", () => {
      if (active) setConnected(false);
    });
    client.on("connect_error", (error) => {
      if (active) setError(error.message);
    });
    client.on("exception", (error) => {
      if (active) {
        setError(String(error?.message ?? labels.error));
        setSending(false);
        sendLock.current = false;
      }
    });
    client.on("newMessage", (message: unknown) => {
      if (
        validMessage(message) &&
        ((message.senderId === identity.senderId &&
          message.receiverId === identity.receiverId) ||
          (message.receiverId === identity.senderId &&
            message.senderId === identity.receiverId))
      )
        addMessage(message);
    });
    client.connect();
    return () => {
      active = false;
      controller.abort();
      client.removeAllListeners();
      client.disconnect();
      socket.current = null;
      sendLock.current = false;
    };
  }, [identity, refresh]);

  function send() {
    const value = text.trim();
    if (!value || !identity || !connected || sendLock.current) return;
    sendLock.current = true;
    setSending(true);
    setError("");
    const client = socket.current;
    if (!client) {
      sendLock.current = false;
      setSending(false);
      return;
    }
    client
      .timeout(10000)
      .emit(
        "sendMessage",
        { ...identity, message: value },
        (error: Error | null, message: unknown) => {
          if (
            socket.current !== client ||
            !activeIdentity.current ||
            activeIdentity.current !== identity
          )
            return;
          sendLock.current = false;
          setSending(false);
          if (error || !validMessage(message)) {
            setError(labels.error);
            return;
          }
          addMessage(message);
          setText("");
        },
      );
  }
  return {
    messages,
    text,
    setText,
    error,
    connected,
    loading,
    sending,
    send,
    retry: () => setRefresh((value) => value + 1),
  };
}
