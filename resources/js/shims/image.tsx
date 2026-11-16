import { forwardRef, type CSSProperties, type ImgHTMLAttributes } from "react";

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  fill?: boolean;
  unoptimized?: boolean;
  priority?: boolean;
};

const fillStyle: CSSProperties = {
  position: "absolute",
  height: "100%",
  width: "100%",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  color: "transparent",
};

const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { fill, unoptimized: _unoptimized, priority: _priority, style, decoding = "async", ...rest },
  ref
) {
  const mergedStyle = fill ? { ...fillStyle, ...style } : style;

  return <img ref={ref} decoding={decoding} style={mergedStyle} {...rest} />;
});

export default Image;
