// Footer component - displays at bottom of every page with copyright info
export default function Footer() {
  return (
    <footer className="bg-dark text-light py-4 mt-5 fs-6">
      <div className="container text-center">
        <p className="mb-1">
          &copy; {new Date().getFullYear()} E-Learn Platform. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
