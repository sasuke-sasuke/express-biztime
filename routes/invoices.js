const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

// Get all invoices {id, comp_code}
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT id, comp_code FROM invoices");
    return res.json({ invoices: results.rows });
  } catch (e) {
    return next(e);
  }
});
// Get a single invoice by id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id]);
    if (result.rows.length === 0) {
      throw new ExpressError(`Cant find id of ${id}`, 404);
    }
    return res.json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});
// Create a new invoice with {comp_code, amt}
router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    if (comp_code === null || amt === null) {
      throw new ExpressError("Must include data to add invoice", 404);
    }
    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`,
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});
// Update invoice by id with amt
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt } = req.body;
    const result = await db.query(
      `UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *`,
      [amt, id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Cant find invoice of id ${id}`);
    }
    return res.json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// Delete invoice by ID
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const check = await db.query(`SELECT id FROM invoices WHERE id=$1`, [id]);

    if (check.rows.length === 0) {
      throw new ExpressError(`Can't delete unknown invoice id ${id}`, 404);
    }
    const result = await db.query(`DELETE FROM invoices WHERE id=$1`, [id]);
    res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
