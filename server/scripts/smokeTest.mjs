// Backend smoke test of the endpoints added for the frontend (route-order fix, guest ownership,
// public + /my routes). It stubs the Mongoose models, so it needs NO database:  npm run smoke
process.env.JWT_SECRET = "testsecret"; process.env.NODE_ENV = "test"; process.env.CLIENT_URL = "http://localhost:5173";
const root = process.cwd();
const { default: request } = await import(root + "/node_modules/supertest/index.js");
const { default: jwt } = await import(root + "/node_modules/jsonwebtoken/index.js");
const { default: User } = await import(root + "/src/models/User.mjs");
const { default: ServiceRequest } = await import(root + "/src/models/ServiceRequest.mjs");
const { default: Service } = await import(root + "/src/models/Service.mjs");
const { default: RoomType } = await import(root + "/src/models/RoomType.mjs");
const { default: Reservation } = await import(root + "/src/models/Reservation.mjs");
const { default: Guest } = await import(root + "/src/models/Guest.mjs");

const chain = (result) => { const p = new Proxy(function(){}, { get: (_, k) => k === "then" ? (res, rej) => Promise.resolve(result).then(res, rej) : () => p, apply: () => p }); return p; };
const users = {
  admin: { _id: "64b000000000000000000001", role: "Admin", isActive: true, email: "a@x.com", firstName: "A", lastName: "B" },
  guestA: { _id: "64b000000000000000000002", role: "Guest", isActive: true, email: "ga@x.com", firstName: "G", lastName: "A" },
};
User.findById = (id) => ({ select: async () => Object.values(users).find(u => u._id === String(id)) });
ServiceRequest.find = () => chain([{ _id: "r1" }]);
ServiceRequest.countDocuments = async () => 1;
Service.find = () => chain([]);
const tok = (u) => "Bearer " + jwt.sign({ userId: u._id }, "testsecret");

const { default: app } = await import(root + "/src/app.mjs");
const results = [];
const check = (name, ok, extra="") => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (extra ? "  -> " + extra : "")); };

let r = await request(app).get("/api/health"); check("health", r.status === 200);

r = await request(app).get("/api/services/requests").set("Authorization", tok(users.admin));
check("GET /api/services/requests reaches the list handler (route-order fix)", r.status === 200 && Array.isArray(r.body.data), `status ${r.status} ${r.body.message || ""}`);


const { default: Setting } = await import(root + "/src/models/Setting.mjs");
const { default: Room } = await import(root + "/src/models/Room.mjs");
const OID = (n) => "64c0000000000000000000" + String(n).padStart(2, "0");
Setting.findOne = () => chain({ hotelName: "LuxuryStay", currency: "PKR", taxEnabled: true, taxPercentage: 10, serviceChargeEnabled: false });
r = await request(app).get("/api/public/hotel");
check("GET /api/public/hotel (no login)", r.status === 200 && r.body.data?.hotelName === "LuxuryStay", "status " + r.status);

RoomType.find = () => chain([{ name: "Deluxe", basePrice: 100 }]);
r = await request(app).get("/api/public/room-types");
check("GET /api/public/room-types (no login)", r.status === 200 && r.body.count === 1);

r = await request(app).get("/api/public/availability?roomType=bad");
check("public availability validates input -> 400", r.status === 400, JSON.stringify(r.body.errors || r.body.message));

const type = { _id: OID(10), name: "Deluxe", basePrice: 100, capacity: 2, isActive: true };
RoomType.findById = async () => type;
Room.find = () => chain([{ _id: OID(20), roomNumber: "101", price: null }]);
Reservation.find = () => chain([]);
r = await request(app).get(`/api/public/availability?roomType=${OID(10)}&checkInDate=2030-01-01&checkOutDate=2030-01-03`);
check("public availability counts free rooms", r.status === 200 && r.body.count === 1, JSON.stringify(r.body));

r = await request(app).get("/api/my/reservations");
check("/api/my/reservations needs login -> 401", r.status === 401);
r = await request(app).get("/api/my/reservations").set("Authorization", tok(users.admin));
check("/api/my/reservations rejects staff -> 403", r.status === 403);

