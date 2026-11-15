export type Resource = {
  id: string;
  title: string;
  description: string;
  kind: "file" | "document" | "slide" | "folder";
  name: string;
  mime: string;
  size?: number;
  filePath?: string;
  dataUrl?: string;
  driveUrl?: string;
  textContent?: string;
};

export type Task = { id: string; text: string; done: boolean };
export type EventItem = { id: string; title: string; description: string; date: string };
export type CodeItem = { id: string; title: string; name: string; mime: string; filePath?: string; dataUrl?: string; size: number };
export type Contact = { id: string; email: string; description: string };
export type SiteState = {
  resources: Resource[];
  tasks: Record<string, Task[]>;
  answers: Record<string, string>;
  code: CodeItem[];
  missionScores: number[][];
  times: string[];
  events: EventItem[];
  contacts: Contact[];
  tips: string[];
};

export const defaultState: SiteState = {
  resources: [],
  tasks: { presentation: [], innovation: [], core: [] },
  answers: {},
  code: [],
  missionScores: Array.from({ length: 15 }, () => [0, 0, 0]),
  times: ["", "", ""],
  events: [],
  contacts: [],
  tips: [],
};

// Prompts are paraphrased from the BIOGLOW season judging script.
export const judgeQuestions = [
  "How did your team come together, and how do you know one another?",
  "What problem did your team choose, and how does it connect to this season’s challenge?",
  "Which research resources did you use?",
  "Which research resource helped your team the most?",
  "What steps did your team take to develop the innovation project?",
  "How did you divide up the project work?",
  "How did the team make sure everyone’s contributions mattered?",
  "What is innovative about your proposed solution?",
  "How is your idea different from solutions found in your research?",
  "What do the different parts of your model, drawing, or prototype represent?",
  "Who gave you feedback on the solution?",
  "What changes did you make as your project developed?",
  "How did those changes improve your solution?",
  "How could the solution help other people?",
  "What was your favorite part of the project, and why?",
  "What part of the project makes your team most proud?",
  "Which expert or organization would you want to work with on this solution?",
  "What would your team do next if you had more project time?",
  "How did your team choose which robot missions to attempt?",
  "Which resources helped you build and program the robot?",
  "Which robot resource was most useful?",
  "How did everyone get a chance to share robot ideas?",
  "How did you divide the robot work across the team?",
  "How did you help each team member understand the robot and its code?",
  "How did you build the robot and attachments for the missions?",
  "How did sensors and programming help with the missions?",
  "What is innovative about the robot’s attachments or code?",
  "How did you test whether a mission run was consistent?",
  "What did you improve after testing the robot?",
  "What did the team learn by designing the robot together?",
  "What part of the robot design or mission strategy makes the team most proud?",
  "How do you decide whether to change the robot, the code, or both after a problem?",
  "What would you work on next if you had more time for robot design?",
  "Which mission was your favorite to work on, and why?",
  "What was the toughest challenge this season, and how did the team handle it?",
  "How did your coach help the team this season?",
  "How did the team work through disagreements?",
];
