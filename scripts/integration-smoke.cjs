// Only run against the disposable picasso_integration database.
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");
const { io } = require("socket.io-client");
const { createServer } = require("node:net");
const { once } = require("node:events");
if (
  new URL(process.env.DATABASE_URL || "http://invalid").pathname !==
  "/picasso_integration"
)
  throw new Error("Use only the disposable picasso_integration database");
const prisma = new PrismaClient();
const port = 3001;
const backendBase = `http://127.0.0.1:${port}`;
const frontendPort = 5175;
const base = `http://127.0.0.1:${frontendPort}`;
let frontend;
let backend;
const clients = [];
async function api(path, method = "GET", body) {
  const response = await fetch(`${base}/api/${path}`, {
    method,
    signal: AbortSignal.timeout(10000),
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  assert.ok(response.ok, `${method} ${path}: ${JSON.stringify(data)}`);
  return data;
}
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const emit = (socket, event, payload) =>
  new Promise((resolve, reject) =>
    socket
      .timeout(5000)
      .emit(event, payload, (error, data) =>
        error ? reject(error) : resolve(data),
      ),
  );
async function connect() {
  const client = io(base, {
    transports: ["websocket"],
    timeout: 5000,
    reconnection: false,
  });
  clients.push(client);
  await new Promise((resolve, reject) => {
    client.once("connect", resolve);
    client.once("connect_error", reject);
  });
  return client;
}
async function waitForUrl(url, errors = () => "") {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return;
    } catch {}
    await pause(100);
  }
  throw new Error(`Service did not start at ${url}: ${errors()}`);
}
async function checkPort(port) {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  await new Promise((resolve) => server.close(resolve));
}
async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, "exit");
  child.kill("SIGTERM");
  let timer;
  try {
    await Promise.race([
      exited,
      new Promise((resolve) => {
        timer = setTimeout(() => {
          child.kill("SIGKILL");
          resolve();
        }, 3000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
async function startBackend() {
  const child = spawn(process.execPath, ["apps/backend/dist/main.js"], {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  backend = child;
  child.stderr.on("data", (chunk) => (stderr += chunk));
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      ready = (
        await fetch(`${backendBase}/api/health`, {
          signal: AbortSignal.timeout(1000),
        })
      ).ok;
      if (ready) break;
    } catch {}
    await pause(100);
  }
  assert.ok(ready, `Backend did not start: ${stderr}`);
  return child;
}
async function main() {
  await checkPort(port);
  await checkPort(frontendPort);
  assert.equal(await prisma.user.count(), 0, "Use a fresh disposable database");
  const role = await prisma.userRole.create({ data: { name: "Integration" } });
  const language = await prisma.language.create({
    data: { code: "es", name: "Español" },
  });
  const restaurant = await prisma.restaurant.create({
    data: { name: "Integration", address: "Test" },
  });
  const position = await prisma.employeePosition.create({
    data: { name: "Service" },
  });
  const user = await prisma.user.create({
    data: {
      email: "one@integration.local",
      roleId: role.id,
      languageId: language.id,
    },
  });
  const other = await prisma.user.create({
    data: {
      email: "two@integration.local",
      roleId: role.id,
      languageId: language.id,
    },
  });
  const initialEmployee = await prisma.employee.create({
    data: {
      firstName: "Test",
      lastName: "Employee",
      userId: user.id,
      restaurantId: restaurant.id,
      positionId: position.id,
    },
  });
  const category = await prisma.menuCategory.create({
    data: { name: "Integration" },
  });
  const unit = await prisma.unitOfMeasure.create({
    data: { name: "Gram", abbreviation: "g", type: "weight", baseFactor: 1 },
  });
  backend = await startBackend();
  frontend = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "apps/frontend",
      "--host",
      "127.0.0.1",
      "--port",
      String(frontendPort),
      "--strictPort",
    ],
    {
      env: {
        ...process.env,
        VITE_DATA_MODE: "api",
        BACKEND_PROXY_TARGET: backendBase,
      },
      stdio: ["ignore", "ignore", "pipe"],
    },
  );
  let frontendErrors = "";
  frontend.stderr.on("data", (chunk) => (frontendErrors += chunk));
  await waitForUrl(base, () => frontendErrors);
  assert.match(await (await fetch(base)).text(), /src\/main.tsx/);
  assert.equal((await api("health")).status, "ok");
  const table = await prisma.table.create({
    data: { tableNumber: "Terraza 7", capacity: 4 },
  });
  assert.deepEqual(await api("tables"), [table]);
  assert.deepEqual(await api("employees/positions"), [
    { id: position.id, name: position.name },
  ]);
  const createdEmployee = await api("employees", "POST", {
    userId: other.id,
    firstName: "Ana",
    lastName: "García López",
    restaurantId: restaurant.id,
    positionId: position.id,
  });
  await api(`employees/${createdEmployee.id}`, "PATCH", {
    firstName: "Ana María",
    phone: "600000123",
  });
  assert.equal(
    (await api("employees")).find((row) => row.id === createdEmployee.id)
      .firstName,
    "Ana María",
  );
  const supply = await api("supplies", "POST", {
    name: "Flour",
    unitId: unit.id,
    unitCost: 1.5,
    currentStock: 1000,
    minimumStock: 50,
  });
  const dish = await api("menu", "POST", {
    name: "Pizza integration",
    price: 25000.5,
    categoryId: category.id,
    isFavorite: true,
    showImageInGallery: true,
    ingredients: [{ ingredientId: supply.id, quantity: 100, unitId: unit.id }],
  });
  const publicMenu = await api("menu");
  assert.equal(publicMenu[0].items[0].description, null);
  assert.equal(publicMenu[0].items[0].featured, true);
  assert.equal(publicMenu[0].items[0].price, "$25.000,5 COP");
  assert.equal((await api("menu/featured"))[0].id, dish.id);
  const stock = await api("inventory", "POST", {
    name: "Napkins",
    unitId: unit.id,
    unitCost: 3,
    currentStock: 20,
  });
  await api(`inventory/${stock.id}`, "PATCH", { currentStock: 18 });
  assert.equal((await api("inventory"))[0].stock, "18");
  const dineIn = await api("orders", "POST", {
    type: "dine_in",
    tableId: table.id,
    items: [{ itemId: dish.id, quantity: 1 }],
  });
  assert.equal(
    (await api(`orders/${dineIn.id}`)).tableOrLocation,
    "Mesa Terraza 7",
  );
  await api(`orders/${dineIn.id}/status`, "PATCH", { status: "cancelled" });
  assert.equal((await api("supplies"))[0].stock, "1000");
  const order = await api("orders", "POST", {
    type: "delivery",
    customerName: "Ana",
    customerPhone: "600123456",
    customerAddress: "Test address",
    items: [{ itemId: dish.id, quantity: 2 }],
  });
  assert.equal(order.total, "50001");
  const statusResponses = await Promise.all([
    fetch(`${base}/api/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "preparing" }),
    }),
    fetch(`${base}/api/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "preparing" }),
    }),
  ]);
  assert.equal(statusResponses.filter((response) => response.ok).length, 1);
  assert.equal((await api("supplies"))[0].stock, "800");
  await api(`orders/${order.id}/status`, "PATCH", { status: "ready" });
  await api(`orders/${order.id}/status`, "PATCH", { status: "completed" });
  assert.equal((await api(`orders/${order.id}`)).status, "completed");
  await api(`menu/${dish.id}`, "DELETE");
  assert.equal((await api("menu/management"))[0].active, false);
  assert.equal((await api("menu"))[0].items.length, 0);
  const recipe = Object.values(await api("recipes"))[0].ingredients[0];
  await api("recipes", "PATCH", {
    ingredients: [{ id: recipe.id, quantity: 90 }],
  });
  await api(`employees/${initialEmployee.id}/deactivate`, "PATCH");
  assert.equal(
    (await api("employees")).find((row) => row.id === initialEmployee.id)
      .active,
    false,
  );
  await api(`employees/${initialEmployee.id}/activate`, "PATCH");
  const sender = await connect();
  const receiver = await connect();
  await emit(receiver, "join", { userId: other.id });
  const delivered = new Promise((resolve) =>
    receiver.once("newMessage", resolve),
  );
  const ack = await emit(sender, "sendMessage", {
    senderId: user.id,
    receiverId: other.id,
    message: "Integration hello",
  });
  const incoming = await Promise.race([
    delivered,
    pause(5000).then(() => {
      throw new Error("Chat delivery timeout");
    }),
  ]);
  assert.equal(incoming.id, ack.id);
  assert.equal(
    (await api(`chat/conversation/${user.id}/${other.id}`))[0].message,
    "Integration hello",
  );
  const storedMessage = await prisma.chatMessage.findUniqueOrThrow({
    where: { id: ack.id },
  });
  assert.notEqual(storedMessage.message, "Integration hello");
  sender.disconnect();
  receiver.disconnect();
  await stop(backend);
  backend = await startBackend();
  assert.equal((await api(`orders/${order.id}`)).status, "completed");
  assert.equal((await api("supplies"))[0].stock, "800");
  assert.equal((await api("menu/management"))[0].active, false);
  assert.equal(
    (await api("employees")).find((row) => row.id === createdEmployee.id)
      .firstName,
    "Ana María",
  );
  assert.deepEqual(await api("tables"), [table]);
  assert.equal(
    Object.values(await api("recipes"))[0].ingredients[0].quantity,
    "90",
  );
  assert.equal(
    (await api(`chat/conversation/${user.id}/${other.id}`))[0].message,
    "Integration hello",
  );
  const reconnectedReceiver = await connect();
  await emit(reconnectedReceiver, "join", { userId: other.id });
  const afterRestart = new Promise((resolve) =>
    reconnectedReceiver.once("newMessage", resolve),
  );
  const reconnectedSender = await connect();
  await emit(reconnectedSender, "sendMessage", {
    senderId: user.id,
    receiverId: other.id,
    message: "After restart",
  });
  const restored = await Promise.race([
    afterRestart,
    pause(5000).then(() => {
      throw new Error("Chat after restart timed out");
    }),
  ]);
  assert.equal(restored.message, "After restart");
  await api(`inventory/${stock.id}`, "DELETE");
  console.log(
    "PASS: real PostgreSQL + frontend HTTP/WebSocket proxy; employee/position/table catalogs; CRUD; decimal totals; dine-in/delivery orders; concurrent stock deduction; recipes; backend restart persistence; encrypted chat history and delivery after reconnect.",
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    clients.forEach((client) => client.disconnect());
    await stop(frontend);
    await stop(backend);
    await prisma.$disconnect();
  });
