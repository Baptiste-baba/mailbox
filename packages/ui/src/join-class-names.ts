/** Joins the class names of a component with the ones given by its caller, if any. */
export function joinClassNames(...classNames: (string | undefined)[]): string {
  return classNames.filter(Boolean).join(' ');
}
