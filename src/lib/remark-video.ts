import { visit } from "unist-util-visit";

function getVideoID(userInput: string) {
  var res = userInput.match(
    /^.*(?:(?:youtu.be\/)|(?:v\/)|(?:\/u\/\w\/)|(?:embed\/)|(?:watch\?))\??v?=?([^#\&\?]*).*/,
  );
  if (res) return res[1];
  return false;
}

interface VideoElement {
  type?: string;
  value?: string;
}

// https://stackoverflow.com/a/28735961
const youtubeRegex =
  /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;

// Based on video-embed-remark
export default function () {
  return (tree: any, file: any) => {
    visit(tree, "text", (node) => {
      if (youtubeRegex.test(node.value)) {
        const videoID = getVideoID(node.value.slice(8));
        const video: VideoElement = {};
        if (videoID) {
          video.type = "html";
          video.value = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoID}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
          return Object.assign(node, video);
        }
      }
    });
  };
}
