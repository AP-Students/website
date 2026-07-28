"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LogOut,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { FRQSubmission } from "@/types/frq";

type FRQGradingRendererProps = {
  frq: FRQSubmission | null;
};

type MockFrq = {
  title: string;
  questionCount: number;
};

type RubricItem = {
  description: string;
  earnedPoints: number;
  possiblePoints: number;
};

const MOCK_FRQS: MockFrq[] = [
  {
    title: "FRQ 1",
    questionCount: 3,
  },
  {
    title: "FRQ 2",
    questionCount: 4,
  },
  {
    title: "FRQ 3",
    questionCount: 2,
  },
];

const RUBRIC_ITEMS: RubricItem[] = [
  {
    description:
      "Answer draws a connection to the Great Demographic Shift",
    earnedPoints: 0,
    possiblePoints: 2,
  },
  {
    description: "Answer mentions John Smith’s contributions",
    earnedPoints: 0,
    possiblePoints: 1,
  },
  {
    description: "Answer is at least 27 paragraphs long",
    earnedPoints: 1,
    possiblePoints: 1,
  },
  {
    description:
      "Answer contains correct punctuation, capitalization, and supporting details",
    earnedPoints: 2,
    possiblePoints: 2,
  },
];

const FRQGradingRenderer = ({
  frq: _frq,
}: FRQGradingRendererProps) => {
  const [currentFrqIndex, setCurrentFrqIndex] = useState(0);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  const currentFrq = MOCK_FRQS[currentFrqIndex];

  if (!currentFrq) {
    return <div>No FRQs available.</div>;
  }

  const isFirstFrq = currentFrqIndex === 0;
  const isLastFrq = currentFrqIndex === MOCK_FRQS.length - 1;

  const handlePrevious = () => {
    setCurrentFrqIndex((previousIndex) =>
      Math.max(previousIndex - 1, 0),
    );
  };

  const handleNext = () => {
    setCurrentFrqIndex((previousIndex) =>
      Math.min(previousIndex + 1, MOCK_FRQS.length - 1),
    );
  };

  const handleJumpToFrq = (index: number) => {
    if (index < 0 || index >= MOCK_FRQS.length) {
      return;
    }

    setCurrentFrqIndex(index);
    setIsNavigationOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col border-t-[6px] border-black bg-white pb-14">
      <GradingHeader />

      <main className="grid flex-1 grid-cols-1 divide-y divide-gray-300 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <GraderResponsePanel frqTitle={currentFrq.title} />

        <StudentResponsePanel
          frqTitle={currentFrq.title}
          questionCount={currentFrq.questionCount}
        />
      </main>

      <GradingFooter
        currentFrqIndex={currentFrqIndex}
        totalFrqs={MOCK_FRQS.length}
        isFirstFrq={isFirstFrq}
        isLastFrq={isLastFrq}
        isNavigationOpen={isNavigationOpen}
        onNavigationOpenChange={setIsNavigationOpen}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onJumpToFrq={handleJumpToFrq}
      />
    </div>
  );
};

function GradingHeader() {
  return (
    <header className="flex min-h-[72px] items-center border-b border-dashed border-gray-400 bg-white px-10 py-3">
      <div className="flex flex-1 items-center gap-4">
        <button
          type="button"
          className="min-w-[176px] rounded-full bg-[#294ad1] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#203cad]"
        >
          Submit Grade Report
        </button>

        <button
          type="button"
          className="min-w-[176px] rounded-full bg-[#294ad1] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#203cad]"
        >
          Save Changes
        </button>
      </div>

      <div className="flex flex-1 justify-center">
        <p className="text-sm font-semibold text-gray-900">
          5/6 Questions Graded
        </p>
      </div>

      <div className="flex flex-1 justify-end">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-sm font-semibold text-red-500 transition-colors hover:text-red-600 hover:underline"
        >
          <LogOut aria-hidden="true" size={19} strokeWidth={2} />
          Return To Admin Dashboard
        </Link>
      </div>
    </header>
  );
}

type GraderResponsePanelProps = {
  frqTitle: string;
};

function GraderResponsePanel({
  frqTitle,
}: GraderResponsePanelProps) {
  return (
    <section className="px-10 py-8">
      <h2 className="mb-5 text-base font-semibold">
        {frqTitle} | Question A | Grader Response
      </h2>

      <QuestionHeader label="A" points="3/6 Points" expanded />

      <div className="space-y-1">
        {RUBRIC_ITEMS.map((item) => (
          <RubricRow key={item.description} item={item} />
        ))}
      </div>

      <div className="mt-4 min-h-[150px] rounded-md border border-gray-300">
        <div className="flex h-10 items-center gap-3 border-b border-gray-300 px-3 text-sm">
          <button type="button" className="font-bold">
            B
          </button>

          <button type="button" className="italic">
            I
          </button>

          <button type="button" className="underline">
            U
          </button>

          <span>Ω</span>
        </div>

        <div className="p-3 text-sm text-gray-400">
          Grader feedback will be entered here.
        </div>

        {/*
          Replace this temporary editor with RenderAdvancedTextbox
          after confirming the component's required properties.
        */}
      </div>

      <QuestionHeader label="B" points="0/3 Points" />
      <QuestionHeader label="C" points="0/3 Points" />
    </section>
  );
}

type RubricRowProps = {
  item: RubricItem;
};

