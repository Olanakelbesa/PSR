"use client";

import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/date-picker.css";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Type for DatePicker ref
type DatePickerRef = React.ComponentRef<typeof DatePicker>;

// Custom date input component with calendar icon
const CustomDateInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    onClick?: () => void;
    value?: string;
  }
>(({ onClick, value, onChange, className, ...props }, ref) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={onChange}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick?.();
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-md p-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
        aria-label="Open calendar"
        title="Open calendar"
      >
        <Calendar className="h-4 w-4" />
      </button>
    </div>
  );
});
CustomDateInput.displayName = "CustomDateInput";

export interface DatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
  dateFormat?: string;
  showPopperArrow?: boolean;
  popperPlacement?:
    | "top"
    | "top-start"
    | "top-end"
    | "bottom"
    | "bottom-start"
    | "bottom-end"
    | "right"
    | "right-start"
    | "right-end"
    | "left"
    | "left-start"
    | "left-end";
  strictParsing?: boolean;
  allowSameDay?: boolean;
  showMonthDropdown?: boolean;
  showYearDropdown?: boolean;
  dropdownMode?: "scroll" | "select";
  yearDropdownItemNumber?: number;
  disableNavigation?: boolean;
}

export const StyledDatePicker = React.forwardRef<
  DatePickerRef,
  DatePickerProps
>(
  (
    {
      selected,
      onChange,
      placeholder = "Select date or type manually",
      minDate,
      maxDate,
      disabled = false,
      className,
      dateFormat = "MM/dd/yyyy",
      showPopperArrow = false,
      popperPlacement = "bottom-end",
      strictParsing = false,
      showMonthDropdown = true,
      showYearDropdown = true,
      dropdownMode = "select",
      yearDropdownItemNumber = 15,
      disableNavigation = false,
      ...props
    },
    ref,
  ) => {
    // Automatically disable navigation when both month and year dropdowns are shown
    const shouldDisableNavigation =
      disableNavigation || (showMonthDropdown && showYearDropdown);

    return (
      <div
        className={cn(
          shouldDisableNavigation && "react-datepicker-no-navigation",
        )}
      >
        <DatePicker
          ref={ref}
          selected={selected}
          onChange={onChange}
          placeholderText={placeholder}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          dateFormat={dateFormat}
          allowSameDay={false}
          customInput={<CustomDateInput className={className} />}
          showPopperArrow={showPopperArrow}
          strictParsing={strictParsing}
          popperPlacement={popperPlacement}
          showMonthDropdown={showMonthDropdown}
          showYearDropdown={showYearDropdown}
          dropdownMode={dropdownMode}
          yearDropdownItemNumber={yearDropdownItemNumber}
          wrapperClassName="w-full"
          {...props}
        />
      </div>
    );
  },
);
StyledDatePicker.displayName = "StyledDatePicker";
