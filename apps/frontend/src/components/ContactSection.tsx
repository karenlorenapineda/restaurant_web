const contactHighlights = [
  { label: "Direccion", value: "Carrera 7 #72-41, Bogota" },
  { label: "Horario", value: "Mar-Dom, 12:00 p.m. - 10:00 p.m." },
  { label: "Reservas", value: "+57 300 123 4567" },
];

export function ContactSection() {
  return (
    <section
      id="contacto"
      className="flex min-h-[100svh] items-center bg-[#242424] px-5 py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 sm:gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#e8b45f] sm:text-base">
            Reservas y localizacion
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold sm:mt-5 sm:text-6xl">
            Ven con tu familia
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:mt-8 sm:text-lg sm:leading-9">
            Tenemos mesas para grupos, pedidos para recoger y atencion para
            celebraciones familiares alrededor de la brasa.
          </p>

          <div className="mt-8 grid gap-4">
            {contactHighlights.map((item) => (
              <div
                className="rounded-sm bg-[#333333] p-5 sm:p-7"
                key={item.label}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-[#e8b45f] sm:text-sm">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-100 sm:mt-3 sm:text-xl">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              className="inline-flex rounded-sm bg-[#e8b45f] px-5 py-3 font-bold text-zinc-950 transition hover:bg-white"
              href="https://www.google.com/maps/search/?api=1&query=Carrera+7+72+41+Bogota+Colombia"
              rel="noreferrer"
              target="_blank"
            >
              Abrir mapa
            </a>
            <a
              className="inline-flex rounded-sm border border-[#e8b45f] px-5 py-3 font-bold text-white transition hover:bg-[#e8b45f] hover:text-zinc-950"
              href="https://wa.me/573001234567"
              rel="noreferrer"
              target="_blank"
            >
              WhatsApp
            </a>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="overflow-hidden rounded-sm bg-[#333333] shadow-xl shadow-black/30">
            <div className="grid min-h-80 place-items-center bg-[linear-gradient(135deg,rgba(69,10,10,0.86),rgba(9,9,11,0.96)),url('https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=85')] bg-cover bg-center p-8 text-center sm:min-h-[28rem] sm:p-10">
              <div>
                <p className="font-display text-5xl font-bold sm:text-6xl">
                  Picasso
                </p>
                <p className="mt-2 text-sm font-semibold uppercase text-red-200">
                  Restaurante y asadero familiar
                </p>
                <p className="mt-3 text-zinc-200">Bogota, Colombia</p>
                <p className="mt-6 rounded-md border border-white/20 px-4 py-3 text-sm font-semibold text-white">
                  Carrera 7 #72-41
                </p>
              </div>
            </div>
          </div>

          <form className="rounded-sm bg-[#333333] p-5 shadow-xl shadow-black/30 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-zinc-200">
                Nombre
                <input
                  className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-red-900"
                  name="name"
                  placeholder="Tu nombre"
                  type="text"
                />
              </label>
              <label className="block text-sm font-semibold text-zinc-200">
                Telefono
                <input
                  className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-red-900"
                  name="phone"
                  placeholder="+57 300 123 4567"
                  type="tel"
                />
              </label>
            </div>
            <label className="mt-5 block text-sm font-semibold text-zinc-200">
              Mensaje
              <textarea
                className="mt-2 min-h-28 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-red-900"
                name="message"
                placeholder="Reserva familiar, pedido para recoger o evento"
              />
            </label>
            <button
              className="mt-5 rounded-sm bg-[#e8b45f] px-5 py-3 font-bold text-zinc-950 transition hover:bg-white"
              type="button"
            >
              Enviar mensaje
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