function RubricRow({ item }: RubricRowProps) {
  return (
    <div className="flex min-h-9 items-center gap-2">
      <div className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm">
        <span className="block truncate">{item.description}</span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="flex h-8 min-w-8 items-center justify-center rounded-md border border-gray-300 px-2">
          {item.earnedPoints}
        </span>

        <span>/</span>

        <span>{item.possiblePoints}</span>
      </div>
    </div>
  );
}

type StudentResponsePanelProps = {
  frqTitle: string;
  questionCount: number;
};

function StudentResponsePanel({
  frqTitle,
  questionCount,
}: StudentResponsePanelProps) {
  return (
    <section className="px-10 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {frqTitle} | {questionCount} Questions
        </h2>

        <button
          type="button"
          className="rounded-md bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
        >
          Show Prompt
        </button>
      </div>

      <QuestionHeader label="A" expanded />

      <div className="mb-5 text-sm leading-6 text-gray-900">
        <p className="mb-4">
          The demographic transition model can be used to theorize
          changes in a country&apos;s total population over time.
        </p>

        <p className="mb-3 font-medium">
          Respond to parts A, B, C, D, E, F, and G.
        </p>

        <ol className="space-y-2">
          <li>
            <strong>A.</strong> Referring to Figure 1, identify the
            stage of the Demographic Transition Model that this country
            is most likely in.
          </li>

          <li>
            <strong>B.</strong> Explain one social cause of the
            transition between Stage 2 and Stage 3.
          </li>

          <li>
            <strong>C.</strong> Define the term pro-natalist policy.
          </li>

          <li>
            <strong>D.</strong> Explain the change in cause of death
            between Stage 3 and Stage 4.
          </li>
        </ol>
      </div>

      <div className="min-h-[260px] rounded-md border border-gray-400 p-4 text-sm leading-6">
        <p className="mb-4">
          This is temporary student response content used to match the
          grading-page mockup. The actual FRQ response will be loaded
          in a future work item.
        </p>

        <p className="mb-4">
          The student response area will use the advanced textbox
          renderer after its required properties are confirmed.
        </p>

        <p>
          Navigating through the footer changes the displayed FRQ title
          and question count.
        </p>

        {/*
          Replace this temporary content with RenderAdvancedTextbox.
        */}
      </div>

      <QuestionHeader label="B" />
      <QuestionHeader label="C" />
    </section>
  );
}

type QuestionHeaderProps = {
  label: string;
  points?: string;
  expanded?: boolean;
};

function QuestionHeader({
  label,
  points,
  expanded = false,
}: QuestionHeaderProps) {
  const Icon = expanded ? ChevronDown : ChevronRight;

  return (
    <button
      type="button"
      aria-expanded={expanded}
      className="mb-3 flex h-9 w-full items-center justify-between bg-gray-100 pr-3 text-left"
    >
      <div className="flex h-full items-center">
        <span className="flex h-full w-9 items-center justify-center bg-black font-bold text-white">
          {label}
        </span>

        {points && (
          <span className="px-3 font-semibold">{points}</span>
        )}
      </div>

      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}

type GradingFooterProps = {
  currentFrqIndex: number;
  totalFrqs: number;
  isFirstFrq: boolean;
  isLastFrq: boolean;
  isNavigationOpen: boolean;
  onNavigationOpenChange: (open: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
  onJumpToFrq: (index: number) => void;
};

function GradingFooter({
  currentFrqIndex,
  totalFrqs,
  isFirstFrq,
  isLastFrq,
  isNavigationOpen,
  onNavigationOpenChange,
  onPrevious,
  onNext,
  onJumpToFrq,
}: GradingFooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 z-50 flex h-14 w-full items-center justify-between border-t-2 border-gray-300 bg-white px-8">
      <p className="font-semibold">
        AP Human Geography Practice FRQ
      </p>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
        <FooterIconButton
          label="Previous FRQ"
          disabled={isFirstFrq}
          onClick={onPrevious}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </FooterIconButton>

        <Popover
          open={isNavigationOpen}
          onOpenChange={onNavigationOpenChange}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 rounded-md bg-black px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-800"
            >
              Question {currentFrqIndex + 1} of {totalFrqs}
              <ChevronUp aria-hidden="true" className="size-4" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="center"
            side="top"
            className="w-40 p-2"
          >
            <div className="flex flex-col gap-2">
              {Array.from({ length: totalFrqs }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onJumpToFrq(index)}
                  className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    index === currentFrqIndex
                      ? "bg-[#294ad1] font-bold text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  FRQ {index + 1}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <FooterIconButton
          label="Next FRQ"
          disabled={isLastFrq}
          onClick={onNext}
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </FooterIconButton>
      </div>

      <div className="flex items-center gap-3">
        <FooterNavigationButton
          disabled={isFirstFrq}
          onClick={onPrevious}
        >
          Back
        </FooterNavigationButton>

        <FooterNavigationButton
          disabled={isLastFrq}
          onClick={onNext}
        >
          Next
        </FooterNavigationButton>
      </div>
    </footer>
  );
}

type FooterIconButtonProps = {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function FooterIconButton({
  label,
  disabled,
  onClick,
  children,
}: FooterIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-md bg-black p-2 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

type FooterNavigationButtonProps = {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function FooterNavigationButton({
  disabled,
  onClick,
  children,
}: FooterNavigationButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full bg-[#294ad1] px-6 py-2 font-bold text-white transition-colors hover:bg-[#203cad] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export default FRQGradingRenderer;