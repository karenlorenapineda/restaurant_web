import type { OrderCopy } from "../orderCopy";

const PAYMENT_METHODS = ["card", "pse"] as const;
const PAYMENT_FIELDS = [
  { key: "cardNumber", placeholder: "0000 0000 0000 0000", wide: true },
  { key: "cardExpiry", placeholder: "MM / AA", wide: false },
  { key: "cardCvc", placeholder: "•••", wide: false },
] as const;

interface Props {
  copy: OrderCopy;
  contact: { name: string; phone: string; address: string };
  error: string;
  fulfillment: "pickup" | "delivery";
  onBack: () => void;
  onPaymentMethodChange: (method: "card" | "pse") => void;
  onRegister: () => void;
  paymentMethod: "card" | "pse";
}

export function OrderPaymentStep({
  copy,
  contact,
  error,
  fulfillment,
  onBack,
  onPaymentMethodChange,
  onRegister,
  paymentMethod,
}: Props) {
  return (
    <div className="min-w-0">
      <h2 className="font-display text-2xl font-bold">{copy.payment}</h2>
      <p className="mt-3 text-zinc-300">{copy.paymentIntro}</p>
      <p className="mt-6 border-l-2 border-[#e8b45f] pl-4 text-sm leading-6 text-zinc-400">
        {copy.paymentPreview}
      </p>
      <h3 className="mt-10 text-sm font-bold uppercase text-[#e8b45f]">
        {copy.paymentMethod}
      </h3>
      <div
        className="mt-3 grid max-w-2xl grid-cols-2 gap-3"
        role="group"
        aria-label={copy.paymentMethod}
      >
        {PAYMENT_METHODS.map((method) => (
          <button
            aria-pressed={paymentMethod === method}
            className={`rounded-sm border px-4 py-4 text-left font-semibold ${paymentMethod === method ? "border-[#e8b45f] bg-[#333333]" : "border-white/20"}`}
            key={method}
            onClick={() => onPaymentMethodChange(method)}
            type="button"
          >
            {method === "card" ? copy.card : copy.bank}
          </button>
        ))}
      </div>
      {/* The payment provider must supply hosted fields; do not collect card data here. */}
      {paymentMethod === "card" ? (
        <fieldset className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2" disabled>
          {PAYMENT_FIELDS.map(({ key, placeholder, wide }) => (
            <label
              className={`grid gap-2 text-sm font-semibold ${wide ? "sm:col-span-2" : ""}`}
              key={key}
            >
              {copy[key]}
              <input
                className="rounded-sm border border-zinc-600 bg-[#333333] px-4 py-3 opacity-60"
                placeholder={placeholder}
                type="text"
              />
            </label>
          ))}
        </fieldset>
      ) : (
        <label className="mt-6 grid max-w-2xl gap-2 text-sm font-semibold">
          {copy.selectBank}
          <select
            className="rounded-sm border border-zinc-600 bg-[#333333] px-4 py-3 opacity-60"
            disabled
          >
            <option>{copy.selectBank}</option>
          </select>
        </label>
      )}
      <p className="mt-4 text-sm text-zinc-400">{copy.paymentPending}</p>
      <dl className="mt-10 grid max-w-2xl gap-3 border-y border-white/15 py-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-400">{copy.name}</dt>
          <dd className="mt-1 font-semibold">{contact.name.trim()}</dd>
        </div>
        <div>
          <dt className="text-zinc-400">{copy.phone}</dt>
          <dd className="mt-1 font-semibold">{contact.phone.trim()}</dd>
        </div>
        <div>
          <dt className="text-zinc-400">{copy.details}</dt>
          <dd className="mt-1 font-semibold">
            {fulfillment === "pickup" ? copy.pickup : copy.delivery}
          </dd>
        </div>
        {fulfillment === "delivery" ? (
          <div>
            <dt className="text-zinc-400">{copy.address}</dt>
            <dd className="mt-1 font-semibold">{contact.address.trim()}</dd>
          </div>
        ) : null}
      </dl>
      {error ? (
        <p className="mt-4 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          className="rounded-sm border border-white/30 px-5 py-3 font-semibold"
          onClick={onBack}
          type="button"
        >
          {copy.backToDetails}
        </button>
        <button
          className="rounded-sm bg-[#e8b45f] px-5 py-3 font-bold text-zinc-950"
          onClick={onRegister}
          type="button"
        >
          {copy.place}
        </button>
      </div>
    </div>
  );
}
