import { FormEvent, useState } from "react";

interface ChatMessage {
  author: "client" | "restaurant";
  text: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      author: "restaurant",
      text: "Hola, somos Picasso. Como podemos ayudarte?",
    },
  ]);

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { author: "client", text: trimmedMessage },
      {
        author: "restaurant",
        text: "Gracias por escribirnos. Un miembro del equipo te respondera pronto.",
      },
    ]);
    setMessage("");
  }

  return (
    <div className="fixed bottom-5 right-5 z-30">
      {isOpen ? (
        <section className="mb-4 w-[min(calc(100vw-2.5rem),380px)] overflow-hidden rounded-lg border border-red-950 bg-zinc-950 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-red-950 bg-zinc-900 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase text-red-800">
                Chat restaurante
              </p>
              <h2 className="font-display text-2xl font-bold text-white">
                Hablemos
              </h2>
            </div>
            <button
              aria-label="Cerrar chat"
              className="grid h-9 w-9 place-items-center rounded-md border border-red-950 text-lg font-bold text-zinc-200 transition hover:bg-red-950"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              x
            </button>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto p-5">
            {messages.map((chatMessage, index) => (
              <div
                className={`rounded-lg px-4 py-3 text-sm leading-6 ${
                  chatMessage.author === "client"
                    ? "ml-8 bg-red-950 text-white"
                    : "mr-8 bg-zinc-900 text-zinc-200"
                }`}
                key={`${chatMessage.author}-${index}`}
              >
                {chatMessage.text}
              </div>
            ))}
          </div>

          <form
            className="flex gap-3 border-t border-red-950 p-4"
            onSubmit={sendMessage}
          >
            <input
              className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-red-900"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escribe tu mensaje"
              value={message}
            />
            <button
              className="rounded-md bg-red-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-900"
              type="submit"
            >
              Enviar
            </button>
          </form>
        </section>
      ) : null}

      <button
        aria-label="Abrir chat con el restaurante"
        className="flex h-16 w-16 items-center justify-center rounded-full border border-red-900 bg-red-950 text-2xl font-bold text-white shadow-2xl shadow-black/50 transition hover:-translate-y-1 hover:bg-red-900"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        ?
      </button>
    </div>
  );
}
