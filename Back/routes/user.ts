const express = require('express');


const router = express.router();

router.get('/:id', getUser);

router.post('/', addUser);

router.delete('/:id', deleteUser);

