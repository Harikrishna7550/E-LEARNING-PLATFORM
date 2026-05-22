import { render, screen, fireEvent } from "@testing-library/react";
import CourseCard from "../../src/components/courses/CourseCard";

const baseCourse = {
  id: "c1",
  title: "JavaScript Essentials",
  description: "Hands-on intro to modern JavaScript",
  instructorName: "Jane Doe",
  duration: "6h",
  thumbnail: "",
};

describe("Unit: CourseCard", () => {
  it("6. renders the course title, instructor name and duration", () => {
    render(<CourseCard course={baseCourse} onView={() => {}} />);
    expect(screen.getByText("JavaScript Essentials")).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/6h/)).toBeInTheDocument();
  });

  it("7. shows 'Enroll Now' button for an unenrolled student", () => {
    const onEnroll = jest.fn();
    render(
      <CourseCard
        course={baseCourse}
        onView={() => {}}
        onEnroll={onEnroll}
        isEnrolled={false}
        userRole="student"
      />,
    );

    const enrollBtn = screen.getByRole("button", { name: /Enroll Now/i });
    fireEvent.click(enrollBtn);
    expect(onEnroll).toHaveBeenCalledWith("c1");
  });

  it("8. shows progress and 'Continue Learning' when the student is enrolled", () => {
    render(
      <CourseCard
        course={baseCourse}
        onView={() => {}}
        isEnrolled
        userRole="student"
        progress={42}
      />,
    );
    expect(screen.getByText("42% Complete")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continue Learning/i }),
    ).toBeInTheDocument();
  });

  it("9. invokes onView when the 'View Course' button is clicked", () => {
    const onView = jest.fn();
    render(<CourseCard course={baseCourse} onView={onView} />);
    fireEvent.click(screen.getByRole("button", { name: /View Course/i }));
    expect(onView).toHaveBeenCalledWith(baseCourse);
  });
});
