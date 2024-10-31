import React from "react";

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 16,
  color = "white",
}) => {
  return (
    <div
      className={`animate-spin rounded-full border-t-2 border-${color} border-opacity-50`}
      style={{ width: size, height: size }}
    ></div>
  );
};

export default LoadingSpinner;
