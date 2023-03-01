process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;
beforeEach(async () => {
  const result = await db.query(
    `INSERT INTO companies (code, name, description) 
    VALUES ('test', 'TestApple', 'Make Test OSX') 
    RETURNING code, name, description`
  );
  testCompany = result.rows[0];
  const result2 = await db.query(
    `INSERT INTO invoices
      (comp_code, amt)
      VALUES ('test', 100)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`
  );
  testInvoice = result2.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices;`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /invoices", () => {
  test("Get all invoices", async () => {
    const res = await request(app).get(`/invoices`);
    expect(res.statusCode).toBe(200);
    expect(res.body.invoices[0]).toEqual({
      id: testInvoice.id,
      comp_code: testInvoice.comp_code,
    });
  });
});

describe("GET /invoices:id", () => {
  test("Get a single invoice by id", async () => {
    const res = await request(app).get(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: testInvoice.id,
        comp_code: "test",
        amt: 100,
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
      },
    });
  });
  test("Responds with 404 for invalid id", async () => {
    const res = await request(app).get(`/invoices/120000`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /invoices", () => {
  test("Add a invoice", async () => {
    const res = await request(app)
      .post("/invoices")
      .send({ comp_code: "test", amt: 150 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: "test",
        amt: 150,
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
      },
    });
  });
});

describe("PATCH /invoice:id", () => {
  test("update a invoice", async () => {
    const res = await request(app)
      .patch(`/invoices/${testInvoice.id}`)
      .send({ amt: 240 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: testInvoice.id,
        comp_code: "test",
        amt: 240,
        paid: false,
        add_date: expect.anything(),
        paid_date: null,
      },
    });
  });

  test("Responds with 404 for invalid id", async () => {
    const res = await request(app).patch(`/invoice/33874`);
    expect(res.statusCode).toBe(404);
  });

  test("Responds 404 for correct code but empty data", async () => {
    const res = await request(app)
      .patch(`/invoices/${testInvoice.id}`)
      .send({});
  });
});

describe("DELETE /invoices:id", () => {
  test("delete a invoice", async () => {
    const res = await request(app).delete(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" });
  });

  test("Responds with 404 for invalid id", async () => {
    const res = await request(app).delete(`/invoices/56786`);
    expect(res.statusCode).toBe(404);
  });
});
