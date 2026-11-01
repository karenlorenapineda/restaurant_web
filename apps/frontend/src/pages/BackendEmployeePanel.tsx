import { T, t } from "../i18n";
import type { NavigationHandlers } from "../navigation";
import { Button } from "../components/ui/controls";
import {
  MenuManagement,
  EmployeesManagement,
  SuppliesManagement,
  OrdersManagement,
  TabButton,
} from "../features/employee-panel/EmployeePanelSections";
import { useConnectedPanel } from "../features/employee-panel/useConnectedPanel";
import { ConnectedEmployeeChat } from "../features/employee-panel/ConnectedEmployeeChat";
import { useIntegrationCopy } from "../integrationCopy";
import { MOCK_PREVIEW_SESSIONS as DEVELOPMENT_ROLES } from "../mocks/employeePanel";
export function BackendEmployeePanel({
  navigate,
}: Partial<Pick<NavigationHandlers, "navigate">>) {
  const labels = useIntegrationCopy();
  if (!import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_PANEL !== "true")
    return (
      <section className="mx-auto max-w-5xl px-5 py-36">
        <h1 className="font-display text-4xl">{labels.panel}</h1>
        <p className="mt-6">{labels.identity}</p>
      </section>
    );
  return (
    <ConnectedPanel
      navigate={
        navigate ??
        ((path, event) => {
          event.preventDefault();
          window.history.pushState({}, "", path);
          window.dispatchEvent(new PopStateEvent("popstate"));
        })
      }
    />
  );
}
function ConnectedPanel({ navigate }: Pick<NavigationHandlers, "navigate">) {
  const {
    labels,
    session,
    activeTab,
    setActiveTab,
    startPreviewSession,
    logout,
    data,
    sections,
    dishes,
    orders,
    supplies,
    inventory,
    employees,
    isAdmin,
    canViewMenu,
    canAddOrders,
    loading,
    busy,
    error,
    saveMessage,
    refresh,
    draft,
    isCreatingDish,
    selectedDishKey,
    galleryKeys,
    selectDish,
    startNewDish,
    updateDraft,
    saveDish,
    deleteDish,
    toggleGalleryDish,
    addSupply,
    addInventory,
    updateSupply,
    updateInventoryItem,
    saveSupply,
    saveInventory,
    deleteSupply,
    deleteInventoryItem,
    addEmployee,
    updateEmployee,
    saveEmployee,
    removeEmployeeDraft,
    pendingOrder,
    selectedOrderId,
    setSelectedOrderId,
    addOrder,
    confirmPendingOrder,
    cancelPendingOrder,
    updatePendingOrder,
    updatePendingOrderDishQuantity,
    togglePendingRemovedIngredient,
    updateOrder,
  } = useConnectedPanel();
  if (!session) {
    return (
      <section className="flex min-h-screen items-center bg-[linear-gradient(135deg,#120d0b_0%,#26201b_55%,#130d0b_100%)] px-5 py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e8b45f]">
              <T>Employee dashboard preview</T>
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-[0.04em] sm:text-7xl">
              <T>Panel de empleados</T>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-9 text-zinc-300">
              <T>
                Choose a role to preview the dashboard screens. This does not
                authenticate users, grant real permissions, or replace backend
                access control.
              </T>
            </p>
          </div>

          <div className="rounded-md border border-white/10 bg-[#333333] p-6 shadow-2xl shadow-black/40">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e8b45f]">
              <T>Preview role</T>
            </p>
            <div className="mt-5 grid gap-3">
              {DEVELOPMENT_ROLES.map((previewSession) => (
                <button
                  className="rounded-sm border border-white/10 bg-zinc-950 px-5 py-4 text-left transition hover:border-[#e8b45f]"
                  key={previewSession.role}
                  onClick={() => startPreviewSession(previewSession)}
                  type="button"
                >
                  <span className="block font-bold text-white">
                    {t(previewSession.name)}
                  </span>
                  <span className="mt-1 block text-sm text-zinc-400">
                    <T>Role: </T>
                    {previewSession.role}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-5 rounded-sm border border-[#e8b45f]/30 bg-black/25 p-4 text-sm leading-6 text-zinc-300">
              {labels.pending}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#242424_0%,#242424_48%,#242424_100%)] px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid gap-7 lg:grid-cols-[320px_1fr] xl:grid-cols-[340px_1fr]">
          <aside className="rounded-md border border-[#e8b45f]/25 bg-[linear-gradient(180deg,#333333_0%,#242424_100%)] p-6 shadow-2xl shadow-black/35 lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e8b45f]">
              <T>Preview role</T>
            </p>
            <h1 className="mt-3 whitespace-normal break-normal font-display text-[1.7rem] font-bold leading-tight tracking-[0.015em] text-white xl:text-3xl">
              {t(session.name)}
            </h1>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#e8b45f]">
              <T>Rol: </T>
              {session.role}
            </p>
            <div className="mt-6 grid gap-2">
              {canViewMenu ? (
                <>
                  <TabButton
                    active={activeTab === "menu"}
                    label={t("Menu")}
                    onClick={() => setActiveTab("menu")}
                  />
                </>
              ) : null}
              {isAdmin ? (
                <TabButton
                  active={activeTab === "employees"}
                  label={t("Empleados")}
                  onClick={() => setActiveTab("employees")}
                />
              ) : null}
              <TabButton
                active={activeTab === "supplies"}
                label={t("Insumos")}
                onClick={() => setActiveTab("supplies")}
              />
              <TabButton
                active={activeTab === "inventory"}
                label={t("Inventario")}
                onClick={() => setActiveTab("inventory")}
              />
              <TabButton
                active={activeTab === "orders"}
                label={t("Pedidos")}
                onClick={() => setActiveTab("orders")}
              />
              <TabButton
                active={activeTab === "chat"}
                label={t("Chat")}
                onClick={() => setActiveTab("chat")}
              />
            </div>
            <div className="mt-6 grid gap-3 border-t border-white/10 pt-6">
              {isAdmin ? (
                <a
                  className="inline-flex justify-center rounded-sm border border-[#e8b45f] bg-black/15 px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-[#e8b45f] transition hover:bg-[#e8b45f] hover:text-zinc-950"
                  href="/menu"
                  onClick={(event) => navigate("/menu", event)}
                >
                  <T>Ver carta</T>
                </a>
              ) : null}
              <button
                className="rounded-sm border border-white/15 bg-black/15 px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-300 transition hover:bg-white/10"
                onClick={logout}
                type="button"
              >
                <T>Salir</T>
              </button>
            </div>
          </aside>

          <div>
            <div className="rounded-md border border-white/10 bg-[#333333] p-5 shadow-2xl shadow-black/30 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e8b45f]">
                <T>Panel de empleados</T>
              </p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-[0.035em] sm:text-6xl">
                <T>Gestion interna del asadero</T>
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-9 text-zinc-300">
                {labels.pending}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                disabled={busy || loading}
                onClick={() => void refresh()}
              >
                {labels.retry}
              </Button>
              {loading && <p role="status">{labels.load}…</p>}
              {saveMessage && (
                <p role="status" className="text-green-200">
                  {saveMessage}
                </p>
              )}
            </div>
            {error && (
              <p
                role="alert"
                className="mt-4 rounded border border-red-400/40 bg-red-950/20 p-4 text-red-200"
              >
                {error}
              </p>
            )}
            <fieldset disabled={busy || loading} className="min-w-0">
              {activeTab === "menu" && canViewMenu ? (
                <MenuManagement
                  apiMode
                  units={data.units}
                  canEdit={isAdmin}
                  dishes={dishes}
                  draft={draft}

                  galleryKeys={galleryKeys}
                  isCreatingDish={isCreatingDish}
                  saveDish={saveDish}
                  saveMessage=""
                  sections={sections}
                  selectedDishKey={selectedDishKey}
                  selectDish={selectDish}
                  startNewDish={startNewDish}
                  supplies={supplies}
                  deleteDish={deleteDish}

                  toggleGalleryDish={toggleGalleryDish}
                  updateDraft={updateDraft}
                />
              ) : null}

              {activeTab === "employees" && isAdmin ? (
                <EmployeesManagement
                  apiMode
                  restaurants={data.restaurants}
                  onSave={saveEmployee}
                  employees={employees}
                  isAdmin={isAdmin}
                  onAdd={addEmployee}
                  onDelete={removeEmployeeDraft}
                  onUpdate={updateEmployee}
                />
              ) : null}

              {activeTab === "supplies" ? (
                <SuppliesManagement
                  apiMode
                  units={data.units}
                  addLabel={t("Anadir insumo")}
                  canEdit={isAdmin}
                  description={labels.stockNote}
                  emptyReadOnlyMessage={t(
                    "Vista de consulta para empleados: puedes revisar existencias, costos y minimos, pero la edicion queda para administracion.",
                  )}
                  itemNameLabel={t("Insumo")}
                  items={supplies}
                  onAdd={addSupply}
                  onSave={saveSupply}
                  onDelete={deleteSupply}
                  onUpdate={updateSupply}
                  title={t("Gestion de insumos")}
                />
              ) : null}

              {activeTab === "inventory" ? (
                <SuppliesManagement
                  apiMode
                  units={data.units}
                  addLabel={t("Anadir inventario")}
                  canEdit={isAdmin}
                  description={t(
                    "Inventario en bruto o pendiente de preparar. Por ahora es una lista independiente y no se conecta con recetas, pedidos ni descuentos de stock.",
                  )}
                  emptyReadOnlyMessage={t(
                    "Vista de consulta: este inventario todavia no afecta pedidos ni insumos preparados.",
                  )}
                  itemNameLabel={t("Articulo")}
                  items={inventory}
                  onAdd={addInventory}
                  onSave={saveInventory}
                  onDelete={deleteInventoryItem}
                  onUpdate={updateInventoryItem}
                  title={t("Inventario")}
                />
              ) : null}

              {activeTab === "orders" ? (
                <OrdersManagement
                  apiMode
                  canEdit={canAddOrders}
                  canViewRecipe={canViewMenu}
                  dishes={dishes}
                  onAdd={addOrder}
                  onCancelPending={cancelPendingOrder}
                  onConfirmPending={confirmPendingOrder}
                  onDelete={(id) => updateOrder(id, "status", "cancelled")}
                  onSelect={setSelectedOrderId}
                  onTogglePendingRemovedIngredient={
                    togglePendingRemovedIngredient
                  }
                  onToggleRemovedIngredient={() => {}}
                  onUpdate={updateOrder}
                  onUpdateDishQuantity={() => {}}
                  onUpdatePending={updatePendingOrder}
                  onUpdatePendingDishQuantity={updatePendingOrderDishQuantity}
                  orders={orders}
                  pendingOrder={pendingOrder}
                  selectedOrderId={selectedOrderId}
                />
              ) : null}

              {activeTab === "chat" ? (
                <ConnectedEmployeeChat
                  employees={employees}
                  session={session}
                />
              ) : null}
            </fieldset>
          </div>
        </div>
      </div>
    </section>
  );
}
