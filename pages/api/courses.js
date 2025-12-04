import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  // ✅ Get session
  const session = await getServerSession(req, res, authOptions);

  // ✅ CRITICAL: Check authentication - NEVER comment this out!
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // ✅ Validate session has user data
  if (!session.user || !session.user.id) {
    return res.status(401).json({ error: "Invalid session - no user ID" });
  }

  // ✅ Get professor ID from session
  const professorId = parseInt(session.user.id);
  const { method } = req;

  try {
    switch (method) {
      // GET - Read all courses for this professor
      case "GET": {
        const courses = await prisma.course.findMany({
          where: { professorId },
          orderBy: { createdAt: "desc" }
        });
        return res.status(200).json(courses);
      }

      // POST - Create a new course
      case "POST": {
        const { title, description, semester } = req.body;

        if (!title || !description || !semester) {
          return res.status(400).json({ error: "Missing required fields: title, description, semester" });
        }

        const newCourse = await prisma.course.create({
          data: {
            title,
            description,
            semester,
            professorId, // Automatically assigned from session
          },
        });

        return res.status(201).json(newCourse);
      }

      // PUT - Update an existing course
      case "PUT": {
        const { id, ...updateData } = req.body;

        if (!id) {
          return res.status(400).json({ error: "Course ID required" });
        }

        // ✅ Security: Verify course exists and belongs to this professor
        const course = await prisma.course.findUnique({ 
          where: { id: parseInt(id) } 
        });

        if (!course) {
          return res.status(404).json({ error: "Course not found" });
        }

        if (course.professorId !== professorId) {
          return res.status(403).json({ error: "Forbidden: You can only edit your own courses" });
        }

        // Update the course
        const updatedCourse = await prisma.course.update({
          where: { id: parseInt(id) },
          data: updateData,
        });

        return res.status(200).json(updatedCourse);
      }

      // DELETE - Delete a course
      case "DELETE": {
        const { courseId } = req.body;

        if (!courseId) {
          return res.status(400).json({ error: "Course ID required" });
        }

        // ✅ Security: Verify course exists and belongs to this professor
        const course = await prisma.course.findUnique({ 
          where: { id: parseInt(courseId) } 
        });

        if (!course) {
          return res.status(404).json({ error: "Course not found" });
        }

        if (course.professorId !== professorId) {
          return res.status(403).json({ error: "Forbidden: You can only delete your own courses" });
        }

        // Delete the course
        await prisma.course.delete({ 
          where: { id: parseInt(courseId) } 
        });

        return res.status(204).end();
      }

      // Handle unsupported methods
      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ 
      error: "Server error", 
      details: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
}