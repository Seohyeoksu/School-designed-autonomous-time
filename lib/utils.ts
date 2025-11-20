import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function makeCodePrefix(
  grades: string[],
  subjects: string[],
  activityName: string
): string {
  let gradePart = "";
  if (grades && grades.length > 0) {
    gradePart = grades[0].replace("학년", "").replace("학년군", "").trim();
  }

  let subjectPart = "";
  if (subjects && subjects.length > 0) {
    const s = subjects[0];
    if (s) {
      subjectPart = s[0];
    }
  }

  let actPart = "";
  if (activityName && activityName.length > 0) {
    actPart = activityName.slice(0, 2);
  }

  return `${gradePart}${subjectPart}${actPart}`;
}
