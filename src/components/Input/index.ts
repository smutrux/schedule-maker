import type { InputHTMLAttributes } from "react";

export type TextInputProps = {
  placeholder?: string;
  label?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export type CheckboxProps = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
};

export type ColourPickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
};

export type DropdownOption = {
  value: string;
  label: string;
};

export type DropdownProps = {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
};

export type TimePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
};