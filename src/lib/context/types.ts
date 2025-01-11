// types.ts
import { OptionList } from "mathjax-full/js/util/Options";
import { MathJax2Object, MathJax2Config } from "../MathJax2";
import { MathJax3Object, MathJax3Config } from "../MathJax3";

export type TypesettingFunction =
  | "tex2chtml"
  | "tex2chtmlPromise"
  | "tex2svg"
  | "tex2svgPromise"
  | "tex2mml"
  | "tex2mmlPromise"
  | "mathml2chtml"
  | "mathml2chtmlPromise"
  | "mathml2svg"
  | "mathml2svgPromise"
  | "mathml2mml"
  | "mathml2mmlPromise"
  | "asciimath2chtml"
  | "asciimath2chtmlPromise"
  | "asciimath2svg"
  | "asciimath2svgPromise"
  | "asciimath2mml"
  | "asciimath2mmlPromise";

export interface MathJaxBaseContextOverrideableProps {
  hideUntilTypeset: "first" | "every";
  typesettingOptions: {
    fn: TypesettingFunction;
    options?: Omit<OptionList, "display">;
  };
  renderMode: "pre" | "post";
}

export type MathJaxBaseContextSubscriberProps =
  | (MathJaxBaseContextOverrideableProps & {
      version: 2;
      promise: Promise<MathJax2Object>;
    })
  | (MathJaxBaseContextOverrideableProps & {
      version: 3;
      promise: Promise<MathJax3Object>;
    });

export interface MathJaxBaseContextStaticProps
  extends MathJaxBaseContextOverrideableProps {
  src?: string;
  onLoad?: () => void;
  onError?: (error: ErrorEvent) => void;
  children?: React.ReactNode;
}

export type MathJaxBaseContextProps =
  | (MathJaxBaseContextStaticProps & {
      config?: MathJax2Config;
      version: 2;
      onStartup?: (mathJax: MathJax2Object) => void;
    })
  | (MathJaxBaseContextStaticProps & {
      config?: MathJax3Config;
      version?: 3;
      onStartup?: (mathJax: MathJax3Object) => void;
    });
