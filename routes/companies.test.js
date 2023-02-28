process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;
beforeEach(async () => {
  const result = db.query(
    `INSERT INTO companies (code, name, description) 
    VALUES ('test', 'TestApple', 'Makes Test OSX') 
    RETURNING code, name, description`
  );
  const result2 = db.query(
    `INSERT INTO invoices 
    (comp_code, amt) 
    VALUES (test, 100) 
    RETURNING comp_code, amt`
  );
  testCompany = result.rows[0];
  testInvoice = result2.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoives;`);
});

afterAll(async () => {
  await db.end();
});
