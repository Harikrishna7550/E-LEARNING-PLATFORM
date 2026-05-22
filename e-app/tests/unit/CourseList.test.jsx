import { render, screen, fireEvent } from "@testing-library/react";
import CourseList from "../../src/components/courses/CourseList";

const courses = [
  { id: "1", title: "React Deep Dive", instructorName: "Alice", description: "" },
  { id: "2", title: "Node Internals", instructorName: "Bob", description: "" },
  { id: "3", title: "Python Basics", instructorName: "Alice", description: "" },
];

describe("Unit: CourseList", () => {
  it("10. filters courses by the search term (title or instructor)", () => {
    render(<CourseList courses={courses} onViewCourse={() => {}} />);
    expect(screen.getByText("React Deep Dive")).toBeInTheDocument();
    expect(screen.getByText("Python Basics")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Search for courses/i), {
      target: { value: "node" },
    });

    expect(screen.getByText("Node Internals")).toBeInTheDocument();
    expect(screen.queryByText("React Deep Dive")).not.toBeInTheDocument();
    expect(screen.queryByText("Python Basics")).not.toBeInTheDocument();
  });

  it('11. renders an empty state message when no course matches the search', () => {
    render(<CourseList courses={courses} onViewCourse={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/Search for courses/i), {
      target: { value: "nonexistent-xyz" },
    });
    expect(
      screen.getByText(/No courses found matching "nonexistent-xyz"/),
    ).toBeInTheDocument();
  });
});
