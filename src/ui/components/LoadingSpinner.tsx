interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

const LoadingSpinner = ({
  size = 16,
  color = "white",
}: LoadingSpinnerProps) => {
  return (
    <div
      className={`animate-spin rounded-full border-t-2 border-${color} border-opacity-50`}
      style={{ width: size, height: size }}
    ></div>
  );
};

export default LoadingSpinner;
