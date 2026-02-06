import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { PrismaClient } from './generated/prisma';
import authRoutes from './routes/authRoutes';
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

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


app.use(express.json({ limit: "50mb" }))
app.use(cookieParser(process.env.COOKIE_SECRET || "dev-cookie-secret-change-in-production"))

app.use('/auth', authRoutes)
app.use('/groups', groupRoutes)
app.use('/members', memberRoutes)
app.use('/expenses', expenseRoutes)
app.use('/settlements', settlementRoutes)
app.use('/receipts', receiptRoutes)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`server running on port ${PORT}`))

