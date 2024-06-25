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

## Video Embed Test

### Markdown image syntax

![self-hosted video](/doit.mp4)

![external video](https://user-images.githubusercontent.com/126239/151127893-5c98ba8d-c431-4a25-bb1f-e0b33645a2b6.mp4)

### HTML video element in Markdown

<video width="320" height="240" controls>
  <source src="/doit.mp4" type="video/mp4">
</video>

## YouTube Embed Test

### YouTube link surrounded by newlines

https://www.youtube.com/watch?v=ZXsQAXx_ao0

### iframe copied from YouTube (alternative method)

<iframe width="560" height="315" src="https://www.youtube.com/embed/ZXsQAXx_ao0?si=ygjJM7nCRSuzGl-f" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## GitHub Flavored Markdown Test

### Autolink literals

www.example.com, https://example.com, and contact@example.com.

### Footnote

A note[^1]

[^1]: Big note.

### Strikethrough

~one~ or ~~two~~ tildes.

### Table

| First Header  | Second Header |
| ------------- | ------------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |

### Tasklist

* [ ] to do
* [x] done
`;

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl border border-gray-300 bg-white p-6 text-black shadow-lg">
      <MarkdownArticle content={markdownContent} />
    </div>
  );
}
