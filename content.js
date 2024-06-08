let currentTool = null;
let currentColor = "red";
let annotations = [];
let undoStack = [];
let isDrawing = false;
let startX, startY;
let canvas, ctx;

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "activatePen":
      activatePenTool();
      break;
    case "activateHighlighter":
      currentColor = message.color || "yellow";
      activateHighlighterTool();
      break;
    case "undoLastAction":
      undoLast();
      break;
    case "saveAnnotations":
      saveAnnotations(sendResponse);
      break;
  }
  return true; // Ensures sendResponse can be called asynchronously
});

// Function to activate the pen tool
function activatePenTool() {
  currentTool = "pen";
  if (!canvas) {
    createCanvas();
  }
}

// Function to activate the highlighter tool
function activateHighlighterTool() {
  removeCanvas();
  currentTool = "highlighter";
  document.addEventListener("mouseup", highlightText);
}

// Function to create a drawing canvas
function createCanvas() {
  canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");

  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing);

  loadAnnotations();
}

// Function to start drawing on the canvas
function startDrawing(event) {
  if (currentTool !== "pen") return;
  isDrawing = true;
  startX = event.clientX;
  startY = event.clientY;
  path = [{ x: startX, y: startY }];
}

// Function to draw on the canvas
function draw(event) {
  if (!isDrawing) return;

  ctx.strokeStyle = currentColor;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.globalAlpha = 1.0;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(event.clientX, event.clientY);
  ctx.stroke();

  annotations.push({
    tool: "pen",
    color: currentColor,
    startX,
    startY,
    endX: event.clientX,
    endY: event.clientY,
  });

  startX = event.clientX;
  startY = event.clientY;
  path.push({ x: startX, y: startY });
}

// Function to stop drawing
function stopDrawing() {
  if (!isDrawing) return;
  isDrawing = false;
  if (path.length > 1) {
    annotations.push({ tool: "pen", color: currentColor, path: path });
  }
}

// Function to load annotations
function loadAnnotations() {
  chrome.runtime.sendMessage({ action: "loadAnnotations" }, (response) => {
    if (response && response.annotations) {
      annotations = response.annotations;
      redraw();
    }
  });
}

// Function to redraw annotations on the canvas
function redraw() {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    annotations.forEach((annotation) => {
      if (annotation.tool === "pen") {
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.moveTo(annotation.startX, annotation.startY);
        ctx.lineTo(annotation.endX, annotation.endY);
        ctx.stroke();
      } else if (annotation.tool === "highlighter") {
        ctx.fillStyle = annotation.color;
        ctx.fillRect(
          annotation.rect.left,
          annotation.rect.top,
          annotation.rect.width,
          annotation.rect.height
        );
      }
    });
  }
}

// Function to highlight selected text
function highlightText() {
  if (currentTool !== "highlighter") return;
  const selection = window.getSelection();
  if (!selection.isCollapsed) {
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.style.backgroundColor = currentColor;
    span.id = "highlight-" + new Date().getTime();
    span.appendChild(range.extractContents());
    range.insertNode(span);

    selection.removeAllRanges();

    annotations.push({
      tool: "highlighter",
      html: span.outerHTML,
      parentXPath: getXPath(span.parentNode),
      id: span.id,
    });
  }
}

// Function to get XPath of an element
function getXPath(element) {
  if (element.id !== "") return 'id("' + element.id + '")';
  if (element === document.body) return element.tagName;
  let ix = 0;
  const siblings = element.parentNode.childNodes;
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element)
      return getXPath(element.parentNode) + "/" + element.tagName + "[" + (ix + 1) + "]";
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
  }
}

// Function to undo the last action
function undoLast() {
  if (annotations.length > 0) {
    const lastAnnotation = annotations.pop();
    undoStack.push(lastAnnotation);
    redraw();
    if (lastAnnotation.tool === "highlighter") {
      const parent = document.evaluate(
        lastAnnotation.parentXPath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      if (parent) {
        const spans = parent.querySelectorAll(`span[id="${lastAnnotation.id}"]`);
        spans.forEach((span) => {
          const text = document.createTextNode(span.textContent);
          span.parentNode.replaceChild(text, span);
        });
      }
    }
  }
}

// Function to save annotations
function saveAnnotations(sendResponse) {
  chrome.runtime.sendMessage({ action: "saveAnnotation", annotat: annotations }, (response) => {
    if (response && response.status === "success") {
      alert("Annotations Saved!");
    } else {
      console.error("Failed to save annotations");
    }
    sendResponse(response);
  });
}

// Function to remove the canvas
function removeCanvas() {
  if (canvas) {
    canvas.parentNode.removeChild(canvas);
    canvas.removeEventListener("mousedown", startDrawing);
    canvas.removeEventListener("mousemove", draw);
    canvas.removeEventListener("mouseup", stopDrawing);
    canvas.removeEventListener("mouseout", stopDrawing);
    canvas = null;
    ctx = null;
    annotations = [];
  }
}
