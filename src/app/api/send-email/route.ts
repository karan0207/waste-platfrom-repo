import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  const { task, imageUrl } = await request.json();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'cselaba16@gmail.com', // Replace with the recipient's email
    subject: 'Waste Collection Report',
    html: `
      <h1>Waste Collection Report</h1>
      <p>Here are the details of the waste collection:</p>
      <ul>
        <li><strong>Location:</strong> ${task.location}</li>
        <li><strong>Waste Type:</strong> ${task.wasteType}</li>
      </ul>
      <p>Image of the collected waste:</p>
      <img src="cid:collectedWaste" alt="Collected Waste" style="max-width: 100%; height: auto;">
      <p>Thank you for contributing to a cleaner environment!</p>
    `,
    attachments: [
      {
        filename: 'collected-waste.png',
        content: imageUrl.split('base64,')[1], // Extract the base64 content
        encoding: 'base64',
        cid: 'collectedWaste', // Use this CID in the HTML
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
} 
