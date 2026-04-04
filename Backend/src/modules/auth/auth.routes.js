import express from "express";

const router = express.Router();

router.post("/register", (req, res) => {
    res.json({message:"register route works"});
});

export default router;


