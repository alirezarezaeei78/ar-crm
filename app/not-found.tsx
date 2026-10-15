import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state" style={{ padding: "100px 25px" }}>
      <h1>Let’s find your way back.</h1>
      <p>This page isn’t part of your workspace.</p>
      <Link href="/" className="r-button primary">
        Back to overview
      </Link>
    </div>
  );
}
