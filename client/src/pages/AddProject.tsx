import { useState } from "react";
import axios from "axios";
import { Upload } from "lucide-react";

const AddProject = () => {
  // Stroe all form values
  const [form, setForm] = useState({
    projectName: "",
    overview: "",
    technologies: "",
    team: "",
    features: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");

  // Update form when user types
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  // Convert markdown list into comma-separated text
  const convertListToText = (text: string) => {
    return text
      .split("\n")
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean)
      .join(", ");
  };

  // Read uploaded markdown file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Only allow markdown files
    if (!file.name.endsWith(".md")) {
      setMessage("Please upload a .md Markdown file.");
      return;
    }

    setFileName(file.name);
    setMessage("");

    const reader = new FileReader();

    reader.onload = (event) => {
      const markdown = event.target?.result;

      if (typeof markdown !== "string") {
        setMessage("Could not read the file.");
        return;
      }

      parseMarkdown(markdown);
    };

    reader.onerror = () => {
      setMessage("Failed to read the file.");
    };

    reader.readAsText(file);
  };

  // Extract project information from markdown
  const parseMarkdown = (markdown: string) => {
    // Get project name from # Project Name
    const projectNameMatch = markdown.match(/^#\s+(.+)$/m);

    // Get sections
    const overviewMatch = markdown.match(
      /##\s+Overview\s*\n([\s\S]*?)(?=\n##\s+|$)/i,
    );

    const technologiesMatch = markdown.match(
      /##\s+Technologies\s*\n([\s\S]*?)(?=\n##\s+|$)/i,
    );

    const teamMatch = markdown.match(/##\s+Team\s*\n([\s\S]*?)(?=\n##\s+|$)/i);

    const featuresMatch = markdown.match(
      /##\s+Features\s*\n([\s\S]*?)(?=\n##\s+|$)/i,
    );

    setForm({
      projectName: projectNameMatch ? projectNameMatch[1].trim() : "",
      overview: overviewMatch ? overviewMatch[1].trim() : "",
      technologies: technologiesMatch
        ? convertListToText(technologiesMatch[1])
        : "",
      team: teamMatch ? convertListToText(teamMatch[1]) : "",
      features: featuresMatch ? convertListToText(featuresMatch[1]) : "",
    });

    setMessage("Markdown file loaded successfully.");
  };

  // Submit project
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");

    // Basic validation
    if (!form.projectName.trim()) {
      setMessage("Project name is required.");
      return;
    }

    if (!form.overview.trim()) {
      setMessage("Project overview is required.");
      return;
    }

    try {
      setLoading(true);

      // Convert comma-separated values into arrays
      const project = {
        projectName: form.projectName.trim(),

        overview: form.overview.trim() || null,

        technologies: form.technologies
          ? form.technologies
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : null,

        team: form.team
          ? form.team
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : null,

        features: form.features
          ? form.features
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : null,
      };

      // Send project to backend
      const response = await axios.post(
        "http://localhost:5000/api/projects/add",
        project,
      );

      // Backend returned success
      if (response.data.success) {
        setMessage("Project added successfully!");

        // Clear form
        setForm({
          projectName: "",
          overview: "",
          technologies: "",
          team: "",
          features: "",
        });

        setFileName("");
      }
    } catch (error) {
      console.error("Add project error:", error);

      // Handle Axios errors
      if (axios.isAxiosError(error)) {
        setMessage(
          error.response?.data?.message ||
            "Failed to add project. Please try again.",
        );
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Add Project</h1>

          <p className="mt-2 text-gray-600">
            Add project information to the company knowledge base.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl bg-white p-8 shadow-sm"
        >
          {/* Project Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Project Name *
            </label>

            <input
              type="text"
              name="projectName"
              value={form.projectName}
              onChange={handleChange}
              placeholder="Enter project name"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          {/* Overview */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Overview *
            </label>

            <textarea
              name="overview"
              value={form.overview}
              onChange={handleChange}
              rows={4}
              placeholder="Briefly describe the project..."
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          {/* Technologies */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Technologies
            </label>

            <input
              type="text"
              name="technologies"
              value={form.technologies}
              onChange={handleChange}
              placeholder="e.g. React, Node.js, PostgreSQL"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />

            <p className="mt-1 text-xs text-gray-500">
              Separate items with commas.
            </p>
          </div>

          {/* Team */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Team
            </label>

            <input
              type="text"
              name="team"
              value={form.team}
              onChange={handleChange}
              placeholder="e.g. John Doe, Jane Smith"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />

            <p className="mt-1 text-xs text-gray-500">
              Separate team members with commas.
            </p>
          </div>

          {/* Features */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Features
            </label>

            <textarea
              name="features"
              value={form.features}
              onChange={handleChange}
              rows={4}
              placeholder="e.g. Authentication, Dashboard, Reporting"
              className="w-full resize-none border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />

            <p className="mt-1 text-xs text-gray-500">
              Separate features with commas.
            </p>
          </div>

          {/* Markdown Upload */}
          <div className="border-t border-gray-200 pt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Upload Project Markdown
            </label>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 transition hover:border-gray-500 hover:bg-gray-50">
              <Upload size={28} className="mb-3 text-gray-500" />

              <span className="text-sm font-medium text-gray-700">
                Click to upload Markdown file
              </span>

              <span className="mt-1 text-xs text-gray-500">
                Only .md files are supported
              </span>

              <input
                type="file"
                accept=".md"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {fileName && (
              <p className="mt-2 text-sm text-gray-600">
                Selected file: {fileName}
              </p>
            )}

            <p className="mt-2 text-xs text-gray-500">
              Upload a Markdown file containing project information. The form
              will be filled automatically.
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700">
              {message}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Adding Project..." : "Add Project"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProject;
