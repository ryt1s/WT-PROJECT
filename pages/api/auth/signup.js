import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: "Missing required fields",
        details: "Name, email, and password are required" 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ 
        error: "Password too weak",
        details: "Password must be at least 8 characters long" 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.professor.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: "User already exists",
        details: "An account with this email already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new professor
    const newProfessor = await prisma.professor.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        // Don't return password!
      }
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: newProfessor
    });

  } catch (error) {
    console.error("❌ Signup error:", error);
    console.error("Error details:", error.message);
    console.error("Stack:", error.stack);
    
    return res.status(500).json({ 
      error: "Server error",
      details: error.message,
      message: "Check server logs for more details"
    });
  }
}