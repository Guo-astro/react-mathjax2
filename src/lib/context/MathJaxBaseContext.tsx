import { createContext } from "react";
import type { MathJaxBaseContextSubscriberProps } from "./types";

export const defaultContextValue: MathJaxBaseContextSubscriberProps = {
  version: 3,
  promise: Promise.reject(new Error("MathJax not initialized")),
  hideUntilTypeset: "first",
  typesettingOptions: {
    fn: "tex2chtml",
    options: {},
  },
  renderMode: "post",
};

export const MathJaxBaseContext =
  createContext<MathJaxBaseContextSubscriberProps>(defaultContextValue);
