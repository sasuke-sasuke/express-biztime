const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

// Gets All companies in DB reutrns JSON
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT code, name FROM companies;`);
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

// Gets a single company by 'code' returns company and invoices in JSON
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(
      `SELECT code, name, description 
      FROM companies 
      WHERE code=$1`,
      [code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Company code ${code} not found`, 404);
    }
    const { company, name, description } = results.rows[0];
    const invResults = await db.query(
      `SELECT  id, amt, paid, add_date, paid_date FROM invoices WHERE comp_code=$1`,
      [code]
    );
    return res.json({
      code,
      company,
      name,
      description,
      invoices: invResults.rows,
    });
  } catch (e) {
    return next(e);
  }
});
// Add a new company with {code, name, description}; Returns JSON of added company
router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const results = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *",
      [code, name, description]
    );
    return res.status(201).json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});
// Updates a company by 'code' Returns company updated as JSON
router.patch("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const result = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`,
      [name, description, code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Can't update unkown company code ${code}`, 404);
    }
    return res.json({ company: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// Deletes a company by 'code'
router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    // Checks if code exists {if theres a better way please lmk}
    const check = await db.query(`SELECT code FROM companies WHERE code=$1`, [
      code,
    ]);
    if (check.rows.length === 0) {
      throw new ExpressError(`Can't delete unknown company code ${code}`, 404);
    }
    const result = await db.query(`DELETE FROM companies WHERE code=$1`, [
      code,
    ]);
    return res.json({ status: "deleted!" });
  } catch (e) {
    return next(e);
  }
});

router.patch;

module.exports = router;
