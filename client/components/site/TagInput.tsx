import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [text, setText] = React.useState("");

  const add = (v?: string) => {
    const t = (v ?? text).trim();
    if (!t) return;
    if (value.includes(t)) {
      setText("");
      return;
    }
    onChange([...value, t]);
    setText("");
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <Input value={text} onChange={(e) => setText((e.target as HTMLInputElement).value)} onKeyDown={onKeyDown} placeholder={placeholder || "Add and press Enter"} />
        <Button type="button" onClick={() => add()} className="h-10">Add</Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {value.map((t) => (
          <div key={t} className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm" title={t}>
            <span>{t}</span>
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="text-xs text-muted-foreground">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
