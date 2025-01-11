// MathJaxContext.tsx
import { FC } from "react";
import type { MathJaxBaseContextProps } from "./types";
import { MathJaxBaseContextProvider } from "./MathJaxBaseContextProvider";

export const MathJaxContext: FC<MathJaxBaseContextProps> = ({
  children,
  ...props
}) => {
  return (
    <MathJaxBaseContextProvider {...props}>
      {children}
    </MathJaxBaseContextProvider>
  );
};
