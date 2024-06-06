import cn from 'classnames';
import NextLink from "next/link";

import Header from "@/app/components/Layout/Header";

function Section({children}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <div
      className={'mx-auto flex flex-col w-full'}
      style={{
        contain: 'content',
      }}>
      <div className="flex-col gap-2 flex grow w-full my-20 lg:my-32 mx-auto items-center">
        {children}
      </div>
    </div>
  );
}

function Title({children}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <h2 className="leading-xl font-display text-primary dark:text-primary-dark font-semibold text-4xl lg:text-5xl -mt-4 mb-7 w-full max-w-3xl lg:max-w-4xl">
      {children}
    </h2>
  );
}

function Subtitle({children}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <h3 className="max-w-3xl mx-auto text-lg lg:text-3xl text-slate-800 font-semibold dark:text-slate-200 leading-normal">
      {children}
    </h3>
  );
}

function Center({children}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <div className="px-5 lg:px-0 max-w-4xl lg:text-center text-white text-opacity-80 flex flex-col items-center justify-center">
      {children}
    </div>
  );
}

interface ButtonProps {
  type?: 'primary' | 'secondary';
}

function Button({
  href,
  className,
  children,
  type,
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & ButtonProps) {
  const classes = cn(
    className,
    'p-5 px-10 text-3xl font-bold border-2 bg-white dark:bg-zinc-950 border-primary dark:border-primary-dark rounded-md',
    {
      'shadow-button': type === 'primary'
    }
  )
  return (
    <NextLink
      href={href as string}
      className={classes}
    >
      {children}
    </NextLink>
  )
}

export default async function Home() {
  return (
    <>
      <Header />
      <main className="min-w-0 isolate">
        <div className="font-normal break-words text-primary dark:text-primary-dark">
          <div className="px-5 pt-12 lg:pt-24 pb-20 lg:pb-32 flex flex-col justify-center bg-slate-50 dark:bg-zinc-900">
            <h1 className="max-w-3xl text-5xl text-center font-display lg:text-6xl leading-snug lg:leading-snug self-center flex font-bold text-primary dark:text-primary-dark">
              Made by AP students.<br/>For AP students.
            </h1>
            <h3 className="max-w-2xl mt-5 text-2xl text-center font-display lg:text-3xl leading-snug lg:leading-snug self-center flex text-slate-800 dark:text-slate-200">
              Access curated study guides, practice tests, and more for your AP classes.
            </h3>
            <div className="mt-10 self-center flex gap-8 w-full sm:w-auto flex-col sm:flex-row">
              <Button
                href={'/guides'}
                type="primary"
                className="w-full sm:w-auto justify-center"
              >
                Study Now
              </Button>
              <Button
                href={'https://discord.com/invite/apstudents'}
                type="primary"
                className="w-full sm:w-auto justify-center"
              >
                Join the Discord
              </Button>
            </div>
          </div>

          <Section>
            <Center>
              <Title>Everything all in one place. For free.</Title>
              <Subtitle>
                Explore our resources for your AP class.
              </Subtitle>
            </Center>
            <Button
                href={'/guides'}
                type="primary"
                className="w-full sm:w-auto justify-center"
            >
                View All
            </Button>
          </Section>

          <Section>
            <Center>
              <Title>How it works.</Title>
              <Subtitle>
                Learn about all of our features.
              </Subtitle>
            </Center>
            <Button
                href={'/guides'}
                type="secondary"
                className="w-full sm:w-auto justify-center"
            >
                Start Studying!
            </Button>
          </Section>

          <Section>
            <Center>
              <Title>Built by the AP community.</Title>
              <Subtitle>
                Completely ran by student volunteers.<br/>No corporations or “non-profits” involved.
              </Subtitle>
            </Center>
            <Button
                href={'https://discord.com/invite/apstudents'}
                type="secondary"
                className="w-full sm:w-auto justify-center"
            >
                Join us!
            </Button>
          </Section>

          <Section>
            <Center>
              <Title>FAQ</Title>
              <Subtitle>
                If you have any questions...
              </Subtitle>
            </Center>
          </Section>
        </div>
      </main>
    </>
  );
}