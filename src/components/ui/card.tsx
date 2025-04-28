import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-md ${className || ''}`}
      {...props}
    />
  );
} 