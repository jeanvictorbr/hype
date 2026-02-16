const { PrismaClient } = require('@prisma/client');

// Instancia o Prisma uma única vez para o bot inteiro usar
const prisma = new PrismaClient();

module.exports = { prisma };