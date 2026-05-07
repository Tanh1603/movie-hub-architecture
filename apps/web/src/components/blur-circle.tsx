interface BlurCircleProps {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
}
export const BlurCircle = ({
  top = 'auto',
  left = 'auto',
  right = 'auto',
  bottom = 'auto',
}: BlurCircleProps) => {
  return (
    <div
      className="absolute -z-0 h-52 w-52 aspect-square rounded-full bg-primary/30 blur-3xl pointer-events-none"
      style={{ top: top, left: left, right: right, bottom: bottom }}
    ></div>
  );
};
