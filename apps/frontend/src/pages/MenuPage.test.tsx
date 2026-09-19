import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { menuSections } from "../data/menu";
import { saveStoredMenu } from "../menuStore";
import { EmployeePanelPage } from "./EmployeePanelPage";
import { HomePage } from "./HomePage";
import { MenuPage } from "./MenuPage";

beforeEach(() => {
  saveStoredMenu(menuSections);
});

afterEach(() => {
  saveStoredMenu(menuSections);
  vi.unstubAllGlobals();
});

describe("MenuPage", () => {
  it("shows the example menu without requesting the missing endpoint", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<MenuPage navigate={vi.fn()} />);

    expect(
      screen.getByRole("img", { name: "Entrada criolla" }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("filters available dishes from the in-memory menu", () => {
    saveStoredMenu([
      {
        title: "Starters",
        items: [
          {
            id: 901,
            name: "Available starter",
            description: "Starter",
            price: "$10",
          },
          {
            id: 902,
            name: "Unavailable starter",
            description: "Hidden",
            price: "$11",
            available: false,
          },
        ],
      },
      {
        title: "Mains",
        items: [
          {
            id: 903,
            name: "Available main",
            description: "Main",
            price: "$20",
          },
        ],
      },
    ]);

    render(<MenuPage navigate={vi.fn()} />);

    expect(
      screen.getByRole("img", { name: "Available starter" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Unavailable starter" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mains" }));

    expect(
      screen.queryByRole("img", { name: "Available starter" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Available main" }),
    ).toBeInTheDocument();
  });

  it("updates when the employee preview changes the menu", () => {
    render(<MenuPage navigate={vi.fn()} />);

    act(() => {
      saveStoredMenu([
        {
          title: "Starters",
          items: [
            {
              id: 904,
              name: "New preview dish",
              description: "New dish",
              price: "$12",
            },
          ],
        },
      ]);
    });

    expect(
      screen.getByRole("img", { name: "New preview dish" }),
    ).toBeInTheDocument();
  });

  it("keeps home and employee pages on local menu data too", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const home = render(<HomePage navigate={vi.fn()} goToContact={vi.fn()} />);
    home.unmount();
    const employee = render(<EmployeePanelPage navigate={vi.fn()} />);
    employee.unmount();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
