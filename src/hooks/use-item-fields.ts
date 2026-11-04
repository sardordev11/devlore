"use client";

import { useState } from "react";

import type { ItemFieldName, ItemFieldValues } from "@/lib/item-form";

// Server-side field errors, which can also name fields outside the text inputs.
export type ItemFieldErrors = Partial<
  Record<ItemFieldName | "type" | "file", string[]>
>;

export interface ItemFieldProps {
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled: boolean;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
}

// Values and errors for the item form fields. Input ids are `${idPrefix}-${name}`.
export function useItemFields(
  idPrefix: string,
  initialValues: ItemFieldValues,
  disabled: boolean,
) {
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<ItemFieldErrors>({});

  function setValue(name: ItemFieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function fieldProps(name: ItemFieldName): ItemFieldProps {
    const id = `${idPrefix}-${name}`;
    const error = fieldErrors[name]?.[0];
    return {
      id,
      value: values[name],
      onChange: (event) => setValue(name, event.target.value),
      disabled,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${id}-error` : undefined,
    };
  }

  function reset() {
    setValues(initialValues);
    setFieldErrors({});
  }

  return { values, setValue, fieldErrors, setFieldErrors, fieldProps, reset };
}
