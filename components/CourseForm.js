import { useState, useEffect } from "react";
import axios from "axios";

export default function CourseForm({ course, professorId, onSave }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [semester, setSemester] = useState("");
  const [loading, setLoading] = useState(false);

  // Populate form when editing a course
  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description);
      setSemester(course.semester);
    } else {
      // Reset form for creating a new course
      setTitle("");
      setDescription("");
      setSemester("");
    }
  }, [course]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (course) {
        // Update existing course
        await axios.put("/api/courses", {
          id: course.id,
          title,
          description,
          semester,
        });
      } else {
        // Create new course
        await axios.post("/api/courses", {
          title,
          description,
          semester,
        });
      }

      onSave(); // notify parent to reload courses
      
      // Reset form only if creating new course
      if (!course) {
        setTitle("");
        setDescription("");
        setSemester("");
      }
    } catch (error) {
      console.error("Error saving course:", error);
      alert(`Error: ${error.response?.data?.error || "Failed to save course"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} // ✅ THIS WAS MISSING!!!
      className="bg-gray-50 p-6 rounded-lg shadow-md space-y-4 mb-6"
    >
      <h2 className="text-xl font-semibold text-gray-700">
        {course ? "Edit Course" : "Add New Course"}
      </h2>
      
      <input
        className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        type="text"
        placeholder="Course Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        disabled={loading}
      />
      
      <textarea
        className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Course Description"
        rows="3"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        disabled={loading}
      />
      
      <input
        className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        type="text"
        placeholder="Semester (e.g., Fall 2024)"
        value={semester}
        onChange={(e) => setSemester(e.target.value)}
        required
        disabled={loading}
      />
      
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : course ? "Update Course" : "Add Course"}
        </button>
        
        {course && (
          <button
            type="button"
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
            onClick={() => {
              setTitle("");
              setDescription("");
              setSemester("");
              onSave(); // This resets editingCourse to null in parent
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}