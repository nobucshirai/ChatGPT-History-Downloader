const buttonDownloadMarkdown = document.getElementById("download-markdown");

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function downloadMarkdown() {
  // Convert some HTML tags to Markdown equivalents.
  function convertHTMLToMarkdown(html) {
    return html
      .replace(/<p>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<strong>/gi, "**")
      .replace(/<\/strong>/gi, "**")
      .replace(/<em>/gi, "_")
      .replace(/<\/em>/gi, "_")
      // Remove any remaining tags
      .replace(/<\/?[^>]+(>|$)/g, "")
      .trim();
  }
  (function() {
    // Select all conversation turn articles.
    const turns = document.querySelectorAll('article[data-testid^="conversation-turn-"]');
    let markdown = "";
    
    // Process each conversation turn.
    turns.forEach(turn => {
      // Determine sender based on whether a descendant element indicates a user message.
      let sender = "ChatGPT";
      if (turn.querySelector('[data-message-author-role="user"]')) {
         sender = "You";
      }
      // Look for the message content: use .whitespace-pre-wrap if available, else .markdown.
      const contentElem = turn.querySelector('.whitespace-pre-wrap') || turn.querySelector('.markdown');
      if (contentElem && contentElem.innerHTML.trim()) {
         if (markdown !== "") {
            markdown += "\n--------\n";
         }
         markdown += `**${sender}**:\n${convertHTMLToMarkdown(contentElem.innerHTML)}\n\n`;
      }
    });
    
    // Create a download link and trigger it.
    const a = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "_");
    let title = document.querySelector("title")?.innerText || "Conversation with ChatGPT";
    // Clean up the title to make a valid filename.
    title = title.replace(/[ .,:;/-]/g, "_").replace(/_+/g, "_");
    const dateOnly = timestamp.split("T")[0];
    const filename = `${title}_${dateOnly}.md`;
    a.download = filename;
    a.href = URL.createObjectURL(new Blob([markdown]));
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
  })();
}

buttonDownloadMarkdown.addEventListener("click", async () => {
  const tab = await getCurrentTab();
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: downloadMarkdown,
  });
});
