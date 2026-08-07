"use client";

import { useState, type FormEvent } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-2 rounded-sm border border-sage/30 bg-sage/10 p-6">
        <span className="font-display text-lg text-ink">Message received, {name.split(" ")[0] || "there"}.</span>
        <p className="text-sm text-ink/60">
          This is a static demo, so nothing was actually sent — but in the
          live product, your committee&apos;s inbox would have this in front
          of them right now.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="name"
        label="Full name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input id="email" label="Email" type="email" required />
      <Input id="society-name" label="Society name (optional)" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="font-mono text-xs uppercase tracking-wider text-ink/60">
          Message
        </label>
        <textarea
          id="message"
          required
          rows={5}
          className="resize-none rounded-sm border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          placeholder="Tell us about your society and what you're looking for."
        />
      </div>
      <Button type="submit" variant="primary" className="w-fit">
        Send message
      </Button>
    </form>
  );
}
