import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatWidget } from "./ChatWidget";

describe("ChatWidget", () => {
  it("opens and closes the contact conversation", () => {
    render(<ChatWidget />);

    expect(screen.queryByText("Hablemos")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Abrir chat con el restaurante",
      }),
    );

    expect(screen.getByText("Hablemos")).toBeInTheDocument();
    expect(
      screen.getByText(/Hola, somos Picasso Asadero/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar chat" }));

    expect(screen.queryByText("Hablemos")).not.toBeInTheDocument();
  });

  it("ignores empty messages without generating a restaurant reply", () => {
    render(<ChatWidget />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Abrir chat con el restaurante",
      }),
    );
    fireEvent.change(screen.getByPlaceholderText("Escribe tu mensaje"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(
      screen.queryByText(
        "Gracias por escribirnos. El equipo del asadero te respondera pronto.",
      ),
    ).not.toBeInTheDocument();
  });
});
