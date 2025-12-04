import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const professorId = parseInt(session.user.id);

  try {
    switch (req.method) {
      // GET - Get current profile
      case "GET": {
        const professor = await prisma.professor.findUnique({
          where: { id: professorId },
          select: {
            id: true,
            name: true,
            email: true,
            // Don't return password
          }
        });

        if (!professor) {
          return res.status(404).json({ error: "Professor not found" });
        }

        return res.status(200).json(professor);
      }

      // PUT - Update profile
      case "PUT": {
        const { name, email, currentPassword, newPassword } = req.body;

        // Get current professor data
        const professor = await prisma.professor.findUnique({
          where: { id: professorId }
        });

        if (!professor) {
          return res.status(404).json({ error: "Professor not found" });
        }

        // Prepare update data
        const updateData = {};

        // Update name if provided
        if (name && name !== professor.name) {
          updateData.name = name;
        }

        // Update email if provided and different
        if (email && email !== professor.email) {
          // Check if email is already taken
          const existingProfessor = await prisma.professor.findUnique({
            where: { email: email.toLowerCase() }
          });

          if (existingProfessor && existingProfessor.id !== professorId) {
            return res.status(409).json({ error: "Email already in use" });
          }

          updateData.email = email.toLowerCase();
        }

        // Update password if provided
        if (newPassword) {
          if (!currentPassword) {
            return res.status(400).json({ 
              error: "Current password required to set new password" 
            });
          }

          // Verify current password
          const isValidPassword = await bcrypt.compare(
            currentPassword, 
            professor.password
          );

          if (!isValidPassword) {
            return res.status(401).json({ error: "Current password is incorrect" });
          }

          // Validate new password
          if (newPassword.length < 8) {
            return res.status(400).json({ 
              error: "New password must be at least 8 characters" 
            });
          }

          // Hash new password
          updateData.password = await bcrypt.hash(newPassword, 10);
        }

        // If nothing to update
        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: "No changes provided" });
        }

        // Update professor
        const updatedProfessor = await prisma.professor.update({
          where: { id: professorId },
          data: updateData,
          select: {
            id: true,
            name: true,
            email: true,
          }
        });

        return res.status(200).json({
          success: true,
          message: "Profile updated successfully",
          professor: updatedProfessor,
          note: "Please logout and login again to see name changes"
        });
      }

      default:
        res.setHeader("Allow", ["GET", "PUT"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Profile API error:", error);
    return res.status(500).json({ 
      error: "Server error", 
      details: error.message 
    });
  }
}