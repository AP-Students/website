import video from "@chailotl/remark-videos";
import videoEmbed from "@/lib/remark-video";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

const MarkdownArticle: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[video, videoEmbed, remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownArticle;
