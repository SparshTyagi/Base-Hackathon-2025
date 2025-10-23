"use client";
import React, { useState } from "react";
import { Input } from "@/components/input";
import { Button } from "@/components/button";

interface MemberAdderProps {
  onAdd: (name: string) => void;
}

export const MemberAdder: React.FC<MemberAdderProps> = ({ onAdd }) => {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add member by name"
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        className="flex-1"
      />
      <Button
        variant="secondary"
        onClick={handleAdd}
        className="w-full sm:w-auto"
      >
        Add
      </Button>
    </div>
  );
};