// guest A booking
const guestProfile = { _id: OID(30), email: "ga@x.com", isActive: true, phone: "0300" };
Guest.findOne = async () => guestProfile;
Guest.create = async (d) => ({ ...d, _id: OID(30), isActive: true });
User.find = () => chain([]);
let created = null;
Reservation.create = async (d) => (created = { ...d, _id: OID(40) });
Reservation.findById = () => chain(created || { _id: OID(40), bookingId: "X", guest: { email: "other@x.com" } });
r = await request(app).post("/api/my/reservations").set("Authorization", tok(users.guestA)).send({ roomType: OID(10), checkInDate: "2030-01-01", checkOutDate: "2030-01-03", adults: 2 });
check("guest can book online -> 201", r.status === 201 && created, `status ${r.status} ${r.body.message || ""}`);
check("booking is PENDING / ONLINE with a room assigned", created?.status === "PENDING" && created?.bookingSource === "ONLINE" && created?.room === OID(20));
check("tax computed from settings (10% of 200 = 20, total 220)", created?.tax === 20 && created?.totalAmount === 220, `tax ${created?.tax} total ${created?.totalAmount}`);

r = await request(app).post("/api/my/reservations").set("Authorization", tok(users.guestA)).send({ roomType: OID(10), checkInDate: "2030-01-01", checkOutDate: "2030-01-03", adults: 5 });
check("over-capacity booking rejected -> 400", r.status === 400, r.body.message);
r = await request(app).post("/api/my/reservations").set("Authorization", tok(users.guestA)).send({ roomType: OID(10), checkInDate: "2020-01-01", checkOutDate: "2020-01-03" });
check("past dates rejected -> 400", r.status === 400, r.body.message);

// IDOR fix
const reserv = (email) => ({ _id: OID(50), bookingId: "B1", guest: { email } });
Reservation.findById = () => chain(reserv("someone-else@x.com"));
r = await request(app).get(`/api/reservations/${OID(50)}`).set("Authorization", tok(users.guestA));
check("guest cannot read ANOTHER guest's reservation -> 403 (IDOR fix)", r.status === 403, r.body.message);
Reservation.findById = () => chain(reserv("ga@x.com"));
r = await request(app).get(`/api/reservations/${OID(50)}`).set("Authorization", tok(users.guestA));
check("guest can read OWN reservation -> 200", r.status === 200);
Reservation.findById = () => chain(reserv("someone-else@x.com"));
r = await request(app).get(`/api/reservations/${OID(50)}`).set("Authorization", tok(users.admin));
check("staff can still read any reservation -> 200", r.status === 200);

r = await request(app).put("/api/my/profile").set("Authorization", tok(users.admin)).send({ firstName: "" });
check("profile update validates -> 400", r.status === 400, JSON.stringify(r.body.errors));


// ---- guest maintenance reporting
const { default: MaintenanceRequest } = await import(root + "/src/models/MaintenanceRequest.mjs");
let mCreated = null;
MaintenanceRequest.create = async (d) => (mCreated = { ...d, _id: OID(60) });
MaintenanceRequest.findById = () => chain({ _id: OID(60), title: "AC not cooling", room: { roomNumber: "101" } });
MaintenanceRequest.find = () => chain([{ _id: OID(60), title: "AC not cooling" }]);
Reservation.findOne = async (q) => (q.status ? null : { _id: OID(70), status: "CHECKED_IN", room: OID(20), guest: OID(30) });
r = await request(app).post("/api/my/maintenance").set("Authorization", tok(users.guestA)).send({ reservation: OID(70), title: "AC not cooling", description: "Room is warm", category: "HVAC", priority: "HIGH" });
check("guest can report a maintenance issue for own checked-in stay -> 201", r.status === 201 && mCreated?.room === OID(20) && mCreated?.status === "OPEN", `status ${r.status} ${r.body.message || ""}`);
r = await request(app).post("/api/my/maintenance").set("Authorization", tok(users.guestA)).send({ reservation: OID(70), title: "", description: "x" });
check("maintenance report validates input -> 400", r.status === 400);
r = await request(app).get("/api/my/maintenance").set("Authorization", tok(users.guestA));
check("guest can list own maintenance reports", r.status === 200 && r.body.data.length === 1);
r = await request(app).post("/api/my/maintenance").set("Authorization", tok(users.admin)).send({ reservation: OID(70), title: "t", description: "d" });
check("staff cannot use the guest-only endpoint -> 403", r.status === 403);

console.log(`\n${results.filter(Boolean).length}/${results.length} backend checks passed`);
process.exit(results.every(Boolean) ? 0 : 1);
