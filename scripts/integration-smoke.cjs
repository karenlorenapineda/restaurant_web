// Only run against the disposable picasso_integration database.
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");
const { io } = require("socket.io-client");
if (
  new URL(process.env.DATABASE_URL || "http://invalid").pathname !==
  "/picasso_integration"
)
  throw new Error("Use only the disposable picasso_integration database");
const prisma = new PrismaClient();
const port = 3001;
const base = `http://127.0.0.1:${port}`;
let backend;
const clients = [];
async function api(path, method = "GET", body) {
  const response = await fetch(`${base}/api/${path}`, {
    method,
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
  const client = io(base);
  clients.push(client);
  await new Promise((resolve, reject) => {
    client.once("connect", resolve);
    client.once("connect_error", reject);
  });
  return client;
}
async function main() {
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
  await prisma.employee.create({
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
  backend = spawn(process.execPath, ["apps/backend/dist/main.js"], {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  backend.stderr.on("data", (chunk) => (stderr += chunk));
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      ready = (await fetch(`${base}/api/health`)).ok;
      if (ready) break;
    } catch {}
    await pause(100);
  }
  assert.ok(ready, `Backend did not start: ${stderr}`);
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
  await api(`employees/1/deactivate`, "PATCH");
  assert.equal((await api("employees"))[0].active, false);
  await api("employees/1/activate", "PATCH");
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
  await api(`inventory/${stock.id}`, "DELETE");
  console.log(
    "PASS: HTTP CRUD, nullable menu, decimal totals, order states, concurrent stock deduction, soft deletion, recipes, employees and Socket.IO history/delivery.",
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    clients.forEach((client) => client.disconnect());
    if (backend) backend.kill("SIGTERM");
    await prisma.$disconnect();
  });
