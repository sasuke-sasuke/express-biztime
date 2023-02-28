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
      RETURNING comp_code, amt`
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

describe("GET /companies", () => {
  test("Get all companies", async () => {
    const res = await request(app).get(`/companies`);
    expect(res.statusCode).toBe(200);
    expect(res.body.companies[0]).toEqual({
      code: testCompany.code,
      name: testCompany.name,
    });
  });
});

describe("GET /companies:code", () => {
  test("Get single company by code", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
  });
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).get(`/companies/120000`);
    expect(res.statusCode).toBe(404);
  });
  test("Responds with company data and invoices", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    expect(res.body.invoices.length).toEqual(1);
    expect(res.body.invoices[0].amt).toEqual(100);
  });
});

describe("POST /companies", () => {
  test("Add a company", async () => {
    const res = await request(app)
      .post("/companies")
      .send({ code: "amz", name: "Amazon", description: "Bezos" });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: {
        code: "amz",
        name: "Amazon",
        description: "Bezos",
      },
    });
  });

  test("Responds 404 for no data in request", async () => {
    const res = await request(app).post("/companies").send({});
    expect(res.statusCode).toBe(404);
  });
});

describe("PATCH /companies:code", () => {
  test("update a company", async () => {
    const res = await request(app)
      .patch(`/companies/${testCompany.code}`)
      .send({ name: "UpdatedTest", description: "UpdatedDescript" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: "test",
        name: "UpdatedTest",
        description: "UpdatedDescript",
      },
    });
  });

  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).patch(`/companies/rteyei`);
    expect(res.statusCode).toBe(404);
  });

  test("Responds 404 for correct code but empty data", async () => {
    const res = await request(app)
      .patch(`/companies/${testCompany.code}`)
      .send({});
  });
});

describe("DELETE /companies:code", () => {
  test("delete a company", async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" });
  });

  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).delete(`/companies/rteyei`);
    expect(res.statusCode).toBe(404);
  });
});
