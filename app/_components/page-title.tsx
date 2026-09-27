import { TechTitle } from "./tech-title";

// The huge word bleeding off the top-left corner, as in the Figma frames
// (its text box sits 76px above the top of a 1440 frame, 47px in), drawn by
// Tech Text (see TechTitle). It travels with its page in the transition.
export function PageTitle({ children }: { children: string }) {
  return (
    <h1 className="display mt-[-5.28vw] w-fit pl-[3.1vw]">
      <span className="sr-only">{children}</span>
      <TechTitle text={children} />
    </h1>
  );
}
