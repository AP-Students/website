import MarkdownArticle from "@/app/_components/ArticleRenderer";

const markdownContent = `
# AP(roject) Website

Welcome to our website. Here is some information about us.

## Our Mission

- To provide quality content
- To help our users

**Thank you for visiting!**

## Lists

### Unordered list

- [Link to the GitHub repository](https://github.com/AP-Students/website)
- [The same link](https://github.com/AP-Students/website)
- [Another one](https://github.com/AP-Students/website)

### Ordered list

1. One
2. Two
3. Three

## Images

![1 on APUSH](/APscore.webp)

## Video in /public

<video width="320" height="240" controls>
  <source src="/doit.mp4" type="video/mp4">
</video>

## Video embed from YouTube

<iframe width="560" height="315" src="https://www.youtube.com/embed/ZXsQAXx_ao0?si=ygjJM7nCRSuzGl-f" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
`;

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl border border-gray-300 bg-white p-6 text-black shadow-lg">
      <MarkdownArticle content={markdownContent} />
    </div>
  );
}
