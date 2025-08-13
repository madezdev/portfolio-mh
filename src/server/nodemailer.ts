import nodemailer from 'nodemailer'
import { config } from 'dotenv'

config()

const email = process.env.SMTP_USER
const pass = process.env.SMTP_PASS

export const transporter = nodemailer.createTransport({
  service: 'gmail',  
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: email,
    pass: pass
  }
})

export const mailOptions = {
  to: email,
}