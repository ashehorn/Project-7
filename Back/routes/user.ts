import express from "express";

const router = express.Router();

router.get('/:id', getUser);

router.post('/', addUser);

router.delete('/:id', deleteUser);

