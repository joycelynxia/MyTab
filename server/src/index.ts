import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from './generated/prisma';
import groupRoutes from './routes/groupRoutes';
import memberRoutes from './routes/memberRoutes'
import expenseRoutes from './routes/expenseRoutes'
import settlementRoutes from './routes/settlementRoutes'
import receiptRoutes from './routes/receiptRoutes'

dotenv.config();
const app = express()
const prisma = new PrismaClient()

// app.use(cors())
// app.use(cors({
//   origin: 'http://localhost:5173', // frontend URL
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
// }));

app.use(cors({
  origin: 'http://localhost:5173', // your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


app.use(express.json({ limit: "10mb" }))

app.use('/groups', groupRoutes)
app.use('/members', memberRoutes)
app.use('/expenses', expenseRoutes)
app.use('/settlements', settlementRoutes)
app.use('/receipts', receiptRoutes)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`server running on port ${PORT}`))

