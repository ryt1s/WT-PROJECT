import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import CourseForm from "@/components/CourseForm";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // ✅ Redirect if not authenticated (prevent loop)
  useEffect(() => {
    if (status === "unauthenticated" && !redirecting) {
      setRedirecting(true);
      router.replace("/login");
    }
  }, [status, router, redirecting]);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/courses");
      setCourses(res.data);
    } catch (error) {
      console.error(error);
      showMessage("Failed to load courses", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session) loadCourses();
  }, [session]);

  // ✅ Handle logout properly
  const handleLogout = async () => {
    await signOut({ 
      callbackUrl: "/login",
      redirect: true 
    });
  };

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  const handleDelete = async (courseId) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    
    try {
      await axios.delete("/api/courses", { data: { courseId } });
      showMessage("Course deleted successfully!");
      loadCourses();
    } catch (error) {
      console.error(error);
      showMessage("Failed to delete course", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome, {session.user.name}
            </h1>
            <p className="text-gray-600 text-sm mt-1">{session.user.email}</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/profile"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
            >
              Profile
            </a>
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Notification */}
        {message && (
          <div
            className={`p-3 mb-4 rounded ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Course Form */}
        <CourseForm
          course={editingCourse}
          professorId={session.user.id}
          onSave={() => {
            setEditingCourse(null);
            showMessage(editingCourse ? "Course updated!" : "Course created!");
            loadCourses();
          }}
        />

        {editingCourse && (
          <button
            className="mb-4 text-blue-600 hover:underline"
            onClick={() => setEditingCourse(null)}
          >
            ← Cancel Editing
          </button>
        )}

        {/* Courses Table */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Your Courses</h2>
          {loading ? (
            <p className="text-center py-4">Loading courses...</p>
          ) : (
            <table className="w-full table-auto border-collapse shadow-sm rounded overflow-hidden">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="border px-4 py-2">Title</th>
                  <th className="border px-4 py-2">Description</th>
                  <th className="border px-4 py-2">Semester</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white text-gray-800">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">
                      No courses found. Create your first course above!
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{course.title}</td>
                      <td className="border px-4 py-2">{course.description}</td>
                      <td className="border px-4 py-2">{course.semester}</td>
                      <td className="border px-4 py-2 flex gap-2">
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                          onClick={() => setEditingCourse(course)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                          onClick={() => handleDelete(course.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}