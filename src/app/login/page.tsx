"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Unable to sign in.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } catch {
      setError("Unable to reach the birthday command center. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="loginPage">
      <section className="loginVisual" aria-hidden="true">
        <div className="loginGlow loginGlowOne" />
        <div className="loginGlow loginGlowTwo" />
        <div className="loginVisualContent">
          <span className="loginKicker">SHREEKARI · ONE BEAUTIFUL YEAR</span>
          <h1>A little celebration,<br />planned with a lot of love.</h1>
          <p>
            Private family command center for the 29 October birthday
            and 31 October celebration at Satya Farm House, Peruru.
          </p>
          <div className="loginDates">
            <div><b>29</b><span>Oct · Temples & home</span></div>
            <div><b>31</b><span>Oct · Main function</span></div>
          </div>
        </div>
        <div className="loginFlower loginFlowerOne">✦</div>
        <div className="loginFlower loginFlowerTwo">✿</div>
        <div className="loginFlower loginFlowerThree">❋</div>
      </section>

      <section className="loginPanel">
        <form className="loginCard" onSubmit={submit}>
          <div className="loginMark">S</div>
          <span className="loginEyebrow">FAMILY ACCESS</span>
          <h2>Welcome back</h2>
          <p className="loginLead">Sign in to Shreekari’s Birthday Command Center.</p>

          <label className="loginField">
            <span>Username</span>
            <div className="loginInputWrap">
              <span className="loginFieldIcon" aria-hidden="true">◎</span>
              <input
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
          </label>

          <label className="loginField">
            <span>Password</span>
            <div className="loginInputWrap">
              <span className="loginFieldIcon" aria-hidden="true">◇</span>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                required
              />
              <button
                className="passwordToggle"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && <div className="loginError" role="alert">{error}</div>}

          <button className="loginSubmit" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in to Command Center"}
          </button>

          <div className="loginFooterNote">
            Private family workspace · Secure session · KPS managed
          </div>
        </form>
      </section>
    </main>
  );
}

