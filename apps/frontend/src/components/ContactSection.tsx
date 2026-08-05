const contactHighlights = [
  { label: "Direccion", value: "Carrera 7 #72-41, Bogota" },
  { label: "Horario", value: "Mar-Dom, 12:00 p.m. - 10:00 p.m." },
  { label: "Reservas", value: "+57 300 123 4567" },
];

export function ContactSection() {
  return (
    <section
      id="contacto"
      className="flex min-h-screen items-center border-y border-red-950 bg-[linear-gradient(180deg,#18181b_0%,#111113_100%)] px-5 py-24"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase text-red-800">
            Contacto y localizacion
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            Encuentranos en Bogota
          </h2>
          <p className="mt-5 max-w-xl leading-8 text-zinc-300">
            Estamos en una zona facil de llegar, con atencion para reservas,
            celebraciones pequenas y pedidos para recoger.
          </p>

          <div className="mt-8 grid gap-4">
            {contactHighlights.map((item) => (
              <div
                className="rounded-lg border border-red-950 bg-zinc-950 p-5"
                key={item.label}
              >
                <p className="text-xs font-bold uppercase text-red-800">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              className="inline-flex rounded-md bg-red-950 px-5 py-3 font-bold text-white transition hover:bg-red-900"
              href="https://www.google.com/maps/search/?api=1&query=Carrera+7+72+41+Bogota+Colombia"
              rel="noreferrer"
              target="_blank"
            >
              Abrir mapa
            </a>
            <a
              className="inline-flex rounded-md border border-red-900 px-5 py-3 font-bold text-white transition hover:bg-red-950"
              href="https://wa.me/573001234567"
              rel="noreferrer"
              target="_blank"
            >
              WhatsApp
            </a>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="overflow-hidden rounded-lg border border-red-950 bg-zinc-950 shadow-xl shadow-black/30">
            <div className="grid min-h-80 place-items-center bg-[linear-gradient(135deg,rgba(69,10,10,0.86),rgba(9,9,11,0.96)),url('https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=85')] bg-cover bg-center p-8 text-center">
              <div>
                <p className="font-display text-5xl font-bold">Picasso</p>
                <p className="mt-3 text-zinc-200">Bogota, Colombia</p>
                <p className="mt-6 rounded-md border border-white/20 px-4 py-3 text-sm font-semibold text-white">
                  Carrera 7 #72-41
                </p>
              </div>
            </div>
          </div>

          <form className="rounded-lg border border-red-950 bg-zinc-950 p-6 shadow-xl shadow-black/30">
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
                placeholder="Reserva, evento o consulta"
              />
            </label>
            <button
              className="mt-5 rounded-md bg-red-950 px-5 py-3 font-bold text-white transition hover:bg-red-900"
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
