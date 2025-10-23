"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Field } from "@/components/field";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { TextArea } from "@/components/textarea";
import { Button } from "@/components/button";
import { Divider } from "@/components/divider";
import { Piggybank } from "@/lib/types";

interface InfractionModalProps {
  piggy: Piggybank;
  onClose: () => void;
  onSubmit: (memberId: string, ruleId: string, notes?: string) => void;
}

export const InfractionModal: React.FC<InfractionModalProps> = ({
  piggy,
  onClose,
  onSubmit,
}) => {
  const [member, setMember] = useState(piggy.members[0]?.id || "");
  const [rule, setRule] = useState(piggy.rules[0]?.id || "");
  const [notes, setNotes] = useState("");

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Semi-transparent overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm transition-colors duration-300"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />

      {/* Modal card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="relative w-full max-w-lg rounded-3xl shadow-xl border p-6 transition-colors duration-300"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
          color: "var(--color-text)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h4
            className="font-bold text-lg transition-colors"
            style={{ color: "var(--color-text)" }}
          >
            Record Infraction
          </h4>
          <button
            onClick={onClose}
            className="hover:underline transition-colors"
            style={{ color: "var(--color-muted-text)" }}
          >
            Close
          </button>
        </div>
        <Divider />

        <div className="space-y-4">
          <Field label="Member">
            <Select
              value={member}
              onChange={(e) => setMember(e.target.value)}
            >
              {piggy.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Rule">
            <Select
              value={rule}
              onChange={(e) => setRule(e.target.value)}
            >
              {piggy.rules.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Notes (optional)">
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened?"
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="w-1/2"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => onSubmit(member, rule, notes)}
              className="w-1/2"
            >
              Record
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
