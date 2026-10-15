"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state" style={{ padding: "100px 25px" }}>
      <h1>We couldn’t load this view.</h1>
      <p>Try loading the page again to get back to your workspace.</p>
      <button className="r-button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
