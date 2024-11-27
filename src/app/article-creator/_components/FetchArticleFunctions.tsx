import { type OutputData } from "@editorjs/editorjs";

export const revertTableObjectToArray = (data: OutputData) => {
  const table = data.blocks.find((block) => block.type === "table");
  if (table) {
    const contentAsObject = table.data.content as Record<string, any[]>;

    // Convert the object (with keys like row0, row1, ...) back to an array of arrays
    const contentAsArray = Object.keys(contentAsObject)
      .sort() // Ensure the rows are in correct order, just in case
      .map((key) => contentAsObject[key]);

    // Update the data to replace the object back with an array
    data.blocks[data.blocks.indexOf(table)] = {
      ...table,
      data: {
        ...table.data,
        content: contentAsArray,
      },
    };
  }
};

export const getKey = () => {
  const pathParts = window.location.pathname.split("/").slice(-3);
  const key = pathParts.join("-");
  return key;
};
