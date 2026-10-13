import { useState } from "react";
import { Button, Input, Select } from "../components/ui/controls";
import {
  Checkbox,
  DeleteButton,
  Field,
  Metric,
  Panel,
  StatusPill,
  TabButton,
} from "../features/employee-panel/shared";
import { useLocale } from "../i18n";

const copy = {
  es: {
    title: "Sistema de diseño",
    intro:
      "Diez componentes reutilizables y sus estados. Los ejemplos solo modifican esta página.",
    primary: "Principal",
    secondary: "Secundario",
    danger: "Eliminar",
    loading: "Guardando",
    disabled: "Deshabilitado",
    name: "Nombre",
    error: "Campo obligatorio",
    category: "Categoría",
    option: "Entradas",
    check: "Disponible",
    metric: "Pedidos",
    tab: "Carta",
    status: "Preparando",
    delete: "Eliminar ejemplo",
    removed: "Ejemplo eliminado",
    reset: "Restablecer",
    palette: "Paleta",
    typography: "Tipografía",
    sample: "Buena comida, grandes momentos",
  },
  en: {
    title: "Design system",
    intro:
      "Ten reusable components and their states. Examples only change this page.",
    primary: "Primary",
    secondary: "Secondary",
    danger: "Delete",
    loading: "Saving",
    disabled: "Disabled",
    name: "Name",
    error: "Required field",
    category: "Category",
    option: "Starters",
    check: "Available",
    metric: "Orders",
    tab: "Menu",
    status: "Preparing",
    delete: "Delete example",
    removed: "Example deleted",
    reset: "Reset",
    palette: "Palette",
    typography: "Typography",
    sample: "Good food, great moments",
  },
  pt: {
    title: "Sistema de design",
    intro:
      "Dez componentes reutilizáveis e os seus estados. Os exemplos só alteram esta página.",
    primary: "Principal",
    secondary: "Secundário",
    danger: "Eliminar",
    loading: "A guardar",
    disabled: "Desativado",
    name: "Nome",
    error: "Campo obrigatório",
    category: "Categoria",
    option: "Entradas",
    check: "Disponível",
    metric: "Pedidos",
    tab: "Menu",
    status: "Em preparação",
    delete: "Eliminar exemplo",
    removed: "Exemplo eliminado",
    reset: "Repor",
    palette: "Paleta",
    typography: "Tipografia",
    sample: "Boa comida, grandes momentos",
  },
};

export function DesignSystemPage() {
  const labels = copy[useLocale()];
  const [checked, setChecked] = useState(true);
  const [active, setActive] = useState(true);
  const [removed, setRemoved] = useState(false);
  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-36">
      <h1 className="font-display text-4xl font-bold">{labels.title}</h1>
      <p className="mt-4 text-zinc-300">{labels.intro}</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Panel>
          <h2 className="mb-4 font-display text-2xl">{labels.palette}</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              "accent",
              "surface",
              "input",
              "text",
              "muted",
              "border",
              "danger",
            ].map((token) => (
              <div key={token} className="flex items-center gap-3">
                <span
                  className="h-10 w-10 rounded border border-white/20"
                  style={{ background: `var(--ui-${token})` }}
                />
                <code>{token}</code>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-display text-2xl">{labels.typography}</h2>
          <p className="mt-4 font-display text-3xl">{labels.sample}</p>
          <p className="mt-3">Inter / system-ui · Georgia</p>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-xl font-bold">1. Button</h2>
          <div className="flex flex-wrap gap-3">
            <Button>{labels.primary}</Button>
            <Button variant="secondary">{labels.secondary}</Button>
            <Button variant="danger">{labels.danger}</Button>
            <Button loading>{labels.loading}</Button>
            <Button disabled>{labels.disabled}</Button>
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-xl font-bold">
            2. Input · 3. Select · 4. Field
          </h2>
          <div className="grid gap-4">
            <Field label={labels.name}>
              <Input placeholder={labels.name} />
            </Field>
            <Field label={labels.error}>
              <Input invalid aria-describedby="design-error" />
            </Field>
            <span id="design-error" className="text-red-300">
              {labels.error}
            </span>
            <Field label={labels.disabled}>
              <Input disabled value={labels.disabled} readOnly />
            </Field>
            <Field label={labels.category}>
              <Select defaultValue="starters">
                <option value="starters">{labels.option}</option>
                <option value="disabled" disabled>
                  {labels.disabled}
                </option>
              </Select>
            </Field>
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-xl font-bold">5. Checkbox · 6. TabButton</h2>
          <Checkbox
            label={labels.check}
            checked={checked}
            onChange={setChecked}
          />
          <div className="mt-4">
            <TabButton
              label={labels.tab}
              active={active}
              onClick={() => setActive(!active)}
            />
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-xl font-bold">7. Metric · 8. StatusPill</h2>
          <Metric label={labels.metric} value="24" />
          <div className="mt-4">
            <StatusPill label={labels.status} />
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-xl font-bold">
            9. DeleteButton · 10. Panel
          </h2>
          {removed ? (
            <p role="status">{labels.removed}</p>
          ) : (
            <DeleteButton
              label={labels.delete}
              onClick={() => setRemoved(true)}
            />
          )}
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => setRemoved(false)}
          >
            {labels.reset}
          </Button>
        </Panel>
      </div>
    </section>
  );
}
